import { getFactionIdForEmpire } from '../factions/factionMechanicalCatalogRegistry';
import { getFactionMechanicalRoles } from '../factions/factionMechanicalRoles';
import type { IntelPlanetSnapshot } from '../intelligence/types';
import type { GameCommand, GameState } from '../types';
import { getUnitDefinition } from '../units/catalog';
import { getLegacyUnitIdsForCanonical } from '../units/unitAliases';
import { queueUnitBatch } from '../units/productionCommands';
import { planBotEconomy } from './economyPlanner';
import { planBotFleetMission } from './fleetMissionPlanner';
import { deriveRecentBotBattleOutcomeSignal } from './outcomeSignals';
import { createBotPerception, type BotPerception } from './perception';
import { planBotResearchAndProduction } from './researchProductionPlanner';
import {
  calculateBotAttackRiskPermille,
  resolveBotStrategyPolicy,
  type BotTacticalProfile,
} from './strategyPolicy';

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

export interface BotThreatRecoveryDependencies {
  readonly economy?: ReturnType<typeof planBotEconomy>;
  readonly researchProduction?: ReturnType<typeof planBotResearchAndProduction>;
  readonly fleet?: ReturnType<typeof planBotFleetMission>;
}

type Action = Pick<BotThreatRecoveryPlan, 'reasonCode' | 'explanation' | 'command'>;

interface UnitIdentity {
  readonly ids: readonly string[];
  readonly idSet: ReadonlySet<string>;
}

const unitIdentityCache = new Map<string, UnitIdentity>();

function getUnitIdentity(unitId: string): UnitIdentity {
  const cached = unitIdentityCache.get(unitId);
  if (cached !== undefined) return cached;
  const ids = [unitId, ...getLegacyUnitIdsForCanonical(unitId)];
  const identity: UnitIdentity = { ids, idSet: new Set(ids) };
  unitIdentityCache.set(unitId, identity);
  return identity;
}

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
  maxAttackRiskPermille: number | null,
): readonly BotTargetAssessment[] {
  return perception.foreignPlanets
    .map((planet) => {
      const defense = snapshotDefense(planet.snapshot);
      const reward = snapshotReward(planet.snapshot);
      const riskPermille =
        defense === null
          ? null
          : calculateBotAttackRiskPermille(defense, militaryPower);
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
          maxAttackRiskPermille !== null &&
          riskPermille <= maxAttackRiskPermille &&
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

function countEmpireUnit(state: GameState, empireId: string, unitId: string): number {
  const identity = getUnitIdentity(unitId);
  const definition = getUnitDefinition(unitId);
  const isDefense = definition?.kind === 'defense';
  const onPlanets = state.planets
    .filter((planet) => planet.ownerEmpireId === empireId)
    .reduce((total, planet) => {
      const inventory = identity.ids.reduce(
        (subtotal, candidateId) => subtotal + (
          isDefense
            ? planet.inventory.defenses[candidateId] ?? 0
            : planet.inventory.ships[candidateId] ?? 0
        ),
        0,
      );
      const queue = isDefense
        ? planet.productionQueues.defense
        : planet.productionQueues.shipyard;
      const queued = queue.reduce(
        (subtotal, item) => subtotal + (identity.idSet.has(item.unitId) ? item.quantity : 0),
        0,
      );
      return total + inventory + queued;
    }, 0);
  if (isDefense) return onPlanets;
  return state.fleets
    .filter((fleet) => fleet.empireId === empireId)
    .reduce(
      (total, fleet) => total + identity.ids.reduce(
        (subtotal, candidateId) => subtotal + (fleet.ships[candidateId] ?? 0),
        0,
      ),
      onPlanets,
    );
}

function militaryRecoveryCommand(
  state: GameState,
  empireId: string,
): GameCommand | null {
  const roles = getFactionMechanicalRoles(getFactionIdForEmpire(state, empireId));
  const candidates = [
    { unitId: roles.ships.fighter, quantity: 3, desiredTotal: 6 },
    { unitId: roles.defenses.light, quantity: 2, desiredTotal: 4 },
    { unitId: roles.ships.frigate, quantity: 1, desiredTotal: 2 },
  ] as const;
  const planets = state.planets
    .filter((planet) => planet.ownerEmpireId === empireId)
    .sort((left, right) => left.id.localeCompare(right.id));
  for (const candidate of candidates) {
    const current = countEmpireUnit(state, empireId, candidate.unitId);
    if (current >= candidate.desiredTotal) continue;
    const quantity = Math.min(candidate.quantity, candidate.desiredTotal - current);
    for (const planet of planets) {
      const command: Extract<GameCommand, { readonly type: 'QUEUE_UNIT_BATCH' }> = {
        type: 'QUEUE_UNIT_BATCH',
        empireId,
        planetId: planet.id,
        unitId: candidate.unitId,
        quantity,
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
  recoveryBias: 'none' | 'loss-dominant',
  hasTarget: boolean,
  dependencies: BotThreatRecoveryDependencies,
  profile?: BotTacticalProfile,
): Action {
  if (phase === 'critical' || phase === 'economic') {
    const economy = dependencies.economy ?? planBotEconomy(state, empireId);
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
            ? 'Известная угроза превышает безопасный уровень: восстанавливается ограниченный боевой резерв.'
            : 'После потерь приоритет отдан восстановлению ограниченного боевого резерва.',
        command: combatCommand,
      };
    }
    const production =
      dependencies.researchProduction ?? planBotResearchAndProduction(state, empireId);
    if (production.production.command !== null) {
      return {
        reasonCode: threat === 'high' ? 'high-threat-response' : 'military-recovery',
        explanation: production.production.explanation,
        command: production.production.command,
      };
    }
  }

  const fleet = dependencies.fleet ?? planBotFleetMission(state, empireId, profile);
  if (fleet.command !== null) {
    return {
      reasonCode: hasTarget ? 'target-opportunity' : 'stable-development',
      explanation: fleet.explanation,
      command: fleet.command,
    };
  }

  const research =
    dependencies.researchProduction ?? planBotResearchAndProduction(state, empireId);
  if (research.research.command !== null) {
    return {
      reasonCode: 'stable-development',
      explanation: research.research.explanation,
      command: research.research.command,
    };
  }

  if (recoveryBias === 'loss-dominant' && phase === 'stable') {
    const combatCommand = militaryRecoveryCommand(state, empireId);
    if (combatCommand !== null) {
      return {
        reasonCode: 'military-recovery',
        explanation:
          'Последние PvP-результаты смещены к потерям: при отсутствии обычного действия восстанавливается ограниченный боевой резерв.',
        command: combatCommand,
      };
    }
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
  dependencies: BotThreatRecoveryDependencies = {},
  profile?: BotTacticalProfile,
): BotThreatRecoveryPlan {
  const perception = createBotPerception(state, empireId);
  const policy = resolveBotStrategyPolicy(empireId, profile);
  const outcomeSignal = deriveRecentBotBattleOutcomeSignal(state, empireId);
  const militaryPower = ownMilitaryPower(perception);
  const targets = assessTargets(
    perception,
    militaryPower,
    policy?.maxAttackRiskPermille ?? null,
  );
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
    ...selectAction(
      state,
      empireId,
      phase,
      threat,
      outcomeSignal.recoveryBias,
      target !== null,
      dependencies,
      profile,
    ),
  };
}

export function planAllBotThreatsAndRecovery(
  state: GameState,
): readonly BotThreatRecoveryPlan[] {
  return state.empires
    .filter((empireId) => empireId !== 'player')
    .map((empireId) => planBotThreatAndRecovery(state, empireId));
}
