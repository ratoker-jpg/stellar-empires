import {
  SPACE_MAP_ASSET_MANIFEST,
  SPACE_MAP_TEXTURE_GROUPS,
  type SpaceMapTextureGroup,
} from './generated/spaceMapAssetManifest.generated';

export type SunLifecycleState = 'active' | 'collapsed' | 'protostar' | 'recovering';
export type SunAssetSize = 'thumb' | 'detail';
export type StrategicObjectAssetKind = 'asteroid' | 'debris' | 'renegade';

export interface SpaceMapRuntimeAsset {
  readonly id: string;
  readonly key: string;
  readonly url: string;
  readonly width: number;
  readonly height: number;
  readonly family: string;
  readonly viewGroup: SpaceMapTextureGroup;
}

function runtimeUrl(outputPath: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}${outputPath.replace(/^public\//, '')}`;
}

function twoDigits(variant: number): string {
  if (!Number.isInteger(variant) || variant <= 0) throw new Error(`Invalid Space Map asset variant: ${variant}`);
  return String(variant).padStart(2, '0');
}

export function getSpaceMapRuntimeAsset(id: string): SpaceMapRuntimeAsset | undefined {
  const manifest = SPACE_MAP_ASSET_MANIFEST as Readonly<Record<string, {
    readonly outputPath: string;
    readonly width: number;
    readonly height: number;
    readonly family: string;
    readonly viewGroup: SpaceMapTextureGroup;
  }>>;
  const asset = manifest[id];
  if (asset === undefined) return undefined;
  return { id, key: `space-map.${id}`, url: runtimeUrl(asset.outputPath), ...asset };
}

function requireAsset(id: string): SpaceMapRuntimeAsset {
  const asset = getSpaceMapRuntimeAsset(id);
  if (asset === undefined) throw new Error(`Unknown Space Map runtime asset: ${id}`);
  return asset;
}

export function getUniverseGalaxyAsset(variant: number): SpaceMapRuntimeAsset {
  return requireAsset(`universe.galaxy.nebula-${twoDigits(variant)}`);
}

export function getSystemStarAsset(variant: number): SpaceMapRuntimeAsset {
  return requireAsset(`universe.system-star.variant-${twoDigits(variant)}`);
}

export function getSunAsset(
  state: SunLifecycleState,
  variant: number,
  size: SunAssetSize,
): SpaceMapRuntimeAsset {
  const normalizedState = state === 'recovering' ? 'protostar' : state;
  return requireAsset(`universe.sun.${normalizedState}-${twoDigits(variant)}.${size}`);
}

export function getPlanetAsset(variant: number): SpaceMapRuntimeAsset {
  return requireAsset(`universe.planet.variant-${twoDigits(variant)}`);
}

export function getStrategicObjectAsset(
  kind: StrategicObjectAssetKind,
  variant: number,
): SpaceMapRuntimeAsset {
  return requireAsset(`universe.object.${kind}-${twoDigits(variant)}`);
}

export function getSpaceMapTextureGroup(
  group: SpaceMapTextureGroup,
): readonly SpaceMapRuntimeAsset[] {
  return SPACE_MAP_TEXTURE_GROUPS[group].map((id) => requireAsset(id));
}
