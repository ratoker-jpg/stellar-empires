import { BOT_LOGISTICS_RESERVE_PERMILLE } from './colonyLogisticsPlanner';
import { getFactionIdForEmpire } from '../factions/factionMechanicalCatalogRegistry';
import { getResearchEffectsForEmpire } from '../factions/factionResearchEffects';
import { estimateFlight } from '../fleets/flightCalculations';
import type { FleetState } from '../fleets/types';
import {
  createPveOperationsView,
  type PveOpportunityEntry,
} from '../pve/pveOperationsView';
import { PIRATE_EMPIRE_ID } from '../pve/neutralForces';
import { getRequiredSpaceObjectShipId } from '../pve/spaceObjects';
import { executeCommand } from '../reducer';
import type {
  ExecutedGameEvent,
  GameCommand,
  GameEventPayload,
  GameState,
} from '../types';
import { getUnitDefinition } from '../units/catalog';
import type { ShipRole } from '../units/types';
import { createBotPerception, type BotPerception } from './perception';
import type { BotPersonality, BotProfile } from './profiles';

export type BotPveReasonCode =
  | 'invalid-special-operation-recalled'
  | 'expedition-selected'
  | 'space-object-selected'
  | 'pirate-hunt-selected'
  | 'specialist-fleet-created'
  | 'combat-fleet-created'
  | 'no-public-opportunity'
  | 'no-compatible-fleet'
  | 'gas-reserve-protected'
  | 'pirate-intelligence-required'
  | 'pirate-safety-threshold'
  | 'validator-rejected';

export interface BotPveOperationsPlan {
  readonly empireId: string;
  readonly personality: BotPersonality;
  readonly reasonCode: BotPveReasonCode;
  readonly availabilityCode: string | null;
  readonly explanation: string;
  readonly selectedOpportunityId: string | null;
  readonly command: GameCommand | null;
}

type PveCategory = 'anomaly' | 'expedition' | 'resource-object' | 'pirate-hunt';
type CommandValidation =
  | { readonly accepted: true }
  | { readonly accepted: false; readonly code: string; readonly message: string };

interface Candidate {
  readonly entry: PveOpportunityEntry;
  readonly category: PveCategory;
}

interface Blocker {
  readonly reasonCode: BotPveReasonCode;
  readonly availabilityCode: string | null;
  readonly explanation: string;
  readonly opportunityId: string | null;
}

const HIDDEN_PLAYER_EMPIRE_ID = '__hidden-player-for-bot-pve-view__';
const ZERO_CARGO = { metal: 0, crystal: 0, gas: 0 } as const;

const CATEGORY_ORDER: Readonly<Record<BotPersonality, readonly PveCategory[]>> = {
  explorer: ['anomaly', 'expedition', 'resource-object', 'pirate-hunt'],
  industrial: ['resource-object', 'pirate-hunt', 'expedition', 'anomaly'],
  aggressive: ['pirate-hunt', 'anomaly', 'resource-object', 'expedition'],
};

function remapEmpireId(empireId: string | null, viewerEmpireId: string): string | null {
  if (empireId === viewerEmpireId) return 'player';
  if (empireId === 'player') return HIDDEN_PLAYER_EMPIRE_ID;
  return empireId;
}

function remapEventPayload(
  payload: GameEventPayload,
  viewerEmpireId: string,
): GameEventPayload | null {
  if (payload.type === 'BATTLE_REPORT') {
    const report = payload.report;
    if (
      report.attackerEmpireId !== viewerEmpireId &&
      report.defenderEmpireId !== viewerEmpireId
    ) {
      return null;
    }
    return {
      type: 'BATTLE_REPORT',
      report: {
        ...report,
        attackerEmpireId: remapEmpireId(report.attackerEmpireId, viewerEmpireId) ?? report.attackerEmpireId,
        defenderEmpireId: remapEmpireId(report.defenderEmpireId, viewerEmpireId) ?? report.defenderEmpireId,
      },
    };
  }
  if (payload.type === 'EXPEDITION_RESOLVE') {
    if (payload.report.empireId !== viewerEmpireId) return null;
    return {
      type: 'EXPEDITION_RESOLVE',
      report: { ...payload.report, empireId: 'player' },
    };
  }
  if (payload.type === 'SPACE_OBJECT_MISSION_RESOLVE') {
    if (payload.report.empireId !== viewerEmpireId) return null;
    return {
      type: 'SPACE_OBJECT_MISSION_RESOLVE',
      report: { ...payload.report, empireId: 'player' },
    };
  }
  return payload;
}

