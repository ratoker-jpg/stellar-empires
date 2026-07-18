import './styles/main.css';
import './styles/factions.css';
import './styles/aegisAssets.css';
import './styles/planet.css';
import './styles/planetWorkspace.css';
import './styles/saveManager.css';
import './styles/research.css';
import { createGame } from './game/createGame';
import { createInitialGameState } from './simulation/createInitialGameState';
import type { GameState } from './simulation/types';
import {
  AutoSaveController,
  type AutoSaveStatus,
} from './storage/AutoSaveController';
import { IndexedDbSaveRepository } from './storage/IndexedDbSaveRepository';
import { loadAutosave } from './storage/loadAutosave';
import { SaveManager } from './storage/SaveManager';
import {
  applyPlanetScreenCommand,
  mountPlanetScreen,
} from './ui/planetScreen';
import { mountResearchScreen } from './ui/researchScreen';
import { mountSaveManager } from './ui/saveManager';
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

function writeAutoSaveStatus(status: AutoSaveStatus): void {
  switch (status.phase) {
    case 'pending':
      setStatus('Изменения ожидают сохранения');
      break;
    case 'saving':
      setStatus('Сохранение…');
      break;
    case 'saved':
      setStatus('Сохранено локально');
      break;
    case 'error':
      setStatus('Ошибка локального сохранения');
      console.error('[stellar-empires] autosave failed', status.error);
      break;
    case 'idle':
      break;
  }
}

async function bootstrap(): Promise<void> {
  const version = requireElement<HTMLElement>('#build-version');
  const systemCount = requireElement<HTMLElement>('#system-count');
  const repository = new IndexedDbSaveRepository();
  let initialState = createInitialGameState('stellar-empires-m1');
  let runtimeState: GameState = initialState;
  let startupStatus = `Новая партия · seed ${initialState.seed}`;
  let autosave: AutoSaveController | undefined;
  let saveManager: SaveManager | undefined;

  try {
    const restored = await loadAutosave(repository);

    if (restored.status === 'loaded') {
      initialState = restored.state;
      runtimeState = restored.state;
      startupStatus =
        restored.source === 'snapshot'
          ? `Партия восстановлена из резерва · seed ${initialState.seed}`
          : `Партия восстановлена · seed ${initialState.seed}`;
    } else if (restored.status === 'invalid') {
      startupStatus = 'Сохранения повреждены · новая партия';
      console.warn('[stellar-empires] invalid autosave', restored.code, restored.message);
    }

    saveManager = new SaveManager(repository);
    autosave = new AutoSaveController(repository, { onStatus: writeAutoSaveStatus });
  } catch (error: unknown) {
    startupStatus = `Локальное хранилище недоступно · seed ${initialState.seed}`;
    console.error('[stellar-empires] persistence unavailable', error);
  }

  version.textContent = `v${__APP_VERSION__}`;
  systemCount.textContent = String(initialState.galaxy.systems.length);

  createGame('phaser-game', initialState);
  renderAssetShowcases();
  mountPlanetScreen(initialState, setStatus, (state) => {
    runtimeState = state;
    autosave?.request(state);
  });
  mountResearchScreen({
    getState: () => runtimeState,
    execute: applyPlanetScreenCommand,
  });

  if (saveManager !== undefined) {
    mountSaveManager({
      manager: saveManager,
      getState: () => runtimeState,
      writeStatus: setStatus,
    });
  }

  const flushAutosave = (): void => {
    void autosave?.flush();
  };
  window.addEventListener('pagehide', flushAutosave);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushAutosave();
    }
  });

  setStatus(startupStatus);
  document.documentElement.dataset.appReady = 'true';
}

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown startup error';
  const status = document.querySelector<HTMLElement>('#app-status');

  if (status !== null) {
    status.textContent = `Ошибка запуска: ${message}`;
  }

  console.error('[stellar-empires] startup failed', error);
});
