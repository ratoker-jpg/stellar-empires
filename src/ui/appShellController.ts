import type { GameState } from '../simulation/types';
import {
  parseAppShellRoute,
  serializeAppShellRoute,
  type AppShellRoute,
  type PlanetShellMode,
} from './appShellRoute';
import {
  SHELL_SCREEN_REGISTRY,
  validateScreenRegistry,
  type ShellScreenDefinition,
} from './screenRegistry';

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
  readonly activatePlanet: (planetId: string, mode: PlanetShellMode) => void;
  readonly activateSpace: () => void;
  readonly writeStatus?: (message: string) => void;
  readonly registry?: readonly ShellScreenDefinition[];
}

export interface AppShellSnapshot {
  readonly route: AppShellRoute;
  readonly error: string | null;
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

function createNavigationButton(definition: ShellScreenDefinition): HTMLButtonElement {
  const button = document.createElement('button');
  button.id = definition.elementId;
  button.className = `rail-button${definition.utility ? ' rail-button--utility' : ''}`;
  button.type = 'button';
  button.setAttribute('aria-label', definition.ariaLabel);
  button.dataset.shellScreen = definition.id;
  button.dataset.shellScreenKind = definition.kind;
  const icon = document.createElement('span');
  icon.className = 'rail-button__icon';
  icon.textContent = definition.icon;
  const label = document.createElement('small');
  label.textContent = definition.label;
  button.append(icon, label);
  return button;
}

export class AppShellController {
  readonly #environment: AppShellEnvironment;
  readonly #options: AppShellControllerOptions;
  readonly #registry: readonly ShellScreenDefinition[];
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
    const registryErrors = validateScreenRegistry(this.#registry);
    if (registryErrors.length > 0) throw new Error(registryErrors.join('\n'));
    this.renderNavigation();
    this.bindPlanetRouteSync();
    const parsed = parseAppShellRoute(
      environment.readHash(),
      options.getState(),
      options.getActivePlanetId(),
    );
    this.#snapshot = { route: parsed.route, error: parsed.error };
    if (environment.readHash() !== parsed.canonicalHash || parsed.error !== null) {
      environment.replaceHash(parsed.canonicalHash);
    }
    this.#unsubscribeEnvironment = environment.subscribe(() => this.syncFromUrl());
    this.activate(parsed.route, parsed.error);
  }

  public get snapshot(): AppShellSnapshot {
    return this.#snapshot;
  }

  public subscribe(listener: (snapshot: AppShellSnapshot) => void): () => void {
    this.#listeners.add(listener);
    listener(this.#snapshot);
    return () => this.#listeners.delete(listener);
  }

  public navigate(route: AppShellRoute, mode: 'push' | 'replace' = 'push'): void {
    const hash = serializeAppShellRoute(route);
    if (this.#environment.readHash() === hash) {
      this.activate(route, null);
      return;
    }
    if (mode === 'replace') this.#environment.replaceHash(hash);
    else this.#environment.pushHash(hash);
    this.activate(route, null);
  }

  public navigateToPlanet(
    planetId = this.#options.getActivePlanetId(),
    mode: PlanetShellMode = 'overview',
    historyMode: 'push' | 'replace' = 'push',
  ): void {
    this.navigate({ family: 'planet', planetId, mode }, historyMode);
  }

  public navigateToSpace(historyMode: 'push' | 'replace' = 'push'): void {
    const current = this.#environment.readHash();
    const hash = current === '#/space' || current.startsWith('#/space/')
      ? current
      : '#/space/universe';
    this.navigate({ family: 'space', hash }, historyMode);
  }

  public dispose(): void {
    this.#unsubscribeEnvironment();
    for (const cleanup of this.#cleanup.splice(0)) cleanup();
    this.#listeners.clear();
  }

  private renderNavigation(): void {
    const rail = document.querySelector<HTMLElement>('.side-rail');
    if (rail === null) throw new Error('Primary navigation rail is missing.');
    rail.replaceChildren();
    let utilityStarted = false;
    for (const definition of this.#registry) {
      if (definition.utility && !utilityStarted) {
        const spacer = document.createElement('div');
        spacer.className = 'rail-spacer';
        rail.append(spacer);
        utilityStarted = true;
      }
      const button = createNavigationButton(definition);
      if (definition.kind === 'route') {
        const onClick = (): void => {
          if (definition.routeFamily === 'planet') this.navigateToPlanet();
          else this.navigateToSpace();
        };
        button.addEventListener('click', onClick);
        this.#cleanup.push(() => button.removeEventListener('click', onClick));
      }
      rail.append(button);
    }
  }

  private bindPlanetRouteSync(): void {
    const planetView = document.querySelector<HTMLElement>('#planet-view');
    const selector = document.querySelector<HTMLSelectElement>('#planet-selector');
    if (planetView !== null) {
      const syncMode = (): void => {
        if (this.#applyingRoute || this.#snapshot?.route.family !== 'planet') return;
        queueMicrotask(() => {
          if (this.#applyingRoute || this.#snapshot.route.family !== 'planet') return;
          const active = document.querySelector<HTMLButtonElement>(
            '[data-planet-mode][aria-selected="true"]',
          );
          const mode = active?.dataset.planetMode as PlanetShellMode | undefined;
          if (mode === undefined || mode === this.#snapshot.route.mode) return;
          this.navigateToPlanet(this.#options.getActivePlanetId(), mode);
        });
      };
      planetView.addEventListener('click', syncMode);
      planetView.addEventListener('keydown', syncMode);
      this.#cleanup.push(() => {
        planetView.removeEventListener('click', syncMode);
        planetView.removeEventListener('keydown', syncMode);
      });
    }
    if (selector !== null) {
      const onChange = (): void => {
        if (this.#applyingRoute) return;
        if (!this.#options.selectActivePlanet(selector.value)) return;
        const mode = this.#snapshot.route.family === 'planet'
          ? this.#snapshot.route.mode
          : 'overview';
        this.navigateToPlanet(selector.value, mode);
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
    this.activate(parsed.route, parsed.error);
  }

  private activate(route: AppShellRoute, error: string | null): void {
    this.#applyingRoute = true;
    try {
      if (route.family === 'planet') {
        this.#options.selectActivePlanet(route.planetId);
        this.#options.activatePlanet(route.planetId, route.mode);
      } else {
        this.#options.activateSpace();
      }
      this.updateNavigationState(route);
      this.#snapshot = { route, error };
      document.documentElement.dataset.shellRouteFamily = route.family;
      document.documentElement.dataset.shellRoute = serializeAppShellRoute(route);
      if (error !== null) this.#options.writeStatus?.(error);
      this.emit();
    } finally {
      this.#applyingRoute = false;
    }
  }

  private updateNavigationState(route: AppShellRoute): void {
    for (const definition of this.#registry) {
      const button = document.querySelector<HTMLButtonElement>(`#${definition.elementId}`);
      if (button === null) continue;
      const active = definition.kind === 'route' && definition.routeFamily === route.family;
      button.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    }
  }

  private emit(): void {
    for (const listener of this.#listeners) listener(this.#snapshot);
  }
}
