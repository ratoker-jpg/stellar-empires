import type { IntelPlanetSnapshot } from '../intelligence/types';
import type { GameCommand, GameState } from '../types';
import { getUnitDefinition } from '../units/catalog';
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

function unitPower(unitId: string, quantity: number): number {
  const stats = getUnitDefinition(unitId)?.stats;
  if (stats === undefined) return 0;
  return quantity * (stats.attack * 2 + stats.armor + stats.shield);
}

function compositionPower(units: Readonly<Record<string, number>>): number {
  return Object.entries(units).reduce(
    (total, [unitId, quantity]) => total + unitPower(unitId, quantity),
    0,
  );
}

function ownMilitaryPower(perception: BotPerception): number {
  const planetPower = perception.ownPlanets.reduce(
    (total, planet) =>
      total + compositionPower(planet.ships) + compositionPower(planet.defenses),
    0,
  );
  const fleetPower = perception.ownFleets.reduce(
    (total, fleet) => total + compositionPower(fleet.ships),
    0,
  );
  return planetPower + fleetPower;
}

function snapshotDefense(snapshot: IntelPlanetSnapshot): number | null {
  if (snapshot.level < 3) return null;
  const defenses = compositionPower(snapshot.defenses ?? {});
  return (snapshot.stationedFleets ?? []).reduce(
    (total, fleet) => total + compositionPower(fleet.ships),
    defenses,
  );
}

function snapshotReward(snapshot: IntelPlanetSnapshot): number {
  const resources = snapshot.resources;
  const resourceValue =
    resources === undefined
      ? 0
      : resources.metal + resources.crystal + resources.gas * 2;
  const buildingValue = Object.values(snapshot.buildings ?? {}).reduce(
    (total, level) => total + level * 100,
    0,
  );
  return resourceValue + buildingValue;
}

function strategicPlanetScore(planet: BotPerception['ownPlanets'][number]): number {
  const resources = planet.resources.metal + planet.resources.crystal + planet.resources.gas * 2;
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
      const freshnessPenalty = planet.freshness === 'stale' ? 1_000 : 0;
      const uncertaintyPenalty = defense === null ? 1_200 : 0;
      const riskPenalty = riskPermille === null ? 0 : riskPermille;
      const score = reward - freshnessPenalty - uncertaintyPenalty - riskPenalty;
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

function getThreatLevel(
  perception: BotPerception,
  militaryPower: number,
  knownHostilePower: number,
): BotThreatLevel {
  const alertWeight = perception.alerts.reduce((total, alert) => {
    if (alert.confidence === 'high') return total + 3;
    if (alert.confidence === 'medium') return total + 2;
    return total + 1;
  }, 0);
  if (alertWeight >= 3 || knownHostilePower > militaryPower) return 'high';
  if (alertWeight >= 2 || knownHostilePower * 2 > militaryPower) return 'medium';
  if (alertWeight > 0 || knownHostilePower > 0) return 'low';
  return 'none';
}

function getRecoveryPhase(
  perception: BotPerception,
  threatLevel: BotThreatLevel,
): BotRecoveryPhase {
  if (perception.ownPlanets.length === 0) return 'critical';
  const energyDeficit = perception.ownPlanets.some(
    (planet) => planet.resources.energyProduced < planet.resources.energyConsumed,
  );
  const depleted = perception.ownPlanets.some(
    (planet) => Math.min(planet.resources.metal, planet.resources.crystal, planet.resources.gas) < 100,
  );
  const infrastructureMissing = perception.ownPlanets.every(
    (planet) =>
      (planet.buildings['building.aegis.command'] ?? 0) < 1 ||
      (planet.buildings['building.aegis.power-plant'] ?? 0) < 1,
  );
  if (energyDeficit || infrastructureMissing) return 'critical';
  if (depleted) return 'economic';

  const ships = perception.ownPlanets.reduce(
    (total, planet) => total + Object.values(planet.ships).reduce((sum, count) => sum + count, 0),
    0,
  ) + perception.ownFleets.reduce(
    (total, fleet) => total + Object.values(fleet.ships).reduce((sum, count) => sum + count, 0),
    0,
  );
  if (ships < 2 || threatLevel === 'high') return 'fleet';
  return 'stable';
}

function commandForPlan(
  state: GameState,
  empireId: string,
  phase: BotRecoveryPhase,
  threatLevel: BotThreatLevel,
  hasTarget: boolean,
): Pick<BotThreatRecoveryPlan, 'reasonCode' | 'explanation' | 'command'> {
  if (phase === 'critical' || phase === 'economic') {
    const economy = planBotEconomy(state, empireId);
    if (economy.command !== null) {
      return {
        reasonCode: phase === 'critical' ? 'critical-economy-recovery' : 'economic-recovery',
        explanation: economy.explanation,
        command: economy.command,
      };
    }
  }

  if (phase === 'fleet' || threatLevel === 'high') {
    const production = planBotResearchAndProduction(state, empireId).production;
    if (production.command !== null) {
      return {
        reasonCode: threatLevel === 'high' ? 'high-threat-response' : 'military-recovery',
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
  const threatLevel = getThreatLevel(perception, militaryPower, knownHostilePower);
  const recoveryPhase = getRecoveryPhase(perception, threatLevel);
  const keyPlanet = [...perception.ownPlanets].sort(
    (left, right) =>
      strategicPlanetScore(right) - strategicPlanetScore(left) || left.id.localeCompare(right.id),
  )[0];
  const selectedTarget = targets.find((target) => target.attackRecommended) ?? null;
  const action = commandForPlan(
    state,
    empireId,
    recoveryPhase,
    threatLevel,
    selectedTarget !== null,
  );

  return {
    empireId,
    threatLevel,
    recoveryPhase,
    keyPlanetId: keyPlanet?.id ?? null,
    ownMilitaryPower: militaryPower,
    knownHostilePower,
    targets,
    selectedTargetPlanetId: selectedTarget?.planetId ?? null,
    ...action,
  };
}

export function planAllBotThreatsAndRecovery(
  state: GameState,
): readonly BotThreatRecoveryPlan[] {
  return state.empires
    .filter((empireId) => empireId !== 'player')
    .map((empireId) => planBotThreatAndRecovery(state, empireId));
}
