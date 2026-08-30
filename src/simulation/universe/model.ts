import type {
  GalaxyModel,
  PlanetBiome,
  PlanetModel,
  StarClass,
  StarSystemModel,
} from '../galaxy/types';
import { hashText } from '../seed';
import {
  SOLAR_SYSTEM_POSITION_COUNT,
  UNIVERSE_SLOT_COUNT,
  isSpaceCoordinate,
  parsePlanetCoordinate,
  parseSystemCoordinate,
  planetIdForCoordinate,
  systemIdForCoordinate,
  sameSpaceCoordinate,
  type SpaceCoordinate,
} from '../space/coordinates';
import { PLAYER_EMPIRE_ID, LEGACY_BOT_EMPIRE_IDS } from '../bots/profiles';

export type UniverseTopologyPresetId = 'test' | 'campaign' | 'fidelity';

export interface UniverseTopologyPreset {
  readonly id: UniverseTopologyPresetId;
  readonly galaxyCount: number;
  readonly systemsPerGalaxy: number;
}

export const UNIVERSE_TOPOLOGY_PRESETS: Readonly<
  Record<UniverseTopologyPresetId, UniverseTopologyPreset>
> = {
  test: { id: 'test', galaxyCount: 2, systemsPerGalaxy: 9 },
  campaign: { id: 'campaign', galaxyCount: 6, systemsPerGalaxy: 27 },
  fidelity: { id: 'fidelity', galaxyCount: 15, systemsPerGalaxy: 81 },
};

export interface UniverseSlotDescriptor {
  readonly slot: number;
  readonly state: 'populated' | 'empty';
  readonly galaxyId: string | null;
}

export interface UniverseGalaxyDescriptor {
  readonly id: string;
  readonly slot: number;
  readonly seed: number;
  readonly systemCount: number;
}

export interface UniverseHomePlanet {
  readonly coordinate: SpaceCoordinate;
  readonly empireId: string;
}

export interface UniverseModel {
  readonly presetId: UniverseTopologyPresetId;
  readonly positionsPerSystem: typeof SOLAR_SYSTEM_POSITION_COUNT;
  readonly slots: readonly UniverseSlotDescriptor[];
  readonly galaxies: readonly UniverseGalaxyDescriptor[];
  /** Canonical home-world assignment; drives ownership of lazily resolved planets. */
  readonly homePlanets: readonly UniverseHomePlanet[];
}

export interface SolarPositionDescriptor {
  readonly coordinate: SpaceCoordinate;
  readonly planet: PlanetModel | null;
}

export interface MaterializedSolarSystem {
  readonly system: StarSystemModel;
  readonly positions: readonly SolarPositionDescriptor[];
}

const STAR_CLASSES: readonly StarClass[] = ['blue', 'white', 'yellow', 'orange', 'red'];
const PLANET_BIOMES: readonly PlanetBiome[] = [
  'terran',
  'desert',
  'ice',
  'volcanic',
  'toxic',
  'barren',
  'gas',
];
const SYSTEM_PREFIXES = [
  'Astra',
  'Helion',
  'Orion',
  'Vesper',
  'Cygnus',
  'Nadir',
  'Solace',
  'Kepler',
] as const;

