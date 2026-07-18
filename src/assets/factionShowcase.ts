import { RUNTIME_ASSETS } from './runtimeAssets';
import type { FactionArtKey } from './artTokens';

export interface FactionShowcaseDefinition {
  readonly id: FactionArtKey;
  readonly name: string;
  readonly doctrine: string;
  readonly emblemUrl: string;
  readonly backgroundUrl: string;
  readonly controlSetUrl: string;
  readonly accent: string;
}

export const FACTION_SHOWCASES: readonly FactionShowcaseDefinition[] = [
  {
    id: 'aegis',
    name: 'Директорат «Эгида»',
    doctrine: 'Индустрия, логистика и тяжёлая оборона',
    emblemUrl: RUNTIME_ASSETS.factionAegisEmblem,
    backgroundUrl: RUNTIME_ASSETS.factionAegisBackground,
    controlSetUrl: RUNTIME_ASSETS.factionAegisControlSet,
    accent: '#E7A847',
  },
  {
    id: 'synod',
    name: 'Машинный Синод',
    doctrine: 'Энергетическая сеть, модули и перегрузка',
    emblemUrl: RUNTIME_ASSETS.factionSynodEmblem,
    backgroundUrl: RUNTIME_ASSETS.factionSynodBackground,
    controlSetUrl: RUNTIME_ASSETS.factionSynodControlSet,
    accent: '#53DCFF',
  },
  {
    id: 'veyra',
    name: 'Рой Вейра',
    doctrine: 'Выращивание, регенерация и адаптация',
    emblemUrl: RUNTIME_ASSETS.factionVeyraEmblem,
    backgroundUrl: RUNTIME_ASSETS.factionVeyraBackground,
    controlSetUrl: RUNTIME_ASSETS.factionVeyraControlSet,
    accent: '#A8E85E',
  },
] as const;
