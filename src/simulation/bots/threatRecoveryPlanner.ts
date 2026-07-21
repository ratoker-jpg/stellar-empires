import { getFactionIdForEmpire } from '../factions/factionMechanicalCatalogRegistry';
import { getFactionMechanicalRoles } from '../factions/factionMechanicalRoles';
import type { IntelPlanetSnapshot } from '../intelligence/types';
import type { GameCommand, GameState } from '../types';
import { getUnitDefinition } from '../units/catalog';
import { queueUnitBatch } from '../units/productionCommands';
import { planBotEconomy } from './economyPlanner';
import { planBotFleetMission } from './fleetMissionPlanner';
import { createBotPerception, type BotPerception } from './perception';
import { planBotResearchAndProduction } from './researchProductionPlanner';

export type BotThreatLevel = 'none' | 'low' | 'medium' | 'high';
export type BotRecoveryPhase = 'stable' | 'economic' | 'fleet' | 'critical';

export interface BotTargetAssessment {
  readonly planetId: string;
  readonly freshness: 'current' | 'stale';
  readonly intelligenceLevel: 1 | 2 | 3;
  readonly estimatedReward: number;
  readonly estimatedDefense: number | null;
  readonly riskPermille: number | null;
  readonly score: number;
  readonly attackRecommended: boolean;
}

export interface BotThreatRecoveryPlan {
  readonly empireId: string;
  readonly threatLevel: BotThreatLevel;
  readonly recoveryPhase: BotRecoveryPhase;
  readonly keyPlanetId: string | null;
  readonly ownMilitaryPower: number;
  readonly knownHostilePower: number;
  readonly targets: readonly BotTargetAssessment[];
  readonly selectedTargetPlanetId: string | null;
  readonly reasonCode:
    | 'critical-economy-recovery'
    | 'economic-recovery'
    | 'military-recovery'
    | 'high-threat-response'
    | 'target-opportunity'
    | 'stable-development'
    | 'no-action';
  readonly explanation: string;
  readonly command: GameCommand | null;
}

type Action = Pick<BotThreatRecoveryPlan, 'reasonCode' | 'explanation' | 'command'>;

function unitPower(unitId: string, quantity: number): number {
  const stats = getUnitDefinition(unitId)?.stats;
  return stats === undefined
    ? 0
    : quantity * (stats.attack * 2 + stats.armor + stats.shield);
}

function compositionPower(units: Readonly<Record<string, number>>): number {
  return Object.entries(units).reduce(
    (total, [unitId, quantity]) => total + unitPower(unitId, quantity),
    0,
  );
}

function ownMilitaryPower(perception: BotPerception): number {
  const planets = perception.ownPlanets.reduce(
    (total, planet) =>
      total + compositionPower(planet.ships) + compositionPower(planet.defenses),
    0,
  );
  return perception.ownFleets.reduce(
    (total, fleet) => total + compositionPower(fleet.ships),
    planets,
  );
}

function snapshotDefense(snapshot: IntelPlanetSnapshot): number | null {
  if (snapshot.level < 3) return null;
  return (snapshot.stationedFleets ?? []).reduce(
    (total, fleet) => total + compositionPower(fleet.ships),
    compositionPower(snapshot.defenses ?? {}),
  );
}

function snapshotReward(snapshot: IntelPlanetSnapshot): number {
  const resourceValue =
    snapshot.resources === undefined
      ? 0
      : snapshot.resources.metal +
        snapshot.resources.crystal +
        snapshot.resources.gas * 2;
  const buildingValue = Object.values(snapshot.buildings ?? {}).reduce(
    (total, level) => total + level * 100,
    0,
  );
  return resourceValue + buildingValue;
}

function planetStrategicValue(planet: BotPerception['ownPlanets'][number]): number {
  const resources =
    planet.resources.metal + planet.resources.crystal + planet.resources.gas * 2;
  const buildings = Object.values(planet.buildings).reduce(
    (total, level) => total + level * 250,
    0,
  );
  return resources + buildings + compositionPower(planet.defenses) * 2;
}

function assessTargets(
  perception: BotPerception,
  militaryPower: number,
): readonly BotTargetAssessment[] {
  return perception.foreignPlanets
    .map((planet) => {
      const defense = snapshotDefense(planet.snapshot);
      const reward = snapshotReward(planet.snapshot);
      const riskPermille =
        defense === null
          ? null
          : Math.min(9_999, Math.floor((defense * 1_000) / Math.max(1, militaryPower)));
      const score =
        reward -
        (planet.freshness === 'stale' ? 1_000 : 0) -
        (defense === null ? 1_200 : 0) -
        (riskPermille ?? 0);
      return {
        planetId: planet.planetId,
        freshness: planet.freshness,
        intelligenceLevel: planet.snapshot.level,
        estimatedReward: reward,
        estimatedDefense: defense,
        riskPermille,
        score,
        attackRecommended:
          planet.freshness === 'current' &&
          defense !== null &&
          riskPermille !== null &&
          riskPermille <= 800 &&
          militaryPower > 0,
      };
    })
    .sort((left, right) => right.score - left.score || left.planetId.localeCompare(right.planetId));
}

function threatLevel(
  perception: BotPerception,
  militaryPower: number,
  hostilePower: number,
): BotThreatLevel {
  const alerts = perception.alerts.reduce((total, alert) => {
    if (alert.confidence === 'high') return total + 3;
    if (alert.confidence === 'medium') return total + 2;
    return total + 1;
  }, 0);
  if (alerts >= 3 || hostilePower > militaryPower) return 'high';
  if (alerts >= 2 || hostilePower * 2 > militaryPower) return 'medium';
  if (alerts > 0 || hostilePower > 0) return 'low';
  return 'none';
}

