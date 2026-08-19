import type { ResourceCost } from '../economy/types';
import { getFactionMechanicalRoles } from '../factions/factionMechanicalRoles';
import { getMissionAvailability } from '../fleets/missionRules';
import { getCompleteBuildingIds } from '../planet/completeBuildingCatalog';
import { executeCommand } from '../reducer';
import type { GameCommand, GameState } from '../types';
import { createBotEndgamePerception } from './endgamePerception';
import { createBotPerception, type BotOwnPlanetPerception } from './perception';
import type { BotProfile } from './profiles';

export type BotEndgameFinalObjectReasonCode =
  | 'campaign-terminal'
  | 'enemy-gate-attack'
  | 'final-project-contribute'
  | 'final-project-wait'
  | 'final-obelisk-queue'
  | 'final-project-start'
  | 'final-object-not-qualified'
  | 'final-object-no-legal-action';

export interface BotEndgameFinalObjectPlan {
  readonly command: GameCommand | null;
  readonly reasonCode: BotEndgameFinalObjectReasonCode;
}

const RESOURCE_IDS = ['metal', 'crystal', 'gas'] as const;

function hasPositiveResources(resources: ResourceCost): boolean {
  return RESOURCE_IDS.some((resourceId) => resources[resourceId] > 0);
}

function remainingResources(
  required: ResourceCost,
  contributed: ResourceCost,
): ResourceCost {
  return {
    metal: Math.max(0, required.metal - contributed.metal),
    crystal: Math.max(0, required.crystal - contributed.crystal),
    gas: Math.max(0, required.gas - contributed.gas),
  };
}

function affordableContribution(
  planet: BotOwnPlanetPerception,
  remaining: ResourceCost,
): ResourceCost {
  return {
    metal: Math.min(planet.resources.metal, remaining.metal),
    crystal: Math.min(planet.resources.crystal, remaining.crystal),
    gas: Math.min(planet.resources.gas, remaining.gas),
  };
}

function contributionValue(resources: ResourceCost): number {
  return resources.metal + resources.crystal + resources.gas;
}

function hasCurrentPositiveQualification(
  perception: ReturnType<typeof createBotEndgamePerception>,
): boolean {
  const own = perception.ownParticipation;
  if (own === null) return false;
  const participationKind = own.allianceId === null ? 'solo' : 'alliance';
  const participationId = own.allianceId ?? perception.empireId;
  return perception.ownSolarWarResults.some(
    (result) =>
      result.score > 0 &&
      result.participationKind === participationKind &&
      result.participationId === participationId &&
      result.allianceId === own.allianceId,
  );
}

function planEnemyGateAttack(
  state: GameState,
  profile: BotProfile,
): GameCommand | null {
  const endgame = createBotEndgamePerception(state, profile.empireId);
  const perception = createBotPerception(state, profile.empireId);
  const ownAllianceId = endgame.ownParticipation?.allianceId ?? null;
  const eligibleProjectIds = new Set(
    endgame.eligibleFinalProjects.map((project) => project.id),
  );
  const currentFullIntel = new Set(
    perception.foreignPlanets
      .filter(
        (planet) => planet.freshness === 'current' && planet.snapshot.level === 3,
      )
      .map((planet) => planet.planetId),
  );
  const targets = endgame.publicFinalProjects
    .filter(
      (project) =>
        project.phase === 'vulnerable' &&
        project.ownerEmpireId !== profile.empireId &&
        !eligibleProjectIds.has(project.id) &&
        (ownAllianceId === null || project.allianceId !== ownAllianceId) &&
        currentFullIntel.has(project.ownerPlanetId),
    )
    .sort(
      (left, right) =>
        (left.stabilizesAt ?? Number.MAX_SAFE_INTEGER) -
          (right.stabilizesAt ?? Number.MAX_SAFE_INTEGER) ||
        left.id.localeCompare(right.id),
    );
  if (targets.length === 0) return null;

  const ownPlanetsById = new Map(
    perception.ownPlanets.map((planet) => [planet.id, planet]),
  );
  const fleets = [...perception.ownFleets]
    .filter(
      (fleet) =>
        fleet.status === 'stationed' &&
        fleet.location.type === 'planet' &&
        fleet.mission === null,
    )
    .sort((left, right) => left.id.localeCompare(right.id));

  for (const target of targets) {
    for (const fleet of fleets) {
      if (fleet.location.type !== 'planet') continue;
      const origin = ownPlanetsById.get(fleet.location.planetId);
      if (origin === undefined) continue;
      const destroyerId = getFactionMechanicalRoles(origin.factionId)
        .ships.complete.planetDestroyer;
      if ((fleet.ships[destroyerId] ?? 0) <= 0) continue;
      const command: Extract<GameCommand, { readonly type: 'SEND_FLEET' }> = {
        type: 'SEND_FLEET',
        empireId: profile.empireId,
        fleetId: fleet.id,
        targetPlanetId: target.ownerPlanetId,
        mission: 'attack',
      };
      if (getMissionAvailability(state, command).allowed) return command;
    }
  }
  return null;
}

