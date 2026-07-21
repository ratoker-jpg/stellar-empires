import { AEGIS_VERTICAL_SLICE_ASSETS } from './aegisVerticalSliceAssets';
import type { FactionArtKey } from './artTokens';
import { getFactionAtlasUrl } from './factionAtlasSelection';
import { SYNOD_MECHANICAL_ASSETS } from './factionMechanicalAssets';

interface MutableAtlasAsset {
  atlasUrl: string;
}

export function bindFactionRuntimeAssets(factionId: FactionArtKey): void {
  const assets = factionId === 'synod'
    ? SYNOD_MECHANICAL_ASSETS
    : AEGIS_VERTICAL_SLICE_ASSETS;

  for (const asset of assets) {
    if (factionId === 'synod' && asset.category === 'technology') {
      continue;
    }
    (asset as MutableAtlasAsset).atlasUrl = getFactionAtlasUrl(factionId, asset.category);
  }
}
