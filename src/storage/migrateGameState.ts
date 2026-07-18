import type { GameState } from '../simulation/types';
import type { PlanetBuildingState } from '../simulation/planet/types';
import { createPlanetZones } from '../simulation/planet/zones';

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
  };
}

export function migrateGameState(value: unknown): GameState | undefined {
  if (!isRecord(value) || (value.schemaVersion !== 1 && value.schemaVersion !== 2)) {
    return undefined;
  }

  if (!Array.isArray(value.planets)) {
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

  return {
    ...value,
    schemaVersion: 2,
    planets,
  } as unknown as GameState;
}
