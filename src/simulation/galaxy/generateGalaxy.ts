import { createSeededRandom } from '../seed';
import type {
  GalaxyGenerationConfig,
  GalaxyModel,
  PlanetBiome,
  PlanetModel,
  StarClass,
  StarSystemModel,
} from './types';

const DEFAULT_CONFIG: GalaxyGenerationConfig = {
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

  if (value === undefined) {
    throw new Error('Cannot pick from an empty collection.');
  }

  return value;
}

function createPlanets(
  systemIndex: number,
  config: GalaxyGenerationConfig,
  random: () => number,
): readonly PlanetModel[] {
  const planetCount = Math.max(3, Math.floor(config.positionsPerSystem * (0.45 + random() * 0.55)));
  const homeOwner = HOME_OWNERS[systemIndex] ?? null;

  return Array.from({ length: planetCount }, (_, planetIndex): PlanetModel => ({
    id: `system-${systemIndex + 1}-planet-${planetIndex + 1}`,
    position: planetIndex + 1,
    biome: pick(PLANET_BIOMES, random),
    size: 90 + Math.floor(random() * 111),
    ownerEmpireId: planetIndex === 0 ? homeOwner : null,
  }));
}

export function generateGalaxy(
  seed: number,
  overrides: Partial<GalaxyGenerationConfig> = {},
): GalaxyModel {
  const config: GalaxyGenerationConfig = { ...DEFAULT_CONFIG, ...overrides };

  if (config.systemCount <= 0 || config.positionsPerSystem <= 0) {
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

      return {
        id: `system-${systemIndex + 1}`,
        name: `${prefix} ${String(systemIndex + 1).padStart(2, '0')}`,
        x: Math.round((column + 0.5) * cellWidth + jitterX),
        y: Math.round((row + 0.5) * cellHeight + jitterY),
        starClass: pick(STAR_CLASSES, random),
        planets: createPlanets(systemIndex, config, random),
      };
    },
  );

  return {
    width: config.width,
    height: config.height,
    systems,
  };
}
