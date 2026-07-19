import type { FactionArtKey } from './artTokens';
import { RUNTIME_ASSETS } from './runtimeAssets';

export interface FactionRuntimeAssetSet {
  readonly id: FactionArtKey;
  readonly accent: string;
  readonly emblemUrl: string;
  readonly backgroundUrl: string;
  readonly heroUrl: string;
  readonly controlSetUrl: string;
  readonly buildingsAtlasUrl: string;
  readonly shipsAtlasUrl: string;
  readonly defensesAtlasUrl: string;
  readonly technologiesAtlasUrl: string;
  readonly effectsAtlasUrl: string;
  readonly usesProceduralTechnologyFallback: boolean;
  readonly usesProceduralEffectFallback: boolean;
}

export const FACTION_RUNTIME_ASSETS: Readonly<Record<FactionArtKey, FactionRuntimeAssetSet>> = {
  aegis: {
    id: 'aegis',
    accent: '#4EA7FF',
    emblemUrl: RUNTIME_ASSETS.factionAegisEmblemWebp,
    backgroundUrl: RUNTIME_ASSETS.factionAegisBackgroundWebp,
    heroUrl: RUNTIME_ASSETS.factionAegisHero,
    controlSetUrl: RUNTIME_ASSETS.factionAegisControlSet,
    buildingsAtlasUrl: RUNTIME_ASSETS.factionAegisBuildingsAtlasWebp,
    shipsAtlasUrl: RUNTIME_ASSETS.factionAegisShipsAtlasWebp,
    defensesAtlasUrl: RUNTIME_ASSETS.factionAegisDefensesAtlasWebp,
    technologiesAtlasUrl: RUNTIME_ASSETS.factionAegisTechnologiesAtlas,
    effectsAtlasUrl: RUNTIME_ASSETS.factionAegisEffectsAtlas,
    usesProceduralTechnologyFallback: true,
    usesProceduralEffectFallback: true,
  },
  synod: {
    id: 'synod',
    accent: '#55E985',
    emblemUrl: RUNTIME_ASSETS.factionSynodEmblemWebp,
    backgroundUrl: RUNTIME_ASSETS.factionSynodBackgroundWebp,
    heroUrl: RUNTIME_ASSETS.factionSynodHero,
    controlSetUrl: RUNTIME_ASSETS.factionSynodControlSet,
    buildingsAtlasUrl: RUNTIME_ASSETS.factionSynodBuildingsAtlasWebp,
    shipsAtlasUrl: RUNTIME_ASSETS.factionSynodShipsAtlasWebp,
    defensesAtlasUrl: RUNTIME_ASSETS.factionSynodDefensesAtlasWebp,
    technologiesAtlasUrl: RUNTIME_ASSETS.factionAegisTechnologiesAtlas,
    effectsAtlasUrl: RUNTIME_ASSETS.factionAegisEffectsAtlas,
    usesProceduralTechnologyFallback: true,
    usesProceduralEffectFallback: true,
  },
  veyra: {
    id: 'veyra',
    accent: '#FF5A64',
    emblemUrl: RUNTIME_ASSETS.factionVeyraEmblemWebp,
    backgroundUrl: RUNTIME_ASSETS.factionVeyraBackgroundWebp,
    heroUrl: RUNTIME_ASSETS.factionVeyraHero,
    controlSetUrl: RUNTIME_ASSETS.factionVeyraControlSet,
    buildingsAtlasUrl: RUNTIME_ASSETS.factionVeyraBuildingsAtlasWebp,
    shipsAtlasUrl: RUNTIME_ASSETS.factionVeyraShipsAtlasWebp,
    defensesAtlasUrl: RUNTIME_ASSETS.factionVeyraDefensesAtlasWebp,
    technologiesAtlasUrl: RUNTIME_ASSETS.factionAegisTechnologiesAtlas,
    effectsAtlasUrl: RUNTIME_ASSETS.factionAegisEffectsAtlas,
    usesProceduralTechnologyFallback: true,
    usesProceduralEffectFallback: true,
  },
};

export function getFactionRuntimeAssets(factionId: FactionArtKey): FactionRuntimeAssetSet {
  return FACTION_RUNTIME_ASSETS[factionId];
}