function remapExecutedEvent(
  entry: ExecutedGameEvent,
  viewerEmpireId: string,
): ExecutedGameEvent | null {
  const payload = remapEventPayload(entry.event.payload, viewerEmpireId);
  if (payload === null) return null;
  return {
    ...entry,
    event: { ...entry.event, payload },
  };
}

function createViewerState(state: GameState, viewerEmpireId: string): GameState {
  return {
    ...state,
    empires: state.empires.map((empireId) =>
      remapEmpireId(empireId, viewerEmpireId) ?? empireId),
    planets: state.planets.map((planet) => ({
      ...planet,
      ownerEmpireId: remapEmpireId(planet.ownerEmpireId, viewerEmpireId),
    })),
    research: state.research.map((entry) => ({
      ...entry,
      empireId: remapEmpireId(entry.empireId, viewerEmpireId) ?? entry.empireId,
    })),
    shipUpgrades: state.shipUpgrades.map((entry) => ({
      ...entry,
      empireId: remapEmpireId(entry.empireId, viewerEmpireId) ?? entry.empireId,
    })),
    commanders: state.commanders.map((entry) => ({
      ...entry,
      empireId: remapEmpireId(entry.empireId, viewerEmpireId) ?? entry.empireId,
    })),
    fleets: state.fleets
      .filter((fleet) => fleet.empireId === viewerEmpireId)
      .map((fleet) => ({ ...fleet, empireId: 'player' })),
    intelligence: state.intelligence
      .filter((entry) => entry.empireId === viewerEmpireId)
      .map((entry) => ({ ...entry, empireId: 'player' })),
    strategicResources: state.strategicResources
      .filter((entry) => entry.empireId === viewerEmpireId)
      .map((entry) => ({ ...entry, empireId: 'player' })),
    eventLog: state.eventLog.flatMap((entry) => {
      const mapped = remapExecutedEvent(entry, viewerEmpireId);
      return mapped === null ? [] : [mapped];
    }),
  };
}

function categoryFor(
  candidate: PveOpportunityEntry,
  perception: BotPerception,
): PveCategory | null {
  if (candidate.kind === 'expedition') return 'expedition';
  if (candidate.kind === 'space-object') {
    const object = perception.publicSpaceObjects.find((entry) => entry.id === candidate.targetId);
    if (object === undefined) return null;
    return object.kind === 'anomaly' ? 'anomaly' : 'resource-object';
  }
  if (candidate.kind === 'pirate-base') {
    const huntTarget = perception.activeWorldEvents.find(
      (event) => event.definitionId === 'pirate-hunt' && event.targetId === candidate.targetId,
    );
    return huntTarget === undefined ? null : 'pirate-hunt';
  }
  return null;
}

function isPublicCandidate(candidate: Candidate, perception: BotPerception): boolean {
  if (candidate.entry.kind === 'expedition') {
    return perception.publicExpeditionPositions.some(
      (position) => position.galaxyPlanetId === candidate.entry.targetId,
    );
  }
  if (candidate.entry.kind === 'space-object') {
    return perception.publicSpaceObjects.some((object) => object.id === candidate.entry.targetId);
  }
  if (candidate.entry.kind === 'pirate-base') {
    return perception.publicPirateBases.some((base) => base.planetId === candidate.entry.targetId);
  }
  return false;
}

function activeEventBonus(candidate: Candidate, perception: BotPerception): number {
  const targetEvent = perception.activeWorldEvents.find(
    (event) => event.targetId === candidate.entry.targetId,
  );
  if (targetEvent?.definitionId === 'mineral-bloom') return 2;
  if (targetEvent?.definitionId === 'pirate-hunt') return 2;
  return (candidate.entry.rewardMultiplierPermille ?? 1_000) > 1_000 ? 1 : 0;
}

