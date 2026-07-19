import type { FactionArtKey } from './artTokens';
import { getFactionRuntimeAssets } from './factionRuntimeAssets';

export interface FactionShowcaseDefinition {
  readonly id: FactionArtKey;
  readonly name: string;
  readonly doctrine: string;
  readonly emblemUrl: string;
  readonly backgroundUrl: string;
  readonly heroUrl: string;
  readonly previewUrl: string;
  readonly accent: string;
}

const FACTION_COPY: Readonly<
  Record<FactionArtKey, Pick<FactionShowcaseDefinition, 'name' | 'doctrine'>>
> = {
  aegis: {
    name: 'Директорат «Эгида»',
    doctrine: 'Индустрия, логистика и тяжёлая оборона',
  },
  synod: {
    name: 'Машинный Синод',
    doctrine: 'Энергетическая сеть, модули и перегрузка',
  },
  veyra: {
    name: 'Рой Вейра',
    doctrine: 'Выращивание, регенерация и адаптация',
  },
};

const FACTION_ORDER: readonly FactionArtKey[] = ['aegis', 'synod', 'veyra'];

export const FACTION_SHOWCASES: readonly FactionShowcaseDefinition[] = FACTION_ORDER.map(
  (id): FactionShowcaseDefinition => {
    const runtime = getFactionRuntimeAssets(id);
    return {
      id,
      ...FACTION_COPY[id],
      emblemUrl: runtime.emblemUrl,
      backgroundUrl: runtime.backgroundUrl,
      heroUrl: runtime.heroUrl,
      previewUrl: runtime.backgroundUrl,
      accent: runtime.accent,
    };
  },
);
