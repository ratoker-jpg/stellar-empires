import { refreshPlanetEconomy } from '../economy/planetEconomy';
import { isBuildingEndgameLocked } from '../planet/buildingOperations';
import { resolveCanonicalBuildingId } from '../planet/buildingAliases';
import type { PlanetBuildingState, PlanetState } from '../planet/types';
import { createPlanetZones } from '../planet/zones';
import type { GameState, ScheduledGameEvent } from '../types';
import { getUnitDefinition } from '../units/catalog';
import type {
  BattleWinner,
  PlanetDemolitionBuildingRollReport,
  PlanetDemolitionReport,
} from './types';
import { getPlanetDestroyerSiegeContributions } from './planetSiegeConfig';

export interface PlanetDemolitionThreshold {
  readonly baseChanceBasisPoints: number;
  readonly maximumSelectedBuildings: number;
  readonly selectAllEligible: boolean;
}

export interface ResolvePlanetDemolitionInput {
  readonly state: Pick<GameState, 'seed' | 'shipUpgrades' | 'pendingEvents'>;
  readonly attackerEmpireId: string;
  readonly attackerFleetId: string;
  readonly attackerRemaining: Readonly<Record<string, number>>;
  readonly target: PlanetState;
  readonly activeDefenses: Readonly<Record<string, number>>;
  readonly winner: BattleWinner;
  readonly eventSequence: number;
  readonly commanderBonusBasisPoints: number;
}

export interface PlanetDemolitionResolution {
  readonly planet: PlanetState;
  readonly pendingEvents: readonly ScheduledGameEvent[];
  readonly report?: PlanetDemolitionReport;
}

export function getPlanetDemolitionThreshold(
  finalPoints: number,
): PlanetDemolitionThreshold {
  if (finalPoints < 20) {
    return {
      baseChanceBasisPoints: 0,
      maximumSelectedBuildings: 0,
      selectAllEligible: false,
    };
  }
  if (finalPoints <= 100) {
    return {
      baseChanceBasisPoints: 2_000,
      maximumSelectedBuildings: 1,
      selectAllEligible: false,
    };
  }
  if (finalPoints <= 200) {
    return {
      baseChanceBasisPoints: 4_000,
      maximumSelectedBuildings: 1,
      selectAllEligible: false,
    };
  }
  if (finalPoints <= 400) {
    return {
      baseChanceBasisPoints: 6_000,
      maximumSelectedBuildings: 1,
      selectAllEligible: false,
    };
  }
  if (finalPoints <= 550) {
    return {
      baseChanceBasisPoints: 5_000,
      maximumSelectedBuildings: 2,
      selectAllEligible: false,
    };
  }
  if (finalPoints <= 700) {
    return {
      baseChanceBasisPoints: 7_000,
      maximumSelectedBuildings: 2,
      selectAllEligible: false,
    };
  }
  if (finalPoints <= 850) {
    return {
      baseChanceBasisPoints: 5_000,
      maximumSelectedBuildings: 3,
      selectAllEligible: false,
    };
  }
  if (finalPoints <= 1_000) {
    return {
      baseChanceBasisPoints: 6_000,
      maximumSelectedBuildings: 5,
      selectAllEligible: false,
    };
  }
  return {
    baseChanceBasisPoints: 3_300,
    maximumSelectedBuildings: Number.MAX_SAFE_INTEGER,
    selectAllEligible: true,
  };
}

