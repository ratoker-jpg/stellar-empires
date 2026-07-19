import type { DebrisField } from '../simulation/combat/debris';
import {
  createPlanetEconomy,
  refreshPlanetEconomy,
} from '../simulation/economy/planetEconomy';
import type { PlanetEconomyState, ResourceId } from '../simulation/economy/types';
import type { FleetState } from '../simulation/fleets/types';
import { createInitialIntelligenceStates } from '../simulation/intelligence/intelligenceState';
import type { EmpireIntelligenceState } from '../simulation/intelligence/types';
import type { LogisticsRoute } from '../simulation/logistics/types';
import {
  isPlanetDevelopmentTemplateId,
  isPlanetSpecializationId,
  type PlanetSpecializationId,
} from '../simulation/planet/specialization';
import type { PlanetBuildingState } from '../simulation/planet/types';
import { createPlanetZones } from '../simulation/planet/zones';
import { createInitialResearchStates } from '../simulation/research/researchState';
import type { EmpireResearchState } from '../simulation/research/types';
import type { GameState } from '../simulation/types';
import type {
  PlanetProductionQueues,
  PlanetUnitInventory,
} from '../simulation/units/types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isResourceId(value: unknown): value is ResourceId {
  return value === 'metal' || value === 'crystal' || value === 'gas';
}

function readBuildings(value: unknown): readonly PlanetBuildingState[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const buildings: PlanetBuildingState[] = [];
  for (const item of value) {
    if (
      !isRecord(item) ||
      typeof item.buildingId !== 'string' ||
      typeof item.level !== 'number' ||
      !Number.isInteger(item.level) ||
      item.level < 0
    ) return undefined;
    buildings.push({ buildingId: item.buildingId, level: item.level });
  }
  return buildings;
}

function normalizeEconomy(
  value: unknown,
  buildings: readonly PlanetBuildingState[],
  specializationId: PlanetSpecializationId,
): PlanetEconomyState {
  if (!isRecord(value) || !isRecord(value.resources)) {
    return createPlanetEconomy(buildings, 0, specializationId);
  }
  return refreshPlanetEconomy(
    value as unknown as PlanetEconomyState,
    buildings,
    0,
    specializationId,
  );
}

function readCountRecord(value: unknown): Readonly<Record<string, number>> | undefined {
  if (!isRecord(value)) return undefined;
  const counts: Record<string, number> = {};
  for (const [id, count] of Object.entries(value)) {
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) return undefined;
    counts[id] = count;
  }
  return counts;
}

function normalizeInventory(value: unknown): PlanetUnitInventory | undefined {
  if (value === undefined) return { ships: {}, defenses: {} };
  if (!isRecord(value)) return undefined;
  const ships = readCountRecord(value.ships);
  const defenses = readCountRecord(value.defenses);
  return ships === undefined || defenses === undefined ? undefined : { ships, defenses };
}

function normalizeProductionQueues(value: unknown): PlanetProductionQueues | undefined {
  if (value === undefined) return { shipyard: [], defense: [] };
  if (!isRecord(value) || !Array.isArray(value.shipyard) || !Array.isArray(value.defense)) {
    return undefined;
  }
  return {
    shipyard: value.shipyard as PlanetProductionQueues['shipyard'],
    defense: value.defense as PlanetProductionQueues['defense'],
  };
}

function migratePlanet(value: unknown): Record<string, unknown> | undefined {
  if (!isRecord(value)) return undefined;
  const buildings = readBuildings(value.buildings);
  const inventory = normalizeInventory(value.inventory);
  const productionQueues = normalizeProductionQueues(value.productionQueues);
  if (buildings === undefined || inventory === undefined || productionQueues === undefined) {
    return undefined;
  }
  const specializationId = isPlanetSpecializationId(value.specializationId)
    ? value.specializationId
    : 'balanced';
  const developmentTemplateId = isPlanetDevelopmentTemplateId(value.developmentTemplateId)
    ? value.developmentTemplateId
    : 'balanced';
  return {
    ...value,
    specializationId,
    developmentTemplateId,
    buildings,
    zones: createPlanetZones(buildings),
    economy: normalizeEconomy(value.economy, buildings, specializationId),
    inventory,
    productionQueues,
  };
}

function readResearchStates(
  value: unknown,
  empireIds: readonly string[],
): readonly EmpireResearchState[] | undefined {
  if (value === undefined) return createInitialResearchStates(empireIds);
  if (!Array.isArray(value)) return undefined;
  const states: EmpireResearchState[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.empireId !== 'string' || !isRecord(item.levels) || !Array.isArray(item.queue)) {
      return undefined;
    }
    const levels: Record<string, number> = {};
    for (const [id, level] of Object.entries(item.levels)) {
      if (typeof level !== 'number' || !Number.isInteger(level) || level < 0) return undefined;
      levels[id] = level;
    }
    states.push({
      empireId: item.empireId,
      levels,
      queue: item.queue as unknown as EmpireResearchState['queue'],
    });
  }
  return empireIds.map(
    (empireId) => states.find((state) => state.empireId === empireId) ?? {
      empireId,
      levels: {},
      queue: [],
    },
  );
}

