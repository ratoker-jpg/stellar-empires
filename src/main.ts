import './styles/main.css';
import './styles/factions.css';
import './styles/aegisAssets.css';
import './styles/planet.css';
import './styles/planetWorkspace.css';
import { createGame } from './game/createGame';
import { createInitialGameState } from './simulation/createInitialGameState';
import { mountPlanetScreen } from './ui/planetScreen';
import { renderAssetShowcases } from './ui/showcase';

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (element === null) {
    throw new Error(`Required element not found: ${selector}`);
  }

  return element;
}

function setStatus(message: string): void {
  requireElement<HTMLElement>('#app-status').textContent = message;
}

function bootstrap(): void {
  const version = requireElement<HTMLElement>('#build-version');
  const systemCount = requireElement<HTMLElement>('#system-count');
  const initialState = createInitialGameState('stellar-empires-m1');

  version.textContent = `v${__APP_VERSION__}`;
  systemCount.textContent = String(initialState.galaxy.systems.length);

  createGame('phaser-game', initialState);
  renderAssetShowcases();
  mountPlanetScreen(initialState, setStatus);

  setStatus(`Онлайн · seed ${initialState.seed}`);
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
