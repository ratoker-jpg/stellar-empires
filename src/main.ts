import './styles/designTokens.css';
import './styles/main.css';
import './styles/factions.css';
import './styles/factionTheme.css';
import './styles/uiPrimitives.css';
import './styles/newGame.css';
import './styles/campaignTime.css';
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
import './styles/operationsRoutes.css';
import './styles/logistics.css';
import './styles/market.css';
import './styles/saveManager.css';
import './styles/research.css';
import './styles/production.css';
import './styles/missions.css';
import './styles/empire.css';
import './styles/globalHud.css';
import './styles/commandDoctrine.css';
import './styles/fleetDoctrine.css';
import './styles/commandSystemRoutes.css';
import { bindFactionRuntimeAssets } from './assets/bindFactionRuntimeAssets';
import { createGame, updateGamePresentation } from './game/createGame';
import {
  createBrowserSpaceMapNavigationEnvironment,
  parseSpaceMapRoute,
  SpaceMapNavigationController,
} from './navigation/spaceMapRoute';
import { bootstrapRestoredCampaign, shouldShowCampaignCatchUp } from './runtime/campaignBootstrap';
import { CampaignClockController } from './runtime/CampaignClockController';
import {
  E2E_DEFAULT_CAMPAIGN_SEED_SOURCE,
  readE2eInteractiveNewGameConfig,
} from './runtime/e2eCampaignLifecycle';
import { GameApplicationController } from './runtime/GameApplicationController';
import {
  E2E_RUNTIME_ENABLED,
  prepareE2eState,
  updateE2eRuntimeDiagnostics,
} from './runtime/e2eScenario';
import {
  createCampaignSettings,
  DEFAULT_CAMPAIGN_CREATED_AT_REAL,
  formatProgressionProfile,
  formatWorldSpeed,
} from './simulation/campaign/settings';
import { createInitialGameState } from './simulation/createInitialGameState';
import type { GameState } from './simulation/types';
import {
  AutoSaveController,
  type AutoSaveStatus,
} from './storage/AutoSaveController';
import {
  activateManualCampaign,
  resetCampaignAuthority,
} from './storage/campaignLifecycle';
import { IndexedDbSaveRepository } from './storage/IndexedDbSaveRepository';
import { loadAutosave } from './storage/loadAutosave';
import { createCampaignRuntimeMetadata } from './storage/runtimeMetadata';
import { SaveManager } from './storage/SaveManager';
import type { CampaignRuntimeMetadata } from './storage/types';
import { mountAccessibilityRuntime } from './ui/accessibilityRuntime';
import {
  AppShellController,
  createBrowserAppShellEnvironment,
} from './ui/appShellController';
import type {
  CommandShellMode,
  FleetShellMode,
  OperationsShellMode,
  PlanetDevelopmentSurface,
  PlanetShellMode,
  ReportShellFilter,
  SystemShellMode,
} from './ui/appShellRoute';
import {
  mountCampaignCatchUpProgress,
  showCampaignReturnSummary,
} from './ui/campaignCatchUpUi';
import { mountCommandRankingScreen } from './ui/commandRankingScreen';
import { mountCommandWorkspace } from './ui/commandWorkspace';
import { mountDevelopmentPresentation } from './ui/developmentPresentation';
import { mountDevelopmentWorkspaceRouter } from './ui/developmentWorkspaceRouter';
import { mountEmpireOverview } from './ui/empireOverview';
import { applyFactionShellIdentity } from './ui/factionShellIdentity';
import { mountFleetOperationsWorkspace } from './ui/fleetOperationsWorkspace';
import { mountGlobalHud, type GlobalHudMount } from './ui/globalHud';
import { selectNewGameCampaign } from './ui/newGameFactionPicker';
import { mountOperationsWorkspace } from './ui/operationsWorkspace';
import { mountPlanetDevelopmentControls } from './ui/planetDevelopmentControls';
import {
  applyPlanetScreenState,
  getPlanetScreenActivePlanetId,
  mountPlanetScreen,
  selectPlanetScreenPlanet,
} from './ui/planetScreen';
import { mountProductionScreens } from './ui/productionScreen';
import { mountReportsWorkspace } from './ui/reportsWorkspace';
import { mountResearchScreen } from './ui/researchScreen';
import { mountSaveManager } from './ui/saveManager';
import { mountShellContextPanel, type ShellContextPanelMount } from './ui/shellContextPanel';
import { mountShipUpgradesScreen } from './ui/shipUpgradesScreen';
import { mountSpaceMapNavigation } from './ui/spaceMapNavigation';
import {
  applyClientPresentationSettings,
  mountSystemWorkspace,
  readClientPresentationSettings,
} from './ui/systemWorkspace';

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`Required element not found: ${selector}`);
  return element;
}