function planContribution(
  state: GameState,
  profile: BotProfile,
): GameCommand | null {
  const endgame = createBotEndgamePerception(state, profile.empireId);
  const perception = createBotPerception(state, profile.empireId);
  const projects = endgame.eligibleFinalProjects
    .filter((project) => project.phase === 'funding')
    .sort((left, right) => left.id.localeCompare(right.id));

  for (const project of projects) {
    const remaining = remainingResources(
      project.requiredResources,
      project.contributedResources,
    );
    const sources = perception.ownPlanets
      .map((planet) => ({
        planet,
        resources: affordableContribution(planet, remaining),
      }))
      .filter((candidate) => hasPositiveResources(candidate.resources))
      .sort(
        (left, right) =>
          contributionValue(right.resources) - contributionValue(left.resources) ||
          left.planet.id.localeCompare(right.planet.id),
      );

    for (const source of sources) {
      const command: Extract<
        GameCommand,
        { readonly type: 'CONTRIBUTE_FINAL_OBJECT_PROJECT' }
      > = {
        type: 'CONTRIBUTE_FINAL_OBJECT_PROJECT',
        empireId: profile.empireId,
        projectId: project.id,
        sourcePlanetId: source.planet.id,
        resources: source.resources,
      };
      if (executeCommand(state, command).ok) return command;
    }
  }
  return null;
}

function planProjectStartOrObelisk(
  state: GameState,
  profile: BotProfile,
): BotEndgameFinalObjectPlan {
  const endgame = createBotEndgamePerception(state, profile.empireId);
  const perception = createBotPerception(state, profile.empireId);
  if (!hasCurrentPositiveQualification(endgame)) {
    return { command: null, reasonCode: 'final-object-not-qualified' };
  }
  if (endgame.eligibleFinalProjects.length > 0) {
    return { command: null, reasonCode: 'final-project-wait' };
  }

  const planets = [...perception.ownPlanets].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
  for (const planet of planets) {
    const ids = getCompleteBuildingIds(planet.factionId);
    if ((planet.buildings[ids.galacticObelisk] ?? 0) < 1) continue;
    const command: Extract<GameCommand, { readonly type: 'START_FINAL_OBJECT_PROJECT' }> = {
      type: 'START_FINAL_OBJECT_PROJECT',
      empireId: profile.empireId,
      planetId: planet.id,
    };
    if (executeCommand(state, command).ok) {
      return { command, reasonCode: 'final-project-start' };
    }
  }

  for (const planet of planets) {
    const ids = getCompleteBuildingIds(planet.factionId);
    if ((planet.buildings[ids.galacticObelisk] ?? 0) > 0) continue;
    const command: Extract<GameCommand, { readonly type: 'QUEUE_BUILDING' }> = {
      type: 'QUEUE_BUILDING',
      empireId: profile.empireId,
      planetId: planet.id,
      buildingId: ids.galacticObelisk,
    };
    if (executeCommand(state, command).ok) {
      return { command, reasonCode: 'final-obelisk-queue' };
    }
  }

  return { command: null, reasonCode: 'final-object-no-legal-action' };
}

export function planBotEndgameFinalObjects(
  state: GameState,
  profile: BotProfile,
): BotEndgameFinalObjectPlan {
  if (state.campaignResult?.status === 'terminal') {
    return { command: null, reasonCode: 'campaign-terminal' };
  }

  const attack = planEnemyGateAttack(state, profile);
  if (attack !== null) {
    return { command: attack, reasonCode: 'enemy-gate-attack' };
  }

  const contribution = planContribution(state, profile);
  if (contribution !== null) {
    return { command: contribution, reasonCode: 'final-project-contribute' };
  }

  return planProjectStartOrObelisk(state, profile);
}
