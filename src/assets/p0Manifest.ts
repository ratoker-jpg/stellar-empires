export const P0_ASSET_KEYS = [
  'brand.logo.primary',
  'background.main-menu',
  'background.galaxy',
  'faction.aegis.emblem',
  'faction.synod.emblem',
  'faction.veyra.emblem',
  'ship.aegis.scout.hero',
  'ship.synod.scout.hero',
  'ship.veyra.scout.hero',
  'building.aegis.command.hero',
  'building.synod.command.hero',
  'building.veyra.command.hero',
  'planet.shared.terran.hero',
  'ui.panel.primary',
  'icon.resource.metal',
  'icon.resource.crystal',
  'icon.resource.gas',
  'icon.resource.energy',
] as const;

export type P0AssetKey = (typeof P0_ASSET_KEYS)[number];