function setStatus(message: string): void {
  requireElement<HTMLElement>('#app-status').textContent = message;
}

const hudRef: { current?: GlobalHudMount } = {};
const contextRef: { current?: ShellContextPanelMount } = {};

function writeAutoSaveStatus(status: AutoSaveStatus): void {
  hudRef.current?.setAutoSaveStatus(status);
  contextRef.current?.setAutoSaveStatus(status);
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

function createRuntimeRealTimeSource(): { nowMs(): number } {
  if (!E2E_RUNTIME_ENABLED) return { nowMs: () => Date.now() };
  const base = Date.parse(DEFAULT_CAMPAIGN_CREATED_AT_REAL);
  return {
    nowMs: () => base + Number(
      document.documentElement.dataset.e2eClockOffsetMilliseconds ?? 0,
    ),
  };
}

async function createFreshGame(statusPrefix = 'Новая партия'): Promise<{
  readonly state: GameState;
  readonly runtimeMetadata: CampaignRuntimeMetadata;
  readonly status: string;
}> {
  const interactiveE2e = E2E_RUNTIME_ENABLED
    ? readE2eInteractiveNewGameConfig()
    : { enabled: false as const };
  let seedSource: string | number;
  let selection: Awaited<ReturnType<typeof selectNewGameCampaign>>;
  if (E2E_RUNTIME_ENABLED && !interactiveE2e.enabled) {
    seedSource = E2E_DEFAULT_CAMPAIGN_SEED_SOURCE;
    selection = {
      faction: 'aegis',
      seed: 0,
      campaignSettings: createCampaignSettings({
        scenarioPreset: 'campaign',
        worldSpeed: 1,
        createdAtReal: DEFAULT_CAMPAIGN_CREATED_AT_REAL,
      }),
    };
  } else {
    if (E2E_RUNTIME_ENABLED && interactiveE2e.seed === undefined) {
      throw new Error('interactiveNewGame=1 requires a valid uint32 campaignSeed.');
    }
    const fixedSeed = interactiveE2e.seed;
    selection = await selectNewGameCampaign(fixedSeed === undefined ? {} : {
      initialSeed: fixedSeed,
      suggestSeed: () => fixedSeed,
    });
    seedSource = selection.seed;
  }
  const state = prepareE2eState(createInitialGameState(seedSource, {
    playerFaction: selection.faction,
    campaignSettings: selection.campaignSettings,
  }));
  return {
    state,
    runtimeMetadata: createCampaignRuntimeMetadata(selection.campaignSettings.createdAtReal),
    status: `${statusPrefix} · ${selection.faction.toUpperCase()} · ${formatWorldSpeed(selection.campaignSettings.worldSpeed)} · ${formatProgressionProfile(selection.campaignSettings.progressionProfile)} · seed ${state.seed}`,
  };
}

async function bootstrap(): Promise<void> {
  const version = requireElement<HTMLElement>('#build-version');
  const systemCount = requireElement<HTMLElement>('#system-count');
  const repository = new IndexedDbSaveRepository();
  const realTimeSource = createRuntimeRealTimeSource();
  let initialState: GameState;
  let initialRuntimeMetadata: CampaignRuntimeMetadata;
  let startupStatus: string;
  let autosave: AutoSaveController | undefined;
  let saveManager: SaveManager | undefined;

  try {
    const restored = await loadAutosave(repository);
    if (restored.status === 'loaded') {
      const catchUpUi = shouldShowCampaignCatchUp(
        restored.runtimeMetadata,
        realTimeSource.nowMs(),
      )
        ? mountCampaignCatchUpProgress()
        : undefined;
      try {
        const caughtUp = await bootstrapRestoredCampaign({
          repository,
          state: restored.state,
          runtimeMetadata: restored.runtimeMetadata,
          realTimeSource,
          operationBudget: 256,
          onProgress: (progress) => catchUpUi?.update(progress),
          yieldControl: () => new Promise((resolve) => setTimeout(resolve, 0)),
        });
        initialState = prepareE2eState(caughtUp.state);
        initialRuntimeMetadata = caughtUp.runtimeMetadata;
      } finally {
        catchUpUi?.dispose();
      }
      const speed = formatWorldSpeed(initialState.campaignSettings.worldSpeed);
      const progressionProfile = formatProgressionProfile(initialState.campaignSettings.progressionProfile);
      startupStatus = restored.source === 'snapshot'
        ? `Партия восстановлена из резерва · ${speed} · ${progressionProfile} · seed ${initialState.seed}`
        : `Партия восстановлена · ${speed} · ${progressionProfile} · seed ${initialState.seed}`;
    } else {
      if (restored.status === 'invalid') {
        console.warn('[stellar-empires] invalid autosave', restored.code, restored.message);
      }
      const fresh = await createFreshGame(
        restored.status === 'invalid' ? 'Сохранения повреждены · новая партия' : 'Новая партия',
      );
      initialState = fresh.state;
      initialRuntimeMetadata = fresh.runtimeMetadata;
      startupStatus = fresh.status;
    }
    saveManager = new SaveManager(repository);
    autosave = new AutoSaveController(repository, {
      runtimeMetadata: initialRuntimeMetadata,
      onStatus: writeAutoSaveStatus,
      now: () => new Date(realTimeSource.nowMs()).toISOString(),
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'CampaignBootstrapError') throw error;
    console.error('[stellar-empires] persistence unavailable', error);
    const fresh = await createFreshGame('Локальное хранилище недоступно · новая партия');
    initialState = fresh.state;
    initialRuntimeMetadata = fresh.runtimeMetadata;
    startupStatus = fresh.status;
  }

  let runtimeMetadata = initialRuntimeMetadata;
  let autosaveRequestsBlocked = false;
  const requestAutosave = (state: GameState, metadata = runtimeMetadata): void => {
    if (!autosaveRequestsBlocked) autosave?.request(state, metadata);
  };
  const stageAutosave = (state: GameState, metadata = runtimeMetadata): void => {
    if (!autosaveRequestsBlocked) autosave?.stage(state, metadata);
  };
  const flushAutosaveWriter = async (): Promise<void> => {
    if (!autosaveRequestsBlocked) await autosave?.flush();
  };
  const quiesceOldWriter = async (): Promise<void> => {
    if (autosave === undefined) throw new Error('Autosave controller is unavailable.');
    autosaveRequestsBlocked = true;
    try {
      await autosave.flushOrThrow();
      await autosave.dispose();
    } catch (error: unknown) {
      autosaveRequestsBlocked = false;
      throw error;
    }
  };
  const recoverAfterSwitchFailure = (error: unknown): never => {
    if (autosaveRequestsBlocked) {
      window.location.reload();
      throw error;
    }
    throw error;
  };
  const resetActiveCampaign = async (): Promise<void> => {
    if (saveManager === undefined) throw new Error('Save manager is unavailable.');
    try {
      await resetCampaignAuthority({ manager: saveManager, quiesceOldWriter });
      window.location.reload();
    } catch (error: unknown) {
      recoverAfterSwitchFailure(error);
    }
  };
  const activateSaveSlot = async (slotId: string): Promise<void> => {
    if (saveManager === undefined) throw new Error('Save manager is unavailable.');
    try {
      await activateManualCampaign(slotId, { manager: saveManager, quiesceOldWriter });
      window.location.reload();
    } catch (error: unknown) {
      recoverAfterSwitchFailure(error);
    }
  };

  const playerFaction = initialState.planets.find(
    (planet) => planet.ownerEmpireId === 'player',
  )?.factionId ?? 'aegis';
  bindFactionRuntimeAssets(playerFaction);
  applyFactionShellIdentity(playerFaction);
  version.textContent = `v${__APP_VERSION__}`;
  systemCount.textContent = String(initialState.galaxy.systems.length);
  applyClientPresentationSettings(readClientPresentationSettings());
  const disposeAccessibility = mountAccessibilityRuntime();

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
      if (source !== 'clock') requestAutosave(state);
    },
  });

  const spaceMapNavigation = new SpaceMapNavigationController(
    createBrowserSpaceMapNavigationEnvironment(),
    () => application.getState().universe,
  );
  const game = createGame('phaser-game', initialState, spaceMapNavigation);
  gameRef.current = game;
  const spaceMapUi = mountSpaceMapNavigation(spaceMapNavigation, () => application.getState());
  spaceMapUiRef.current = spaceMapUi;
  updateE2eRuntimeDiagnostics(initialState);

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
  const globalHud = mountGlobalHud({
    getState: () => application.getState(),
    getActivePlanetId: () => application.getActivePlanetId(),
  });
  hudRef.current = globalHud;
  const shellContext = mountShellContextPanel({
    getState: () => application.getState(),
    getActivePlanetId: () => application.getActivePlanetId(),
  });
  contextRef.current = shellContext;
  const developmentPresentation = mountDevelopmentPresentation({
    getState: () => application.getState(),
    getActivePlanetId: () => application.getActivePlanetId(),
  });

  const appShellRef: { current?: AppShellController } = {};
  const developmentRouter = mountDevelopmentWorkspaceRouter({
    getState: () => application.getState(),
    getActivePlanetId: () => application.getActivePlanetId(),
    navigateToResearch: () => appShellRef.current?.navigateToResearch(),
    navigateToSurface: (mode, surface) => {
      appShellRef.current?.navigateToPlanet(application.getActivePlanetId(), mode, surface);
    },
  });
  const fleetWorkspace = mountFleetOperationsWorkspace({
    ...commandBridge,
    navigateToMode: (mode) => appShellRef.current?.navigateToFleets(mode),
  });
  const operationsWorkspace = mountOperationsWorkspace({
    ...commandBridge,
    navigateToMode: (mode) => appShellRef.current?.navigateToOperations(mode),
  });
  const reportsWorkspace = mountReportsWorkspace({
    getState: () => application.getState(),
    navigateToFilter: (filter) => appShellRef.current?.navigateToReports(filter),
    navigateToCoordinate: (coordinate) => {
      spaceMapNavigation.navigate({ level: 'solar-system', ...coordinate });
      appShellRef.current?.navigateToSpace();
      spaceMapUi.refresh();
    },
  });
  const empireOverview = mountEmpireOverview({
    getState: () => application.getState(),
    getActivePlanetId: () => application.getActivePlanetId(),
    selectPlanet: (planetId) => appShellRef.current?.navigateToPlanet(planetId),
  });
  const commandWorkspace = mountCommandWorkspace({
    ...commandBridge,
    overview: empireOverview,
    navigateToMode: (mode) => appShellRef.current?.navigateToCommand(mode),
    navigateToPlanetUpgrades: () => appShellRef.current?.navigateToPlanet(
      application.getActivePlanetId(),
      'industry',
      'upgrades',
    ),
  });
  const rankingWorkspace = mountCommandRankingScreen({ getState: () => application.getState() });
  const saveWorkspace = mountSaveManager({
    manager: saveManager,
    getState: () => application.getState(),
    getRuntimeMetadata: () => runtimeMetadata,
    writeStatus: setStatus,
    onNewCampaign: resetActiveCampaign,
    onActivateSlot: activateSaveSlot,
  });
  const systemWorkspace = mountSystemWorkspace({
    saves: saveWorkspace,
    getState: () => application.getState(),
    navigateToMode: (mode) => appShellRef.current?.navigateToSystem(mode),
  });

  const primaryViewIds = [
    '#galaxy-view',
    '#planet-view',
    '#research-view',
    '#fleets-view',
    '#operations-view',
    '#command-view',
    '#ranking-view',
    '#reports-view',
    '#system-view',
  ] as const;
  const hidePrimaryViews = (): void => {
    for (const selector of primaryViewIds) requireElement<HTMLElement>(selector).hidden = true;
  };
  const deactivateRoutedScreens = (): void => {
    researchScreen.deactivate();
    productionScreens.deactivate();
    shipUpgradesScreen.deactivate();
    fleetWorkspace.deactivate();
    operationsWorkspace.deactivate();
    commandWorkspace.deactivate();
    rankingWorkspace.deactivate();
    reportsWorkspace.deactivate();
    systemWorkspace.deactivate();
  };
  const activatePlanet = (
    planetId: string,
    mode: PlanetShellMode,
    surface: PlanetDevelopmentSurface,
  ): void => {
    hidePrimaryViews();
    deactivateRoutedScreens();
    requireElement<HTMLElement>('#planet-view').hidden = false;
    requireElement<HTMLElement>('.game-layout').classList.add('is-planet-view');
    selectPlanetScreenPlanet(planetId, false);
    requireElement<HTMLButtonElement>(`[data-planet-mode="${mode}"]`).click();
    developmentRouter.activate(mode, surface);
    if (surface === 'shipyard') productionScreens.activate('ship');
    if (surface === 'defense') productionScreens.activate('defense');
    if (surface === 'upgrades') shipUpgradesScreen.activate();
    developmentPresentation.refresh();
  };
  const activateSpace = (): void => {
    hidePrimaryViews();
    deactivateRoutedScreens();
    requireElement<HTMLElement>('#galaxy-view').hidden = false;
    requireElement<HTMLElement>('.game-layout').classList.remove('is-planet-view');
    const parsed = parseSpaceMapRoute(window.location.hash, application.getState().universe);
    spaceMapNavigation.navigate(parsed.route, 'replace');
  };
  const activateResearch = (): void => {
    hidePrimaryViews();
    deactivateRoutedScreens();
    requireElement<HTMLElement>('.game-layout').classList.remove('is-planet-view');
    researchScreen.activate();
    developmentPresentation.refresh();
  };
  const activateFleets = (mode: FleetShellMode): void => {
    hidePrimaryViews();
    deactivateRoutedScreens();
    requireElement<HTMLElement>('#fleets-view').hidden = false;
    requireElement<HTMLElement>('.game-layout').classList.remove('is-planet-view');
    fleetWorkspace.activate(mode);
  };
  const activateOperations = (mode: OperationsShellMode): void => {
    hidePrimaryViews();
    deactivateRoutedScreens();
    requireElement<HTMLElement>('#operations-view').hidden = false;
    requireElement<HTMLElement>('.game-layout').classList.remove('is-planet-view');
    operationsWorkspace.activate(mode);
  };
  const activateCommand = (mode: CommandShellMode): void => {
    hidePrimaryViews();
    deactivateRoutedScreens();
    requireElement<HTMLElement>('#command-view').hidden = false;
    requireElement<HTMLElement>('.game-layout').classList.remove('is-planet-view');
    commandWorkspace.activate(mode);
  };
  const activateRanking = (): void => {
    hidePrimaryViews();
    deactivateRoutedScreens();
    requireElement<HTMLElement>('#ranking-view').hidden = false;
    requireElement<HTMLElement>('.game-layout').classList.remove('is-planet-view');
    rankingWorkspace.activate();
  };
  const activateReports = (filter: ReportShellFilter): void => {
    hidePrimaryViews();
    deactivateRoutedScreens();
    requireElement<HTMLElement>('#reports-view').hidden = false;
    requireElement<HTMLElement>('.game-layout').classList.remove('is-planet-view');
    reportsWorkspace.activate(filter);
  };
  const activateSystem = (mode: SystemShellMode): void => {
    hidePrimaryViews();
    deactivateRoutedScreens();
    requireElement<HTMLElement>('#system-view').hidden = false;
    requireElement<HTMLElement>('.game-layout').classList.remove('is-planet-view');
    systemWorkspace.activate(mode);
  };

  const appShell = new AppShellController(createBrowserAppShellEnvironment(), {
    getState: () => application.getState(),
    getActivePlanetId: () => application.getActivePlanetId(),
    selectActivePlanet: (planetId) => application.selectActivePlanet(planetId, false),
    activatePlanet,
    activateSpace,
    activateResearch,
    activateFleets,
    activateOperations,
    activateCommand,
    activateRanking,
    activateReports,
    activateSystem,
    writeStatus: setStatus,
  });
  appShellRef.current = appShell;
  const shellRouteSubscription = appShell.subscribe((snapshot) => shellContext.refresh(snapshot));

  const applicationSubscription = application.subscribe(() => {
    globalHud.refresh();
    developmentControls.refresh();
    researchScreen.refresh();
    productionScreens.refresh();
    shipUpgradesScreen.refresh();
    developmentRouter.refresh();
    developmentPresentation.refresh();
    fleetWorkspace.refresh();
    operationsWorkspace.refresh();
    commandWorkspace.refresh();
    rankingWorkspace.refresh();
    reportsWorkspace.refresh();
    systemWorkspace.refresh();
    shellContext.refresh(appShell.snapshot);
  });

  const campaignClock = new CampaignClockController({
    getState: () => application.getState(),
    getRuntimeMetadata: () => runtimeMetadata,
    realTimeSource,
    applyCheckpoint: (checkpoint, saveRequested) => {
      runtimeMetadata = checkpoint.runtimeMetadata;
      stageAutosave(checkpoint.state, runtimeMetadata);
      if (checkpoint.state !== application.getState()) {
        application.applyState(checkpoint.state, 'clock', '');
      }
      if (saveRequested) requestAutosave(application.getState(), runtimeMetadata);
    },
    onDiagnostic: (diagnostic) => {
      if (diagnostic === 'clock-rollback') {
        console.warn('[stellar-empires] system clock moved behind processed campaign cursor');
      }
    },
    onError: (error) => {
      console.error('[stellar-empires] campaign clock failed', error);
      setStatus('Ошибка синхронизации времени кампании');
    },
  });

  const acknowledgeReturnSummary = async (): Promise<void> => {
    const { pendingReturnSummary: _pendingReturnSummary, ...nextRuntimeMetadata } = runtimeMetadata;
    runtimeMetadata = nextRuntimeMetadata;
    if (autosaveRequestsBlocked) return;
    autosave?.setRuntimeMetadata(runtimeMetadata);
    requestAutosave(application.getState(), runtimeMetadata);
    await flushAutosaveWriter();
  };
  if (runtimeMetadata.pendingReturnSummary !== undefined) {
    showCampaignReturnSummary(runtimeMetadata.pendingReturnSummary, acknowledgeReturnSummary);
  }

  const flushAutosave = (): void => {
    if (autosaveRequestsBlocked) return;
    requestAutosave(application.getState(), runtimeMetadata);
    void flushAutosaveWriter();
  };
  window.addEventListener('pagehide', flushAutosave);
  window.addEventListener('beforeunload', () => {
    campaignClock.dispose();
    applicationSubscription();
    shellRouteSubscription();
    appShell.dispose();
    developmentRouter.dispose();
    globalHud.dispose();
    shellContext.dispose();
    developmentControls.dispose();
    developmentPresentation.dispose();
    researchScreen.dispose();
    productionScreens.dispose();
    shipUpgradesScreen.dispose();
    fleetWorkspace.dispose();
    operationsWorkspace.dispose();
    commandWorkspace.dispose();
    rankingWorkspace.dispose();
    reportsWorkspace.dispose();
    systemWorkspace.dispose();
    application.dispose();
    spaceMapUi.dispose();
    spaceMapNavigation.dispose();
    disposeAccessibility();
    hudRef.current = undefined;
    contextRef.current = undefined;
  }, { once: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushAutosave();
  });

  campaignClock.start();
  setStatus(startupStatus);
  globalHud.refresh();
  shellContext.refresh(appShell.snapshot);
  document.documentElement.dataset.appReady = 'true';
}

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown startup error';
  const status = document.querySelector<HTMLElement>('#app-status');
  if (status !== null) status.textContent = `Ошибка запуска: ${message}`;
  console.error('[stellar-empires] startup failed', error);
});
