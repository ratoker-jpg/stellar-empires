import type { DebrisField } from '../simulation/combat/debris';
import type { GalaxyModel } from '../simulation/galaxy/types';
import type { EmpireIntelligenceState } from '../simulation/intelligence/types';
import type { PlanetState } from '../simulation/planet/types';
import type { SpaceObjectState } from '../simulation/pve/spaceObjects';
import {
  coordinateFromLegacyReference,
  parsePlanetCoordinate,
  type SpaceCoordinate,
} from '../simulation/space/coordinates';
import type { GameState } from '../simulation/types';
import {
  createUniverseModel,
  isUniverseModel,
  mergeLegacyGalaxy,
  selectMigrationPresetForSystemCount,
  type UniverseModel,
} from '../simulation/universe/model';
import {
  migrateGameStateV13,
  type LegacyGameStateV13,
} from './migrateGameStateV13';

export type LegacyGameStateV14 = Omit<GameState, 'schemaVersion' | 'campaignSettings'> & {
  readonly schemaVersion: 14;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function coordinateForPlanetRecord(planet: Record<string, unknown>): SpaceCoordinate | undefined {
  if (isRecord(planet.coordinate)) {
    const coordinate = planet.coordinate as unknown as SpaceCoordinate;
    if (coordinate.galaxy > 0 && coordinate.solarSystem > 0 && coordinate.position > 0) {
      return coordinate;
    }
  }
  if (typeof planet.galaxyPlanetId === 'string') {
    const parsed = parsePlanetCoordinate(planet.galaxyPlanetId);
    if (parsed !== undefined) return parsed;
  }
  if (typeof planet.id === 'string') {
    const parsed = parsePlanetCoordinate(planet.id);
    if (parsed !== undefined) return parsed;
  }
  return typeof planet.systemId === 'string' && typeof planet.position === 'number'
    ? coordinateFromLegacyReference(planet.systemId, planet.position)
    : undefined;
}

function normalizePlanets(value: readonly unknown[]): readonly PlanetState[] | undefined {
  const planets: PlanetState[] = [];
  for (const item of value) {
    if (!isRecord(item)) return undefined;
    const coordinate = coordinateForPlanetRecord(item);
    if (coordinate === undefined) return undefined;
    planets.push({ ...item, coordinate } as unknown as PlanetState);
  }
  return planets;
}

function coordinateByPlanetId(
  planets: readonly PlanetState[],
  planetId: string,
): SpaceCoordinate | undefined {
  const statePlanet = planets.find(
    (planet) => planet.id === planetId || planet.galaxyPlanetId === planetId,
  );
  return statePlanet?.coordinate ?? parsePlanetCoordinate(planetId);
}

function normalizeIntelligence(
  value: readonly EmpireIntelligenceState[],
  planets: readonly PlanetState[],
): readonly EmpireIntelligenceState[] | undefined {
  const states: EmpireIntelligenceState[] = [];
  for (const state of value) {
    const observations = state.observations.map((observation) => {
      const coordinate = observation.coordinate ??
        observation.snapshot.coordinate ??
        coordinateByPlanetId(planets, observation.targetPlanetId);
      if (coordinate === undefined) return undefined;
      return {
        ...observation,
        coordinate,
        snapshot: { ...observation.snapshot, coordinate },
      };
    });
    if (observations.some((observation) => observation === undefined)) return undefined;
    const alerts = state.alerts.map((alert) => {
      const coordinate = alert.coordinate ?? coordinateByPlanetId(planets, alert.targetPlanetId);
      return coordinate === undefined ? undefined : { ...alert, coordinate };
    });
    if (alerts.some((alert) => alert === undefined)) return undefined;
    states.push({
      ...state,
      observations: observations as EmpireIntelligenceState['observations'],
      alerts: alerts as EmpireIntelligenceState['alerts'],
    });
  }
  return states;
}

function normalizeDebris(
  value: readonly DebrisField[],
  planets: readonly PlanetState[],
): readonly DebrisField[] | undefined {
  const result: DebrisField[] = [];
  for (const field of value) {
    const coordinate = field.coordinate ?? coordinateByPlanetId(planets, field.planetId);
    if (coordinate === undefined) return undefined;
    result.push({ ...field, coordinate });
  }
  return result;
}

function normalizeSpaceObjects(
  value: readonly SpaceObjectState[],
): readonly SpaceObjectState[] | undefined {
  const result: SpaceObjectState[] = [];
  for (const object of value) {
    const coordinate = object.coordinate ??
      coordinateFromLegacyReference(object.systemId, object.position);
    if (coordinate === undefined) return undefined;
    result.push({ ...object, coordinate });
  }
  return result;
}

function sourceUniverse(value: unknown, legacy: LegacyGameStateV13): UniverseModel {
  if (isRecord(value) && isUniverseModel(value.universe)) return value.universe;
  return createUniverseModel(
    legacy.seed,
    selectMigrationPresetForSystemCount(legacy.galaxy.systems.length),
  );
}

function migrateLegacyShell(value: unknown): LegacyGameStateV13 | undefined {
  if (!isRecord(value)) return undefined;
  const source = value.schemaVersion === 14 ? { ...value, schemaVersion: 13 } : value;
  return migrateGameStateV13(source);
}

export function migrateGameStateV14(value: unknown): LegacyGameStateV14 | undefined {
  const legacy = migrateLegacyShell(value);
  if (legacy === undefined) return undefined;
  const universe = sourceUniverse(value, legacy);
  const legacyGalaxy = legacy.galaxy as GalaxyModel;
  const galaxy = mergeLegacyGalaxy(universe, legacyGalaxy);
  const planets = normalizePlanets(legacy.planets);
  if (planets === undefined) return undefined;
  const intelligence = normalizeIntelligence(legacy.intelligence, planets);
  const debrisFields = normalizeDebris(legacy.debrisFields, planets);
  const spaceObjects = normalizeSpaceObjects(legacy.spaceObjects);
  if (intelligence === undefined || debrisFields === undefined || spaceObjects === undefined) {
    return undefined;
  }
  return {
    ...legacy,
    schemaVersion: 14,
    universe,
    galaxy,
    planets,
    intelligence,
    debrisFields,
    spaceObjects,
  };
}
