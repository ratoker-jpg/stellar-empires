import {
  GALAXY_SYSTEMS_PER_PAGE,
  routeForDirectCoordinate,
  routeForGalaxyPage,
  routeForParent,
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
import { createSpaceMapObjectDetails, type SpaceMapAction } from './spaceMapActionGate';
import { dispatchFleetMissionTarget } from './fleetMissionEvents';
import { dispatchSpaceObjectTarget } from './spaceObjectTargetEvents';
import { createSpaceMapOverlayViewModel } from './spaceMapOverlayViewModel';

export interface SpaceMapNavigationMount {
  refresh(): void;
  dispose(): void;
}

function requireElement<T extends Element>(selector: string): T {
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

function renderBreadcrumbs(route: SpaceMapRoute, navigation: SpaceMapNavigationController): void {
  const container = requireElement<HTMLElement>('#space-map-breadcrumbs');
  const items: HTMLButtonElement[] = [
    breadcrumbButton('Universe', { level: 'universe' }, navigation, route.level === 'universe'),
  ];
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
    items.push(breadcrumbButton(`Solar system ${route.solarSystem}`, route, navigation, true));
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

function selectionForRoute(state: GameState, route: SpaceMapRoute): SpaceMapSelectionDetail | null {
  if (route.level !== 'solar-system') return null;
  const view = createSolarSystemViewModel(state, route);
  const slot = view.slots[route.position - 1];
  return slot === undefined
    ? null
    : {
        kind: 'position',
        galaxy: slot.galaxy,
        solarSystem: slot.solarSystem,
        position: slot.position,
        label: slot.label,
        objectKind: slot.kind,
      };
}

function renderActionButton(action: SpaceMapAction): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'space-map-action-row';
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = action.label;
  button.disabled = !action.enabled;
  button.dataset.semanticId = `space-action-${action.id}`;
  button.dataset.actionId = action.id;
  if (action.disabledReason !== null) button.title = action.disabledReason;
  if (action.enabled && action.kind === 'mission' && action.mission !== undefined && action.targetId !== undefined) {
    button.addEventListener('click', () => dispatchFleetMissionTarget({
      targetId: action.targetId ?? '',
      label: action.label,
      mission: action.mission ?? 'scout',
      source: 'space-map',
    }));
  }
  if (action.enabled && action.kind === 'space-object' && action.objectId !== undefined) {
    button.addEventListener('click', () => dispatchSpaceObjectTarget({
      objectId: action.objectId ?? '',
      label: action.label,
    }));
  }
  wrapper.append(button);
  if (action.disabledReason !== null) {
    const reason = document.createElement('small');
    reason.textContent = action.disabledReason;
    wrapper.append(reason);
  }
  return wrapper;
}

function renderDetails(state: GameState, selection: SpaceMapSelectionDetail | null): void {
  const container = requireElement<HTMLElement>('#space-map-selection-details');
  if (selection === null) {
    container.textContent = 'Выбери объект на карте.';
    return;
  }
  const details = createSpaceMapObjectDetails(state, selection);
  container.replaceChildren();
  container.dataset.objectState = details.state;
  container.dataset.relation = details.relation;
  container.dataset.intelQuality = details.intelQuality;
  const header = document.createElement('header');
  const title = document.createElement('strong');
  title.textContent = details.label;
  const coordinate = document.createElement('span');
  coordinate.textContent = details.coordinate === null
    ? `G${selection.galaxy} · S${selection.solarSystem} · SUN`
    : `G${details.coordinate.galaxy} · S${details.coordinate.solarSystem} · P${details.coordinate.position}`;
  header.append(title, coordinate);
  const meta = document.createElement('div');
  meta.className = 'space-map-detail-meta';
  const values = [
    ['Состояние', details.state],
    ['Отношение', details.relation],
    ['Разведка', details.intelQuality],
    ...(details.intelAgeSeconds === null ? [] : [['Возраст данных', `${details.intelAgeSeconds} сек.`]]),
    ...(details.ownerEmpireId === null ? [] : [['Владелец', details.ownerEmpireId]]),
    ...(details.factionId === null ? [] : [['Фракция', details.factionId]]),
    ...(details.allianceId === null ? [] : [['Альянс', details.allianceId]]),
  ];
  for (const [label, value] of values) {
    const item = document.createElement('span');
    item.innerHTML = `<small>${label}</small><b>${value}</b>`;
    meta.append(item);
  }
  const actions = document.createElement('div');
  actions.className = 'space-map-detail-actions';
  actions.replaceChildren(...details.actions.map(renderActionButton));
  container.append(header, meta, actions);
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
): SVGElementTagNameMap[K] {
  return document.createElementNS('http://www.w3.org/2000/svg', tag);
}

function renderOverlay(state: GameState, route: SpaceMapRoute): void {
  const overlay = requireElement<SVGSVGElement>('#space-map-overlay');
  overlay.replaceChildren();
  if (route.level !== 'solar-system') {
    overlay.setAttribute('hidden', '');
    return;
  }
  overlay.removeAttribute('hidden');
  const model = createSpaceMapOverlayViewModel(state, route.galaxy, route.solarSystem);
  for (const item of model.routes) {
    const group = createSvgElement('g');
    group.id = item.semanticId;
    group.dataset.semanticId = item.semanticId;
    group.dataset.mission = item.mission;
    const line = createSvgElement('line');
    line.setAttribute('x1', String(item.origin.x));
    line.setAttribute('y1', String(item.origin.y));
    line.setAttribute('x2', String(item.destination.x));
    line.setAttribute('y2', String(item.destination.y));
    line.setAttribute('marker-end', 'url(#space-map-arrow)');
    group.append(line);
    overlay.append(group);
  }
  for (const marker of model.markers) {
    const group = createSvgElement('g');
    group.id = marker.semanticId;
    group.dataset.semanticId = marker.semanticId;
    group.dataset.relation = marker.relation;
    group.dataset.markerKind = marker.kind;
    const circle = createSvgElement('circle');
    circle.setAttribute('cx', String(marker.point.x));
    circle.setAttribute('cy', String(marker.point.y));
    circle.setAttribute('r', marker.kind === 'mission' ? '9' : '7');
    const title = createSvgElement('title');
    title.textContent = marker.label;
    group.append(circle, title);
    overlay.append(group);
  }
}

function parseInput(input: HTMLInputElement): number {
  const value = Number(input.value);
  return Number.isInteger(value) ? value : Number.NaN;
}

export function mountSpaceMapNavigation(
  navigation: SpaceMapNavigationController,
  getState: () => GameState,
): SpaceMapNavigationMount {
  let latestSelection: SpaceMapSelectionDetail | null = null;
  const renderSnapshot = (snapshot: SpaceMapNavigationSnapshot): void => {
    const { route } = snapshot;
    const state = getState();
    showGalaxyView();
    renderBreadcrumbs(route, navigation);
    const error = requireElement<HTMLElement>('#space-map-route-error');
    error.textContent = snapshot.error ?? '';
    error.hidden = snapshot.error === null;
    const pageControls = requireElement<HTMLElement>('#space-map-page-controls');
    pageControls.hidden = route.level !== 'galaxy';
    if (route.level === 'galaxy') {
      const descriptor = state.universe.galaxies.find((galaxy) => galaxy.slot === route.galaxy);
      const pageCount = descriptor === undefined ? 1 : Math.ceil(descriptor.systemCount / GALAXY_SYSTEMS_PER_PAGE);
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
    const selection = route.level === 'solar-system' &&
      latestSelection !== null &&
      latestSelection.galaxy === route.galaxy &&
      latestSelection.solarSystem === route.solarSystem
      ? latestSelection
      : selectionForRoute(state, route);
    renderDetails(state, selection);
    renderOverlay(state, route);
  };
  const unsub = navigation.subscribe(renderSnapshot);
  const navGalaxy = requireElement<HTMLButtonElement>('#nav-galaxy');
  const onGalaxy = (): void => { latestSelection = null; navigation.navigate({ level: 'universe' }); };
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
    latestSelection = null;
    navigation.navigate(routeForDirectCoordinate(
      parseInput(requireElement<HTMLInputElement>('#space-map-galaxy-input')),
      parseInput(requireElement<HTMLInputElement>('#space-map-system-input')),
      parseInput(requireElement<HTMLInputElement>('#space-map-position-input')),
    ));
  };
  form.addEventListener('submit', onSubmit);
  const onSelection = (event: Event): void => {
    if (!(event instanceof CustomEvent)) return;
    latestSelection = event.detail as SpaceMapSelectionDetail;
    renderSnapshot(navigation.snapshot);
  };
  window.addEventListener(SPACE_MAP_SELECTION_EVENT, onSelection);
  const onGlobalKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || navigation.snapshot.route.level === 'universe') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    latestSelection = null;
    navigation.navigate(routeForParent(navigation.snapshot.route));
  };
  window.addEventListener('keydown', onGlobalKeyDown, { capture: true });
  return {
    refresh: () => renderSnapshot(navigation.snapshot),
    dispose: () => {
      unsub();
      navGalaxy.removeEventListener('click', onGalaxy);
      previous.removeEventListener('click', onPrevious);
      next.removeEventListener('click', onNext);
      form.removeEventListener('submit', onSubmit);
      window.removeEventListener(SPACE_MAP_SELECTION_EVENT, onSelection);
      window.removeEventListener('keydown', onGlobalKeyDown, { capture: true });
    },
  };
}
