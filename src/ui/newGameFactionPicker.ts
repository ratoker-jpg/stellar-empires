import type { FactionArtKey } from '../assets/artTokens';
import { FACTION_SHOWCASES } from '../assets/factionShowcase';

export interface NewGameFactionOption {
  readonly id: FactionArtKey;
  readonly name: string;
  readonly doctrine: string;
  readonly emblemUrl: string;
  readonly heroUrl: string;
  readonly backgroundUrl: string;
  readonly accent: string;
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

function createFactionChoice(
  option: NewGameFactionOption,
  select: (factionId: FactionArtKey) => void,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `new-game-faction new-game-faction--${option.id}`;
  button.style.setProperty('--faction-accent', option.accent);
  button.style.setProperty('--faction-background', `url("${option.backgroundUrl}")`);
  button.setAttribute('aria-label', `Начать новую игру: ${option.name}`);

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
  action.textContent = 'Выбрать фракцию';
  text.append(name, doctrine, action);

  copy.append(emblem, text);
  button.append(hero, copy);
  button.addEventListener('click', () => select(option.id));
  return button;
}

export function selectNewGameFaction(): Promise<FactionArtKey> {
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
    title.textContent = 'Выберите цивилизацию';
    const description = document.createElement('p');
    description.textContent =
      'Сейчас фракции используют общий механический вертикальный срез, но имеют собственные корабли, здания, эмблемы и интерфейсный язык.';
    header.append(eyebrow, title, description);

    const grid = document.createElement('div');
    grid.className = 'new-game-faction-grid';

    const finish = (factionId: FactionArtKey): void => {
      dialog.close();
      dialog.remove();
      resolve(factionId);
    };

    for (const option of NEW_GAME_FACTION_OPTIONS) {
      grid.append(createFactionChoice(option, finish));
    }

    const note = document.createElement('p');
    note.className = 'new-game-note';
    note.textContent =
      'Выбор сохраняется внутри партии. Полная механическая асимметрия будет добавляться отдельными faction-content этапами.';

    dialog.append(header, grid, note);
    document.body.append(dialog);
    dialog.showModal();
  });
}