function compareCoordinates(left: PveOpportunityEntry, right: PveOpportunityEntry): number {
  return left.coordinate.galaxy - right.coordinate.galaxy ||
    left.coordinate.solarSystem - right.coordinate.solarSystem ||
    left.coordinate.position - right.coordinate.position;
}

function compareCandidates(
  left: Candidate,
  right: Candidate,
  personality: BotPersonality,
  perception: BotPerception,
): number {
  const order = CATEGORY_ORDER[personality];
  return order.indexOf(left.category) - order.indexOf(right.category) ||
    activeEventBonus(right, perception) - activeEventBonus(left, perception) ||
    (left.entry.fuelRequired ?? Number.MAX_SAFE_INTEGER) -
      (right.entry.fuelRequired ?? Number.MAX_SAFE_INTEGER) ||
    (left.entry.flightDurationSeconds ?? Number.MAX_SAFE_INTEGER) -
      (right.entry.flightDurationSeconds ?? Number.MAX_SAFE_INTEGER) ||
    compareCoordinates(left.entry, right.entry) ||
    left.entry.targetId.localeCompare(right.entry.targetId) ||
    (left.entry.activeFleetId ?? '').localeCompare(right.entry.activeFleetId ?? '');
}

function validateCommand(state: GameState, command: GameCommand): CommandValidation {
  const result = executeCommand(state, command);
  return result.ok
    ? { accepted: true }
    : { accepted: false, code: result.code, message: result.message };
}

function realFleet(
  state: GameState,
  empireId: string,
  fleetId: string | undefined,
): FleetState | undefined {
  if (fleetId === undefined) return undefined;
  return state.fleets.find(
    (fleet) => fleet.id === fleetId && fleet.empireId === empireId,
  );
}

function gasReserveAllows(
  perception: BotPerception,
  fleet: FleetState,
  fuelRequired: number,
): boolean {
  if (fleet.location.type !== 'planet') return false;
  const origin = perception.ownPlanets.find((planet) => planet.id === fleet.location.planetId);
  if (origin === undefined) return false;
  const reserve = Math.floor(
    (origin.resources.gasCapacity * BOT_LOGISTICS_RESERVE_PERMILLE) / 1_000,
  );
  return origin.resources.gas - fuelRequired >= reserve;
}

function createFleetCommand(
  state: GameState,
  perception: BotPerception,
  unitId: string,
  quantity: number,
): GameCommand | null {
  const planet = perception.ownPlanets
    .filter((candidate) => (candidate.ships[unitId] ?? 0) >= quantity)
    .sort((left, right) =>
      left.coordinate.galaxy - right.coordinate.galaxy ||
      left.coordinate.solarSystem - right.coordinate.solarSystem ||
      left.coordinate.position - right.coordinate.position ||
      left.id.localeCompare(right.id),
    )[0];
  if (planet === undefined) return null;
  const command: GameCommand = {
    type: 'CREATE_FLEET',
    empireId: perception.empireId,
    planetId: planet.id,
    ships: { [unitId]: quantity },
    cargo: ZERO_CARGO,
  };
  return validateCommand(state, command).accepted ? command : null;
}

function specialistUnitId(
  state: GameState,
  perception: BotPerception,
  entry: PveOpportunityEntry,
): string | null {
  const factionId = getFactionIdForEmpire(state, perception.empireId);
  if (entry.kind === 'expedition') {
    return getRequiredSpaceObjectShipId('anomaly', factionId);
  }
  if (entry.kind !== 'space-object') return null;
  const object = perception.publicSpaceObjects.find((candidate) => candidate.id === entry.targetId);
  return object === undefined ? null : getRequiredSpaceObjectShipId(object.kind, factionId);
}

function compositionPower(ships: Readonly<Record<string, number>>): number {
  return Object.entries(ships).reduce((total, [unitId, quantity]) => {
    const stats = getUnitDefinition(unitId)?.stats;
    return stats === undefined
      ? total
      : total + quantity * (stats.attack * 2 + stats.armor + stats.shield);
  }, 0);
}

