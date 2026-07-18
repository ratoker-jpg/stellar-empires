export const P0_ASSET_KEYS = [
  'brand.logo.primary',
  'background.galaxy',
  'faction.aegis.emblem',
  'faction.aegis.background',
  'faction.aegis.control-set',
  'faction.synod.emblem',
  'faction.synod.background',
  'faction.synod.control-set',
  'faction.veyra.emblem',
  'faction.veyra.background',
  'faction.veyra.control-set',
  'icon.resource.metal',
  'icon.resource.crystal',
  'icon.resource.gas',
  'icon.resource.energy',
  'ui.shell.primary',
] as const;

export const P1_AEGIS_ATLAS_KEYS = [
  'atlas.aegis.buildings',
  'atlas.aegis.ships',
  'atlas.aegis.defenses',
  'atlas.aegis.technologies',
  'atlas.aegis.effects',
] as const;

export type P0AssetKey = (typeof P0_ASSET_KEYS)[number];
export type P1AegisAtlasKey = (typeof P1_AEGIS_ATLAS_KEYS)[number];
