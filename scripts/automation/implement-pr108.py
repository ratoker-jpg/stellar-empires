from __future__ import annotations

import json
from pathlib import Path

ROOT = Path.cwd()


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def replace(path: str, old: str, new: str) -> None:
    content = read(path)
    if old not in content:
        raise RuntimeError(f"Expected text not found in {path}: {old[:120]!r}")
    write(path, content.replace(old, new))


write(
    "src/simulation/space/coordinates.ts",
    r'''export const UNIVERSE_SLOT_COUNT = 20 as const;
export const SOLAR_SYSTEM_POSITION_COUNT = 24 as const;

export interface SpaceCoordinate {
  readonly galaxy: number;
  readonly solarSystem: number;
  readonly position: number;
}

export interface SpaceSystemCoordinate {
  readonly galaxy: number;
  readonly solarSystem: number;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

export function isSpaceCoordinate(value: unknown): value is SpaceCoordinate {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const coordinate = value as Record<string, unknown>;
  return isPositiveInteger(coordinate.galaxy) &&
    coordinate.galaxy <= UNIVERSE_SLOT_COUNT &&
    isPositiveInteger(coordinate.solarSystem) &&
    isPositiveInteger(coordinate.position) &&
    coordinate.position <= SOLAR_SYSTEM_POSITION_COUNT;
}

export function assertSpaceCoordinate(coordinate: SpaceCoordinate): void {
  if (!isSpaceCoordinate(coordinate)) {
    throw new Error(`Invalid SpaceCoordinate: ${JSON.stringify(coordinate)}`);
  }
}

export function spaceCoordinateKey(coordinate: SpaceCoordinate): string {
  assertSpaceCoordinate(coordinate);
  return `${coordinate.galaxy}:${coordinate.solarSystem}:${coordinate.position}`;
}

export function compareSpaceCoordinates(
  left: SpaceCoordinate,
  right: SpaceCoordinate,
): number {
  return left.galaxy - right.galaxy ||
    left.solarSystem - right.solarSystem ||
    left.position - right.position;
}

export function systemIdForCoordinate(
  coordinate: SpaceSystemCoordinate,
): string {
  if (!isPositiveInteger(coordinate.galaxy) || !isPositiveInteger(coordinate.solarSystem)) {
    throw new Error(`Invalid system coordinate: ${JSON.stringify(coordinate)}`);
  }
  return coordinate.galaxy === 1
    ? `system-${coordinate.solarSystem}`
    : `galaxy-${coordinate.galaxy}-system-${coordinate.solarSystem}`;
}

export function planetIdForCoordinate(coordinate: SpaceCoordinate): string {
  assertSpaceCoordinate(coordinate);
  return `${systemIdForCoordinate(coordinate)}-planet-${coordinate.position}`;
}

export function parseSystemCoordinate(reference: string): SpaceSystemCoordinate | undefined {
  const legacy = /^system-(\d+)$/.exec(reference);
  if (legacy !== null) {
    const solarSystem = Number(legacy[1]);
    return isPositiveInteger(solarSystem) ? { galaxy: 1, solarSystem } : undefined;
  }
  const current = /^galaxy-(\d+)-system-(\d+)$/.exec(reference);
  if (current === null) return undefined;
  const galaxy = Number(current[1]);
  const solarSystem = Number(current[2]);
  return isPositiveInteger(galaxy) && galaxy <= UNIVERSE_SLOT_COUNT &&
    isPositiveInteger(solarSystem)
    ? { galaxy, solarSystem }
    : undefined;
}

function stripStatePrefix(reference: string): string {
  for (const prefix of ['colony-', 'pirate-base-', 'debris-']) {
    if (reference.startsWith(prefix)) return reference.slice(prefix.length);
  }
  return reference;
}

export function parsePlanetCoordinate(reference: string): SpaceCoordinate | undefined {
  const normalized = stripStatePrefix(reference);
  const match = /^(system-\d+|galaxy-\d+-system-\d+)-planet-(\d+)$/.exec(normalized);
  if (match === null) return undefined;
  const system = parseSystemCoordinate(match[1] ?? '');
  const position = Number(match[2]);
  if (system === undefined || !isPositiveInteger(position) || position > SOLAR_SYSTEM_POSITION_COUNT) {
    return undefined;
  }
  return { ...system, position };
}

export function coordinateFromLegacyReference(
  systemId: string,
  position: number,
): SpaceCoordinate | undefined {
  const system = parseSystemCoordinate(systemId);
  if (system === undefined) return undefined;
  const coordinate = { ...system, position };
  return isSpaceCoordinate(coordinate) ? coordinate : undefined;
}

export function calculateCoordinateDistance(
  origin: SpaceCoordinate,
  target: SpaceCoordinate,
): number {
  assertSpaceCoordinate(origin);
  assertSpaceCoordinate(target);
  if (spaceCoordinateKey(origin) === spaceCoordinateKey(target)) return 0;
  const galaxyDistance = Math.abs(target.galaxy - origin.galaxy) * 250_000;
  const systemDistance = Math.abs(target.solarSystem - origin.solarSystem) * 10_000;
  const positionDistance = Math.abs(target.position - origin.position) * 12;
  return Math.max(1, galaxyDistance + systemDistance + positionDistance);
}
''',
)

