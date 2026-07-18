import './styles/main.css';
import { createGame } from './game/createGame';
import { createInitialGameState } from './simulation/createInitialGameState';

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (element === null) {
    throw new Error(`Required element not found: ${selector}`);
  }

  return element;
}

function bootstrap(): void {
  const version = requireElement<HTMLElement>('#build-version');
  const status = requireElement<HTMLElement>('#app-status');

  version.textContent = `v${__APP_VERSION__}`;

  const initialState = createInitialGameState('stellar-empires-m1');
  createGame('phaser-game');

  status.textContent = `Системы готовы · seed ${initialState.seed}`;
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
