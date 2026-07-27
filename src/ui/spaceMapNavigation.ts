import {
  GALAXY_SYSTEMS_PER_PAGE,
  routeForDirectCoordinate,
  routeForGalaxyPage,
  type SpaceMapNavigationController,
  type SpaceMapNavigationSnapshot,
  type SpaceMapRoute,
} from '../navigation/spaceMapRoute';
import type { GameState } from '../simulation/types';
import { createSolarSystemViewModel } from './spaceMapViewModel';
import {
  SPACE_MAP_SELECTION_EVENT,
  type SpaceMapSelectionDetail,
} from '../game/spaceMapPresentationEvents';

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`Required Space Map element not found: ${selector}`);
  return element;
}

function showGalaxyView(): void {
  requireElement<HTMLElement>('#galaxy-view').hidden = false;
  requireElement<HTMLElement>('#planet-view').hidden = true;
  requireElement<HTMLButtonElement>('#nav-galaxy').classList.add('is-active');
  requireElement<HTMLButtonElement>('#nav-planet').classList.remove('is-active');
  requireElement<HTMLElement>('.game-layout').classList.remove('is-planet-view');
}

function breadcrumbButton(
  label: string,
  route: SpaceMapRoute,
  navigation: SpaceMapNavigationController,
  current: boolean,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.disabled = current;
  button.setAttribute('aria-current', current ? 'page' : 'false');
  button.addEventListener('click', () => navigation.navigate(route));
  return button;
}

function renderBreadcrumbs(
  route: SpaceMapRoute,
  navigation: SpaceMapNavigationController,
): void {
  const container = requireElement<HTMLElement>('#space-map-breadcrumbs');
  const items: HTMLButtonElement[] = [];
  items.push(breadcrumbButton('Universe', { level: 'universe' }, navigation, route.level === 'universe'));
  if (route.level !== 'universe') {
    items.push(breadcrumbButton(
      `Galaxy ${route.galaxy}`,
      {
        level: 'galaxy',
        galaxy: route.galaxy,
        page: route.level === 'galaxy'
          ? route.page
          : Math.floor((route.solarSystem - 1) / GALAXY_SYSTEMS_PER_PAGE) + 1,
      },
      navigation,
      route.level === 'galaxy',
    ));
  }
  if (route.level === 'solar-system') {
    items.push(breadcrumbButton(
      `Solar system ${route.solarSystem}`,
      route,
      navigation,
      true,
    ));
  }
  container.replaceChildren();
  items.forEach((item, index) => {
    if (index > 0) {
      const separator = document.createElement('span');
      separator.textContent = '›';
      separator.setAttribute('aria-hidden', 'true');
      container.append(separator);
    }
    container.append(item);
  });
}

function routeCoordinate(route: SpaceMapRoute): string {
  if (route.level === 'universe') return 'U';
  if (route.level === 'galaxy') return `G${route.galaxy} · PAGE ${route.page}`;
  return `G${route.galaxy} · S${route.solarSystem} · P${route.position}`;
}

function defaultDetails(state: GameState, route: SpaceMapRoute): string {
  if (route.level === 'universe') return 'Выбери одну из 20 галактических позиций.';
  if (route.level === 'galaxy') return 'Выбери систему. Первый клик только открывает Solar system.';
  const view = createSolarSystemViewModel(state, route);
  const slot = view.slots[route.position - 1];
  return slot?.label ?? `Позиция ${route.position}`;
}