write(
    "src/simulation/universe/model.ts",
    r'''import type {
  GalaxyModel,
  PlanetBiome,
  PlanetModel,
  StarClass,
  StarSystemModel,
} from '../galaxy/types';
import {
  SOLAR_SYSTEM_POSITION_COUNT,
  UNIVERSE_SLOT_COUNT,
  isSpaceCoordinate,
  parsePlanetCoordinate,
  parseSystemCoordinate,
  planetIdForCoordinate,
  systemIdForCoordinate,
  type SpaceCoordinate,
} from '../space/coordinates';

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

export interface UniverseModel {
  readonly presetId: UniverseTopologyPresetId;
  readonly positionsPerSystem: typeof SOLAR_SYSTEM_POSITION_COUNT;
  readonly slots: readonly UniverseSlotDescriptor[];
  readonly galaxies: readonly UniverseGalaxyDescriptor[];
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
const HOME_OWNERS: readonly string[] = ['player', 'aegis-bot', 'synod-bot', 'veyra-bot'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hashText(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
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

export function createUniverseModel(
  seed: number,
  presetId: UniverseTopologyPresetId = 'campaign',
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
  };
}

export function isUniverseModel(value: unknown): value is UniverseModel {
  if (!isRecord(value) ||
    (value.presetId !== 'test' && value.presetId !== 'campaign' && value.presetId !== 'fidelity') ||
    value.positionsPerSystem !== SOLAR_SYSTEM_POSITION_COUNT ||
    !Array.isArray(value.slots) || value.slots.length !== UNIVERSE_SLOT_COUNT ||
    !Array.isArray(value.galaxies)) return false;
  const preset = getUniverseTopologyPreset(value.presetId);
  if (value.galaxies.length !== preset.galaxyCount) return false;
  return value.slots.every((slot, index) =>
    isRecord(slot) && slot.slot === index + 1 &&
    (slot.state === 'populated' || slot.state === 'empty') &&
    (slot.galaxyId === null || typeof slot.galaxyId === 'string')) &&
    value.galaxies.every((galaxy, index) =>
      isRecord(galaxy) && galaxy.id === `galaxy-${index + 1}` &&
      galaxy.slot === index + 1 && Number.isInteger(galaxy.seed) &&
      galaxy.systemCount === preset.systemsPerGalaxy);
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
  const homeOwner = coordinate.galaxy === 1 && coordinate.position === 1
    ? HOME_OWNERS[coordinate.solarSystem - 1] ?? null
    : null;
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
''',
)

write(
    "src/simulation/galaxy/types.ts",
    r'''import type { SpaceCoordinate } from '../space/coordinates';

export type StarClass = 'blue' | 'white' | 'yellow' | 'orange' | 'red';

export type PlanetBiome =
  | 'terran'
  | 'desert'
  | 'ice'
  | 'volcanic'
  | 'toxic'
  | 'barren'
  | 'gas';

export interface PlanetModel {
  readonly id: string;
  readonly coordinate: SpaceCoordinate;
  readonly position: number;
  readonly biome: PlanetBiome;
  readonly size: number;
  readonly ownerEmpireId: string | null;
}

export interface StarSystemModel {
  readonly id: string;
  readonly name: string;
  readonly galaxy: number;
  readonly solarSystem: number;
  readonly x: number;
  readonly y: number;
  readonly starClass: StarClass;
  readonly planets: readonly PlanetModel[];
}

export interface GalaxyModel {
  readonly galaxy: number;
  readonly width: number;
  readonly height: number;
  readonly systems: readonly StarSystemModel[];
}

export interface GalaxyGenerationConfig {
  readonly galaxy: number;
  readonly systemCount: number;
  readonly positionsPerSystem: number;
  readonly width: number;
  readonly height: number;
}
''',
)

write(
    "src/simulation/galaxy/generateGalaxy.ts",
    r'''import { createSeededRandom } from '../seed';
import { planetIdForCoordinate, systemIdForCoordinate } from '../space/coordinates';
import type {
  GalaxyGenerationConfig,
  GalaxyModel,
  PlanetBiome,
  PlanetModel,
  StarClass,
  StarSystemModel,
} from './types';

const DEFAULT_CONFIG: GalaxyGenerationConfig = {
  galaxy: 1,
  systemCount: 12,
  positionsPerSystem: 8,
  width: 1_120,
  height: 560,
};

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
const HOME_OWNERS: readonly string[] = ['player', 'aegis-bot', 'synod-bot', 'veyra-bot'];
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

function pick<T>(values: readonly T[], random: () => number): T {
  const value = values[Math.floor(random() * values.length)];
  if (value === undefined) throw new Error('Cannot pick from an empty collection.');
  return value;
}

function createPlanets(
  systemIndex: number,
  config: GalaxyGenerationConfig,
  random: () => number,
): readonly PlanetModel[] {
  const planetCount = Math.max(3, Math.floor(config.positionsPerSystem * (0.45 + random() * 0.55)));
  const homeOwner = config.galaxy === 1 ? HOME_OWNERS[systemIndex] ?? null : null;
  return Array.from({ length: planetCount }, (_, planetIndex): PlanetModel => {
    const coordinate = {
      galaxy: config.galaxy,
      solarSystem: systemIndex + 1,
      position: planetIndex + 1,
    };
    return {
      id: planetIdForCoordinate(coordinate),
      coordinate,
      position: coordinate.position,
      biome: pick(PLANET_BIOMES, random),
      size: 90 + Math.floor(random() * 111),
      ownerEmpireId: planetIndex === 0 ? homeOwner : null,
    };
  });
}

export function generateGalaxy(
  seed: number,
  overrides: Partial<GalaxyGenerationConfig> = {},
): GalaxyModel {
  const config: GalaxyGenerationConfig = { ...DEFAULT_CONFIG, ...overrides };
  if (config.galaxy <= 0 || config.systemCount <= 0 || config.positionsPerSystem <= 0) {
    throw new Error('Galaxy generation counts must be positive.');
  }
  const random = createSeededRandom(seed);
  const columns = Math.ceil(Math.sqrt(config.systemCount));
  const rows = Math.ceil(config.systemCount / columns);
  const cellWidth = config.width / columns;
  const cellHeight = config.height / rows;
  const systems: readonly StarSystemModel[] = Array.from(
    { length: config.systemCount },
    (_, systemIndex): StarSystemModel => {
      const column = systemIndex % columns;
      const row = Math.floor(systemIndex / columns);
      const jitterX = (random() - 0.5) * cellWidth * 0.42;
      const jitterY = (random() - 0.5) * cellHeight * 0.42;
      const prefix = pick(SYSTEM_PREFIXES, random);
      const solarSystem = systemIndex + 1;
      return {
        id: systemIdForCoordinate({ galaxy: config.galaxy, solarSystem }),
        name: `${prefix} ${String(solarSystem).padStart(2, '0')}`,
        galaxy: config.galaxy,
        solarSystem,
        x: Math.round((column + 0.5) * cellWidth + jitterX),
        y: Math.round((row + 0.5) * cellHeight + jitterY),
        starClass: pick(STAR_CLASSES, random),
        planets: createPlanets(systemIndex, config, random),
      };
    },
  );
  return { galaxy: config.galaxy, width: config.width, height: config.height, systems };
}
''',
)

