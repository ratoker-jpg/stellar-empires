import {
  createPlanetEconomy,
  refreshPlanetEconomy,
} from '../simulation/economy/planetEconomy';
import type { PlanetEconomyState } from '../simulation/economy/types';
import type { FleetState } from '../simulation/fleets/types';
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
): PlanetEconomyState {
  if (!isRecord(value) || !isRecord(value.resources)) {
    return createPlanetEconomy(buildings);
  }
  return refreshPlanetEconomy(value as unknown as PlanetEconomyState, buildings);
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
  return {
    ...value,
    buildings,
    zones: createPlanetZones(buildings),
    economy: normalizeEconomy(value.economy, buildings),
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
        (item.mission.kind === 'deploy' || item.mission.kind === 'transport') &&
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

export function migrateGameState(value: unknown): GameState | undefined {
  if (!isRecord(value) || ![1, 2, 3, 4, 5, 6, 7].includes(value.schemaVersion as number)) {
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
  if (research === undefined || fleets === undefined) return undefined;

  return {
    ...value,
    schemaVersion: 7,
    planets,
    research,
    fleets,
  } as unknown as GameState;
}
