import type { AegisAssetCategory } from './aegisVerticalSliceAssets';
import type { FactionArtKey } from './artTokens';
import { getFactionRuntimeAssets } from './factionRuntimeAssets';

export function getFactionAtlasUrl(
  factionId: FactionArtKey,
  category: AegisAssetCategory,
): string {
  const assets = getFactionRuntimeAssets(factionId);

  switch (category) {
    case 'building':
      return assets.buildingsAtlasUrl;
    case 'ship':
      return assets.shipsAtlasUrl;
    case 'defense':
      return assets.defensesAtlasUrl;
    case 'technology':
      return assets.technologiesAtlasUrl;
    case 'effect':
      return assets.effectsAtlasUrl;
  }
}