replace(
    "src/simulation/types.ts",
    "import type { UnitKind } from './units/types';",
    "import type { UnitKind } from './units/types';\nimport type { UniverseModel } from './universe/model';",
)
replace(
    "src/simulation/types.ts",
    "export interface GameState {\n  readonly schemaVersion: 13;",
    "export interface GameState {\n  readonly schemaVersion: 14;",
)
replace(
    "src/simulation/types.ts",
    "  readonly empires: readonly string[];\n  readonly galaxy: GalaxyModel;",
    "  readonly empires: readonly string[];\n  readonly universe: UniverseModel;\n  readonly galaxy: GalaxyModel;",
)

replace(
    "src/simulation/planet/types.ts",
    "import type { PlanetDefenseState } from '../defense/types';",
    "import type { PlanetDefenseState } from '../defense/types';\nimport type { SpaceCoordinate } from '../space/coordinates';",
)
replace(
    "src/simulation/planet/types.ts",
    "  readonly position: number;\n  readonly name: string;",
    "  readonly position: number;\n  readonly coordinate: SpaceCoordinate;\n  readonly name: string;",
)

replace(
    "src/simulation/planet/createInitialPlanetStates.ts",
    "        position: planet.position,\n        name:",
    "        position: planet.position,\n        coordinate: planet.coordinate,\n        name:",
)

write(
    "src/simulation/createInitialGameState.ts",
    r'''import { createInitialBotAutomationState } from './bots/state';
import { createInitialCommandStates } from './command/commandDoctrine';
import { createInitialIntelligenceStates } from './intelligence/intelligenceState';
import { createInitialMarketState } from './market/market';
import { createInitialPlanetStates } from './planet/createInitialPlanetStates';
import type { FactionId } from './planet/types';
import { createInitialNeutralForces } from './pve/neutralForces';
import {
  createInitialSpaceObjects,
  createInitialStrategicResources,
} from './pve/spaceObjects';
import { createInitialWorldEventState } from './pve/worldEvents';
import { createInitialResearchStates } from './research/researchState';
import { normalizeSeed } from './seed';
import type { GameState } from './types';
import {
  createUniverseModel,
  materializeGalaxy,
  type UniverseTopologyPresetId,
} from './universe/model';
import { createInitialShipUpgradeStates } from './upgrades/shipUpgrades';

export function createInitialGameState(
  seedSource: string,
  playerFaction: FactionId = 'aegis',
  topologyPreset: UniverseTopologyPresetId = 'campaign',
): GameState {
  const seed = normalizeSeed(seedSource);
  const universe = createUniverseModel(seed, topologyPreset);
  const galaxy = materializeGalaxy(universe, 1);
  const empires = ['player', 'aegis-bot', 'synod-bot', 'veyra-bot'] as const;
  const colonies = createInitialPlanetStates(galaxy, playerFaction);
  const neutralForces = createInitialNeutralForces(galaxy, seed);
  return {
    schemaVersion: 14,
    seed,
    clock: {
      startedAt: '2026-07-18T00:00:00.000Z',
      elapsedSeconds: 0,
    },
    empires,
    universe,
    galaxy,
    planets: [...colonies, ...neutralForces.planets],
    research: createInitialResearchStates(empires),
    shipUpgrades: createInitialShipUpgradeStates(empires),
    commanders: createInitialCommandStates(empires),
    fleets: neutralForces.fleets,
    intelligence: createInitialIntelligenceStates(empires),
    debrisFields: [],
    logisticsRoutes: [],
    market: createInitialMarketState(),
    spaceObjects: createInitialSpaceObjects(galaxy, seed),
    strategicResources: createInitialStrategicResources(empires),
    worldEvents: createInitialWorldEventState(),
    botAutomation: createInitialBotAutomationState(empires, 0),
    nextEventSequence: 0,
    pendingEvents: [],
    commandLog: [],
    eventLog: [],
  };
}
''',
)

replace(
    "src/simulation/colonization/colonization.ts",
    "import type { GameState } from '../types';",
    "import type { GameState } from '../types';\nimport { resolveUniversePlanet, selectStarSystemDescriptor } from '../universe/model';",
)
replace(
    "src/simulation/colonization/colonization.ts",
    "export function isColonizableGalaxyPlanet",
    "export function findUniversePlanet(\n  state: GameState,\n  galaxyPlanetId: string,\n): GalaxyPlanetLocation | undefined {\n  const materialized = findGalaxyPlanet(state.galaxy, galaxyPlanetId);\n  if (materialized !== undefined) return materialized;\n  const planet = resolveUniversePlanet(state.universe, galaxyPlanetId);\n  if (planet === undefined) return undefined;\n  return {\n    system: selectStarSystemDescriptor(\n      state.universe,\n      planet.coordinate.galaxy,\n      planet.coordinate.solarSystem,\n    ),\n    planet,\n  };\n}\n\nexport function isColonizableGalaxyPlanet",
)
replace(
    "src/simulation/colonization/colonization.ts",
    "    position: location.planet.position,\n    name:",
    "    position: location.planet.position,\n    coordinate: location.planet.coordinate,\n    name:",
)
replace(
    "src/simulation/colonization/colonization.ts",
    "  const location = findGalaxyPlanet(state.galaxy, galaxyPlanetId);",
    "  const location = findUniversePlanet(state, galaxyPlanetId);",
)

replace(
    "src/simulation/pve/neutralForces.ts",
    "    position: candidate.planet.position,\n    name:",
    "    position: candidate.planet.position,\n    coordinate: candidate.planet.coordinate,\n    name:",
)

