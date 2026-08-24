import '../styles/commandRanking.css';
import { getGeneratedFactionIdentityAssets } from '../assets/generatedFactionIdentityAssets';
import type { GameState } from '../simulation/types';
import { createEmpireRanking, createPlayerCommandProfile } from './commandRanking';

export interface CommandRankingScreenOptions {
  readonly getState: () => GameState;
}

export interface CommandRankingScreenMount {
  activate(): void;
  deactivate(): void;
  refresh(): void;
  dispose(): void;
}

const NUMBER_FORMAT = new Intl.NumberFormat('ru-RU');

function createStat(label: string, value: string): HTMLElement {
  const item = document.createElement('div');
  const term = document.createElement('span');
  term.textContent = label;
  const output = document.createElement('strong');
  output.textContent = value;
  item.append(term, output);
  return item;
}

export function mountCommandRankingScreen(
  options: CommandRankingScreenOptions,
): CommandRankingScreenMount {
  const workspace = document.querySelector<HTMLElement>('#ranking-view');
  const profileHost = document.querySelector<HTMLElement>('#ranking-profile-view');
  const rankingHost = document.querySelector<HTMLElement>('#ranking-list-view');
  if (workspace === null || profileHost === null || rankingHost === null) {
    throw new Error('Command ranking workspace is missing.');
  }
  let active = false;

  const render = (): void => {
    if (!active) return;
    const state = options.getState();
    const profile = createPlayerCommandProfile(state);
    const identity = getGeneratedFactionIdentityAssets(profile.factionId);
    profileHost.style.setProperty('--command-profile-bg', `url("${identity.backgroundUrl}")`);
    profileHost.replaceChildren();

    const hero = document.createElement('img');
    hero.className = 'command-profile-hero';
    hero.src = identity.heroUrl;
    hero.alt = '';
    const body = document.createElement('div');
    body.className = 'command-profile-body';
    const identityRow = document.createElement('div');
    identityRow.className = 'command-profile-identity';
    const emblem = document.createElement('img');
    emblem.src = identity.emblemUrl;
    emblem.alt = '';
    const copy = document.createElement('div');
    const kicker = document.createElement('p');
    kicker.className = 'panel-label';
    kicker.textContent = `Место ${profile.rank} · ${NUMBER_FORMAT.format(profile.score)} очков`;
    const title = document.createElement('h2');
    title.textContent = profile.factionName;
    const doctrine = document.createElement('p');
    doctrine.textContent = profile.doctrine;
    copy.append(kicker, title, doctrine);
    identityRow.append(emblem, copy);
    const stats = document.createElement('div');
    stats.className = 'command-profile-stats';
    stats.append(
      createStat('Колонии', String(profile.colonies)),
      createStat('Запасы', NUMBER_FORMAT.format(profile.resourceStock)),
      createStat('Производство/ч', NUMBER_FORMAT.format(profile.productionPerHour)),
      createStat('Уровни зданий', String(profile.buildingLevels)),
      createStat('Уровни наук', String(profile.researchLevels)),
      createStat('Юниты', String(profile.units)),
      createStat('Флоты', String(profile.fleets)),
      createStat('Боевые победы', String(profile.victories)),
    );
    body.append(identityRow, stats);
    profileHost.append(hero, body);

    rankingHost.replaceChildren();
    const heading = document.createElement('header');
    const titleList = document.createElement('h2');
    titleList.textContent = 'Локальный рейтинг империй';
    const note = document.createElement('p');
    note.textContent = 'Очки вычисляются из текущего состояния партии и не сохраняются отдельным полем.';
    heading.append(titleList, note);
    rankingHost.append(heading);

    for (const entry of createEmpireRanking(state)) {
      const row = document.createElement('article');
      row.className = `command-ranking-entry${entry.empireId === 'player' ? ' is-player' : ''}`;
      const place = document.createElement('strong');
      place.className = 'command-ranking-place';
      place.textContent = `#${entry.rank}`;
      const identityAssets = getGeneratedFactionIdentityAssets(entry.factionId);
      const rowEmblem = document.createElement('img');
      rowEmblem.src = identityAssets.emblemUrl;
      rowEmblem.alt = '';
      const rowCopy = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = entry.empireId === 'player'
        ? `${entry.factionName} · игрок`
        : `${entry.factionName} · ${entry.empireId}`;
      const detail = document.createElement('small');
      detail.textContent = `${entry.colonies} кол. · ${entry.units} юн. · ${entry.victories} боев. побед`;
      rowCopy.append(name, detail);
      const score = document.createElement('b');
      score.textContent = NUMBER_FORMAT.format(entry.score);
      row.append(place, rowEmblem, rowCopy, score);
      rankingHost.append(row);
    }
  };

  return {
    activate: () => {
      active = true;
      workspace.hidden = false;
      render();
    },
    deactivate: () => {
      active = false;
      workspace.hidden = true;
    },
    refresh: render,
    dispose: () => {
      profileHost.replaceChildren();
      rankingHost.replaceChildren();
    },
  };
}
