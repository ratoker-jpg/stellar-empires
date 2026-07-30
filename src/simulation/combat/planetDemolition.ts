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
  readonly state: Pick<
    GameState,
    'seed' | 'shipUpgrades' | 'pendingEvents' | 'campaignSettings'
  >;
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
      baseChanceBasisPoints: 8_000,
      maximumSelectedBuildings: 2,
      selectAllEligible: false,
    };
  }
  return {
    baseChanceBasisPoints: 10_000,
    maximumSelectedBuildings: Number.POSITIVE_INFINITY,
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

function deterministicRollBasisPoints(
  seed: number,
  eventSequence: number,
  attackerEmpireId: string,
  attackerFleetId: string,
  targetPlanetId: string,
  buildingId: string,
  selectionIndex: number,
): number {
  return hashText(
    `${seed}:${eventSequence}:${attackerEmpireId}:${attackerFleetId}:${targetPlanetId}:${buildingId}:${selectionIndex}:planet-demolition`,
  ) % 10_000;
}

function getCurrentBuildingLevel(
  buildings: readonly PlanetBuildingState[],
  buildingId: string,
): number {
  const canonicalBuildingId = resolveCanonicalBuildingId(buildingId);
  return buildings.find(
    (building) => resolveCanonicalBuildingId(building.buildingId) === canonicalBuildingId,
  )?.level ?? 0;
}

function getEligibleBuildings(
  target: PlanetState,
): readonly PlanetBuildingState[] {
  return target.buildings
    .filter((building) => building.level > 0 && !isBuildingEndgameLocked(building.buildingId))
    .sort((left, right) => {
      const levelDifference = right.level - left.level;
      if (levelDifference !== 0) return levelDifference;
      return resolveCanonicalBuildingId(left.buildingId).localeCompare(
        resolveCanonicalBuildingId(right.buildingId),
      );
    });
}

function getAttackerPlanetDestroyerCount(
  ships: Readonly<Record<string, number>>,
): number {
  return Object.entries(ships).reduce((total, [unitId, quantity]) => {
    const definition = getUnitDefinition(unitId);
    return definition?.role === 'planet-destroyer' ? total + quantity : total;
  }, 0);
}

function getActiveDefensePopulation(
  defenses: Readonly<Record<string, number>>,
): number {
  return Object.entries(defenses).reduce((total, [unitId, quantity]) => {
    const definition = getUnitDefinition(unitId);
    return definition?.kind === 'defense'
      ? total + definition.populationCost * quantity
      : total;
  }, 0);
}

function getDefenseReductionBasisPoints(defensePopulation: number): number {
  return Math.min(7_500, defensePopulation * 50);
}

function applyReduction(points: number, reductionBasisPoints: number): number {
  return Math.floor((points * (10_000 - reductionBasisPoints)) / 10_000);
}

function selectEligibleBuildings(
  eligible: readonly PlanetBuildingState[],
  maximumSelectedBuildings: number,
): readonly PlanetBuildingState[] {
  return maximumSelectedBuildings === Number.POSITIVE_INFINITY
    ? eligible
    : eligible.slice(0, maximumSelectedBuildings);
}

function buildReport(
  input: ResolvePlanetDemolitionInput,
  status: PlanetDemolitionReport['status'],
  rawPoints: number,
  defensePopulation: number,
  defenseReductionBasisPoints: number,
  finalPoints: number,
  threshold: PlanetDemolitionThreshold,
  eligibleBuildingIds: readonly string[],
  selectedBuildingIds: readonly string[],
  buildingRolls: readonly PlanetDemolitionBuildingRollReport[],
  demolishedBuildingIds: readonly string[],
  cancelledQueueItemIds: readonly string[],
): PlanetDemolitionReport {
  return {
    status,
    attackerEmpireId: input.attackerEmpireId,
    attackerFleetId: input.attackerFleetId,
    targetPlanetId: input.target.id,
    planetDestroyerCount: getAttackerPlanetDestroyerCount(input.attackerRemaining),
    commanderBonusBasisPoints: input.commanderBonusBasisPoints,
    rawPoints,
    defensePopulation,
    defenseReductionBasisPoints,
    finalPoints,
    threshold: {
      baseChanceBasisPoints: threshold.baseChanceBasisPoints,
      maximumSelectedBuildings:
        threshold.maximumSelectedBuildings === Number.POSITIVE_INFINITY
          ? eligibleBuildingIds.length
          : threshold.maximumSelectedBuildings,
      selectAllEligible: threshold.selectAllEligible,
    },
    eligibleBuildingIds,
    selectedBuildingIds,
    buildingRolls,
    demolishedBuildingIds,
    cancelledQueueItemIds,
  };
}

function createNoopReport(
  input: ResolvePlanetDemolitionInput,
  status: PlanetDemolitionReport['status'],
): PlanetDemolitionReport {
  return buildReport(
    input,
    status,
    0,
    getActiveDefensePopulation(input.activeDefenses),
    0,
    0,
    getPlanetDemolitionThreshold(0),
    [],
    [],
    [],
    [],
    [],
  );
}

export function resolvePlanetDemolition(
  input: ResolvePlanetDemolitionInput,
): PlanetDemolitionResolution {
  if (input.winner !== 'attacker') {
    return {
      planet: input.target,
      pendingEvents: input.state.pendingEvents,
      report: createNoopReport(input, 'skipped-attacker-lost'),
    };
  }

  const contributions = getPlanetDestroyerSiegeContributions(
    input.attackerRemaining,
    input.state.shipUpgrades,
    input.attackerEmpireId,
  );
  const rawPoints = contributions.reduce(
    (sum, contribution) => sum + contribution.totalDemolitionPoints,
    0,
  );
  if (rawPoints <= 0) {
    return {
      planet: input.target,
      pendingEvents: input.state.pendingEvents,
      report: createNoopReport(input, 'skipped-no-planet-destroyer'),
    };
  }

  const defensePopulation = getActiveDefensePopulation(input.activeDefenses);
  const defenseReductionBasisPoints = getDefenseReductionBasisPoints(defensePopulation);
  const defendedPoints = applyReduction(rawPoints, defenseReductionBasisPoints);
  const finalPoints = Math.floor(
    (defendedPoints * (10_000 + Math.max(0, input.commanderBonusBasisPoints))) / 10_000,
  );
  const threshold = getPlanetDemolitionThreshold(finalPoints);
  const eligible = getEligibleBuildings(input.target);
  const eligibleBuildingIds = eligible.map((building) => building.buildingId);
  if (eligible.length === 0 || threshold.baseChanceBasisPoints === 0) {
    return {
      planet: input.target,
      pendingEvents: input.state.pendingEvents,
      report: buildReport(
        input,
        eligible.length === 0 ? 'skipped-no-eligible-buildings' : 'applied',
        rawPoints,
        defensePopulation,
        defenseReductionBasisPoints,
        finalPoints,
        threshold,
        eligibleBuildingIds,
        [],
        [],
        [],
        [],
      ),
    };
  }

  const selected = selectEligibleBuildings(eligible, threshold.maximumSelectedBuildings);
  const selectedBuildingIds = selected.map((building) => building.buildingId);
  const buildingRolls: PlanetDemolitionBuildingRollReport[] = [];
  const demolishedBuildingIds = new Set<string>();

  selected.forEach((building, selectionIndex) => {
    const rollBasisPoints = deterministicRollBasisPoints(
      input.state.seed,
      input.eventSequence,
      input.attackerEmpireId,
      input.attackerFleetId,
      input.target.id,
      building.buildingId,
      selectionIndex,
    );
    const passed = threshold.selectAllEligible || rollBasisPoints < threshold.baseChanceBasisPoints;
    buildingRolls.push({
      buildingId: building.buildingId,
      levelBefore: building.level,
      chanceBasisPoints: threshold.baseChanceBasisPoints,
      rollBasisPoints,
      passed,
    });
    if (passed) demolishedBuildingIds.add(resolveCanonicalBuildingId(building.buildingId));
  });

  const buildings = input.target.buildings.filter(
    (building) => !demolishedBuildingIds.has(resolveCanonicalBuildingId(building.buildingId)),
  );
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
      defenseReductionBasisPoints,
      finalPoints,
      threshold,
      eligibleBuildingIds,
      selectedBuildingIds,
      buildingRolls,
      [...demolishedBuildingIds].sort(),
      cancelledQueueItemIds,
    ),
  };
}