function hashText(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function rollBasisPoints(domain: string): number {
  return hashText(domain) % 10_000;
}

function getDefensePopulation(
  defenses: Readonly<Record<string, number>>,
): number {
  return Object.entries(defenses).reduce((total, [unitId, count]) => {
    if (count <= 0) return total;
    const definition = getUnitDefinition(unitId);
    return definition?.kind === 'defense'
      ? total + definition.populationCost * count
      : total;
  }, 0);
}

function eligibleBuildings(
  target: PlanetState,
): readonly PlanetBuildingState[] {
  return target.buildings
    .filter(
      (building) =>
        building.level > 0 && !isBuildingEndgameLocked(building.buildingId),
    )
    .map((building) => ({
      buildingId: resolveCanonicalBuildingId(building.buildingId),
      level: building.level,
    }))
    .sort((left, right) => left.buildingId.localeCompare(right.buildingId));
}

function selectionDomain(
  input: ResolvePlanetDemolitionInput,
  buildingId: string,
): string {
  return [
    input.state.seed,
    input.eventSequence,
    input.attackerFleetId,
    input.target.galaxyPlanetId,
    'planet-demolition-selection',
    buildingId,
  ].join(':');
}

function buildingRollDomain(
  input: ResolvePlanetDemolitionInput,
  buildingId: string,
): string {
  return [
    input.state.seed,
    input.eventSequence,
    input.attackerFleetId,
    input.target.galaxyPlanetId,
    'planet-demolition-roll',
    buildingId,
  ].join(':');
}

function buildReport(
  input: ResolvePlanetDemolitionInput,
  outcome: PlanetDemolitionReport['outcome'],
  rawPoints: number,
  defensePopulation: number,
  defenseReduction: number,
  finalPoints: number,
  threshold: PlanetDemolitionThreshold,
  eligibleBuildingCount: number,
  selectedBuildingIds: readonly string[],
  rolls: readonly PlanetDemolitionBuildingRollReport[],
  cancelledQueueItemIds: readonly string[],
): PlanetDemolitionReport {
  const commanderBonusBasisPoints = Math.max(
    0,
    input.commanderBonusBasisPoints,
  );
  return {
    outcome,
    contributions: getPlanetDestroyerSiegeContributions(
      input.state.shipUpgrades,
      input.attackerEmpireId,
      input.attackerRemaining,
    ).map((contribution) => ({
      unitId: contribution.unitId,
      factionId: contribution.factionId,
      count: contribution.count,
      weaponLevel: contribution.weaponLevel,
      pointsPerShip: contribution.demolitionPointsPerShip,
      totalPoints: contribution.totalDemolitionPoints,
    })),
    defensePopulation,
    rawPoints,
    defenseReduction,
    finalPoints,
    baseChanceBasisPoints: threshold.baseChanceBasisPoints,
    commanderBonusBasisPoints,
    finalChanceBasisPoints: Math.min(
      10_000,
      threshold.baseChanceBasisPoints + commanderBonusBasisPoints,
    ),
    maximumSelectedBuildings: threshold.selectAllEligible
      ? eligibleBuildingCount
      : threshold.maximumSelectedBuildings,
    allEligibleBuildingsSelected: threshold.selectAllEligible,
    eligibleBuildingCount,
    selectedBuildingIds,
    rolls,
    cancelledQueueItemIds,
  };
}

export function resolvePlanetDemolition(
  input: ResolvePlanetDemolitionInput,
): PlanetDemolitionResolution {
  const contributions = getPlanetDestroyerSiegeContributions(
    input.state.shipUpgrades,
    input.attackerEmpireId,
    input.attackerRemaining,
  );
  if (contributions.length === 0) {
    return {
      planet: input.target,
      pendingEvents: input.state.pendingEvents,
    };
  }

  const rawPoints = contributions.reduce(
    (total, contribution) => total + contribution.totalDemolitionPoints,
    0,
  );
  const defensePopulation = getDefensePopulation(input.activeDefenses);
  const defenseReduction = Math.floor(defensePopulation / 2_500) * 100;
  const finalPoints = Math.max(0, rawPoints - defenseReduction);
  const threshold = getPlanetDemolitionThreshold(finalPoints);
  const eligible = eligibleBuildings(input.target);

  if (input.winner === 'defender') {
    return {
      planet: input.target,
      pendingEvents: input.state.pendingEvents,
      report: buildReport(
        input,
        'battle-result-ineligible',
        rawPoints,
        defensePopulation,
        defenseReduction,
        finalPoints,
        threshold,
        eligible.length,
        [],
        [],
        [],
      ),
    };
  }

  if (threshold.maximumSelectedBuildings === 0) {
    return {
      planet: input.target,
      pendingEvents: input.state.pendingEvents,
      report: buildReport(
        input,
        'zero-final-points',
        rawPoints,
        defensePopulation,
        defenseReduction,
        finalPoints,
        threshold,
        eligible.length,
        [],
        [],
        [],
      ),
    };
  }

  if (eligible.length === 0) {
    return {
      planet: input.target,
      pendingEvents: input.state.pendingEvents,
      report: buildReport(
        input,
        'no-eligible-buildings',
        rawPoints,
        defensePopulation,
        defenseReduction,
        finalPoints,
        threshold,
        0,
        [],
        [],
        [],
      ),
    };
  }

  const selected = threshold.selectAllEligible
    ? eligible
    : [...eligible]
        .sort((left, right) => {
          const leftHash = hashText(selectionDomain(input, left.buildingId));
          const rightHash = hashText(selectionDomain(input, right.buildingId));
          return leftHash - rightHash || left.buildingId.localeCompare(right.buildingId);
        })
        .slice(0, threshold.maximumSelectedBuildings);
  const finalChanceBasisPoints = Math.min(
    10_000,
    threshold.baseChanceBasisPoints +
      Math.max(0, input.commanderBonusBasisPoints),
  );
  const rolls: PlanetDemolitionBuildingRollReport[] = selected.map(
    (building) => {
      const roll = rollBasisPoints(
        buildingRollDomain(input, building.buildingId),
      );
      const demolished = roll < finalChanceBasisPoints;
      return {
        buildingId: building.buildingId,
        levelBefore: building.level,
        levelAfter: demolished ? Math.max(0, building.level - 1) : building.level,
        chanceBasisPoints: finalChanceBasisPoints,
        rollBasisPoints: roll,
        demolished,
      };
    },
  );
  const demolishedBuildingIds = new Set(
    rolls.filter((roll) => roll.demolished).map((roll) => roll.buildingId),
  );
  const buildings = input.target.buildings.flatMap((building) => {
    const canonicalId = resolveCanonicalBuildingId(building.buildingId);
    if (!demolishedBuildingIds.has(canonicalId)) return [building];
    const level = Math.max(0, building.level - 1);
    return level === 0 ? [] : [{ buildingId: canonicalId, level }];
  });
  const cancelledQueueItemIds = input.target.buildQueue
    .filter((item) =>
      demolishedBuildingIds.has(resolveCanonicalBuildingId(item.buildingId)),
    )
    .map((item) => item.id)
    .sort();
  const cancelledQueueItemIdSet = new Set(cancelledQueueItemIds);
  const buildQueue = input.target.buildQueue.filter(
    (item) => !cancelledQueueItemIdSet.has(item.id),
  );
  const pendingEvents = input.state.pendingEvents.filter((event) => {
    const payload = event.payload;
    return !(
      payload.type === 'BUILDING_COMPLETE' &&
      cancelledQueueItemIdSet.has(payload.queueItemId)
    );
  });
  const planet: PlanetState = demolishedBuildingIds.size === 0
    ? input.target
    : {
        ...input.target,
        buildings,
        buildQueue,
        zones: createPlanetZones(buildings),
        economy: refreshPlanetEconomy(
          input.state.campaignSettings.progressionProfile,
          input.target.economy,
          buildings,
          0,
          input.target.specializationId,
        ),
      };

  return {
    planet,
    pendingEvents,
    report: buildReport(
      input,
      'applied',
      rawPoints,
      defensePopulation,
      defenseReduction,
      finalPoints,
      threshold,
      eligible.length,
      selected.map((building) => building.buildingId),
      rolls,
      cancelledQueueItemIds,
    ),
  };
}