/** Canonical legacy home systems inside galaxy 1 (player + the three legacy bots). */
const LEGACY_HOME_COORDINATES: readonly SpaceCoordinate[] = [
  { galaxy: 1, solarSystem: 1, position: 1 },
  { galaxy: 1, solarSystem: 2, position: 1 },
  { galaxy: 1, solarSystem: 3, position: 1 },
  { galaxy: 1, solarSystem: 4, position: 1 },
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function valueAt<T>(values: readonly T[], hash: number): T {
  const value = values[hash % values.length];
  if (value === undefined) throw new Error('Cannot select from an empty deterministic collection.');
  return value;
}

export function getUniverseTopologyPreset(
  presetId: UniverseTopologyPresetId,
): UniverseTopologyPreset {
  return UNIVERSE_TOPOLOGY_PRESETS[presetId];
}

/**
 * Deterministic home-world assignment (docs/30 D-1): the player always roots at
 * galaxy 1 system 1, legacy bots keep their historical homes, and generated
 * bots claim one home per system along a seed-hashed traversal until every
 * bot is placed or the systems are exhausted.
 */
export function assignHomeWorlds(
  seed: number,
  presetId: UniverseTopologyPresetId,
  empireIds: readonly string[],
): readonly UniverseHomePlanet[] {
  const preset = getUniverseTopologyPreset(presetId);
  const homes: UniverseHomePlanet[] = [];
  const taken = new Set<string>();
  const remaining: string[] = [];
  for (const empireId of empireIds) {
    if (empireId === PLAYER_EMPIRE_ID) {
      const coordinate = LEGACY_HOME_COORDINATES[0];
      if (coordinate === undefined) throw new Error('Legacy home layout is missing the player coordinate.');
      homes.push({ coordinate, empireId });
      taken.add(`${coordinate.galaxy}:${coordinate.solarSystem}`);
      continue;
    }
    remaining.push(empireId);
  }

  const legacyIndex = new Map(LEGACY_BOT_EMPIRE_IDS.map((id, index) => [id, index + 1]));
  const generated: string[] = [];
  for (const empireId of remaining) {
    const legacySlot = legacyIndex.get(empireId);
    if (legacySlot === undefined) {
      generated.push(empireId);
      continue;
    }
    const coordinate = LEGACY_HOME_COORDINATES[legacySlot];
    if (coordinate === undefined) throw new Error(`Legacy home coordinate is missing: ${empireId}.`);
    homes.push({ coordinate, empireId });
    taken.add(`${coordinate.galaxy}:${coordinate.solarSystem}`);
  }

  if (generated.length > 0) {
    const systems: SpaceCoordinate[] = [];
    for (let galaxySlot = 1; galaxySlot <= preset.galaxyCount; galaxySlot += 1) {
      for (let solarSystem = 1; solarSystem <= preset.systemsPerGalaxy; solarSystem += 1) {
        if (!taken.has(`${galaxySlot}:${solarSystem}`)) {
          systems.push({ galaxy: galaxySlot, solarSystem, position: 1 });
        }
      }
    }
    const ordered = systems
      .map((coordinate) => ({
        coordinate,
        order: hashText(`${seed}:home:${coordinate.galaxy}:${coordinate.solarSystem}`),
      }))
      .sort((left, right) =>
        left.order - right.order || left.coordinate.galaxy - right.coordinate.galaxy ||
        left.coordinate.solarSystem - right.coordinate.solarSystem)
      .map((entry) => entry.coordinate);
    if (ordered.length < generated.length) {
      throw new Error(
        `Universe preset ${presetId} cannot host ${generated.length} generated bot homes (only ${ordered.length} systems remain).`,
      );
    }
    for (let index = 0; index < generated.length; index += 1) {
      const coordinate = ordered[index];
      const empireId = generated[index];
      if (coordinate === undefined) throw new Error('Home assignment exhausted the universe systems.');
      if (empireId === undefined) throw new Error('Home assignment ran out of bot empires.');
      homes.push({ coordinate, empireId });
    }
  }

  return homes.sort((left, right) =>
    left.coordinate.galaxy - right.coordinate.galaxy ||
    left.coordinate.solarSystem - right.coordinate.solarSystem ||
    left.coordinate.position - right.coordinate.position);
}

export function createUniverseModel(
  seed: number,
  presetId: UniverseTopologyPresetId = 'campaign',
  empireIds?: readonly string[],
): UniverseModel {
  const preset = getUniverseTopologyPreset(presetId);
  const galaxies = Array.from(
    { length: preset.galaxyCount },
    (_, index): UniverseGalaxyDescriptor => ({
      id: `galaxy-${index + 1}`,
      slot: index + 1,
      seed: hashText(`${seed}:galaxy:${index + 1}`),
      systemCount: preset.systemsPerGalaxy,
    }),
  );
  const galaxyBySlot = new Map(galaxies.map((galaxy) => [galaxy.slot, galaxy]));
  const slots = Array.from(
    { length: UNIVERSE_SLOT_COUNT },
    (_, index): UniverseSlotDescriptor => {
      const slot = index + 1;
      const galaxy = galaxyBySlot.get(slot);
      return galaxy === undefined
        ? { slot, state: 'empty', galaxyId: null }
        : { slot, state: 'populated', galaxyId: galaxy.id };
    },
  );
  return {
    presetId,
    positionsPerSystem: SOLAR_SYSTEM_POSITION_COUNT,
    slots,
    galaxies,
    homePlanets: empireIds === undefined ? [] : assignHomeWorlds(seed, presetId, empireIds),
  };
}

export function isUniverseModel(value: unknown): value is UniverseModel {
  if (!isRecord(value) ||
    (value.presetId !== 'test' && value.presetId !== 'campaign' && value.presetId !== 'fidelity') ||
    value.positionsPerSystem !== SOLAR_SYSTEM_POSITION_COUNT ||
    !Array.isArray(value.slots) || value.slots.length !== UNIVERSE_SLOT_COUNT ||
    !Array.isArray(value.galaxies) || !Array.isArray(value.homePlanets)) return false;
  const preset = getUniverseTopologyPreset(value.presetId);
  if (value.galaxies.length !== preset.galaxyCount) return false;
  const slotsValid = value.slots.every((slot, index) =>
    isRecord(slot) && slot.slot === index + 1 &&
    (slot.state === 'populated' || slot.state === 'empty') &&
    (slot.galaxyId === null || typeof slot.galaxyId === 'string'));
  const galaxiesValid = value.galaxies.every((galaxy, index) =>
    isRecord(galaxy) && galaxy.id === `galaxy-${index + 1}` &&
    galaxy.slot === index + 1 && Number.isInteger(galaxy.seed) &&
    galaxy.systemCount === preset.systemsPerGalaxy);
  const homeCoordinates = new Set<string>();
  const homeEmpireIds = new Set<string>();
  const homesValid = value.homePlanets.every((home) =>
    isRecord(home) && isSpaceCoordinate(home.coordinate) &&
    typeof home.empireId === 'string' && home.empireId.length > 0 &&
    home.coordinate.position === 1 &&
    home.coordinate.galaxy <= preset.galaxyCount &&
    home.coordinate.solarSystem <= preset.systemsPerGalaxy &&
    (() => {
      const key = `${home.coordinate.galaxy}:${home.coordinate.solarSystem}`;
      if (homeCoordinates.has(key) || homeEmpireIds.has(home.empireId)) return false;
      homeCoordinates.add(key);
      homeEmpireIds.add(home.empireId);
      return true;
    })());
  return slotsValid && galaxiesValid && homesValid;
}

export function selectMigrationPresetForSystemCount(
  systemCount: number,
): UniverseTopologyPresetId {
  if (systemCount <= UNIVERSE_TOPOLOGY_PRESETS.test.systemsPerGalaxy) return 'test';
  if (systemCount <= UNIVERSE_TOPOLOGY_PRESETS.campaign.systemsPerGalaxy) return 'campaign';
  return 'fidelity';
}

function requireGalaxy(
  universe: UniverseModel,
  galaxySlot: number,
): UniverseGalaxyDescriptor {
  const galaxy = universe.galaxies.find((candidate) => candidate.slot === galaxySlot);
  if (galaxy === undefined) throw new Error(`Universe galaxy slot is not populated: ${galaxySlot}`);
  return galaxy;
}

export function selectStarSystemDescriptor(
  universe: UniverseModel,
  galaxySlot: number,
  solarSystem: number,
): StarSystemModel {
  const galaxy = requireGalaxy(universe, galaxySlot);
  if (!Number.isInteger(solarSystem) || solarSystem < 1 || solarSystem > galaxy.systemCount) {
    throw new Error(`Solar system is outside galaxy ${galaxySlot}: ${solarSystem}`);
  }
  const columns = 9;
  const rows = Math.ceil(galaxy.systemCount / columns);
  const width = 1_120;
  const height = Math.max(560, rows * 170);
  const column = (solarSystem - 1) % columns;
  const row = Math.floor((solarSystem - 1) / columns);
  const roll = hashText(`${galaxy.seed}:system:${solarSystem}`);
  const jitterX = ((roll % 101) - 50) * 0.7;
  const jitterY = (((Math.floor(roll / 101)) % 101) - 50) * 0.7;
  const x = Math.round(((column + 0.5) * width) / columns + jitterX);
  const y = Math.round(((row + 0.5) * height) / rows + jitterY);
  const prefix = valueAt(SYSTEM_PREFIXES, Math.floor(roll / 13));
  const planets = Array.from(
    { length: SOLAR_SYSTEM_POSITION_COUNT },
    (_, index) => selectPlanetDescriptor(universe, {
      galaxy: galaxySlot,
      solarSystem,
      position: index + 1,
    }),
  ).filter((planet): planet is PlanetModel => planet !== null);
  return {
    id: systemIdForCoordinate({ galaxy: galaxySlot, solarSystem }),
    name: `${prefix} ${String(solarSystem).padStart(2, '0')}`,
    galaxy: galaxySlot,
    solarSystem,
    x,
    y,
    starClass: valueAt(STAR_CLASSES, Math.floor(roll / 29)),
    planets,
  };
}

export function selectPlanetDescriptor(
  universe: UniverseModel,
  coordinate: SpaceCoordinate,
): PlanetModel | null {
  if (!isSpaceCoordinate(coordinate)) return null;
  const galaxy = universe.galaxies.find((candidate) => candidate.slot === coordinate.galaxy);
  if (galaxy === undefined || coordinate.solarSystem > galaxy.systemCount) return null;
  const roll = hashText(`${galaxy.seed}:${coordinate.solarSystem}:${coordinate.position}:planet`);
  const homeOwner = homeOwnerForCoordinate(universe, coordinate);
  const occupied = homeOwner !== null || coordinate.position <= 3 || roll % 100 < 48;
  if (!occupied) return null;
  let biome = valueAt(PLANET_BIOMES, Math.floor(roll / 7));
  if (homeOwner !== null && biome === 'gas') biome = 'terran';
  return {
    id: planetIdForCoordinate(coordinate),
    coordinate,
    position: coordinate.position,
    biome,
    size: 90 + (Math.floor(roll / 17) % 111),
    ownerEmpireId: homeOwner,
  };
}

export function homeOwnerForCoordinate(
  universe: UniverseModel,
  coordinate: SpaceCoordinate,
): string | null {
  for (const home of universe.homePlanets) {
    if (sameSpaceCoordinate(home.coordinate, coordinate)) return home.empireId;
  }
  return null;
}

export function materializeSolarSystem(
  universe: UniverseModel,
  galaxySlot: number,
  solarSystem: number,
): MaterializedSolarSystem {
  const system = selectStarSystemDescriptor(universe, galaxySlot, solarSystem);
  const planetByPosition = new Map(system.planets.map((planet) => [planet.position, planet]));
  const positions = Array.from(
    { length: SOLAR_SYSTEM_POSITION_COUNT },
    (_, index): SolarPositionDescriptor => {
      const coordinate = { galaxy: galaxySlot, solarSystem, position: index + 1 };
      return { coordinate, planet: planetByPosition.get(index + 1) ?? null };
    },
  );
  return { system, positions };
}

export function materializeGalaxy(
  universe: UniverseModel,
  galaxySlot = 1,
): GalaxyModel {
  const galaxy = requireGalaxy(universe, galaxySlot);
  const systems = Array.from(
    { length: galaxy.systemCount },
    (_, index) => selectStarSystemDescriptor(universe, galaxySlot, index + 1),
  );
  const rows = Math.ceil(galaxy.systemCount / 9);
  return { galaxy: galaxySlot, width: 1_120, height: Math.max(560, rows * 170), systems };
}

export function mergeLegacyGalaxy(
  universe: UniverseModel,
  legacyGalaxy: GalaxyModel,
): GalaxyModel {
  const generated = materializeGalaxy(universe, 1);
  const legacyById = new Map(legacyGalaxy.systems.map((system) => [system.id, system]));
  return {
    ...generated,
    systems: generated.systems.map((system) => {
      const legacy = legacyById.get(system.id);
      if (legacy === undefined) return system;
      const systemCoordinate = parseSystemCoordinate(legacy.id) ?? {
        galaxy: 1,
        solarSystem: system.solarSystem,
      };
      return {
        ...system,
        ...legacy,
        galaxy: systemCoordinate.galaxy,
        solarSystem: systemCoordinate.solarSystem,
        planets: legacy.planets.map((planet) => ({
          ...planet,
          coordinate: parsePlanetCoordinate(planet.id) ?? {
            ...systemCoordinate,
            position: planet.position,
          },
        })),
      };
    }),
  };
}

export function resolveUniversePlanet(
  universe: UniverseModel,
  planetId: string,
): PlanetModel | undefined {
  const coordinate = parsePlanetCoordinate(planetId);
  return coordinate === undefined ? undefined : selectPlanetDescriptor(universe, coordinate) ?? undefined;
}

export function selectDeterministicSpaceCoordinate(
  universe: UniverseModel,
  actorId: string,
  purpose: string,
): SpaceCoordinate {
  const preset = getUniverseTopologyPreset(universe.presetId);
  const roll = hashText(`${actorId}:${purpose}:${universe.presetId}`);
  const galaxy = 1 + (roll % preset.galaxyCount);
  const solarSystem = 1 + (Math.floor(roll / 31) % preset.systemsPerGalaxy);
  const position = 1 + (Math.floor(roll / 997) % SOLAR_SYSTEM_POSITION_COUNT);
  return { galaxy, solarSystem, position };
}
