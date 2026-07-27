import { getFactionMechanicalRoles } from '../simulation/factions/factionMechanicalRoles';
import { getBuildingLevel } from '../simulation/planet/buildingProgression';
import type { GameState } from '../simulation/types';
import type {
  PlanetDevelopmentSurface,
  PlanetShellMode,
} from './appShellRoute';

export interface DevelopmentWorkspaceRouterOptions {
  readonly getState: () => GameState;
  readonly getActivePlanetId: () => string;
  readonly navigateToResearch: () => void;
  readonly navigateToSurface: (
    mode: PlanetShellMode,
    surface: PlanetDevelopmentSurface,
  ) => void;
}

export interface DevelopmentWorkspaceRouter {
  activate(mode: PlanetShellMode, surface: PlanetDevelopmentSurface): void;
  refresh(): void;
  dispose(): void;
}

export function getDevelopmentSurfacesForMode(
  mode: PlanetShellMode,
): readonly PlanetDevelopmentSurface[] {
  if (mode === 'industry') return ['zone', 'shipyard', 'upgrades'];
  if (mode === 'military') return ['zone', 'defense'];
  return ['zone'];
}

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`Development workspace element is missing: ${selector}`);
  return element;
}

function activePlanet(options: DevelopmentWorkspaceRouterOptions) {
  return options.getState().planets.find(
    (planet) => planet.id === options.getActivePlanetId() && planet.ownerEmpireId === 'player',
  );
}

function createUpgradesGateway(options: DevelopmentWorkspaceRouterOptions): HTMLButtonElement {
  const planet = activePlanet(options);
  const shipyardLevel = planet === undefined
    ? 0
    : getBuildingLevel(
        planet.buildings,
        getFactionMechanicalRoles(planet.factionId).buildings.shipyard,
      );
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `zone-gateway${shipyardLevel > 0 ? ' is-ready' : ''}`;
  button.dataset.developmentGateway = 'upgrades';
  const label = document.createElement('strong');
  label.textContent = 'Модернизация кораблей';
  const hint = document.createElement('span');
  hint.textContent = shipyardLevel > 0
    ? `Верфь ур. ${shipyardLevel} · улучшение вооружения, брони и грузовых систем`
    : 'Требуется орбитальная верфь';
  button.append(label, hint);
  return button;
}

export function mountDevelopmentWorkspaceRouter(
  options: DevelopmentWorkspaceRouterOptions,
): DevelopmentWorkspaceRouter {
  const core = requireElement<HTMLElement>('#planet-core-workspace');
  const tabs = requireElement<HTMLElement>('#planet-development-tabs');
  const surfaces: Readonly<Record<Exclude<PlanetDevelopmentSurface, 'zone'>, HTMLElement>> = {
    shipyard: requireElement<HTMLElement>('#ship-production-view'),
    defense: requireElement<HTMLElement>('#defense-production-view'),
    upgrades: requireElement<HTMLElement>('#ship-upgrades-view'),
  };
  let activeMode: PlanetShellMode = 'overview';
  let activeSurface: PlanetDevelopmentSurface = 'zone';

  const refreshTabs = (): void => {
    const available = getDevelopmentSurfacesForMode(activeMode);
    tabs.hidden = available.length <= 1;
    for (const button of tabs.querySelectorAll<HTMLButtonElement>('[data-development-surface]')) {
      const surface = button.dataset.developmentSurface as PlanetDevelopmentSurface;
      const visible = available.includes(surface);
      button.hidden = !visible;
      button.disabled = !visible;
      const selected = visible && surface === activeSurface;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    }
  };

  const refreshGateway = (): void => {
    const panel = document.querySelector<HTMLElement>('#planet-context-panel');
    if (panel?.dataset.mode !== 'industry') return;
    const gatewayHost = panel.querySelector<HTMLElement>('.zone-context-content');
    if (gatewayHost === null) return;
    gatewayHost.querySelector('[data-development-gateway="upgrades"]')?.remove();
    gatewayHost.append(createUpgradesGateway(options));
  };

  const activate = (
    mode: PlanetShellMode,
    surface: PlanetDevelopmentSurface,
  ): void => {
    activeMode = mode;
    activeSurface = getDevelopmentSurfacesForMode(mode).includes(surface) ? surface : 'zone';
    core.hidden = activeSurface !== 'zone';
    for (const [candidate, host] of Object.entries(surfaces) as Array<
      [Exclude<PlanetDevelopmentSurface, 'zone'>, HTMLElement]
    >) {
      host.hidden = candidate !== activeSurface;
    }
    refreshTabs();
    queueMicrotask(refreshGateway);
  };

  const onTabClick = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('[data-development-surface]');
    if (button === null || button.disabled) return;
    const surface = button.dataset.developmentSurface as PlanetDevelopmentSurface;
    options.navigateToSurface(activeMode, surface);
  };
  tabs.addEventListener('click', onTabClick);

  const onGatewayClick = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const gateway = target.closest<HTMLButtonElement>('.zone-gateway');
    if (gateway === null || !gateway.classList.contains('is-ready')) return;
    const label = gateway.querySelector('strong')?.textContent;
    if (label === 'Исследования') {
      event.preventDefault();
      event.stopImmediatePropagation();
      options.navigateToResearch();
      return;
    }
    const destination = label === 'Орбитальная верфь'
      ? { mode: 'industry', surface: 'shipyard' } as const
      : label === 'Планетарная оборона'
        ? { mode: 'military', surface: 'defense' } as const
        : label === 'Модернизация кораблей'
          ? { mode: 'industry', surface: 'upgrades' } as const
          : undefined;
    if (destination === undefined) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    options.navigateToSurface(destination.mode, destination.surface);
  };
  document.addEventListener('click', onGatewayClick, { capture: true });

  return {
    activate,
    refresh: () => {
      refreshTabs();
      queueMicrotask(refreshGateway);
    },
    dispose: () => {
      tabs.removeEventListener('click', onTabClick);
      document.removeEventListener('click', onGatewayClick, { capture: true });
    },
  };
}
