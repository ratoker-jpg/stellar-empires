const ASSET_ROOT = `${import.meta.env.BASE_URL}assets/`;

export const RUNTIME_ASSETS = {
  brandLogo: `${ASSET_ROOT}brand/logo-primary.svg`,
  galaxyBackground: `${ASSET_ROOT}backgrounds/galaxy.svg`,
  resourceMetal: `${ASSET_ROOT}icons/resource-metal.svg`,
  resourceCrystal: `${ASSET_ROOT}icons/resource-crystal.svg`,
  resourceGas: `${ASSET_ROOT}icons/resource-gas.svg`,
  resourceEnergy: `${ASSET_ROOT}icons/resource-energy.svg`,

  factionAegisEmblem: `${ASSET_ROOT}factions/aegis/emblem.webp`,
  factionAegisBackground: `${ASSET_ROOT}factions/aegis/background.webp`,
  factionAegisControlSet: `${ASSET_ROOT}factions/aegis/hero.webp`,
  factionAegisBuildingsAtlas: `${ASSET_ROOT}factions/aegis/p1/buildings-atlas.webp`,
  factionAegisShipsAtlas: `${ASSET_ROOT}factions/aegis/p1/ships-atlas.webp`,
  factionAegisDefensesAtlas: `${ASSET_ROOT}factions/aegis/p1/defenses-atlas.webp`,
  factionAegisTechnologiesAtlas: `${ASSET_ROOT}factions/aegis/p1/technologies-atlas.svg`,
  factionAegisEffectsAtlas: `${ASSET_ROOT}factions/aegis/p1/effects-atlas.svg`,

  factionSynodEmblem: `${ASSET_ROOT}factions/synod/emblem.webp`,
  factionSynodBackground: `${ASSET_ROOT}factions/synod/background.webp`,
  factionSynodControlSet: `${ASSET_ROOT}factions/synod/hero.webp`,
  factionSynodBuildingsAtlas: `${ASSET_ROOT}factions/synod/p1/buildings-atlas.webp`,
  factionSynodShipsAtlas: `${ASSET_ROOT}factions/synod/p1/ships-atlas.webp`,
  factionSynodDefensesAtlas: `${ASSET_ROOT}factions/synod/p1/defenses-atlas.webp`,

  factionVeyraEmblem: `${ASSET_ROOT}factions/veyra/emblem.webp`,
  factionVeyraBackground: `${ASSET_ROOT}factions/veyra/background.webp`,
  factionVeyraControlSet: `${ASSET_ROOT}factions/veyra/hero.webp`,
  factionVeyraBuildingsAtlas: `${ASSET_ROOT}factions/veyra/p1/buildings-atlas.webp`,
  factionVeyraShipsAtlas: `${ASSET_ROOT}factions/veyra/p1/ships-atlas.webp`,
  factionVeyraDefensesAtlas: `${ASSET_ROOT}factions/veyra/p1/defenses-atlas.webp`,
} as const;

export type RuntimeAssetKey = keyof typeof RUNTIME_ASSETS;
