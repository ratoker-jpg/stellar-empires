import './styles/designTokens.css';
import './styles/main.css';
import './styles/factions.css';
import './styles/factionTheme.css';
import './styles/uiPrimitives.css';
import './styles/newGame.css';
import './styles/aegisAssets.css';
import './styles/galaxyIntel.css';
import './styles/spaceMap.css';
import './styles/expeditions.css';
import './styles/spaceObjects.css';
import './styles/worldEvents.css';
import './styles/missionReports.css';
import './styles/planet.css';
import './styles/planetWorkspace.css';
import './styles/planetDevelopment.css';
import './styles/developmentWorkspace.css';
import './styles/logistics.css';
import './styles/market.css';
import './styles/saveManager.css';
import './styles/research.css';
import './styles/production.css';
import './styles/missions.css';
import './styles/empire.css';
import './styles/globalHud.css';
import { bindFactionRuntimeAssets } from './assets/bindFactionRuntimeAssets';
import { createGame, updateGamePresentation } from './game/createGame';
import {
  createBrowserSpaceMapNavigationEnvironment,
  parseSpaceMapRoute,
  SpaceMapNavigationController,
} from './navigation/spaceMapRoute';
import { BotAutomationController } from './runtime/BotAutomationController';
import { GameApplicationController } from './runtime/GameApplicationController';
import {
  E2E_RUNTIME_ENABLED,
  prepareE2eState,
  updateE2eRuntimeDiagnostics,
} from './runtime/e2eScenario';
import { createInitialGameState } from './simulation/createInitialGameState';
import type { GameState } from './simulation/types';
import {
  AutoSaveController,
  type AutoSaveStatus,
} from './storage/AutoSaveController';
import { IndexedDbSaveRepository } from './storage/IndexedDbSaveRepository';
import { loadAutosave } from './storage/loadAutosave';
import { SaveManager } from './storage/SaveManager';
import { mountAccessibilityRuntime } from './ui/accessibilityRuntime';
import {
  AppShellController,
  createBrowserAppShellEnvironment,
} from './ui/appShellController';
import type {
  PlanetDevelopmentSurface,
  PlanetShellMode,
} from './ui/appShellRoute';
import { mountCommandDoctrineScreen } from './ui/commandDoctrineScreen';
import { mountCommandRankingScreen } from './ui/commandRankingScreen';
import { mountDevelopmentHud } from './ui/developmentHud';
import { mountDevelopmentPresentation } from './ui/developmentPresentation';
import { mountDevelopmentWorkspaceRouter } from './ui/developmentWorkspaceRouter';
import { mountEmpireOverview } from './ui/empireOverview';
import { mountExpeditionPanel } from './ui/expeditionPanel';
import { applyFactionShellIdentity } from './ui/factionShellIdentity';
import { mountFleetDoctrineScreen } from './ui/fleetDoctrineScreen';
import { mountGalaxyIntelPanel } from './ui/galaxyIntelPanel';
import { mountLogisticsRoutesPanel } from './ui/logisticsRoutesPanel';
import { mountMarketPanel } from './ui/marketPanel';
import { mountMissionReportsPanel } from './ui/missionReportsPanel';
import { mountMissionScreen } from './ui/missionScreen';
import { selectNewGameFaction } from './ui/newGameFactionPicker';
import { mountOperationsWorkspace } from './ui/operationsWorkspace';
import { mountPlanetDevelopmentControls } from './ui/planetDevelopmentControls';
import {
  applyPlanetScreenState,
  getPlanetScreenActivePlanetId,
  mountPlanetScreen,
  selectPlanetScreenPlanet,
} from './ui/planetScreen';
import { mountProductionScreens } from './ui/productionScreen';
import { mountResearchScreen } from './ui/researchScreen';
import { mountSaveManager } from './ui/saveManager';
import { renderAssetShowcases } from './ui/showcase';
import { mountShipUpgradesScreen } from './ui/shipUpgradesScreen';
import { mountSpaceObjectsPanel } from './ui/spaceObjectsPanel';
import { mountSpaceMapNavigation } from './ui/spaceMapNavigation';
import { mountWorldEventsPanel } from './ui/worldEventsPanel';

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`Required element not found: ${selector}`);
  return element;
}

function setStatus(message: string): void {
  requireElement<HTMLElement>('#app-status').textContent = message;
}

function writeAutoSaveStatus(status: AutoSaveStatus): void {
  switch (status.phase) {
    case 'pending': setStatus('Изменения ожидают сохранения'); break;
    case 'saving': setStatus('Сохранение…'); break;
    case 'saved': setStatus('Сохранено локально'); break;
    case 'error':
      setStatus('Ошибка локального сохранения');
      console.error('[stellar-empires] autosave failed', status.error);
      break;
    case 'idle': break;
  }
}

async function createFreshGame(statusPrefix = 'Новая партия'): Promise<{
  readonly state: GameState;
  readonly status: string;
}> {
  const faction = E2E_RUNTIME_ENABLED ? 'aegis' : await selectNewGameFaction();
  const state = prepareE2eState(createInitialGameState('stellar-empires-m1', faction));
  return { state, status: `${statusPrefix} · ${faction.toUpperCase()} · seed ${state.seed}` };
}

