import type { FactionId } from '../simulation/planet/types';

export interface GeneratedFactionIdentityAssetSet {
  readonly heroUrl: string;
  readonly emblemUrl: string;
  readonly backgroundUrl: string;
}

export const GENERATED_FACTION_IDENTITY_ASSETS: Readonly<
  Record<FactionId, GeneratedFactionIdentityAssetSet>
> = {
  aegis: {
    heroUrl: new URL(
      '../../assets/source/generated-factions-v1/factions/aegis_hero.png',
      import.meta.url,
    ).href,
    emblemUrl: new URL(
      '../../assets/source/generated-factions-v1/factions/aegis_emblem.png',
      import.meta.url,
    ).href,
    backgroundUrl: new URL(
      '../../assets/source/generated-factions-v1/factions/aegis_card_bg.png',
      import.meta.url,
    ).href,
  },
  synod: {
    heroUrl: new URL(
      '../../assets/source/generated-factions-v1/factions/synod_hero.png',
      import.meta.url,
    ).href,
    emblemUrl: new URL(
      '../../assets/source/generated-factions-v1/factions/synod_emblem.png',
      import.meta.url,
    ).href,
    backgroundUrl: new URL(
      '../../assets/source/generated-factions-v1/factions/synod_card_bg.png',
      import.meta.url,
    ).href,
  },
  veyra: {
    heroUrl: new URL(
      '../../assets/source/generated-factions-v1/factions/veyra_hero.png',
      import.meta.url,
    ).href,
    emblemUrl: new URL(
      '../../assets/source/generated-factions-v1/factions/veyra_emblem.png',
      import.meta.url,
    ).href,
    backgroundUrl: new URL(
      '../../assets/source/generated-factions-v1/factions/veyra_card_bg.png',
      import.meta.url,
    ).href,
  },
};

export function getGeneratedFactionIdentityAssets(
  factionId: FactionId,
): GeneratedFactionIdentityAssetSet {
  return GENERATED_FACTION_IDENTITY_ASSETS[factionId];
}