write(
    "src/simulation/fleets/flightCalculations.ts",
    r'''import type { GalaxyModel, PlanetModel, StarSystemModel } from '../galaxy/types';
import type { PlanetState } from '../planet/types';
import {
  calculateCoordinateDistance,
  coordinateFromLegacyReference,
  parseSystemCoordinate,
} from '../space/coordinates';
import { calculateFleetComposition } from './fleetCalculations';
import type { FleetState } from './types';

export interface FlightEstimate {
  readonly distance: number;
  readonly durationSeconds: number;
  readonly fuelCost: number;
}

function requireSystem(galaxy: GalaxyModel, systemId: string): StarSystemModel {
  const system = galaxy.systems.find((candidate) => candidate.id === systemId);
  if (system === undefined) throw new Error(`Galaxy system not found: ${systemId}`);
  return system;
}

function findGalaxyPlanet(
  galaxy: GalaxyModel,
  galaxyPlanetId: string,
): { readonly system: StarSystemModel; readonly planet: PlanetModel } | undefined {
  for (const system of galaxy.systems) {
    const planet = system.planets.find((candidate) => candidate.id === galaxyPlanetId);
    if (planet !== undefined) return { system, planet };
  }
  return undefined;
}

export function calculateTargetDistance(
  galaxy: GalaxyModel,
  origin: PlanetState,
  targetSystemId: string,
  targetPosition: number,
): number {
  const parsedTarget = parseSystemCoordinate(targetSystemId);
  const targetSystem = parsedTarget === undefined ? requireSystem(galaxy, targetSystemId) : undefined;
  const targetCoordinate = {
    galaxy: parsedTarget?.galaxy ?? targetSystem?.galaxy ?? galaxy.galaxy,
    solarSystem: parsedTarget?.solarSystem ?? targetSystem?.solarSystem ?? 1,
    position: targetPosition,
  };
  const originCoordinate = origin.coordinate ??
    coordinateFromLegacyReference(origin.systemId, origin.position);
  if (originCoordinate === undefined) throw new Error(`Planet coordinate not found: ${origin.id}`);
  return calculateCoordinateDistance(originCoordinate, targetCoordinate);
}

export function calculatePlanetDistance(
  galaxy: GalaxyModel,
  origin: PlanetState,
  target: PlanetState,
): number {
  if (origin.id === target.id) return 0;
  if (origin.coordinate !== undefined && target.coordinate !== undefined) {
    return calculateCoordinateDistance(origin.coordinate, target.coordinate);
  }
  return calculateTargetDistance(galaxy, origin, target.systemId, target.position);
}

export function calculateFlightDuration(
  distance: number,
  speed: number,
  speedBonusPercent = 0,
): number {
  if (!Number.isInteger(distance) || distance < 0) {
    throw new Error('Flight distance must be a non-negative integer.');
  }
  if (!Number.isInteger(speed) || speed <= 0) {
    throw new Error('Fleet speed must be a positive integer.');
  }
  const effectiveSpeed = Math.max(
    1,
    Math.floor((speed * (100 + Math.max(0, speedBonusPercent))) / 100),
  );
  return Math.max(1, Math.ceil((distance * 60) / effectiveSpeed));
}

export function calculateFlightFuel(distance: number, fleet: FleetState): number {
  return Math.max(
    1,
    Math.ceil((distance * calculateFleetComposition(fleet.ships).shipCount) / 25),
  );
}

function createEstimate(
  distance: number,
  fleet: FleetState,
  speedBonusPercent: number,
): FlightEstimate {
  return {
    distance,
    durationSeconds: calculateFlightDuration(distance, fleet.speed, speedBonusPercent),
    fuelCost: calculateFlightFuel(distance, fleet),
  };
}

export function estimateFlight(
  galaxy: GalaxyModel,
  planets: readonly PlanetState[],
  fleet: FleetState,
  targetPlanetId: string,
  speedBonusPercent = 0,
): FlightEstimate {
  if (fleet.location.type !== 'planet') {
    throw new Error('Only a stationed fleet can estimate a new flight.');
  }
  const origin = planets.find((planet) => planet.id === fleet.location.planetId);
  const target = planets.find((planet) => planet.id === targetPlanetId);
  if (origin === undefined || target === undefined) {
    throw new Error('Flight origin or target planet not found.');
  }
  return createEstimate(
    calculatePlanetDistance(galaxy, origin, target),
    fleet,
    speedBonusPercent,
  );
}

export function estimateFlightToGalaxyPlanet(
  galaxy: GalaxyModel,
  planets: readonly PlanetState[],
  fleet: FleetState,
  galaxyPlanetId: string,
  speedBonusPercent = 0,
): FlightEstimate {
  if (fleet.location.type !== 'planet') {
    throw new Error('Only a stationed fleet can estimate a new flight.');
  }
  const origin = planets.find((planet) => planet.id === fleet.location.planetId);
  const target = findGalaxyPlanet(galaxy, galaxyPlanetId);
  if (origin === undefined || target === undefined) {
    throw new Error('Flight origin or galaxy target not found.');
  }
  return createEstimate(
    calculateCoordinateDistance(origin.coordinate, target.planet.coordinate),
    fleet,
    speedBonusPercent,
  );
}
''',
)

replace(
    "src/simulation/pve/spaceObjects.ts",
    "import type { FactionId, PlanetState } from '../planet/types';",
    "import type { FactionId, PlanetState } from '../planet/types';\nimport type { SpaceCoordinate } from '../space/coordinates';",
)
replace(
    "src/simulation/pve/spaceObjects.ts",
    "  readonly position: number;\n  readonly kind:",
    "  readonly position: number;\n  readonly coordinate?: SpaceCoordinate;\n  readonly kind:",
)
old_space_objects = r'''  return galaxy.systems.map((system, index): SpaceObjectState => {
    const roll = hashText(`${seed}:${system.id}:space-object`);
    const kind = SPACE_OBJECT_KINDS[index % SPACE_OBJECT_KINDS.length] ?? 'asteroid';
    const maxPlanetPosition = system.planets.reduce(
      (maximum, planet) => Math.max(maximum, planet.position),
      0,
    );
    const initialYield ='''
new_space_objects = r'''  return galaxy.systems.map((system, index): SpaceObjectState => {
    const roll = hashText(`${seed}:${system.id}:space-object`);
    const kind = SPACE_OBJECT_KINDS[index % SPACE_OBJECT_KINDS.length] ?? 'asteroid';
    const occupied = new Set(system.planets.map((planet) => planet.position));
    const position = Array.from({ length: 24 }, (_, offset) => 24 - offset)
      .find((candidate) => !occupied.has(candidate)) ?? 24;
    const initialYield ='''