async function bootstrap(): Promise<void> {
  const version = requireElement<HTMLElement>('#build-version');
  const systemCount = requireElement<HTMLElement>('#system-count');
  const repository = new IndexedDbSaveRepository();
  let initialState: GameState;
  let startupStatus: string;
  let autosave: AutoSaveController | undefined;
  let saveManager: SaveManager | undefined;

  try {
    const restored = await loadAutosave(repository);
    if (restored.status === 'loaded') {
      initialState = prepareE2eState(restored.state);
      startupStatus = restored.source === 'snapshot'
        ? `Партия восстановлена из резерва · seed ${initialState.seed}`
        : `Партия восстановлена · seed ${initialState.seed}`;
    } else {
      if (restored.status === 'invalid') {
        console.warn('[stellar-empires] invalid autosave', restored.code, restored.message);
      }
      const fresh = await createFreshGame(
        restored.status === 'invalid' ? 'Сохранения повреждены · новая партия' : 'Новая партия',
      );
      initialState = fresh.state;
      startupStatus = fresh.status;
    }
    saveManager = new SaveManager(repository);
    autosave = new AutoSaveController(repository, { onStatus: writeAutoSaveStatus });
  } catch (error: unknown) {
    console.error('[stellar-empires] persistence unavailable', error);
    const fresh = await createFreshGame('Локальное хранилище недоступно · новая партия');
    initialState = fresh.state;
    startupStatus = fresh.status;
  }

  const playerFaction = initialState.planets.find(
    (planet) => planet.ownerEmpireId === 'player',
  )?.factionId ?? 'aegis';
  bindFactionRuntimeAssets(playerFaction);
  applyFactionShellIdentity(playerFaction);
  version.textContent = `v${__APP_VERSION__}`;
  systemCount.textContent = String(initialState.galaxy.systems.length);

  const botAutomationRef: { current?: BotAutomationController } = {};
  const gameRef: { current?: ReturnType<typeof createGame> } = {};
  const spaceMapUiRef: { current?: ReturnType<typeof mountSpaceMapNavigation> } = {};
  let syncingPlanetScreen = false;

  const application = new GameApplicationController(initialState, {
    writeStatus: setStatus,
    onTransition: ({ state, source, message }) => {
      if (source !== 'planet-compatibility') {
        syncingPlanetScreen = true;
        try {
          applyPlanetScreenState(state, message);
        } finally {
          syncingPlanetScreen = false;
        }
      }
      if (gameRef.current !== undefined) updateGamePresentation(gameRef.current, state);
      spaceMapUiRef.current?.refresh();
      updateE2eRuntimeDiagnostics(state);
      autosave?.request(state);
      if (source !== 'bot') botAutomationRef.current?.request();
    },
  });

  const spaceMapNavigation = new SpaceMapNavigationController(
    createBrowserSpaceMapNavigationEnvironment(),
    () => application.getState().universe,
  );
  const game = createGame('phaser-game', initialState, spaceMapNavigation);
  gameRef.current = game;
  const spaceMapUi = mountSpaceMapNavigation(
    spaceMapNavigation,
    () => application.getState(),
  );
  spaceMapUiRef.current = spaceMapUi;
  updateE2eRuntimeDiagnostics(initialState);
  renderAssetShowcases();

  mountPlanetScreen(initialState, setStatus, (state) => {
    if (syncingPlanetScreen) return;
    application.applyState(state, 'planet-compatibility', 'Состояние колонии обновлено');
  });
  application.selectActivePlanet(getPlanetScreenActivePlanetId(), false);

  const commandBridge = application.createCommandBridge();
  const researchScreen = mountResearchScreen(commandBridge);
  const productionScreens = mountProductionScreens(commandBridge);
  const shipUpgradesScreen = mountShipUpgradesScreen(commandBridge);
  const developmentControls = mountPlanetDevelopmentControls(commandBridge);
  const developmentHud = mountDevelopmentHud({
    getState: () => application.getState(),
    getActivePlanetId: () => application.getActivePlanetId(),
  });
  const developmentPresentation = mountDevelopmentPresentation({
    getState: () => application.getState(),
    getActivePlanetId: () => application.getActivePlanetId(),
  });

  let appShellRef: AppShellController | undefined;
  const developmentRouter = mountDevelopmentWorkspaceRouter({
    getState: () => application.getState(),
    getActivePlanetId: () => application.getActivePlanetId(),
    navigateToResearch: () => appShellRef?.navigateToResearch(),
    navigateToSurface: (mode, surface) => {
      appShellRef?.navigateToPlanet(application.getActivePlanetId(), mode, surface);
    },
  });

  const hidePrimaryViews = (): void => {
    requireElement<HTMLElement>('#galaxy-view').hidden = true;
    requireElement<HTMLElement>('#planet-view').hidden = true;
    requireElement<HTMLElement>('#research-view').hidden = true;
  };
  const deactivateDevelopmentScreens = (): void => {
    researchScreen.deactivate();
    productionScreens.deactivate();
    shipUpgradesScreen.deactivate();
  };
  const activatePlanet = (
    planetId: string,
    mode: PlanetShellMode,
    surface: PlanetDevelopmentSurface,
  ): void => {
    hidePrimaryViews();
    researchScreen.deactivate();
    requireElement<HTMLElement>('#planet-view').hidden = false;
    requireElement<HTMLElement>('.game-layout').classList.add('is-planet-view');
    selectPlanetScreenPlanet(planetId, false);
    requireElement<HTMLButtonElement>(`[data-planet-mode="${mode}"]`).click();
    productionScreens.deactivate();
    shipUpgradesScreen.deactivate();
    developmentRouter.activate(mode, surface);
    if (surface === 'shipyard') productionScreens.activate('ship');
    if (surface === 'defense') productionScreens.activate('defense');
    if (surface === 'upgrades') shipUpgradesScreen.activate();
    developmentPresentation.refresh();
  };
  const activateSpace = (): void => {
    hidePrimaryViews();
    deactivateDevelopmentScreens();
    requireElement<HTMLElement>('#galaxy-view').hidden = false;
    requireElement<HTMLElement>('.game-layout').classList.remove('is-planet-view');
    const parsed = parseSpaceMapRoute(
      window.location.hash,
      application.getState().universe,
    );
    spaceMapNavigation.navigate(parsed.route, 'replace');
  };
  const activateResearch = (): void => {
    hidePrimaryViews();
    productionScreens.deactivate();
    shipUpgradesScreen.deactivate();
    requireElement<HTMLElement>('.game-layout').classList.remove('is-planet-view');
    researchScreen.activate();
    developmentPresentation.refresh();
  };

  const appShell = new AppShellController(createBrowserAppShellEnvironment(), {
    getState: () => application.getState(),
    getActivePlanetId: () => application.getActivePlanetId(),
    selectActivePlanet: (planetId) => application.selectActivePlanet(planetId, false),
    activatePlanet,
    activateSpace,
    activateResearch,
    writeStatus: setStatus,
  });
  appShellRef = appShell;

  const applicationSubscription = application.subscribe(() => {
    developmentHud.refresh();
    developmentControls.refresh();
    researchScreen.refresh();
    productionScreens.refresh();
    shipUpgradesScreen.refresh();
    developmentRouter.refresh();
    developmentPresentation.refresh();
  });

  const botAutomation = new BotAutomationController({
    getState: () => application.getState(),
    applyState: (state, acceptedCommandCount) => {
      application.applyState(
        state,
        'bot',
        acceptedCommandCount > 0
          ? `Боты выполнили действий · ${acceptedCommandCount}`
          : 'График решений ботов синхронизирован',
      );
    },
    onError: (message) => {
      console.error('[stellar-empires] bot scheduler failed', message);
      setStatus('Ошибка автономного планировщика');
    },
  });
  botAutomationRef.current = botAutomation;

  mountGalaxyIntelPanel({ getState: () => application.getState() });
  mountExpeditionPanel(commandBridge);
  mountSpaceObjectsPanel(commandBridge);
  mountWorldEventsPanel({ getState: () => application.getState() });
  mountMissionReportsPanel({
    getState: () => application.getState(),
    navigateToCoordinate: (coordinate) => {
      spaceMapNavigation.navigate({ level: 'solar-system', ...coordinate });
      appShell.navigateToSpace();
      spaceMapUi.refresh();
    },
  });
  mountLogisticsRoutesPanel(commandBridge);
  mountMarketPanel(commandBridge);
  mountOperationsWorkspace({ getState: () => application.getState() });
  mountEmpireOverview({
    getState: () => application.getState(),
    getActivePlanetId: () => application.getActivePlanetId(),
    selectPlanet: (planetId) => appShell.navigateToPlanet(planetId),
  });
  mountCommandRankingScreen({ getState: () => application.getState() });
  mountCommandDoctrineScreen(commandBridge);
  mountMissionScreen(commandBridge);
  mountFleetDoctrineScreen(commandBridge);
  mountAccessibilityRuntime();

  if (saveManager !== undefined) {
    mountSaveManager({
      manager: saveManager,
      getState: () => application.getState(),
      writeStatus: setStatus,
    });
  }

  const flushAutosave = (): void => { void autosave?.flush(); };
  window.addEventListener('pagehide', flushAutosave);
  window.addEventListener('beforeunload', () => {
    botAutomation.dispose();
    applicationSubscription();
    appShell.dispose();
    developmentRouter.dispose();
    developmentHud.dispose();
    developmentControls.dispose();
    developmentPresentation.dispose();
    researchScreen.dispose();
    productionScreens.dispose();
    shipUpgradesScreen.dispose();
    application.dispose();
    spaceMapUi.dispose();
    spaceMapNavigation.dispose();
  }, { once: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushAutosave();
  });

  botAutomation.request();
  setStatus(startupStatus);
  document.documentElement.dataset.appReady = 'true';
}

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown startup error';
  const status = document.querySelector<HTMLElement>('#app-status');
  if (status !== null) status.textContent = `Ошибка запуска: ${message}`;
  console.error('[stellar-empires] startup failed', error);
});
