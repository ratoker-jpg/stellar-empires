import type { FactionArtKey } from '../assets/artTokens';
import { FACTION_SHOWCASES } from '../assets/factionShowcase';
import {
  createCampaignSettings,
  type CampaignSettings,
  type WorldSpeed,
} from '../simulation/campaign/settings';
import type { UniverseTopologyPresetId } from '../simulation/universe/model';

export interface NewGameFactionOption {
  readonly id: FactionArtKey;
  readonly name: string;
  readonly doctrine: string;
  readonly emblemUrl: string;
  readonly heroUrl: string;
  readonly backgroundUrl: string;
  readonly accent: string;
}

export interface NewGameScenarioOption {
  readonly id: UniverseTopologyPresetId;
  readonly name: string;
  readonly detail: string;
}

export interface NewGameSpeedOption {
  readonly value: WorldSpeed;
  readonly name: string;
  readonly detail: string;
  readonly recommended?: boolean;
}

export interface NewGameCampaignSelection {
  readonly faction: FactionArtKey;
  readonly campaignSettings: CampaignSettings;
}

export const NEW_GAME_FACTION_OPTIONS: readonly NewGameFactionOption[] =
  FACTION_SHOWCASES.map((faction) => ({
    id: faction.id,
    name: faction.name,
    doctrine: faction.doctrine,
    emblemUrl: faction.emblemUrl,
    heroUrl: faction.heroUrl,
    backgroundUrl: faction.backgroundUrl,
    accent: faction.accent,
  }));

export const NEW_GAME_SCENARIO_OPTIONS: readonly NewGameScenarioOption[] = [
  { id: 'test', name: 'Компактный сектор', detail: '2 галактики · 9 систем' },
  { id: 'campaign', name: 'Основная кампания', detail: '6 галактик · 27 систем' },
  { id: 'fidelity', name: 'Большая вселенная', detail: '15 галактик · 81 система' },
];

export const NEW_GAME_SPEED_OPTIONS: readonly NewGameSpeedOption[] = [
  { value: 1, name: 'x1', detail: 'Базовый темп' },
  { value: 2, name: 'x2', detail: 'Рекомендуемый темп', recommended: true },
  { value: 5, name: 'x5', detail: 'Быстрая кампания' },
  { value: 10, name: 'x10', detail: 'Экспресс-кампания' },
];

function createFactionChoice(
  option: NewGameFactionOption,
  select: (factionId: FactionArtKey) => void,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `new-game-faction new-game-faction--${option.id}`;
  button.style.setProperty('--faction-accent', option.accent);
  button.style.setProperty('--faction-background', `url("${option.backgroundUrl}")`);
  button.setAttribute('aria-label', `Начать кампанию: ${option.name}`);

  const hero = document.createElement('img');
  hero.className = 'new-game-faction__hero';
  hero.src = option.heroUrl;
  hero.alt = '';

  const copy = document.createElement('span');
  copy.className = 'new-game-faction__copy';
  const emblem = document.createElement('img');
  emblem.className = 'new-game-faction__emblem';
  emblem.src = option.emblemUrl;
  emblem.alt = '';
  const text = document.createElement('span');
  const name = document.createElement('strong');
  name.textContent = option.name;
  const doctrine = document.createElement('small');
  doctrine.textContent = option.doctrine;
  const action = document.createElement('b');
  action.textContent = 'Начать кампанию';
  text.append(name, doctrine, action);
  copy.append(emblem, text);
  button.append(hero, copy);
  button.addEventListener('click', () => select(option.id));
  return button;
}

function createSelect<T extends string | number>(
  labelText: string,
  options: readonly { readonly value: T; readonly name: string; readonly detail: string }[],
  selected: T,
): { readonly label: HTMLLabelElement; readonly select: HTMLSelectElement } {
  const label = document.createElement('label');
  label.className = 'new-game-setting';
  const caption = document.createElement('span');
  caption.textContent = labelText;
  const select = document.createElement('select');
  select.className = 'new-game-setting__select';
  for (const option of options) {
    const element = document.createElement('option');
    element.value = String(option.value);
    element.textContent = `${option.name} · ${option.detail}`;
    select.append(element);
  }
  select.value = String(selected);
  label.append(caption, select);
  return { label, select };
}

export function selectNewGameCampaign(): Promise<NewGameCampaignSelection> {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'new-game-dialog';
    dialog.setAttribute('aria-labelledby', 'new-game-title');
    dialog.addEventListener('cancel', (event) => event.preventDefault());

    const header = document.createElement('header');
    const eyebrow = document.createElement('p');
    eyebrow.textContent = 'Новая партия';
    const title = document.createElement('h1');
    title.id = 'new-game-title';
    title.textContent = 'Настройте кампанию';
    const description = document.createElement('p');
    description.textContent =
      'Размер мира и скорость фиксируются при создании и сохраняются внутри партии.';
    header.append(eyebrow, title, description);

    const scenario = createSelect(
      'Размер мира',
      NEW_GAME_SCENARIO_OPTIONS.map((option) => ({
        value: option.id,
        name: option.name,
        detail: option.detail,
      })),
      'campaign',
    );
    const speed = createSelect(
      'Скорость мира',
      NEW_GAME_SPEED_OPTIONS.map((option) => ({
        value: option.value,
        name: option.name,
        detail: option.detail,
      })),
      2,
    );
    const settings = document.createElement('section');
    settings.className = 'new-game-settings';
    settings.setAttribute('aria-label', 'Неизменяемые настройки кампании');
    settings.append(scenario.label, speed.label);

    const grid = document.createElement('div');
    grid.className = 'new-game-faction-grid';
    const finish = (faction: FactionArtKey): void => {
      const scenarioPreset = scenario.select.value as UniverseTopologyPresetId;
      const worldSpeed = Number(speed.select.value) as WorldSpeed;
      const campaignSettings = createCampaignSettings({
        scenarioPreset,
        worldSpeed,
        createdAtReal: new Date().toISOString(),
      });
      dialog.close();
      dialog.remove();
      resolve({ faction, campaignSettings });
    };
    for (const option of NEW_GAME_FACTION_OPTIONS) {
      grid.append(createFactionChoice(option, finish));
    }

    const note = document.createElement('p');
    note.className = 'new-game-note';
    note.textContent =
      'Офлайн-прогрессия включена для локальной кампании. Изменить размер мира или скорость после старта нельзя.';
    dialog.append(header, settings, grid, note);
    document.body.append(dialog);
    dialog.showModal();
  });
}

export async function selectNewGameFaction(): Promise<FactionArtKey> {
  return (await selectNewGameCampaign()).faction;
}