function recoveryPhase(
  perception: BotPerception,
  threat: BotThreatLevel,
): BotRecoveryPhase {
  const firstPlanet = perception.ownPlanets[0];
  if (firstPlanet === undefined) return 'critical';
  const roles = getFactionMechanicalRoles(firstPlanet.factionId).buildings;
  const brokenEnergy = perception.ownPlanets.some(
    (planet) => planet.resources.energyProduced < planet.resources.energyConsumed,
  );
  const missingCore = perception.ownPlanets.every(
    (planet) =>
      (planet.buildings[roles.command] ?? 0) < 1 ||
      (planet.buildings[roles.power] ?? 0) < 1,
  );
  if (brokenEnergy || missingCore) return 'critical';
  if (
    perception.ownPlanets.some(
      (planet) =>
        Math.min(planet.resources.metal, planet.resources.crystal, planet.resources.gas) < 100,
    )
  ) {
    return 'economic';
  }
  const shipCount =
    perception.ownPlanets.reduce(
      (total, planet) =>
        total + Object.values(planet.ships).reduce((sum, count) => sum + count, 0),
      0,
    ) +
    perception.ownFleets.reduce(
      (total, fleet) =>
        total + Object.values(fleet.ships).reduce((sum, count) => sum + count, 0),
      0,
    );
  return shipCount < 2 || threat === 'high' ? 'fleet' : 'stable';
}

function militaryRecoveryCommand(
  state: GameState,
  empireId: string,
): GameCommand | null {
  const roles = getFactionMechanicalRoles(getFactionIdForEmpire(state, empireId));
  const candidates = [
    { unitId: roles.ships.fighter, quantity: 3 },
    { unitId: roles.defenses.light, quantity: 2 },
    { unitId: roles.ships.frigate, quantity: 1 },
  ] as const;
  const planets = state.planets
    .filter((planet) => planet.ownerEmpireId === empireId)
    .sort((left, right) => left.id.localeCompare(right.id));
  for (const candidate of candidates) {
    for (const planet of planets) {
      const command: Extract<GameCommand, { readonly type: 'QUEUE_UNIT_BATCH' }> = {
        type: 'QUEUE_UNIT_BATCH',
        empireId,
        planetId: planet.id,
        unitId: candidate.unitId,
        quantity: candidate.quantity,
      };
      if (queueUnitBatch(state, command).ok) return command;
    }
  }
  return null;
}

function selectAction(
  state: GameState,
  empireId: string,
  phase: BotRecoveryPhase,
  threat: BotThreatLevel,
  hasTarget: boolean,
): Action {
  if (phase === 'critical' || phase === 'economic') {
    const economy = planBotEconomy(state, empireId);
    if (economy.command !== null) {
      return {
        reasonCode:
          phase === 'critical' ? 'critical-economy-recovery' : 'economic-recovery',
        explanation: economy.explanation,
        command: economy.command,
      };
    }
  }

  if (phase === 'fleet' || threat === 'high') {
    const combatCommand = militaryRecoveryCommand(state, empireId);
    if (combatCommand !== null) {
      return {
        reasonCode: threat === 'high' ? 'high-threat-response' : 'military-recovery',
        explanation:
          threat === 'high'
            ? 'Известная угроза превышает безопасный уровень: восстанавливается боевой контур.'
            : 'После потерь приоритет отдан боевым кораблям и обороне.',
        command: combatCommand,
      };
    }
    const production = planBotResearchAndProduction(state, empireId).production;
    if (production.command !== null) {
      return {
        reasonCode: threat === 'high' ? 'high-threat-response' : 'military-recovery',
        explanation: production.explanation,
        command: production.command,
      };
    }
  }

  const fleet = planBotFleetMission(state, empireId);
  if (fleet.command !== null) {
    return {
      reasonCode: hasTarget ? 'target-opportunity' : 'stable-development',
      explanation: fleet.explanation,
      command: fleet.command,
    };
  }

  const research = planBotResearchAndProduction(state, empireId).research;
  if (research.command !== null) {
    return {
      reasonCode: 'stable-development',
      explanation: research.explanation,
      command: research.command,
    };
  }

  return {
    reasonCode: 'no-action',
    explanation: 'Нет валидного действия восстановления или безопасной цели.',
    command: null,
  };
}

export function planBotThreatAndRecovery(
  state: GameState,
  empireId: string,
): BotThreatRecoveryPlan {
  const perception = createBotPerception(state, empireId);
  const militaryPower = ownMilitaryPower(perception);
  const targets = assessTargets(perception, militaryPower);
  const knownHostilePower = targets.reduce(
    (maximum, target) => Math.max(maximum, target.estimatedDefense ?? 0),
    0,
  );
  const threat = threatLevel(perception, militaryPower, knownHostilePower);
  const phase = recoveryPhase(perception, threat);
  const keyPlanet = [...perception.ownPlanets].sort(
    (left, right) =>
      planetStrategicValue(right) - planetStrategicValue(left) ||
      left.id.localeCompare(right.id),
  )[0];
  const target = targets.find((candidate) => candidate.attackRecommended) ?? null;

  return {
    empireId,
    threatLevel: threat,
    recoveryPhase: phase,
    keyPlanetId: keyPlanet?.id ?? null,
    ownMilitaryPower: militaryPower,
    knownHostilePower,
    targets,
    selectedTargetPlanetId: target?.planetId ?? null,
    ...selectAction(state, empireId, phase, threat, target !== null),
  };
}

export function planAllBotThreatsAndRecovery(
  state: GameState,
): readonly BotThreatRecoveryPlan[] {
  return state.empires
    .filter((empireId) => empireId !== 'player')
    .map((empireId) => planBotThreatAndRecovery(state, empireId));
}
