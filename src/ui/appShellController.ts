import '../styles/navigationHierarchy.css';
import type { GameState } from '../simulation/types';
import {
  parseAppShellRoute,
  serializeAppShellRoute,
  type AppShellRoute,
  type CommandShellMode,
  type FleetShellMode,
  type OperationsShellMode,
  type PlanetDevelopmentSurface,
  type PlanetShellMode,
  type ReportShellFilter,
  type SystemShellMode,
} from './appShellRoute';
import {
  SHELL_NAVIGATION_GROUPS,
  SHELL_SCREEN_REGISTRY,
  validateScreenRegistry,
  type ShellNavigationGroupDefinition,
  type ShellRouteFamily,
  type ShellScreenDefinition,
} from './screenRegistry';
import {
  createBrowserShellNavigationStore,
  createMemoryShellNavigationStore,
  createShellBreadcrumbs,
  getShellRouteDisplayName,
  normalizeShellRoute,
  ShellNavigationContextModel,
  type ShellBreadcrumbEntry,
  type ShellNavigationMemoryStore,
  type ShellNavigationNormalizationCode,
} from './shellNavigationContext';

export interface AppShellEnvironment {
  readHash(): string;
  pushHash(hash: string): void;
  replaceHash(hash: string): void;
  subscribe(listener: () => void): () => void;
}

export interface AppShellControllerOptions {
  readonly getState: () => GameState;
  readonly getActivePlanetId: () => string;
  readonly selectActivePlanet: (planetId: string) => boolean;
  readonly activatePlanet: (
    planetId: string,
    mode: PlanetShellMode,
    surface: PlanetDevelopmentSurface,
  ) => void;
  readonly activateSpace: () => void;
  readonly activateResearch: () => void;
  readonly activateFleets: (mode: FleetShellMode) => void;
  readonly activateOperations: (mode: OperationsShellMode) => void;
  readonly activateCommand: (mode: CommandShellMode) => void;
  readonly activateRanking: () => void;
  readonly activateReports: (filter: ReportShellFilter) => void;
  readonly activateSystem: (mode: SystemShellMode) => void;
  readonly writeStatus?: (message: string) => void;
  readonly registry?: readonly ShellScreenDefinition[];
  readonly navigationGroups?: readonly ShellNavigationGroupDefinition[];
  readonly navigationStore?: ShellNavigationMemoryStore;
}

export interface AppShellSnapshot {
  readonly route: AppShellRoute;
  readonly error: string | null;
  readonly normalizationCode: ShellNavigationNormalizationCode | null;
  readonly breadcrumbs: readonly ShellBreadcrumbEntry[];
  readonly returnRoute: AppShellRoute | null;
}

export function createBrowserAppShellEnvironment(browserWindow: Window = window): AppShellEnvironment {
  return {
    readHash: () => browserWindow.location.hash,
    pushHash: (hash) => browserWindow.history.pushState(null, '', hash),
    replaceHash: (hash) => browserWindow.history.replaceState(null, '', hash),
    subscribe: (listener) => {
      const handle = (): void => listener();
      browserWindow.addEventListener('popstate', handle);
      browserWindow.addEventListener('hashchange', handle);
      return () => {
        browserWindow.removeEventListener('popstate', handle);
        browserWindow.removeEventListener('hashchange', handle);
      };
    },
  };
}

function defaultNavigationStore(): ShellNavigationMemoryStore {
  try {
    return createBrowserShellNavigationStore();
  } catch {
    return createMemoryShellNavigationStore();
  }
}

