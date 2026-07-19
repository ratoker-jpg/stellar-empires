import { AEGIS_VERTICAL_SLICE_ASSETS } from './aegisVerticalSliceAssets';
import type { FactionArtKey } from './artTokens';
import { getFactionAtlasUrl } from './factionAtlasSelection';

interface MutableAtlasAsset {
  atlasUrl: string;
}

export function bindFactionRuntimeAssets(factionId: FactionArtKey): void {
  for (const asset of AEGIS_VERTICAL_SLICE_ASSETS) {
    (asset as MutableAtlasAsset).atlasUrl = getFactionAtlasUrl(factionId, asset.category);
  }
}
