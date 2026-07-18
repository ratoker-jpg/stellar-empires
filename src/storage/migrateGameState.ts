import {
  createPlanetEconomy,
  refreshPlanetEconomy,
} from '../simulation/economy/planetEconomy';
import type { PlanetEconomyState } from '../simulation/economy/types';
import type { PlanetBuildingState } from '../simulation/planet/types';
import { createPlanetZones } from '../simulation/planet/zones';
import { createInitialResearchStates } from '../simulation/research/researchState';
import type { EmpireResearchState } from '../simulation/research/types';
import type { GameState } from '../simulation/types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readBuildings(value: unknown): readonly PlanetBuildingState[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const buildings: PlanetBuildingState[] = [];

  for (const item of value) {
    if (
      !isRecord(item) ||
      typeof item.buildingId !== 'string' ||
      typeof item.level !== 'number' ||
      !Number.isInteger(item.level) ||
      item.level < 0
    ) {
      return undefined;
    }

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

function migratePlanet(value: unknown): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const buildings = readBuildings(value.buildings);

  if (buildings === undefined) {
    return undefined;
  }

  return {
    ...value,
    buildings,
    zones: createPlanetZones(buildings),
    economy: normalizeEconomy(value.economy, buildings),
  };
}

function readResearchLevels(value: unknown): Readonly<Record<string, number>> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const levels: Record<string, number> = {};
  for (const [technologyId, level] of Object.entries(value)) {
    if (typeof level !== 'number' || !Number.isInteger(level) || level < 0) {
      return undefined;
    }
    levels[technologyId] = level;
  }
  return levels;
}

function readResearchStates(
  value: unknown,
  empireIds: readonly string[],
): readonly EmpireResearchState[] | undefined {
  if (value === undefined) {
    return createInitialResearchStates(empireIds);
  }

  if (!Array.isArray(value)) {
    return undefined;
  }

  const byEmpire = new Map<string, EmpireResearchState>();
  for (const item of value) {
    if (
      !isRecord(item) ||
      typeof item.empireId !== 'string' ||
      !Array.isArray(item.queue)
    ) {
      return undefined;
    }

    const levels = readResearchLevels(item.levels);
    if (levels === undefined || byEmpire.has(item.empireId)) {
      return undefined;
    }

    byEmpire.set(item.empireId, {
      empireId: item.empireId,
      levels,
      queue: item.queue as unknown as EmpireResearchState['queue'],
    });
  }

  return empireIds.map(
    (empireId) => byEmpire.get(empireId) ?? { empireId, levels: {}, queue: [] },
  );
}

export function migrateGameState(value: unknown): GameState | undefined {
  if (
    !isRecord(value) ||
    (value.schemaVersion !== 1 && value.schemaVersion !== 2 && value.schemaVersion !== 3)
  ) {
    return undefined;
  }

  if (!Array.isArray(value.planets) || !Array.isArray(value.empires)) {
    return undefined;
  }

  const empireIds = value.empires.filter(
    (empireId): empireId is string => typeof empireId === 'string',
  );
  if (empireIds.length !== value.empires.length) {
    return undefined;
  }

  const planets: Record<string, unknown>[] = [];
  for (const planet of value.planets) {
    const migrated = migratePlanet(planet);
    if (migrated === undefined) {
      return undefined;
    }
    planets.push(migrated);
  }

  const research = readResearchStates(value.research, empireIds);
  if (research === undefined) {
    return undefined;
  }

  return {
    ...value,
    schemaVersion: 3,
    planets,
    research,
  } as unknown as GameState;
}