replace("src/simulation/pve/spaceObjects.ts", old_space_objects, new_space_objects)
replace(
    "src/simulation/pve/spaceObjects.ts",
    "      systemId: system.id,\n      position: maxPlanetPosition + 1 + (Math.floor(roll / 11) % 3),",
    "      systemId: system.id,\n      position,\n      coordinate: { galaxy: system.galaxy, solarSystem: system.solarSystem, position },",
)

replace(
    "src/simulation/combat/debris.ts",
    "import type { ResourceCost } from '../economy/types';",
    "import type { ResourceCost } from '../economy/types';\nimport type { SpaceCoordinate } from '../space/coordinates';",
)
replace(
    "src/simulation/combat/debris.ts",
    "  readonly planetId: string;\n  readonly metal:",
    "  readonly planetId: string;\n  readonly coordinate?: SpaceCoordinate;\n  readonly metal:",
)
replace(
    "src/simulation/combat/debris.ts",
    "  createdAt: number,\n): readonly DebrisField[] {",
    "  createdAt: number,\n  coordinate?: SpaceCoordinate,\n): readonly DebrisField[] {",
)
replace(
    "src/simulation/combat/debris.ts",
    "        planetId,\n        metal:",
    "        planetId,\n        coordinate,\n        metal:",
)
replace(
    "src/simulation/combat/resolveAttackMission.ts",
    "    debrisCreated,\n    state.clock.elapsedSeconds,\n  );",
    "    debrisCreated,\n    state.clock.elapsedSeconds,\n    target.coordinate,\n  );",
)

replace(
    "src/simulation/intelligence/types.ts",
    "import type { FactionId } from '../planet/types';",
    "import type { FactionId } from '../planet/types';\nimport type { SpaceCoordinate } from '../space/coordinates';",
)
replace(
    "src/simulation/intelligence/types.ts",
    "  readonly planetId: string;\n  readonly name:",
    "  readonly planetId: string;\n  readonly coordinate?: SpaceCoordinate;\n  readonly name:",
)
replace(
    "src/simulation/intelligence/types.ts",
    "  readonly targetPlanetId: string;\n  readonly observedAt:",
    "  readonly targetPlanetId: string;\n  readonly coordinate?: SpaceCoordinate;\n  readonly observedAt:",
)
replace(
    "src/simulation/intelligence/types.ts",
    "  readonly targetPlanetId: string;\n  readonly detectedAt:",
    "  readonly targetPlanetId: string;\n  readonly coordinate?: SpaceCoordinate;\n  readonly detectedAt:",
)
replace(
    "src/simulation/intelligence/resolveScout.ts",
    "    planetId: target.id,\n    name:",
    "    planetId: target.id,\n    coordinate: target.coordinate,\n    name:",
)
replace(
    "src/simulation/intelligence/resolveScout.ts",
    "    targetPlanetId: target.id,\n    observedAt,",
    "    targetPlanetId: target.id,\n    coordinate: target.coordinate,\n    observedAt,",
)
replace(
    "src/simulation/intelligence/resolveScout.ts",
    "        targetPlanetId: target.id,\n        detectedAt:",
    "        targetPlanetId: target.id,\n        coordinate: target.coordinate,\n        detectedAt:",
)

replace(
    "src/simulation/bots/perception.ts",
    "import type { PlanetState } from '../planet/types';",
    "import type { PlanetState } from '../planet/types';\nimport type { SpaceCoordinate } from '../space/coordinates';",
)
replace(
    "src/simulation/bots/perception.ts",
    "  readonly id: string;\n  readonly name:",
    "  readonly id: string;\n  readonly coordinate: SpaceCoordinate;\n  readonly name:",
)
replace(
    "src/simulation/bots/perception.ts",
    "  readonly planetId: string;\n  readonly snapshot:",
    "  readonly planetId: string;\n  readonly coordinate?: SpaceCoordinate;\n  readonly snapshot:",
)
replace(
    "src/simulation/bots/perception.ts",
    "    readonly planetId: string;\n    readonly metal:",
    "    readonly planetId: string;\n    readonly coordinate?: SpaceCoordinate;\n    readonly metal:",
)
replace(
    "src/simulation/bots/perception.ts",
    "    id: planet.id,\n    name:",
    "    id: planet.id,\n    coordinate: planet.coordinate,\n    name:",
)
replace(
    "src/simulation/bots/perception.ts",
    "      planetId: observation.targetPlanetId,\n      snapshot:",
    "      planetId: observation.targetPlanetId,\n      coordinate: observation.coordinate ?? observation.snapshot.coordinate,\n      snapshot:",
)
replace(
    "src/simulation/bots/perception.ts",
    "        planetId: field.planetId,\n        metal:",
    "        planetId: field.planetId,\n        coordinate: field.coordinate,\n        metal:",
)
replace(
    "src/simulation/bots/fleetMissionPlanner.ts",
    "import type { GameCommand, GameState } from '../types';",
    "import { compareSpaceCoordinates } from '../space/coordinates';\nimport type { GameCommand, GameState } from '../types';",
)
replace(
    "src/simulation/bots/fleetMissionPlanner.ts",
    ".filter((planet) => planet.biome !== 'gas')\n        .sort((left, right) => left.id.localeCompare(right.id));",
    ".filter((planet) => planet.biome !== 'gas')\n        .sort((left, right) =>\n          compareSpaceCoordinates(left.coordinate, right.coordinate) ||\n          left.id.localeCompare(right.id),\n        );",
)

write(
    "src/storage/migrateGameStateV14.ts",
    r'''import type { DebrisField } from '../simulation/combat/debris';
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

export function migrateGameStateV14(value: unknown): GameState | undefined {
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
''',
)

replace(
    "src/storage/migrateGameStateV13.ts",
    "import type { GameState } from '../simulation/types';",
    "import type { GameState } from '../simulation/types';\n\nexport type LegacyGameStateV13 = Omit<GameState, 'schemaVersion' | 'universe'> & {\n  readonly schemaVersion: 13;\n};",
)
replace(
    "src/storage/migrateGameStateV13.ts",
    "export function migrateGameStateV13(value: unknown): GameState | undefined {",
    "export function migrateGameStateV13(value: unknown): LegacyGameStateV13 | undefined {",
)
old_v13_return = r'''  return compactGameStateHistory(migrateLegacyVeyraAliases(migrateLegacySynodAliases({
    ...migrated,
    schemaVersion: 13,
    shipUpgrades,
    commanders,
    botAutomation,
  })));
}'''
new_v13_return = r'''  const normalized = {
    ...migrated,
    schemaVersion: 13,
    shipUpgrades,
    commanders,
    botAutomation,
  } as unknown as GameState;
  return compactGameStateHistory(
    migrateLegacyVeyraAliases(migrateLegacySynodAliases(normalized)),
  ) as unknown as LegacyGameStateV13;
}'''
replace("src/storage/migrateGameStateV13.ts", old_v13_return, new_v13_return)