function createNavigationButton(definition: ShellScreenDefinition): HTMLButtonElement {
  const button = document.createElement('button');
  button.id = definition.elementId;
  button.className = `rail-button rail-button--${definition.group}`;
  button.type = 'button';
  button.setAttribute('aria-label', definition.ariaLabel);
  button.dataset.shellScreen = definition.id;
  button.dataset.shellScreenKind = definition.kind;
  button.dataset.shellNavigationGroup = definition.group;
  const icon = document.createElement('span');
  icon.className = 'rail-button__icon';
  icon.textContent = definition.icon;
  const label = document.createElement('small');
  label.textContent = definition.label;
  button.append(icon, label);
  if (definition.badgeId !== undefined) {
    const badge = document.createElement('span');
    badge.id = definition.badgeId;
    badge.className = 'rail-button__badge';
    badge.hidden = true;
    badge.setAttribute('aria-label', `${definition.label}: нет новых событий`);
    button.append(badge);
  }
  return button;
}

function createNavigationGroup(
  group: ShellNavigationGroupDefinition,
): { readonly root: HTMLElement; readonly items: HTMLElement } {
  const root = document.createElement('section');
  root.className = `rail-group rail-group--${group.id}${group.compact ? ' rail-group--compact' : ''}`;
  root.dataset.navigationGroup = group.id;
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', group.ariaLabel);

  const label = document.createElement('span');
  label.className = 'rail-group__label';
  label.textContent = group.label;
  label.title = group.ariaLabel;

  const items = document.createElement('div');
  items.className = 'rail-group__items';
  root.append(label, items);
  return { root, items };
}

function routeWorkspaceSelector(route: AppShellRoute): string {
  switch (route.family) {
    case 'planet': return '#planet-view';
    case 'space': return '#galaxy-view';
    case 'research': return '#research-view';
    case 'fleets': return '#fleets-view';
    case 'operations': return '#operations-view';
    case 'command': return '#command-view';
    case 'ranking': return '#ranking-view';
    case 'reports': return '#reports-view';
    case 'system': return '#system-view';
  }
}

function normalizationCodeForError(error: string | null): ShellNavigationNormalizationCode | null {
  if (error === null) return null;
  if (error.includes('Колония')) return 'STALE_COLONY_CONTEXT';
  if (error.includes('Локальный экран')) return 'INVALID_LOCAL_SURFACE';
  return 'INVALID_FAMILY_MODE';
}

export class AppShellController {
  readonly #environment: AppShellEnvironment;
  readonly #options: AppShellControllerOptions;
  readonly #registry: readonly ShellScreenDefinition[];
  readonly #navigationGroups: readonly ShellNavigationGroupDefinition[];
  readonly #navigationContext: ShellNavigationContextModel;
  readonly #listeners = new Set<(snapshot: AppShellSnapshot) => void>();
  readonly #unsubscribeEnvironment: () => void;
  readonly #cleanup: Array<() => void> = [];
  #snapshot: AppShellSnapshot;
  #applyingRoute = false;

