const ASSET_ROOT = `${import.meta.env.BASE_URL}assets/`;

export const RUNTIME_ASSETS = {
  brandLogo: `${ASSET_ROOT}brand/logo-primary.svg`,
  galaxyBackground: `${ASSET_ROOT}backgrounds/galaxy.svg`,
  resourceMetal: `${ASSET_ROOT}icons/resource-metal.svg`,
  resourceCrystal: `${ASSET_ROOT}icons/resource-crystal.svg`,
  resourceGas: `${ASSET_ROOT}icons/resource-gas.svg`,
  resourceEnergy: `${ASSET_ROOT}icons/resource-energy.svg`,

  factionAegisEmblem: `${ASSET_ROOT}factions/aegis/emblem.svg`,
  factionAegisEmblemWebp: `${ASSET_ROOT}factions/aegis/emblem.webp`,
  factionAegisBackground: `${ASSET_ROOT}factions/aegis/background.svg`,
  factionAegisBackgroundWebp: `${ASSET_ROOT}factions/aegis/background.webp`,
  factionAegisHero: `${ASSET_ROOT}factions/aegis/hero.webp`,
  factionAegisControlSet: `${ASSET_ROOT}factions/aegis/control-set.svg`,
  factionAegisBuildingsAtlas: `${ASSET_ROOT}factions/aegis/p1/buildings-atlas.svg`,
  factionAegisBuildingsAtlasWebp: `${ASSET_ROOT}factions/aegis/p1/buildings-atlas.webp`,
  factionAegisShipsAtlas: `${ASSET_ROOT}factions/aegis/p1/ships-atlas.svg`,
  factionAegisShipsAtlasWebp: `${ASSET_ROOT}factions/aegis/p1/ships-atlas.webp`,
  factionAegisDefensesAtlas: `${ASSET_ROOT}factions/aegis/p1/defenses-atlas.svg`,
  factionAegisDefensesAtlasWebp: `${ASSET_ROOT}factions/aegis/p1/defenses-atlas.webp`,
  factionAegisTechnologiesAtlas: `${ASSET_ROOT}factions/aegis/p1/technologies-atlas.svg`,
  factionAegisEffectsAtlas: `${ASSET_ROOT}factions/aegis/p1/effects-atlas.svg`,

  factionSynodEmblem: `${ASSET_ROOT}factions/synod/emblem.svg`,
  factionSynodEmblemWebp: `${ASSET_ROOT}factions/synod/emblem.webp`,
  factionSynodBackground: `${ASSET_ROOT}factions/synod/background.svg`,
  factionSynodBackgroundWebp: `${ASSET_ROOT}factions/synod/background.webp`,
  factionSynodHero: `${ASSET_ROOT}factions/synod/hero.webp`,
  factionSynodControlSet: `${ASSET_ROOT}factions/synod/control-set.svg`,
  factionSynodBuildingsAtlasWebp: `${ASSET_ROOT}factions/synod/p1/buildings-atlas.webp`,
  factionSynodShipsAtlasWebp: `${ASSET_ROOT}factions/synod/p1/ships-atlas.webp`,
  factionSynodDefensesAtlasWebp: `${ASSET_ROOT}factions/synod/p1/defenses-atlas.webp`,

  factionVeyraEmblem: `${ASSET_ROOT}factions/veyra/emblem.svg`,
  factionVeyraEmblemWebp: `${ASSET_ROOT}factions/veyra/emblem.webp`,
  factionVeyraBackground: `${ASSET_ROOT}factions/veyra/background.svg`,
  factionVeyraBackgroundWebp: `${ASSET_ROOT}factions/veyra/background.webp`,
  factionVeyraHero: `${ASSET_ROOT}factions/veyra/hero.webp`,
  factionVeyraControlSet: `${ASSET_ROOT}factions/veyra/control-set.svg`,
  factionVeyraBuildingsAtlasWebp: `${ASSET_ROOT}factions/veyra/p1/buildings-atlas.webp`,
  factionVeyraShipsAtlasWebp: `${ASSET_ROOT}factions/veyra/p1/ships-atlas.webp`,
  factionVeyraDefensesAtlasWebp: `${ASSET_ROOT}factions/veyra/p1/defenses-atlas.webp`,
} as const;

export type RuntimeAssetKey = keyof typeof RUNTIME_ASSETS;