replace(
    "src/storage/saveFormat.ts",
    "import type { GameState } from '../simulation/types';\nimport { migrateGameStateV13 } from './migrateGameStateV13';",
    "import { isSpaceCoordinate } from '../simulation/space/coordinates';\nimport type { GameState } from '../simulation/types';\nimport { isUniverseModel } from '../simulation/universe/model';\nimport { migrateGameStateV14 } from './migrateGameStateV14';",
)
replace(
    "src/storage/saveFormat.ts",
    "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].includes",
    "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].includes",
)
replace(
    "src/storage/saveFormat.ts",
    "  if (!isRecord(value) || !isPlanetSpecializationId(value.specializationId) ||",
    "  if (!isRecord(value) || !isSpaceCoordinate(value.coordinate) ||\n    !isPlanetSpecializationId(value.specializationId) ||",
)
replace(
    "src/storage/saveFormat.ts",
    "    typeof value.targetPlanetId === 'string' && isNonNegativeInteger(value.observedAt) &&",
    "    typeof value.targetPlanetId === 'string' && isSpaceCoordinate(value.coordinate) &&\n    isNonNegativeInteger(value.observedAt) &&",
)
replace(
    "src/storage/saveFormat.ts",
    "    isRecord(value.snapshot) && typeof value.snapshot.planetId === 'string' && typeof value.snapshot.name === 'string' &&",
    "    isRecord(value.snapshot) && isSpaceCoordinate(value.snapshot.coordinate) &&\n    typeof value.snapshot.planetId === 'string' && typeof value.snapshot.name === 'string' &&",
)
replace(
    "src/storage/saveFormat.ts",
    "    (value.sourceEmpireId === null || typeof value.sourceEmpireId === 'string') && typeof value.targetPlanetId === 'string' &&\n    isNonNegativeInteger(value.detectedAt)",
    "    (value.sourceEmpireId === null || typeof value.sourceEmpireId === 'string') && typeof value.targetPlanetId === 'string' &&\n    isSpaceCoordinate(value.coordinate) && isNonNegativeInteger(value.detectedAt)",
)
replace(
    "src/storage/saveFormat.ts",
    "  return isRecord(value) && typeof value.id === 'string' && typeof value.planetId === 'string' &&\n    isNonNegativeInteger(value.metal)",
    "  return isRecord(value) && typeof value.id === 'string' && typeof value.planetId === 'string' &&\n    isSpaceCoordinate(value.coordinate) && isNonNegativeInteger(value.metal)",
)
replace(
    "src/storage/saveFormat.ts",
    "  return isRecord(value) && typeof value.id === 'string' && typeof value.systemId === 'string' &&\n    isPositiveInteger(value.position) &&",
    "  return isRecord(value) && typeof value.id === 'string' && typeof value.systemId === 'string' &&\n    isSpaceCoordinate(value.coordinate) && isPositiveInteger(value.position) &&",
)
replace(
    "src/storage/saveFormat.ts",
    "  return isStateShell(value) && value.schemaVersion === 13 &&",
    "  return isStateShell(value) && value.schemaVersion === 14 && isUniverseModel(value.universe) &&",
)
replace(
    "src/storage/saveFormat.ts",
    "  const state = migrateGameStateV13(parsed.state);",
    "  const state = migrateGameStateV14(parsed.state);",
)

write(
    "tests/fixtures/gameStateV13Fixture.ts",
    r'''import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import type { GameState } from '../../src/simulation/types';

export function createSchemaV13MigrationFixture(): unknown {
  const current = createInitialGameState('schema-v13-universe-fixture', 'aegis', 'campaign');
  const {
    universe: _universe,
    ...withoutUniverse
  } = current;
  return {
    ...withoutUniverse,
    schemaVersion: 13,
    galaxy: {
      ...withoutUniverse.galaxy,
      systems: withoutUniverse.galaxy.systems.slice(0, 12).map((system) => ({
        id: system.id,
        name: system.name,
        x: system.x,
        y: system.y,
        starClass: system.starClass,
        planets: system.planets.map(({ coordinate: _coordinate, ...planet }) => planet),
      })),
    },
    planets: withoutUniverse.planets.map(({ coordinate: _coordinate, ...planet }) => planet),
    intelligence: withoutUniverse.intelligence.map((state) => ({
      ...state,
      observations: state.observations.map(({ coordinate: _coordinate, snapshot, ...observation }) => ({
        ...observation,
        snapshot: (({ coordinate: _snapshotCoordinate, ...rest }) => rest)(snapshot),
      })),
      alerts: state.alerts.map(({ coordinate: _coordinate, ...alert }) => alert),
    })),
    debrisFields: withoutUniverse.debrisFields.map(({ coordinate: _coordinate, ...field }) => field),
    spaceObjects: withoutUniverse.spaceObjects.map(({ coordinate: _coordinate, ...object }) => object),
  } satisfies Omit<GameState, 'schemaVersion' | 'universe'> & { readonly schemaVersion: 13 };
}
''',
)