function snapshotPower(
  snapshot: BotPerception['foreignPlanets'][number]['snapshot'],
): number | null {
  if (snapshot.level < 3) return null;
  const defenses = Object.entries(snapshot.defenses ?? {}).reduce((total, [unitId, quantity]) => {
    const stats = getUnitDefinition(unitId)?.stats;
    return stats === undefined
      ? total
      : total + quantity * (stats.attack * 2 + stats.armor + stats.shield);
  }, 0);
  return (snapshot.stationedFleets ?? []).reduce(
    (total, fleet) => total + compositionPower(fleet.ships),
    defenses,
  );
}

function pirateSafety(
  perception: BotPerception,
  targetId: string,
  fleet: FleetState,
): 'safe' | 'intelligence-required' | 'unsafe' {
  const intelligence = perception.foreignPlanets.find(
    (candidate) =>
      candidate.planetId === targetId &&
      candidate.freshness === 'current' &&
      candidate.snapshot.level === 3,
  );
  if (intelligence === undefined) return 'intelligence-required';
  const targetPower = snapshotPower(intelligence.snapshot);
  if (targetPower === null) return 'intelligence-required';
  return compositionPower(fleet.ships) * 10 >= Math.max(1, targetPower) * 12
    ? 'safe'
    : 'unsafe';
}

function createCombatFleetCommand(
  state: GameState,
  perception: BotPerception,
): GameCommand | null {
  const candidates = perception.ownPlanets.flatMap((planet) =>
    Object.entries(planet.ships)
      .filter(([, quantity]) => quantity > 0)
      .map(([unitId, quantity]) => ({
        planet,
        unitId,
        quantity,
        power: compositionPower({ [unitId]: 1 }),
      })))
    .filter((candidate) => candidate.power > 0)
    .sort((left, right) =>
      right.power - left.power ||
      left.planet.coordinate.galaxy - right.planet.coordinate.galaxy ||
      left.planet.coordinate.solarSystem - right.planet.coordinate.solarSystem ||
      left.planet.coordinate.position - right.planet.coordinate.position ||
      left.unitId.localeCompare(right.unitId));
  const selected = candidates[0];
  if (selected === undefined) return null;
  return createFleetCommand(
    state,
    perception,
    selected.unitId,
    Math.min(3, selected.quantity),
  );
}

function invalidSpecialOperationRecall(
  state: GameState,
  perception: BotPerception,
): GameCommand | null {
  for (const fleet of perception.ownFleets) {
    if (fleet.mission?.kind === 'expedition') {
      const valid = perception.publicExpeditionPositions.some(
        (position) => position.galaxyPlanetId === fleet.mission?.targetPlanetId,
      );
      if (!valid) {
        const command: GameCommand = {
          type: 'RECALL_FLEET',
          empireId: perception.empireId,
          fleetId: fleet.id,
        };
        if (validateCommand(state, command).accepted) return command;
      }
    }
    if (fleet.mission?.kind === 'space-object') {
      const object = perception.publicSpaceObjects.find(
        (candidate) => candidate.id === fleet.mission?.targetPlanetId,
      );
      if (object === undefined || object.remainingYield <= 0) {
        const command: GameCommand = {
          type: 'RECALL_FLEET',
          empireId: perception.empireId,
          fleetId: fleet.id,
        };
        if (validateCommand(state, command).accepted) return command;
      }
    }
  }
  return null;
}

function blockedPlan(
  profile: BotProfile,
  blocker: Blocker,
): BotPveOperationsPlan {
  return {
    empireId: profile.empireId,
    personality: profile.personality,
    reasonCode: blocker.reasonCode,
    availabilityCode: blocker.availabilityCode,
    explanation: blocker.explanation,
    selectedOpportunityId: blocker.opportunityId,
    command: null,
  };
}

function selectedPlan(
  profile: BotProfile,
  reasonCode: BotPveReasonCode,
  entry: PveOpportunityEntry | null,
  explanation: string,
  command: GameCommand,
): BotPveOperationsPlan {
  return {
    empireId: profile.empireId,
    personality: profile.personality,
    reasonCode,
    availabilityCode: null,
    explanation,
    selectedOpportunityId: entry?.id ?? null,
    command,
  };
}