function renderSnapshot(
  snapshot: SpaceMapNavigationSnapshot,
  navigation: SpaceMapNavigationController,
  getState: () => GameState,
): void {
  const { route } = snapshot;
  showGalaxyView();
  renderBreadcrumbs(route, navigation);
  requireElement<HTMLElement>('#space-map-route-error').textContent = snapshot.error ?? '';
  requireElement<HTMLElement>('#space-map-route-error').hidden = snapshot.error === null;
  const pageControls = requireElement<HTMLElement>('#space-map-page-controls');
  pageControls.hidden = route.level !== 'galaxy';
  if (route.level === 'galaxy') {
    const state = getState();
    const descriptor = state.universe.galaxies.find((galaxy) => galaxy.slot === route.galaxy);
    const pageCount = descriptor === undefined
      ? 1
      : Math.ceil(descriptor.systemCount / GALAXY_SYSTEMS_PER_PAGE);
    requireElement<HTMLButtonElement>('#space-map-page-previous').disabled = route.page <= 1;
    requireElement<HTMLButtonElement>('#space-map-page-next').disabled = route.page >= pageCount;
    requireElement<HTMLElement>('#space-map-page-label').textContent = `${route.page} / ${pageCount}`;
  }
  const galaxyInput = requireElement<HTMLInputElement>('#space-map-galaxy-input');
  const systemInput = requireElement<HTMLInputElement>('#space-map-system-input');
  const positionInput = requireElement<HTMLInputElement>('#space-map-position-input');
  if (route.level !== 'universe') galaxyInput.value = String(route.galaxy);
  if (route.level === 'solar-system') {
    systemInput.value = String(route.solarSystem);
    positionInput.value = String(route.position);
  }
  requireElement<HTMLElement>('#space-map-footer-level').textContent = route.level;
  requireElement<HTMLElement>('#space-map-footer-coordinate').textContent = routeCoordinate(route);
  requireElement<HTMLElement>('#space-map-selection-details').textContent = defaultDetails(getState(), route);
}

function parseInput(input: HTMLInputElement): number {
  const value = Number(input.value);
  return Number.isInteger(value) ? value : Number.NaN;
}

export function mountSpaceMapNavigation(
  navigation: SpaceMapNavigationController,
  getState: () => GameState,
): () => void {
  const unsub = navigation.subscribe((snapshot) => renderSnapshot(snapshot, navigation, getState));
  const navGalaxy = requireElement<HTMLButtonElement>('#nav-galaxy');
  const onGalaxy = (): void => { navigation.navigate({ level: 'universe' }); };
  navGalaxy.addEventListener('click', onGalaxy);

  const previous = requireElement<HTMLButtonElement>('#space-map-page-previous');
  const next = requireElement<HTMLButtonElement>('#space-map-page-next');
  const onPrevious = (): void => {
    navigation.navigate(routeForGalaxyPage(navigation.snapshot.route, getState().universe, -1));
  };
  const onNext = (): void => {
    navigation.navigate(routeForGalaxyPage(navigation.snapshot.route, getState().universe, 1));
  };
  previous.addEventListener('click', onPrevious);
  next.addEventListener('click', onNext);

  const form = requireElement<HTMLFormElement>('#space-map-coordinate-form');
  const onSubmit = (event: SubmitEvent): void => {
    event.preventDefault();
    const route = routeForDirectCoordinate(
      parseInput(requireElement<HTMLInputElement>('#space-map-galaxy-input')),
      parseInput(requireElement<HTMLInputElement>('#space-map-system-input')),
      parseInput(requireElement<HTMLInputElement>('#space-map-position-input')),
    );
    navigation.navigate(route);
  };
  form.addEventListener('submit', onSubmit);

  const onSelection = (event: Event): void => {
    if (!(event instanceof CustomEvent)) return;
    const detail = event.detail as SpaceMapSelectionDetail;
    requireElement<HTMLElement>('#space-map-selection-details').textContent = detail.label;
  };
  window.addEventListener(SPACE_MAP_SELECTION_EVENT, onSelection);

  return () => {
    unsub();
    navGalaxy.removeEventListener('click', onGalaxy);
    previous.removeEventListener('click', onPrevious);
    next.removeEventListener('click', onNext);
    form.removeEventListener('submit', onSubmit);
    window.removeEventListener(SPACE_MAP_SELECTION_EVENT, onSelection);
  };
}
