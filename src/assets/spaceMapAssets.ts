import {
  SPACE_MAP_ASSET_FAMILIES,
  SPACE_MAP_ASSET_GROUPS,
  SPACE_MAP_ASSET_MANIFEST,
  type GeneratedSpaceMapAsset,
} from './generated/spaceMapAssetManifest.generated';

export type SpaceMapLevel = 'universe' | 'galaxy' | 'solar-system';
export type SunLifecycleState = 'active' | 'collapsed' | 'protostar' | 'recovering';
export type SunAssetSize = 'thumb' | 'detail';
export type StrategicObjectKind = 'asteroid' | 'debris' | 'renegade';

export interface RuntimeSpaceMapAsset extends GeneratedSpaceMapAsset {
  readonly semanticId: string;
  readonly url: string;
}

export interface SolarSystemTextureSelection {
  readonly sunState: SunLifecycleState;
  readonly sunVariant: number;
}

const manifest: Readonly<Record<string, GeneratedSpaceMapAsset>> = SPACE_MAP_ASSET_MANIFEST;

function runtimeUrl(outputPath: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}${outputPath.replace(/^public\//, '')}`;
}

function normalizedVariant(variant: number, count: number): number {
  if (!Number.isInteger(variant)) throw new Error(`Space Map variant must be an integer: ${variant}`);
  return ((variant - 1) % count + count) % count + 1;
}

function padVariant(variant: number, count: number): string {
  return String(normalizedVariant(variant, count)).padStart(2, '0');
}

function getAsset(semanticId: string): RuntimeSpaceMapAsset {
  const generated = manifest[semanticId];
  if (generated === undefined) throw new Error(`Unknown Space Map asset: ${semanticId}`);
  return {
    semanticId,
    ...generated,
    url: runtimeUrl(generated.outputPath),
  };
}

export function selectDeterministicSpaceMapVariant(
  count: number,
  ...parts: readonly (number | string)[]
): number {
  if (!Number.isInteger(count) || count <= 0) throw new Error(`Invalid variant count: ${count}`);
  let hash = 2_166_136_261;
  for (const character of parts.join('|')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }
  return 1 + ((hash >>> 0) % count);
}

export function getUniverseGalaxyAsset(variant: number): RuntimeSpaceMapAsset {
  return getAsset(`universe.galaxy.nebula-${padVariant(variant, 20)}`);
}

export function getSystemStarAsset(variant: number): RuntimeSpaceMapAsset {
  return getAsset(`universe.system-star.variant-${padVariant(variant, 12)}`);
}

export function getSunAsset(
  state: SunLifecycleState,
  variant: number,
  size: SunAssetSize,
): RuntimeSpaceMapAsset {
  const sourceState = state === 'recovering' ? 'protostar' : state;
  const count = sourceState === 'active' ? 8 : 2;
  return getAsset(
    `universe.sun.${sourceState}-${padVariant(variant, count)}.${size}`,
  );
}

export function getPlanetAsset(variant: number): RuntimeSpaceMapAsset {
  return getAsset(`universe.planet.variant-${padVariant(variant, 24)}`);
}

export function getStrategicObjectAsset(
  kind: StrategicObjectKind,
  variant: number,
): RuntimeSpaceMapAsset {
  const count = kind === 'asteroid' ? 8 : 6;
  return getAsset(`universe.object.${kind}-${padVariant(variant, count)}`);
}

function assetsFor(ids: readonly string[]): readonly RuntimeSpaceMapAsset[] {
  return ids.map(getAsset);
}

export function getSpaceMapTextureGroup(
  level: SpaceMapLevel,
  selection: SolarSystemTextureSelection = { sunState: 'active', sunVariant: 1 },
): readonly RuntimeSpaceMapAsset[] {
  if (level === 'universe') return assetsFor(SPACE_MAP_ASSET_GROUPS.universe);
  if (level === 'galaxy') return assetsFor(SPACE_MAP_ASSET_GROUPS.galaxy);
  const sun = getSunAsset(selection.sunState, selection.sunVariant, 'detail');
  return [
    sun,
    ...assetsFor(SPACE_MAP_ASSET_FAMILIES.planet),
    ...assetsFor(SPACE_MAP_ASSET_FAMILIES.asteroid),
    ...assetsFor(SPACE_MAP_ASSET_FAMILIES.debris),
    ...assetsFor(SPACE_MAP_ASSET_FAMILIES.renegade),
    ...assetsFor(SPACE_MAP_ASSET_FAMILIES.marker),
  ];
}