function missionPlanForCandidate(
  state: GameState,
  profile: BotProfile,
  perception: BotPerception,
  candidate: Candidate,
): BotPveOperationsPlan | Blocker {
  const entry = candidate.entry;
  if (entry.kind === 'expedition' || entry.kind === 'space-object') {
    const fleet = realFleet(state, profile.empireId, entry.activeFleetId);
    if (fleet === undefined) {
      const unitId = specialistUnitId(state, perception, entry);
      const create = unitId === null ? null : createFleetCommand(state, perception, unitId, 1);
      return create === null
        ? {
            reasonCode: 'no-compatible-fleet',
            availabilityCode: entry.availabilityCode,
            explanation: `${entry.title}: нет готового совместимого флота или корпуса в инвентаре.`,
            opportunityId: entry.id,
          }
        : selectedPlan(
            profile,
            'specialist-fleet-created',
            entry,
            `${entry.title}: из доступного корпуса сформирован специализированный флот.`,
            create,
          );
    }
    const fuelRequired = entry.fuelRequired ?? 0;
    if (!gasReserveAllows(perception, fleet, fuelRequired)) {
      return {
        reasonCode: 'gas-reserve-protected',
        availabilityCode: 'BOT_PVE_GAS_RESERVE',
        explanation: `${entry.title}: операция нарушила бы 40% газовый резерв колонии.`,
        opportunityId: entry.id,
      };
    }
    const command: GameCommand = entry.kind === 'expedition'
      ? {
          type: 'START_EXPEDITION',
          empireId: profile.empireId,
          fleetId: fleet.id,
          targetGalaxyPlanetId: entry.targetId,
        }
      : {
          type: 'START_SPACE_OBJECT_MISSION',
          empireId: profile.empireId,
          fleetId: fleet.id,
          objectId: entry.targetId,
        };
    const validation = validateCommand(state, command);
    if (!validation.accepted) {
      return {
        reasonCode: 'validator-rejected',
        availabilityCode: validation.code,
        explanation: `${entry.title}: ${validation.message}`,
        opportunityId: entry.id,
      };
    }
    return selectedPlan(
      profile,
      entry.kind === 'expedition' ? 'expedition-selected' : 'space-object-selected',
      entry,
      `${entry.title}: выбрана обычная подтверждённая PvE-команда.`,
      command,
    );
  }

  if (entry.kind !== 'pirate-base') {
    return {
      reasonCode: 'no-public-opportunity',
      availabilityCode: entry.availabilityCode,
      explanation: 'Запись не является исполнимой PvE-целью.',
      opportunityId: entry.id,
    };
  }

  const fleet = realFleet(state, profile.empireId, entry.activeFleetId);
  if (fleet === undefined) {
    const create = createCombatFleetCommand(state, perception);
    return create === null
      ? {
          reasonCode: 'no-compatible-fleet',
          availabilityCode: 'BOT_PVE_COMBAT_FLEET_REQUIRED',
          explanation: `${entry.title}: нет готового вооружённого флота или корпуса в инвентаре.`,
          opportunityId: entry.id,
        }
      : selectedPlan(
          profile,
          'combat-fleet-created',
          entry,
          `${entry.title}: из доступных вооружённых корпусов сформирован флот.`,
          create,
        );
  }
  const safety = pirateSafety(perception, entry.targetId, fleet);
  if (safety === 'intelligence-required') {
    return {
      reasonCode: 'pirate-intelligence-required',
      availabilityCode: 'ATTACK_INTELLIGENCE_REQUIRED',
      explanation: `${entry.title}: нет актуальной разведки уровня 3.`,
      opportunityId: entry.id,
    };
  }
  if (safety === 'unsafe') {
    return {
      reasonCode: 'pirate-safety-threshold',
      availabilityCode: 'BOT_PVE_ATTACK_UNSAFE',
      explanation: `${entry.title}: сила флота ниже обычного порога 120% известной обороны.`,
      opportunityId: entry.id,
    };
  }
  try {
    const estimate = estimateFlight(
      state.galaxy,
      state.planets,
      fleet,
      entry.targetId,
      getResearchEffectsForEmpire(state, profile.empireId).fleetSpeedPercent,
    );
    if (!gasReserveAllows(perception, fleet, estimate.fuelCost)) {
      return {
        reasonCode: 'gas-reserve-protected',
        availabilityCode: 'BOT_PVE_GAS_RESERVE',
        explanation: `${entry.title}: атака нарушила бы 40% газовый резерв колонии.`,
        opportunityId: entry.id,
      };
    }
  } catch {
    return {
      reasonCode: 'validator-rejected',
      availabilityCode: 'PVE_TARGET_UNAVAILABLE',
      explanation: `${entry.title}: маршрут атаки недоступен.`,
      opportunityId: entry.id,
    };
  }
  const command: GameCommand = {
    type: 'SEND_FLEET',
    empireId: profile.empireId,
    fleetId: fleet.id,
    targetPlanetId: entry.targetId,
    mission: 'attack',
  };
  const validation = validateCommand(state, command);
  if (!validation.accepted) {
    return {
      reasonCode: 'validator-rejected',
      availabilityCode: validation.code,
      explanation: `${entry.title}: ${validation.message}`,
      opportunityId: entry.id,
    };
  }
  return selectedPlan(
    profile,
    'pirate-hunt-selected',
    entry,
    `${entry.title}: активная pirate-hunt цель проходит разведку и обычный порог безопасности.`,
    command,
  );
}