write(
    "tests/simulation/universeSpatialModel.test.ts",
    r'''import { describe, expect, it } from 'vitest';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  SOLAR_SYSTEM_POSITION_COUNT,
  calculateCoordinateDistance,
  parsePlanetCoordinate,
  planetIdForCoordinate,
} from '../../src/simulation/space/coordinates';
import {
  UNIVERSE_TOPOLOGY_PRESETS,
  createUniverseModel,
  materializeSolarSystem,
  selectDeterministicSpaceCoordinate,
} from '../../src/simulation/universe/model';

describe('Universe spatial model', () => {
  it('defines the approved compact topology presets behind exactly 20 slots', () => {
    expect(UNIVERSE_TOPOLOGY_PRESETS).toEqual({
      test: { id: 'test', galaxyCount: 2, systemsPerGalaxy: 9 },
      campaign: { id: 'campaign', galaxyCount: 6, systemsPerGalaxy: 27 },
      fidelity: { id: 'fidelity', galaxyCount: 15, systemsPerGalaxy: 81 },
    });
    for (const presetId of ['test', 'campaign', 'fidelity'] as const) {
      const universe = createUniverseModel(42, presetId);
      expect(universe.slots).toHaveLength(20);
      expect(universe.galaxies).toHaveLength(
        UNIVERSE_TOPOLOGY_PRESETS[presetId].galaxyCount,
      );
      expect(universe.galaxies.every(
        (galaxy) => galaxy.systemCount === UNIVERSE_TOPOLOGY_PRESETS[presetId].systemsPerGalaxy,
      )).toBe(true);
    }
  });

  it('materializes exactly 24 stable positions without storing empty slots in GameState', () => {
    const universe = createUniverseModel(123, 'campaign');
    const first = materializeSolarSystem(universe, 1, 1);
    const second = materializeSolarSystem(universe, 1, 1);
    expect(first).toEqual(second);
    expect(first.positions).toHaveLength(SOLAR_SYSTEM_POSITION_COUNT);
    expect(first.positions.map((position) => position.coordinate.position)).toEqual(
      Array.from({ length: 24 }, (_, index) => index + 1),
    );
    const state = createInitialGameState('compact-save', 'aegis', 'fidelity');
    expect('positions' in state.universe).toBe(false);
    expect(JSON.stringify(state).length).toBeLessThan(1_500_000);
  });

  it('preserves legacy first-galaxy IDs and resolves them as SpaceCoordinates', () => {
    const coordinate = { galaxy: 1, solarSystem: 7, position: 24 } as const;
    expect(planetIdForCoordinate(coordinate)).toBe('system-7-planet-24');
    expect(parsePlanetCoordinate('colony-system-7-planet-24')).toEqual(coordinate);
  });

  it('uses the same deterministic selector for players and bots', () => {
    const universe = createUniverseModel(99, 'campaign');
    const player = selectDeterministicSpaceCoordinate(universe, 'player', 'colonize');
    const playerAgain = selectDeterministicSpaceCoordinate(universe, 'player', 'colonize');
    const bot = selectDeterministicSpaceCoordinate(universe, 'aegis-bot', 'colonize');
    expect(playerAgain).toEqual(player);
    expect(bot).toMatchObject({ galaxy: expect.any(Number), solarSystem: expect.any(Number) });
    expect(calculateCoordinateDistance(player, player)).toBe(0);
  });

  it('keeps initial-state checksum deterministic for every preset', () => {
    for (const presetId of ['test', 'campaign', 'fidelity'] as const) {
      const first = createInitialGameState('preset-checksum', 'aegis', presetId);
      const second = createInitialGameState('preset-checksum', 'aegis', presetId);
      expect(createStateChecksum(first)).toBe(createStateChecksum(second));
      expect(first.schemaVersion).toBe(14);
    }
  });
});
''',
)

write(
    "tests/storage/migrateGameStateV14.test.ts",
    r'''import { describe, expect, it } from 'vitest';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { replayCommands } from '../../src/simulation/replay';
import { createSchemaV13MigrationFixture } from '../fixtures/gameStateV13Fixture';
import { createSaveEnvelope, parseSaveJson, serializeSave } from '../../src/storage/saveFormat';
import { migrateGameStateV14 } from '../../src/storage/migrateGameStateV14';

describe('schema v14 migration', () => {
  it('migrates the committed v13 fixture deterministically and preserves old references', () => {
    const fixture = createSchemaV13MigrationFixture();
    const first = migrateGameStateV14(fixture);
    const second = migrateGameStateV14(structuredClone(fixture));
    expect(first).toBeDefined();
    expect(second).toEqual(first);
    expect(first?.schemaVersion).toBe(14);
    expect(first?.universe.slots).toHaveLength(20);
    expect(first?.galaxy.systems.some((system) => system.id === 'system-12')).toBe(true);
    expect(first?.planets.every((planet) => planet.coordinate.position === planet.position)).toBe(true);
    expect(first?.spaceObjects.every((object) => object.coordinate !== undefined)).toBe(true);
  });

  it('round-trips export/import and retains the migrated checksum', () => {
    const migrated = migrateGameStateV14(createSchemaV13MigrationFixture());
    expect(migrated).toBeDefined();
    if (migrated === undefined) return;
    const save = createSaveEnvelope('v13-fixture', migrated, '2026-07-27T00:00:00.000Z');
    const parsed = parseSaveJson(serializeSave(save));
    expect(parsed).toEqual({ ok: true, value: save });
    if (parsed.ok) expect(parsed.value.checksum).toBe(createStateChecksum(migrated));
  });

  it('keeps replay/checksum stable under schema v14', () => {
    const replay = replayCommands('schema-v14-replay', [
      { type: 'ADVANCE_TIME', seconds: 120 },
      { type: 'ADVANCE_TIME', seconds: 30 },
    ]);
    expect(replay.ok).toBe(true);
    if (!replay.ok) return;
    const direct = createInitialGameState('schema-v14-replay');
    expect(replay.value.clock.elapsedSeconds).toBe(150);
    expect(replay.value.schemaVersion).toBe(14);
    expect(createStateChecksum(replay.value)).not.toBe(createStateChecksum(direct));
  });
});
''',
)

write(
    "tests/simulation/simulationBoundary.test.ts",
    r'''import { describe, expect, it } from 'vitest';

const simulationSources = import.meta.glob('../../src/simulation/**/*.ts', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Readonly<Record<string, string>>;

describe('simulation boundary', () => {
  it('does not import Phaser, game scenes, UI modules or DOM globals', () => {
    const violations: string[] = [];
    for (const [path, source] of Object.entries(simulationSources)) {
      if (/from ['\"]phaser['\"]|from ['\"]\.\.\/game\//.test(source)) {
        violations.push(`${path}: runtime framework import`);
      }
      if (/\b(?:document|window|HTMLElement|localStorage)\b/.test(source)) {
        violations.push(`${path}: DOM global`);
      }
    }
    expect(violations).toEqual([]);
  });
});
''',
)

