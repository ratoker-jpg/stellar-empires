import './styles/main.css';
import './styles/factions.css';
import { FACTION_SHOWCASES } from './assets/factionShowcase';
import { createGame } from './game/createGame';
import { createInitialGameState } from './simulation/createInitialGameState';

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (element === null) {
    throw new Error(`Required element not found: ${selector}`);
  }

  return element;
}

function createFactionCard(
  faction: (typeof FACTION_SHOWCASES)[number],
  openPreview: () => void,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `faction-card faction-card--${faction.id}`;
  button.setAttribute('aria-label', `Открыть визуальный набор: ${faction.name}`);

  const emblem = document.createElement('img');
  emblem.src = faction.emblemUrl;
  emblem.alt = '';

  const copy = document.createElement('span');
  copy.className = 'faction-card__copy';

  const name = document.createElement('strong');
  name.textContent = faction.name;

  const doctrine = document.createElement('small');
  doctrine.textContent = faction.doctrine;

  const action = document.createElement('span');
  action.className = 'faction-card__action';
  action.textContent = '↗';
  action.setAttribute('aria-hidden', 'true');

  copy.append(name, doctrine);
  button.append(emblem, copy, action);
  button.addEventListener('click', openPreview);

  return button;
}

function renderFactionShowcase(): void {
  const container = requireElement<HTMLElement>('#faction-showcase');
  const dialog = requireElement<HTMLDialogElement>('#faction-preview-dialog');
  const previewImage = requireElement<HTMLImageElement>('#faction-preview-image');
  const previewTitle = requireElement<HTMLElement>('#faction-preview-title');
  const closeButton = requireElement<HTMLButtonElement>('#faction-preview-close');

  for (const faction of FACTION_SHOWCASES) {
    const openPreview = (): void => {
      previewImage.src = faction.controlSetUrl;
      previewImage.alt = `Контрольный визуальный набор: ${faction.name}`;
      previewTitle.textContent = faction.name;
      dialog.showModal();
    };

    container.append(createFactionCard(faction, openPreview));
  }

  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
}

function bootstrap(): void {
  const version = requireElement<HTMLElement>('#build-version');
  const status = requireElement<HTMLElement>('#app-status');
  const systemCount = requireElement<HTMLElement>('#system-count');

  version.textContent = `v${__APP_VERSION__}`;

  const initialState = createInitialGameState('stellar-empires-m1');
  createGame('phaser-game', initialState);
  renderFactionShowcase();

  systemCount.textContent = String(initialState.galaxy.systems.length);
  status.textContent = `Онлайн · seed ${initialState.seed}`;
  document.documentElement.dataset.appReady = 'true';
}

try {
  bootstrap();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown startup error';
  const status = document.querySelector<HTMLElement>('#app-status');

  if (status !== null) {
    status.textContent = `Ошибка запуска: ${message}`;
  }

  console.error('[stellar-empires] startup failed', error);
}