export function planBotPveOperations(
  state: GameState,
  profile: BotProfile,
): BotPveOperationsPlan {
  const perception = createBotPerception(state, profile.empireId);
  const recall = invalidSpecialOperationRecall(state, perception);
  if (recall !== null) {
    return selectedPlan(
      profile,
      'invalid-special-operation-recalled',
      null,
      'Спецоперация потеряла публично валидную цель и отзывается обычной командой.',
      recall,
    );
  }

  const viewerState = createViewerState(state, profile.empireId);
  const candidates = createPveOperationsView(viewerState)
    .flatMap((entry): readonly Candidate[] => {
      if (entry.status !== 'available') return [];
      const category = categoryFor(entry, perception);
      return category === null ? [] : [{ entry, category }];
    })
    .filter((candidate) => isPublicCandidate(candidate, perception))
    .sort((left, right) => compareCandidates(left, right, profile.personality, perception));

  if (candidates.length === 0) {
    return blockedPlan(profile, {
      reasonCode: 'no-public-opportunity',
      availabilityCode: null,
      explanation: 'Нет публичной доступной PvE-возможности для текущей personality policy.',
      opportunityId: null,
    });
  }

  let blocker: Blocker | null = null;
  for (const candidate of candidates) {
    const plan = missionPlanForCandidate(state, profile, perception, candidate);
    if ('command' in plan) return plan;
    blocker ??= plan;
  }
  return blockedPlan(profile, blocker ?? {
    reasonCode: 'no-public-opportunity',
    availabilityCode: null,
    explanation: 'Все публичные возможности заблокированы ordinary validators.',
    opportunityId: null,
  });
}

export function isPirateTargetPublic(
  perception: BotPerception,
  targetId: string,
): boolean {
  return perception.publicPirateBases.some((base) => base.planetId === targetId) &&
    perception.activeWorldEvents.some(
      (event) => event.definitionId === 'pirate-hunt' && event.targetId === targetId,
    );
}

export function requiredRoleForOpportunity(
  entry: PveOpportunityEntry,
  perception: BotPerception,
): ShipRole | null {
  if (entry.kind === 'expedition') return 'scout';
  if (entry.kind !== 'space-object') return null;
  const object = perception.publicSpaceObjects.find((candidate) => candidate.id === entry.targetId);
  if (object?.kind === 'asteroid') return 'recycler';
  if (object?.kind === 'gas-cloud') return 'transport';
  return object?.kind === 'anomaly' ? 'scout' : null;
}

export { PIRATE_EMPIRE_ID };