  public constructor(environment: AppShellEnvironment, options: AppShellControllerOptions) {
    this.#environment = environment;
    this.#options = options;
    this.#registry = [...(options.registry ?? SHELL_SCREEN_REGISTRY)].sort(
      (left, right) => left.order - right.order,
    );
    this.#navigationGroups = [...(options.navigationGroups ?? SHELL_NAVIGATION_GROUPS)].sort(
      (left, right) => left.order - right.order,
    );
    const registryErrors = validateScreenRegistry(this.#registry, this.#navigationGroups);
    if (registryErrors.length > 0) throw new Error(registryErrors.join('\n'));

    const state = options.getState();
    this.#navigationContext = new ShellNavigationContextModel(
      state,
      options.getActivePlanetId(),
      options.navigationStore ?? defaultNavigationStore(),
    );
    options.selectActivePlanet(this.#navigationContext.restoreActivePlanet(state));
    this.renderNavigation();

    const parsed = parseAppShellRoute(
      environment.readHash(),
      state,
      options.getActivePlanetId(),
    );
    const normalizationCode = normalizationCodeForError(parsed.error);
    this.#snapshot = this.createSnapshot(parsed.route, parsed.error, normalizationCode);
    this.bindPlanetRouteSync();
    this.bindActivePlanetSelectors();
    if (environment.readHash() !== parsed.canonicalHash || parsed.error !== null) {
      environment.replaceHash(parsed.canonicalHash);
    }
    this.#unsubscribeEnvironment = environment.subscribe(() => this.syncFromUrl());
    this.activate(parsed.route, parsed.error, normalizationCode, null);
  }

  public get snapshot(): AppShellSnapshot {
    this.reconcileState();
    return this.#snapshot;
  }

  public subscribe(listener: (snapshot: AppShellSnapshot) => void): () => void {
    this.#listeners.add(listener);
    listener(this.#snapshot);
    return () => this.#listeners.delete(listener);
  }

  public navigate(
    route: AppShellRoute,
    mode: 'push' | 'replace' = 'push',
    error: string | null = null,
    normalizationCode: ShellNavigationNormalizationCode | null = null,
  ): void {
    const hash = serializeAppShellRoute(route);
    if (this.#environment.readHash() === hash) {
      this.activate(route, error, normalizationCode, this.#snapshot.route);
      return;
    }
    if (mode === 'replace') this.#environment.replaceHash(hash);
    else this.#environment.pushHash(hash);
    this.activate(route, error, normalizationCode, this.#snapshot.route);
  }

  public navigateToFamily(
    family: ShellRouteFamily,
    historyMode: 'push' | 'replace' = 'push',
  ): void {
    const restored = this.#navigationContext.routeForFamily(family, this.#options.getState());
    this.navigate(restored.route, historyMode, restored.message, restored.code);
  }

  public navigateToPlanet(
    planetId = this.#options.getActivePlanetId(),
    mode: PlanetShellMode = 'overview',
    surface: PlanetDevelopmentSurface = 'zone',
    historyMode: 'push' | 'replace' = 'push',
  ): void {
    this.navigate({ family: 'planet', planetId, mode, surface }, historyMode);
  }

  public navigateToSpace(historyMode: 'push' | 'replace' = 'push'): void {
    this.navigateToFamily('space', historyMode);
  }

  public navigateToResearch(historyMode: 'push' | 'replace' = 'push'): void {
    this.navigate({ family: 'research' }, historyMode);
  }

  public navigateToFleets(
    mode: FleetShellMode = 'overview',
    historyMode: 'push' | 'replace' = 'push',
  ): void {
    this.navigate({ family: 'fleets', mode }, historyMode);
  }

  public navigateToOperations(
    mode: OperationsShellMode = 'overview',
    historyMode: 'push' | 'replace' = 'push',
  ): void {
    this.navigate({ family: 'operations', mode }, historyMode);
  }

  public navigateToCommand(
    mode: CommandShellMode = 'overview',
    historyMode: 'push' | 'replace' = 'push',
  ): void {
    this.navigate({ family: 'command', mode }, historyMode);
  }

  public navigateToRanking(historyMode: 'push' | 'replace' = 'push'): void {
    this.navigate({ family: 'ranking' }, historyMode);
  }

  public navigateToReports(
    filter: ReportShellFilter = 'all',
    historyMode: 'push' | 'replace' = 'push',
  ): void {
    this.navigate({ family: 'reports', filter }, historyMode);
  }

  public navigateToSystem(
    mode: SystemShellMode = 'saves',
    historyMode: 'push' | 'replace' = 'push',
  ): void {
    this.navigate({ family: 'system', mode }, historyMode);
  }

  public reconcileState(): void {
    if (this.#applyingRoute) return;
    const state = this.#options.getState();
    const previousActivePlanetId = this.#options.getActivePlanetId();
    const activePlanetId = this.#navigationContext.restoreActivePlanet(state);
    this.#options.selectActivePlanet(activePlanetId);
    const contextChanges = this.#navigationContext.reconcile(state);
    const normalized = normalizeShellRoute(
      serializeAppShellRoute(this.#snapshot.route),
      this.#snapshot.route.family,
      state,
      activePlanetId,
    );
    if (
      normalized.code !== null ||
      serializeAppShellRoute(normalized.route) !== serializeAppShellRoute(this.#snapshot.route)
    ) {
      this.navigate(normalized.route, 'replace', normalized.message, normalized.code);
      return;
    }
    if (previousActivePlanetId === activePlanetId && contextChanges.length === 0) return;
    const firstChange = contextChanges[0];
    this.#snapshot = this.createSnapshot(
      this.#snapshot.route,
      firstChange?.message ?? null,
      firstChange?.code ?? null,
    );
    this.renderBreadcrumbs(this.#snapshot);
    if (firstChange?.message !== null && firstChange?.message !== undefined) {
      this.#options.writeStatus?.(firstChange.message);
    }
    this.emit();
  }

  public reconcileNavigationMetadata(): void {
    const definitionsByElement = new Map(
      this.#registry.map((definition) => [definition.elementId, definition] as const),
    );
    for (const button of document.querySelectorAll<HTMLButtonElement>('.side-rail .rail-button')) {
      const definition = definitionsByElement.get(button.id);
      if (definition === undefined) continue;
      button.dataset.shellScreen = definition.id;
      button.dataset.shellScreenKind = definition.kind;
      button.dataset.shellNavigationGroup = definition.group;
    }
    this.updateNavigationState(this.#snapshot.route);
    this.renderBreadcrumbs(this.#snapshot);
  }

  public dispose(): void {
    this.#unsubscribeEnvironment();
    for (const cleanup of this.#cleanup.splice(0)) cleanup();
    this.#listeners.clear();
  }

  private createSnapshot(
    route: AppShellRoute,
    error: string | null,
    normalizationCode: ShellNavigationNormalizationCode | null,
  ): AppShellSnapshot {
    const state = this.#options.getState();
    return {
      route,
      error,
      normalizationCode,
      breadcrumbs: createShellBreadcrumbs(route, state),
      returnRoute: this.#navigationContext.getReturnRoute(state, route),
    };
  }

  private renderNavigation(): void {
    const rail = document.querySelector<HTMLElement>('.side-rail');
    if (rail === null) throw new Error('Primary navigation rail is missing.');
    rail.replaceChildren();
    for (const group of this.#navigationGroups) {
      const entries = this.#registry.filter((definition) => definition.group === group.id);
      if (entries.length === 0) continue;
      const renderedGroup = createNavigationGroup(group);
      for (const definition of entries) {
        const button = createNavigationButton(definition);
        const onClick = (event: MouseEvent): void => {
          event.preventDefault();
          event.stopImmediatePropagation();
          this.navigateToFamily(definition.routeFamily);
        };
        button.addEventListener('click', onClick);
        this.#cleanup.push(() => button.removeEventListener('click', onClick));
        renderedGroup.items.append(button);
      }
      rail.append(renderedGroup.root);
    }
  }

  private renderBreadcrumbs(snapshot: AppShellSnapshot): void {
    const hosts = document.querySelectorAll<HTMLElement>('[data-shell-breadcrumbs-host]');
    if (hosts.length === 0) return;
    for (const host of hosts) {
      // Только один хост видим одновременно (панель контекста либо планетарный
      // экран); return-действие рендерится исключительно в видимый хост, чтобы
      // [data-shell-return] оставался уникальным в документе (UI-01).
      const hostVisible = host.getClientRects().length > 0;
      host.replaceChildren();
      const trail = document.createElement('div');
      trail.className = 'shell-breadcrumbs__trail';
      for (const [index, entry] of snapshot.breadcrumbs.entries()) {
        if (index > 0) {
          const separator = document.createElement('span');
          separator.className = 'shell-breadcrumbs__separator';
          separator.textContent = '›';
          separator.setAttribute('aria-hidden', 'true');
          trail.append(separator);
        }
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = entry.label;
        button.dataset.breadcrumbId = entry.id;
        button.disabled = entry.current;
        if (entry.current) button.setAttribute('aria-current', 'page');
        else button.addEventListener('click', () => this.navigate(entry.route));
        trail.append(button);
      }
      host.append(trail);

      if (snapshot.returnRoute !== null && hostVisible) {
        const returnRoute = snapshot.returnRoute;
        const returnButton = document.createElement('button');
        returnButton.type = 'button';
        returnButton.className = 'shell-breadcrumbs__return';
        returnButton.dataset.shellReturn = returnRoute.family;
        returnButton.textContent = `Вернуться: ${getShellRouteDisplayName(returnRoute, this.#options.getState())}`;
        returnButton.addEventListener('click', () => this.navigate(returnRoute));
        host.append(returnButton);
      }
    }
  }

  private bindPlanetRouteSync(): void {
    const planetView = document.querySelector<HTMLElement>('#planet-view');
    if (planetView === null) return;
    const syncMode = (): void => {
      if (this.#applyingRoute || this.#snapshot.route.family !== 'planet') return;
      queueMicrotask(() => {
        if (this.#applyingRoute || this.#snapshot.route.family !== 'planet') return;
        const active = document.querySelector<HTMLButtonElement>(
          '[data-planet-mode][aria-selected="true"]',
        );
        const mode = active?.dataset.planetMode as PlanetShellMode | undefined;
        if (mode === undefined || mode === this.#snapshot.route.mode) return;
        this.navigateToPlanet(this.#options.getActivePlanetId(), mode, 'zone');
      });
    };
    planetView.addEventListener('click', syncMode);
    planetView.addEventListener('keydown', syncMode);
    this.#cleanup.push(() => {
      planetView.removeEventListener('click', syncMode);
      planetView.removeEventListener('keydown', syncMode);
    });
  }

  private bindActivePlanetSelectors(): void {
    const selectors = [
      document.querySelector<HTMLSelectElement>('#planet-selector'),
      document.querySelector<HTMLSelectElement>('#hud-planet-selector'),
    ].filter((selector): selector is HTMLSelectElement => selector !== null);
    for (const selector of selectors) {
      const onChange = (): void => {
        if (this.#applyingRoute) return;
        const state = this.#options.getState();
        const previousPlanetId = this.#options.getActivePlanetId();
        if (!this.#navigationContext.rememberActivePlanet(state, selector.value)) return;
        if (!this.#options.selectActivePlanet(selector.value)) {
          this.#navigationContext.rememberActivePlanet(state, previousPlanetId);
          return;
        }
        if (this.#snapshot.route.family === 'planet') {
          this.navigateToPlanet(
            selector.value,
            this.#snapshot.route.mode,
            this.#snapshot.route.surface,
          );
        } else {
          this.activate(this.#snapshot.route, null, null, this.#snapshot.route);
        }
      };
      selector.addEventListener('change', onChange);
      this.#cleanup.push(() => selector.removeEventListener('change', onChange));
    }
  }

  private syncFromUrl(): void {
    const parsed = parseAppShellRoute(
      this.#environment.readHash(),
      this.#options.getState(),
      this.#options.getActivePlanetId(),
    );
    if (this.#environment.readHash() !== parsed.canonicalHash || parsed.error !== null) {
      this.#environment.replaceHash(parsed.canonicalHash);
    }
    this.activate(
      parsed.route,
      parsed.error,
      normalizationCodeForError(parsed.error),
      this.#snapshot.route,
    );
  }

  private activate(
    route: AppShellRoute,
    error: string | null,
    normalizationCode: ShellNavigationNormalizationCode | null,
    previousRoute: AppShellRoute | null,
  ): void {
    this.#applyingRoute = true;
    try {
      switch (route.family) {
        case 'planet':
          this.#options.selectActivePlanet(route.planetId);
          this.#navigationContext.rememberActivePlanet(this.#options.getState(), route.planetId);
          this.#options.activatePlanet(route.planetId, route.mode, route.surface);
          break;
        case 'space': this.#options.activateSpace(); break;
        case 'research': this.#options.activateResearch(); break;
        case 'fleets': this.#options.activateFleets(route.mode); break;
        case 'operations': this.#options.activateOperations(route.mode); break;
        case 'command': this.#options.activateCommand(route.mode); break;
        case 'ranking': this.#options.activateRanking(); break;
        case 'reports': this.#options.activateReports(route.filter); break;
        case 'system': this.#options.activateSystem(route.mode); break;
      }
      this.#navigationContext.rememberRoute(route, this.#options.getState(), previousRoute);
      this.updateNavigationState(route);
      this.#snapshot = this.createSnapshot(route, error, normalizationCode);
      this.renderBreadcrumbs(this.#snapshot);
      document.documentElement.dataset.shellRouteFamily = route.family;
      document.documentElement.dataset.shellRoute = serializeAppShellRoute(route);
      if (normalizationCode === null) delete document.documentElement.dataset.shellNormalizationCode;
      else document.documentElement.dataset.shellNormalizationCode = normalizationCode;
      if (route.family === 'planet') {
        document.documentElement.dataset.planetDevelopmentSurface = route.surface;
      } else {
        delete document.documentElement.dataset.planetDevelopmentSurface;
      }
      if (route.family === 'fleets') document.documentElement.dataset.fleetRouteMode = route.mode;
      else delete document.documentElement.dataset.fleetRouteMode;
      if (route.family === 'operations') document.documentElement.dataset.operationsRouteMode = route.mode;
      else delete document.documentElement.dataset.operationsRouteMode;
      if (route.family === 'command') document.documentElement.dataset.commandRouteMode = route.mode;
      else delete document.documentElement.dataset.commandRouteMode;
      if (route.family === 'reports') document.documentElement.dataset.reportRouteFilter = route.filter;
      else delete document.documentElement.dataset.reportRouteFilter;
      if (route.family === 'system') document.documentElement.dataset.systemRouteMode = route.mode;
      else delete document.documentElement.dataset.systemRouteMode;
      if (error !== null) this.#options.writeStatus?.(error);
      this.emit();
      this.focusWorkspaceHeading(route);
    } finally {
      this.#applyingRoute = false;
    }
  }

  private updateNavigationState(route: AppShellRoute): void {
    const activeDefinition = this.#registry.find(
      (definition) => definition.routeFamily === route.family,
    );
    const activeGroup = activeDefinition?.group;
    const rail = document.querySelector<HTMLElement>('.side-rail');
    if (rail !== null && activeGroup !== undefined) rail.dataset.activeGroup = activeGroup;
    if (activeGroup !== undefined) document.documentElement.dataset.shellNavigationGroup = activeGroup;

    for (const group of this.#navigationGroups) {
      const root = document.querySelector<HTMLElement>(`[data-navigation-group="${group.id}"]`);
      if (root === null) continue;
      const active = group.id === activeGroup;
      root.classList.toggle('is-active', active);
      root.setAttribute(
        'aria-label',
        active ? `${group.ariaLabel}. Активная группа.` : group.ariaLabel,
      );
    }

    for (const definition of this.#registry) {
      const button = document.querySelector<HTMLButtonElement>(`#${definition.elementId}`);
      if (button === null) continue;
      const active = definition.routeFamily === route.family;
      button.classList.toggle('is-active', active);
      button.tabIndex = active ? 0 : -1;
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    }
  }

  private focusWorkspaceHeading(route: AppShellRoute): void {
    queueMicrotask(() => {
      const workspace = document.querySelector<HTMLElement>(routeWorkspaceSelector(route));
      if (workspace === null || workspace.hidden) return;
      const heading = workspace.querySelector<HTMLElement>('[data-shell-heading], h1, h2');
      if (heading === null) return;
      if (!heading.hasAttribute('tabindex')) heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      document.querySelector<HTMLElement>('#accessibility-live-region')!.textContent =
        `Открыт раздел ${heading.textContent?.trim() ?? route.family}`;
    });
  }

  private emit(): void {
    for (const listener of this.#listeners) listener(this.#snapshot);
  }
}