function readFleets(value: unknown): readonly FleetState[] | undefined {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return undefined;
  const fleets: FleetState[] = [];
  for (const item of value) {
    if (!isRecord(item)) return undefined;
    fleets.push({
      ...(item as unknown as FleetState),
      mission:
        isRecord(item.mission) &&
        (item.mission.kind === 'deploy' ||
          item.mission.kind === 'transport' ||
          item.mission.kind === 'scout' ||
          item.mission.kind === 'attack' ||
          item.mission.kind === 'recycle' ||
          item.mission.kind === 'colonize') &&
        typeof item.mission.targetPlanetId === 'string'
          ? {
              kind: item.mission.kind,
              targetPlanetId: item.mission.targetPlanetId,
            }
          : null,
    });
  }
  return fleets;
}

function readIntelligenceStates(
  value: unknown,
  empireIds: readonly string[],
): readonly EmpireIntelligenceState[] | undefined {
  if (value === undefined) return createInitialIntelligenceStates(empireIds);
  if (!Array.isArray(value)) return undefined;
  const states: EmpireIntelligenceState[] = [];
  for (const item of value) {
    if (
      !isRecord(item) ||
      typeof item.empireId !== 'string' ||
      !Array.isArray(item.observations) ||
      !Array.isArray(item.alerts)
    ) return undefined;
    states.push({
      empireId: item.empireId,
      observations: item.observations as EmpireIntelligenceState['observations'],
      alerts: item.alerts as EmpireIntelligenceState['alerts'],
    });
  }
  return empireIds.map(
    (empireId) => states.find((state) => state.empireId === empireId) ?? {
      empireId,
      observations: [],
      alerts: [],
    },
  );
}

function readDebrisFields(value: unknown): readonly DebrisField[] | undefined {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return undefined;
  const fields: DebrisField[] = [];
  for (const item of value) {
    if (
      !isRecord(item) ||
      typeof item.id !== 'string' ||
      typeof item.planetId !== 'string' ||
      typeof item.metal !== 'number' ||
      !Number.isInteger(item.metal) ||
      item.metal < 0 ||
      typeof item.crystal !== 'number' ||
      !Number.isInteger(item.crystal) ||
      item.crystal < 0 ||
      typeof item.createdAt !== 'number' ||
      !Number.isInteger(item.createdAt) ||
      item.createdAt < 0
    ) return undefined;
    fields.push({
      id: item.id,
      planetId: item.planetId,
      metal: item.metal,
      crystal: item.crystal,
      createdAt: item.createdAt,
    });
  }
  return fields;
}

function readLogisticsRoutes(value: unknown): readonly LogisticsRoute[] | undefined {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return undefined;
  const routes: LogisticsRoute[] = [];
  for (const item of value) {
    if (
      !isRecord(item) ||
      typeof item.id !== 'string' ||
      typeof item.empireId !== 'string' ||
      typeof item.originPlanetId !== 'string' ||
      typeof item.targetPlanetId !== 'string' ||
      !isResourceId(item.resourceId) ||
      typeof item.amountPerTrip !== 'number' ||
      !Number.isInteger(item.amountPerTrip) ||
      item.amountPerTrip <= 0 ||
      typeof item.originReserve !== 'number' ||
      !Number.isInteger(item.originReserve) ||
      item.originReserve < 0 ||
      typeof item.intervalSeconds !== 'number' ||
      !Number.isInteger(item.intervalSeconds) ||
      item.intervalSeconds <= 0 ||
      (item.priority !== 1 && item.priority !== 2 && item.priority !== 3) ||
      (item.status !== 'active' && item.status !== 'paused') ||
      typeof item.nextDepartureAt !== 'number' ||
      !Number.isInteger(item.nextDepartureAt) ||
      item.nextDepartureAt < 0
    ) return undefined;
    routes.push({
      ...(item as unknown as LogisticsRoute),
      consecutiveMisses:
        typeof item.consecutiveMisses === 'number' && Number.isInteger(item.consecutiveMisses)
          ? Math.max(0, item.consecutiveMisses)
          : 0,
      lastResult: isRecord(item.lastResult)
        ? item.lastResult as unknown as LogisticsRoute['lastResult']
        : null,
    });
  }
  return routes;
}

export function migrateGameState(value: unknown): GameState | undefined {
  if (!isRecord(value) || ![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].includes(value.schemaVersion as number)) {
    return undefined;
  }
  if (!Array.isArray(value.planets) || !Array.isArray(value.empires)) return undefined;
  const empireIds = value.empires.filter(
    (empireId): empireId is string => typeof empireId === 'string',
  );
  if (empireIds.length !== value.empires.length) return undefined;

  const planets: Record<string, unknown>[] = [];
  for (const planet of value.planets) {
    const migrated = migratePlanet(planet);
    if (migrated === undefined) return undefined;
    planets.push(migrated);
  }

  const research = readResearchStates(value.research, empireIds);
  const fleets = readFleets(value.fleets);
  const intelligence = readIntelligenceStates(value.intelligence, empireIds);
  const debrisFields = readDebrisFields(value.debrisFields);
  const logisticsRoutes = readLogisticsRoutes(value.logisticsRoutes);
  if (
    research === undefined ||
    fleets === undefined ||
    intelligence === undefined ||
    debrisFields === undefined ||
    logisticsRoutes === undefined
  ) {
    return undefined;
  }

  return {
    ...value,
    schemaVersion: 11,
    planets,
    research,
    fleets,
    intelligence,
    debrisFields,
    logisticsRoutes,
  } as unknown as GameState;
}
