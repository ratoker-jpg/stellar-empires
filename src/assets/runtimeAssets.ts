const ASSET_ROOT = `${import.meta.env.BASE_URL}assets/`;

export const RUNTIME_ASSETS = {
  brandLogo: `${ASSET_ROOT}brand/logo-primary.svg`,
  galaxyBackground: `${ASSET_ROOT}backgrounds/galaxy.svg`,
  resourceMetal: `${ASSET_ROOT}icons/resource-metal.svg`,
  resourceCrystal: `${ASSET_ROOT}icons/resource-crystal.svg`,
  resourceGas: `${ASSET_ROOT}icons/resource-gas.svg`,
  resourceEnergy: `${ASSET_ROOT}icons/resource-energy.svg`,
  factionAegisEmblem: `${ASSET_ROOT}factions/aegis/emblem.svg`,
  factionAegisBackground: `${ASSET_ROOT}factions/aegis/background.svg`,
  factionAegisControlSet: `${ASSET_ROOT}factions/aegis/control-set.svg`,
  factionAegisBuildingsAtlas: `${ASSET_ROOT}factions/aegis/p1/buildings-atlas.svg`,
  factionAegisShipsAtlas: `${ASSET_ROOT}factions/aegis/p1/ships-atlas.svg`,
  factionAegisDefensesAtlas: `${ASSET_ROOT}factions/aegis/p1/defenses-atlas.svg`,
  factionAegisTechnologiesAtlas: `${ASSET_ROOT}factions/aegis/p1/technologies-atlas.svg`,
  factionAegisEffectsAtlas: `${ASSET_ROOT}factions/aegis/p1/effects-atlas.svg`,
  factionSynodEmblem: `${ASSET_ROOT}factions/synod/emblem.svg`,
  factionSynodBackground: `${ASSET_ROOT}factions/synod/background.svg`,
  factionSynodControlSet: `${ASSET_ROOT}factions/synod/control-set.svg`,
  factionVeyraEmblem: `${ASSET_ROOT}factions/veyra/emblem.svg`,
  factionVeyraBackground: `${ASSET_ROOT}factions/veyra/background.svg`,
  factionVeyraControlSet: `${ASSET_ROOT}factions/veyra/control-set.svg`,
} as const;

export type RuntimeAssetKey = keyof typeof RUNTIME_ASSETS;
