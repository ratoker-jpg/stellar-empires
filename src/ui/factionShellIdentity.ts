import type { FactionArtKey } from '../assets/artTokens';
import { FACTION_SHOWCASES } from '../assets/factionShowcase';

export interface FactionShellCopy {
  readonly name: string;
  readonly profile: string;
  readonly planetModel: string;
  readonly buildingHeading: string;
  readonly arsenalHeading: string;
  readonly arsenalDescription: string;
}

const SHELL_COPY: Readonly<Record<FactionArtKey, FactionShellCopy>> = {
  aegis: {
    name: 'Директорат «Эгида»',
    profile: 'Человеческая держава · военно-индустриальная доктрина',
    planetModel: 'Директорат «Эгида» · трёхзонная планетарная модель',
    buildingHeading: 'Здания «Эгиды»',
    arsenalHeading: 'Арсенал «Эгиды»',
    arsenalDescription: 'Бронированные здания, корабли и оборона человеческой космической державы.',
  },
  synod: {
    name: 'Машинный Синод',
    profile: 'Кибернетическая цивилизация · энергетическая доктрина',
    planetModel: 'Машинный Синод · модульная трёхзонная сеть',
    buildingHeading: 'Узлы Синода',
    arsenalHeading: 'Матрица Синода',
    arsenalDescription: 'Кольцевые комплексы, синтетические корабли и энергетическая оборона.',
  },
  veyra: {
    name: 'Рой Вейра',
    profile: 'Органический рой · доктрина роста и адаптации',
    planetModel: 'Рой Вейра · живая трёхзонная колония',
    buildingHeading: 'Структуры Вейра',
    arsenalHeading: 'Биофлот Вейра',
    arsenalDescription: 'Живые структуры, выращенные организмы и панцирная планетарная защита.',
  },
};

export function getFactionShellCopy(factionId: FactionArtKey): FactionShellCopy {
  return SHELL_COPY[factionId];
}

export function applyFactionShellIdentity(factionId: FactionArtKey): void {
  const faction = FACTION_SHOWCASES.find((candidate) => candidate.id === factionId);
  if (faction === undefined) return;
  const copy = getFactionShellCopy(factionId);

  document.documentElement.dataset.faction = factionId;

  const emblem = document.querySelector<HTMLImageElement>('.commander-emblem');
  if (emblem !== null) {
    emblem.src = faction.emblemUrl;
    emblem.alt = `Эмблема: ${copy.name}`;
  }

  const commanderName = document.querySelector<HTMLElement>('.commander-row h2');
  const commanderProfile = document.querySelector<HTMLElement>('.commander-row p');
  if (commanderName !== null) commanderName.textContent = copy.name;
  if (commanderProfile !== null) commanderProfile.textContent = copy.profile;

  const planetModel = document.querySelector<HTMLElement>(
    '#planet-view .planet-header p:not(.panel-label)',
  );
  if (planetModel !== null) planetModel.textContent = copy.planetModel;

  const buildingHeading = document.querySelector<HTMLElement>(
    '.building-catalog-panel .planet-section-heading h2',
  );
  if (buildingHeading !== null) buildingHeading.textContent = copy.buildingHeading;

  const arsenalHeading = document.querySelector<HTMLElement>('.aegis-deck-panel h2');
  const arsenalDescription = document.querySelector<HTMLElement>('.aegis-deck-panel > p');
  if (arsenalHeading !== null) arsenalHeading.textContent = copy.arsenalHeading;
  if (arsenalDescription !== null) arsenalDescription.textContent = copy.arsenalDescription;
}
