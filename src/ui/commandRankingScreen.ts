import '../styles/commandRanking.css';
import { getGeneratedFactionIdentityAssets } from '../assets/generatedFactionIdentityAssets';
import type { GameState } from '../simulation/types';
import { createEmpireRanking, createPlayerCommandProfile } from './commandRanking';

export interface CommandRankingScreenOptions {
  readonly getState: () => GameState;
}

const NUMBER_FORMAT = new Intl.NumberFormat('ru-RU');

function createDialog(): HTMLDialogElement {
  const existing = document.querySelector<HTMLDialogElement>('#command-ranking-dialog');
  if (existing !== null) return existing;
  const dialog = document.createElement('dialog');
  dialog.id = 'command-ranking-dialog';
  dialog.className = 'command-ranking-dialog';
  dialog.innerHTML = `
    <header class="command-ranking-header">
      <div><p class="panel-label">Strategic Command</p><h2>Командный профиль и рейтинг</h2></div>
      <button type="button" class="dialog-close" aria-label="Закрыть рейтинг">×</button>
    </header>
    <section class="command-profile"></section>
    <section class="command-ranking-list" aria-label="Локальный рейтинг империй"></section>
  `;
  dialog.querySelector<HTMLButtonElement>('.dialog-close')?.addEventListener('click', () => {
    dialog.close();
  });
  document.body.append(dialog);
  return dialog;
}

function createStat(label: string, value: string): HTMLElement {
  const item = document.createElement('div');
  const term = document.createElement('span');
  term.textContent = label;
  const output = document.createElement('strong');
  output.textContent = value;
  item.append(term, output);
  return item;
}

export function mountCommandRankingScreen(options: CommandRankingScreenOptions): void {
  const button = document.querySelector<HTMLButtonElement>('#nav-rating')
    ?? document.querySelector<HTMLButtonElement>('[aria-label="Рейтинг"]');
  if (button === null) return;
  button.id = 'nav-rating';
  button.disabled = false;
  const dialog = createDialog();
  const profileHost = dialog.querySelector<HTMLElement>('.command-profile');
  const rankingHost = dialog.querySelector<HTMLElement>('.command-ranking-list');
  if (profileHost === null || rankingHost === null) {
    throw new Error('Command ranking containers are missing.');
  }

  const render = (): void => {
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
    const title = document.createElement('h3');
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
      createStat('Победы', String(profile.victories)),
    );
    body.append(identityRow, stats);
    profileHost.append(hero, body);

    rankingHost.replaceChildren();
    const heading = document.createElement('header');
    const titleList = document.createElement('h3');
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
      const emblem = document.createElement('img');
      emblem.src = identityAssets.emblemUrl;
      emblem.alt = '';
      const copy = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = entry.empireId === 'player' ? `${entry.factionName} · игрок` : `${entry.factionName} · ${entry.empireId}`;
      const detail = document.createElement('small');
      detail.textContent = `${entry.colonies} кол. · ${entry.units} юн. · ${entry.victories} побед`;
      copy.append(name, detail);
      const score = document.createElement('b');
      score.textContent = NUMBER_FORMAT.format(entry.score);
      row.append(place, emblem, copy, score);
      rankingHost.append(row);
    }
  };

  button.addEventListener('click', () => {
    render();
    dialog.showModal();
  });
}
