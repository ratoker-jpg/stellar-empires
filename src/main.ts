import './styles/main.css';
import './styles/factions.css';
import './styles/aegisAssets.css';
import { AEGIS_ASSET_ATLASES } from './assets/aegisVerticalSliceAssets';
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

function closeOnBackdrop(dialog: HTMLDialogElement): void {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
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
  closeOnBackdrop(dialog);
}

function createAtlasCard(
  atlas: (typeof AEGIS_ASSET_ATLASES)[number],
  openAtlas: () => void,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'aegis-atlas-card';
  button.setAttribute('aria-label', `Открыть атлас: ${atlas.name}`);

  const mark = document.createElement('span');
  mark.className = 'aegis-atlas-card__mark';
  mark.textContent = String(atlas.count);

  const name = document.createElement('strong');
  name.textContent = atlas.name;

  const count = document.createElement('small');
  count.textContent = `${atlas.count} ед.`;

  button.append(mark, name, count);
  button.addEventListener('click', openAtlas);

  return button;
}

function renderAegisAssetDeck(): void {
  const container = requireElement<HTMLElement>('#aegis-asset-deck');
  const dialog = requireElement<HTMLDialogElement>('#aegis-atlas-dialog');
  const previewImage = requireElement<HTMLImageElement>('#aegis-atlas-image');
  const previewTitle = requireElement<HTMLElement>('#aegis-atlas-title');
  const closeButton = requireElement<HTMLButtonElement>('#aegis-atlas-close');

  for (const atlas of AEGIS_ASSET_ATLASES) {
    const openAtlas = (): void => {
      previewImage.src = atlas.url;
      previewImage.alt = `Атлас «Эгиды»: ${atlas.name}`;
      previewTitle.textContent = `${atlas.name} · ${atlas.count} ассетов`;
      dialog.showModal();
    };

    container.append(createAtlasCard(atlas, openAtlas));
  }

  closeButton.addEventListener('click', () => dialog.close());
  closeOnBackdrop(dialog);
}

function bootstrap(): void {
  const version = requireElement<HTMLElement>('#build-version');
  const status = requireElement<HTMLElement>('#app-status');
  const systemCount = requireElement<HTMLElement>('#system-count');

  version.textContent = `v${__APP_VERSION__}`;

  const initialState = createInitialGameState('stellar-empires-m1');
  createGame('phaser-game', initialState);
  renderFactionShowcase();
  renderAegisAssetDeck();

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