# Update existing save-format assertions and explicit schema-v14 custom state fixtures.
save_test = read("tests/storage/saveFormat.test.ts")
save_test = save_test.replace("round-trips a valid schema-v13 save", "round-trips a valid schema-v14 save")
save_test = save_test.replace("expect(parsed.value.state.schemaVersion).toBe(13);", "expect(parsed.value.state.schemaVersion).toBe(14);")
save_test = save_test.replace("expect(parsed.value.state.schemaVersion).toBe(13)", "expect(parsed.value.state.schemaVersion).toBe(14)")
save_test = save_test.replace(
    "          createdAt: 100,\n        },",
    "          createdAt: 100,\n          coordinate: current.planets[0]!.coordinate,\n        },",
)
write("tests/storage/saveFormat.test.ts", save_test)

# Add explicit coordinate checks to the existing galaxy tests without changing the old generator API.
galaxy_test = read("tests/simulation/galaxy.test.ts")
galaxy_test = galaxy_test.replace(
    "      expect(system.planets.length).toBeLessThanOrEqual(10);",
    "      expect(system.planets.length).toBeLessThanOrEqual(10);\n      expect(system.planets.every((planet) => planet.coordinate.galaxy === 1)).toBe(true);",
)
write("tests/simulation/galaxy.test.ts", galaxy_test)

write(
    "docs/changes/pr108-universe-spatial-model.md",
    r'''# PR #108 — UNIVERSE-SPATIAL-MODEL

**Audit:** PR #106  
**Work item:** `UNIVERSE-SPATIAL-MODEL`

## Delivered

- schema v14 and deterministic v13 → v14 migration;
- exactly 20 explicit Universe slots;
- shared one-based `SpaceCoordinate { galaxy, solarSystem, position }`;
- compact test, campaign and fidelity descriptors: 2×9, 6×27 and 15×81;
- exactly 24 positions in every materialized solar system without persisting empty position arrays;
- stable first-galaxy legacy IDs and reference resolvers;
- coordinate-aware colonies, colonization, distance, intelligence, debris, neutral forces, space objects and bot perception/selection;
- migration fixture, checksum/replay/export/import coverage and a fidelity save-size gate;
- simulation boundary test preventing Phaser, scene, UI and DOM dependencies.

## Intentional boundary

Navigation route/history state remains outside `GameState`. Phaser views, breadcrumbs and map interaction remain assigned to PR #109. Mission action gating and report backlinks remain assigned to PR #110.
''',
)

write(
    "docs/audits/current-execution-state.md",
    r'''# Current execution state

**Updated:** 2026-07-27  
**Safe to continue:** yes

| Field | Current value |
|---|---|
| Protocol PR | #100 — audit-first autonomous delivery protocol — merged |
| Active batch | `UNIVERSE-NAVIGATION-01` |
| Audit PR | #106 — merged |
| Last merged implementation | #107 — `UNIVERSE-ASSET-PIPELINE` — merge `398a6074b8d7d62d00aa6beabc064a88b2565ca4` |
| Active work item | `UNIVERSE-SPATIAL-MODEL` |
| Active implementation PR | #108 |
| Base SHA | `398a6074b8d7d62d00aa6beabc064a88b2565ca4` |
| Last completed atomic action | implemented schema v14, compact Universe descriptors and deterministic coordinate migration |
| Last successful validation | pending clean PR CI and Graphify on the final implementation head |
| Exact next action | fix ordinary validation failures, merge #108 after CI and Graphify are green, then create #109 from fresh `main` |
| Blockers | none |
| Divergence | none |

## Batch checkpoints

| Checkpoint | State |
|---|---|
| #107 Universe asset pipeline | merged |
| #108 spatial model and schema v14 | implementation complete; validation active |
| #109 three-level navigation views | not started |
| #110 actions, E2E and batch closure | not started |

## Recovery rule

Implementation order remains strict: #107 → #108 → #109 → #110. Do not start #109 before #108 merges. Route/UI state is not part of `GameState`; complete solar-war mechanics remain outside this batch.
''',
)

status_path = ROOT / "docs/project-status.json"
status = json.loads(status_path.read_text(encoding="utf-8"))
status["statusVersion"] = max(int(status.get("statusVersion", 0)) + 1, 10)
status["updatedAt"] = "2026-07-27"
status["lastMergedPr"] = 107
status["lastMergeSha"] = "398a6074b8d7d62d00aa6beabc064a88b2565ca4"
status["verifiedMainBaseline"] = "398a6074b8d7d62d00aa6beabc064a88b2565ca4"
status["activePr"] = 108
status["nextPrAfterActive"] = 109
status["nextPrKind"] = "implementation"
status["currentBatch"]["status"] = "implementation-active"
status["currentBatch"]["nextWorkItem"] = "UNIVERSE-SPATIAL-MODEL"
status["activeDelivery"] = [
    "PR #108 — schema-v14 compact Universe spatial model and migration",
    "three-level spatial views in planned PR #109",
    "map actions, report backlinks, browser E2E and batch closure in planned PR #110",
]
status_path.write_text(json.dumps(status, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

continuation = read("docs/17-continuation-guide.md")
continuation = continuation.replace(
    "**Status:** Implementation active — PR #107",
    "**Status:** Implementation active — PR #108",
)
continuation = continuation.replace(
    "**Verified baseline:** `main` SHA `3bafad74907a92633f5c31c3d30bd96268c3dafb`",
    "**Verified baseline:** `main` SHA `398a6074b8d7d62d00aa6beabc064a88b2565ca4`",
)
continuation = continuation.replace(
    "- PR #107 implements the audited Universe asset pipeline; later model, route and mission work remains separate.",
    "- PR #107 merged the audited Universe asset pipeline;\n- PR #108 implements schema v14, compact Universe descriptors and deterministic coordinate migration; route and mission work remains separate.",
)
continuation = continuation.replace(
    "Complete and merge PR #107 after CI and Graphify pass. Then create PR #108 from fresh `main`; do not begin #109 or unrelated roadmap work first.",
    "Complete and merge PR #108 after CI and Graphify pass. Then create PR #109 from fresh `main`; do not begin #110 or unrelated roadmap work first.",
)
write("docs/17-continuation-guide.md", continuation)

print("Applied PR108 Universe spatial model implementation.")
