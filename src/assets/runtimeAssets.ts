const ASSET_ROOT = `${import.meta.env.BASE_URL}assets/`;

export const RUNTIME_ASSETS = {
  brandLogo: `${ASSET_ROOT}brand/logo-primary.svg`,
  galaxyBackground: `${ASSET_ROOT}backgrounds/galaxy.svg`,
  resourceMetal: `${ASSET_ROOT}icons/resource-metal.svg`,
  resourceCrystal: `${ASSET_ROOT}icons/resource-crystal.svg`,
  resourceGas: `${ASSET_ROOT}icons/resource-gas.svg`,
  resourceEnergy: `${ASSET_ROOT}icons/resource-energy.svg`,
} as const;

export type RuntimeAssetKey = keyof typeof RUNTIME_ASSETS;
