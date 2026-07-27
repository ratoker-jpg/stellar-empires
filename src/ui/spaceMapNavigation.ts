import {
  GALAXY_SYSTEMS_PER_PAGE,
  getUniverseGalaxyDescriptor,
} from '../simulation/universe/universeModel';
import {
  createSpaceMapOverlayViewModel,
  routeCoordinate,
  routeForDirectCoordinate,
  routeForGalaxyPage,
  routeForParent,
  selectionForRoute,
  type SpaceMapSelectionDetail,
} from './spaceMapViewModel';
import {
  SPACE_MAP_SELECTION_EVENT,
  type SpaceMapSelectionEventDetail,
} from '../game/spaceMapPresentationEvents';
import type { GameState } from '../simulation/types';
import {
  SpaceMapNavigationController,
  type SpaceMapNavigationSnapshot,
  type SpaceMapRoute,
} from '../navigation/spaceMapRoute';
import { dispatchFleetMissionTarget } from './fleetMissionEvents';
import { dispatchSpaceObjectTarget } from './spaceObjectTargetEvents';

export interface SpaceMapNavigationMount {
  refresh(): void;
  dispose(): void;
}

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`Required Space Map element not found: ${selector}`);
  return element;
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
  tagName: K,
): SVGElementTagNameMap[K] {
  return document.createElementNS('http://www.w3.org/2000/svg', tagName);
}

function renderBreadcrumbs(
  route: SpaceMapRoute,
  navigation: SpaceMapNavigationController,
): void {
  const host = requireElement<HTMLElement>('#space-map-breadcrumbs');
  host.replaceChildren();
  const items: Array<{ label: string; route: SpaceMapRoute }> = [
    { label: 'Universe', route: { level: 'universe' } },
  ];
  if (route.level !== 'universe') {
    items.push({
      label: `Galaxy ${route.galaxy}`,
      route: { level: 'galaxy', galaxy: route.galaxy, page: route.level === 'galaxy' ? route.page : 1 },
    });
  }
  if (route.level === 'solar-system') {
    items.push({
      label: `Solar ${route.galaxy}:${route.solarSystem}:${route.position}`,
      route,
    });
  }
  for (const [index, item] of items.entries()) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = item.label;
    button.disabled = index === items.length - 1;
    button.addEventListener('click', () => navigation.navigate(item.route));
    host.append(button);
  }
}

function actionButton(
  id: string,
  label: string,
  disabled: boolean,
  title: string,
  onClick: () => void,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.dataset.actionId = id;
  button.disabled = disabled;
  button.title = title;
  button.addEventListener('click', onClick);
  return button;
}

function renderDetails(state: GameState, selection: SpaceMapSelectionDetail | null): void {
  const host = requireElement<HTMLElement>('#space-map-selection-details');
  host.replaceChildren();
  delete host.dataset.intelQuality;
  delete host.dataset.relation;
  if (selection === null) {
    host.textContent = 'Выбери объект на карте.';
    return;
  }
  host.dataset.intelQuality = selection.intelligence.quality;
  host.dataset.relation = selection.relation;
  const title = document.createElement('strong');
  title.textContent = selection.label;
  const meta = document.createElement('p');
  meta.textContent = selection.description;
  host.append(title, meta);
  const actions = document.createElement('div');
  actions.className = 'space-map-selection-actions';
  for (const action of selection.actions) {
    actions.append(actionButton(
      action.id,
      action.label,
      !action.enabled,
      action.reason ?? action.label,
      () => {
        if (action.kind === 'fleet-mission' && action.target !== undefined) {
          dispatchFleetMissionTarget({
            targetId: action.target.id,
            label: action.target.label,
            mission: action.mission,
            source: 'space-map',
          });
        }
        if (action.kind === 'space-object' && action.objectId !== undefined) {
          dispatchSpaceObjectTarget({ objectId: action.objectId, label: action.label });
        }
      },
    ));
  }
  host.append(actions);
  if (selection.details.length > 0) {
    const list = document.createElement('dl');
    for (const detail of selection.details) {
      const row = document.createElement('div');
      const term = document.createElement('dt');
      term.textContent = detail.label;
      const value = document.createElement('dd');
      value.textContent = detail.value;
      row.append(term, value);
      list.append(row);
    }
    host.append(list);
  }
}

function renderOverlay(state: GameState, route: SpaceMapRoute): void {
  const overlay = requireElement<SVGSVGElement>('#space-map-overlay');
  overlay.replaceChildren();
  const defs = createSvgElement('defs');
  const marker = createSvgElement('marker');
  marker.id = 'space-map-arrow';
  marker.setAttribute('markerWidth', '8');
  marker.setAttribute('markerHeight', '8');
  marker.setAttribute('refX', '7');
  marker.setAttribute('refY', '4');
  marker.setAttribute('orient', 'auto');
  const markerPath = createSvgElement('path');
  markerPath.setAttribute('d', 'M0,0 L8,4 L0,8 z');
  marker.append(markerPath);
  defs.append(marker);
  overlay.append(defs);
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
  for (const markerItem of model.markers) {
    const group = createSvgElement('g');
    group.id = markerItem.semanticId;
    group.dataset.semanticId = markerItem.semanticId;
    group.dataset.relation = markerItem.relation;
    group.dataset.markerKind = markerItem.kind;
    const circle = createSvgElement('circle');
    circle.setAttribute('cx', String(markerItem.point.x));
    circle.setAttribute('cy', String(markerItem.point.y));
    circle.setAttribute('r', markerItem.kind === 'mission' ? '9' : '7');
    const title = createSvgElement('title');
    title.textContent = markerItem.label;
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
    renderBreadcrumbs(route, navigation);
    const error = requireElement<HTMLElement>('#space-map-route-error');
    error.textContent = snapshot.error ?? '';
    error.hidden = snapshot.error === null;
    const pageControls = requireElement<HTMLElement>('#space-map-page-controls');
    pageControls.hidden = route.level !== 'galaxy';
    if (route.level === 'galaxy') {
      const descriptor = getUniverseGalaxyDescriptor(state.universe, route.galaxy);
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
    latestSelection = (event as CustomEvent<SpaceMapSelectionEventDetail>).detail;
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
      previous.removeEventListener('click', onPrevious);
      next.removeEventListener('click', onNext);
      form.removeEventListener('submit', onSubmit);
      window.removeEventListener(SPACE_MAP_SELECTION_EVENT, onSelection);
      window.removeEventListener('keydown', onGlobalKeyDown, { capture: true });
    },
  };
}
