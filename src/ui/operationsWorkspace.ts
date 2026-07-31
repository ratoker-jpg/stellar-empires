import '../styles/operationsWorkspace.css';
import {
  GALAXY_SYSTEM_SELECTED_EVENT,
  type GalaxySystemSelectionDetail,
} from '../game/galaxyPresentationEvents';
import { getResearchEffectsForEmpire } from '../simulation/factions/factionResearchEffects';
import { estimateFlightToGalaxyPlanet } from '../simulation/fleets/flightCalculations';
import type { FleetState } from '../simulation/fleets/types';
import {
  createGalaxyIntelligenceView,
  filterGalaxyIntelligence,
  summarizeGalaxyIntelligence,
  type GalaxyIntelPlanet,
  type GalaxyIntelVisibility,
  type GalaxyOwnerFilter,
} from '../simulation/galaxy/intelligenceView';
import type { PlanetBiome } from '../simulation/galaxy/types';
import {
  estimateSpaceObjectMission,
  getRequiredSpaceObjectShipId,
  type SpaceObjectState,
} from '../simulation/pve/spaceObjects';
import {
  WORLD_EVENT_CATALOG,
  type WorldEventInstance,
} from '../simulation/pve/worldEvents';
import { createUnifiedMissionReports } from '../simulation/reports/missionReports';
import type { GameCommand, GameState } from '../simulation/types';
import { getUnitDefinition } from '../simulation/units/catalog';
import { getShipCountByRole, hasShipRole } from '../simulation/units/shipCapabilities';
import type { OperationsShellMode } from './appShellRoute';
import {
  dispatchFleetMissionTarget,
  inferMissionForGalaxyTarget,
} from './fleetMissionEvents';
import { renderLogisticsRoutesPanel } from './logisticsRoutesPanel';
import { renderMarketPanel } from './marketPanel';
import { formatGameDuration } from './planetViewModel';
import {
  SPACE_OBJECT_TARGET_EVENT,
  type SpaceObjectTargetRequest,
} from './spaceObjectTargetEvents';

export interface OperationsWorkspaceOptions {
  readonly getState: () => GameState;
  readonly getActivePlanetId: () => string;
  readonly execute: (command: GameCommand, successMessage: string) => boolean;
  readonly navigateToMode: (mode: OperationsShellMode) => void;
}

export interface OperationsWorkspace {
  activate(mode: OperationsShellMode): void;
  refresh(): void;
  deactivate(): void;
  dispose(): void;
}

export interface OperationsSummary {
  readonly activeRoutes: number;
  readonly totalRoutes: number;
  readonly marketTrades: number;
  readonly activeExpeditions: number;
  readonly activeObjectOperations: number;
  readonly availableObjects: number;
  readonly activeEvents: number;
  readonly reports: number;
  readonly exoticMatter: number;
}

const MODES: readonly OperationsShellMode[] = [
  'overview',
  'expeditions',
  'objects',
  'events',
  'market',
  'logistics',
];

const OBJECT_LABELS = {
  asteroid: 'Астероид',
  'gas-cloud': 'Газовое облако',
  anomaly: 'Аномалия',
} as const;

const VISIBILITY_LABELS = {
  owned: 'Своя колония',
  current: 'Актуальная разведка',
  stale: 'Устаревшие сведения',
  contact: 'Неизвестный контакт',
  unclaimed: 'Свободная позиция',
} as const;

const BIOME_LABELS: Readonly<Record<PlanetBiome, string>> = {
  terran: 'Земная',
  desert: 'Пустынная',
  ice: 'Ледяная',
  volcanic: 'Вулканическая',
  toxic: 'Токсичная',
  barren: 'Безжизненная',
  gas: 'Газовый гигант',
};

export function createOperationsSummary(state: GameState): OperationsSummary {
  return {
    activeRoutes: state.logisticsRoutes.filter(
      (route) => route.empireId === 'player' && route.status === 'active',
    ).length,
    totalRoutes: state.logisticsRoutes.filter((route) => route.empireId === 'player').length,
    marketTrades: state.market.trades.length,
    activeExpeditions: state.fleets.filter(
      (fleet) => fleet.empireId === 'player' && fleet.mission?.kind === 'expedition',
    ).length,
    activeObjectOperations: state.fleets.filter(
      (fleet) => fleet.empireId === 'player' && fleet.mission?.kind === 'space-object',
    ).length,
    availableObjects: state.spaceObjects.filter((object) => object.remainingYield > 0).length,
    activeEvents: state.worldEvents.active.length,
    reports: createUnifiedMissionReports(state).length,
    exoticMatter:
      state.strategicResources.find((resource) => resource.empireId === 'player')?.exoticMatter ?? 0,
  };
}

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`Operations workspace element is missing: ${selector}`);
  return element;
}

function createMetric(label: string, value: string, detail: string): HTMLElement {
  const item = document.createElement('article');
  const term = document.createElement('span');
  term.textContent = label;
  const output = document.createElement('strong');
  output.textContent = value;
  const hint = document.createElement('small');
  hint.textContent = detail;
  item.append(term, output, hint);
  return item;
}

function createSelect(
  labelText: string,
  options: readonly { readonly value: string; readonly label: string }[],
  selected: string,
): { readonly label: HTMLLabelElement; readonly select: HTMLSelectElement } {
  const label = document.createElement('label');
  label.className = 'galaxy-intel-control';
  const caption = document.createElement('span');
  caption.textContent = labelText;
  const select = document.createElement('select');
  for (const option of options) {
    const element = document.createElement('option');
    element.value = option.value;
    element.textContent = option.label;
    select.append(element);
  }
  select.value = selected;
  label.append(caption, select);
  return { label, select };
}

function fleetSpeedBonus(state: GameState, empireId: string): number {
  return getResearchEffectsForEmpire(state, empireId).fleetSpeedPercent;
}

function availableExpeditionTargets(state: GameState) {
  const occupied = new Set(state.planets.map((planet) => planet.galaxyPlanetId));
  return state.galaxy.systems.flatMap((system) =>
    system.planets
      .filter((planet) => !occupied.has(planet.id))
      .map((planet) => ({ system, planet })),
  );
}

function expeditionFleets(state: GameState): readonly FleetState[] {
  return state.fleets
    .filter(
      (fleet) =>
        fleet.empireId === 'player' &&
        fleet.status === 'stationed' &&
        fleet.location.type === 'planet' &&
        hasShipRole(fleet.ships, 'scout'),
    )
    .sort((left, right) => left.id.localeCompare(right.id));
}

function compatibleFleets(
  state: GameState,
  object: SpaceObjectState,
): readonly FleetState[] {
  const requiredShipId = getRequiredSpaceObjectShipId(object.kind);
  return state.fleets
    .filter(
      (fleet) =>
        fleet.empireId === 'player' &&
        fleet.status === 'stationed' &&
        fleet.location.type === 'planet' &&
        (fleet.ships[requiredShipId] ?? 0) > 0,
    )
    .sort((left, right) => left.id.localeCompare(right.id));
}

function objectUnavailable(state: GameState, object: SpaceObjectState): string | null {
  if (object.remainingYield <= 0) return 'Истощён';
  if (object.cooldownUntil > state.clock.elapsedSeconds) {
    return `Нестабилен ещё ${formatGameDuration(object.cooldownUntil - state.clock.elapsedSeconds)}`;
  }
  if (
    state.pendingEvents.some(
      (event) =>
        event.payload.type === 'SPACE_OBJECT_MISSION_RESOLVE' &&
        event.payload.report.objectId === object.id,
    )
  ) return 'Операция уже выполняется';
  return null;
}

function targetLabel(state: GameState, event: WorldEventInstance): string {
  if (event.targetType === 'system') {
    return state.galaxy.systems.find((system) => system.id === event.targetId)?.name ?? event.targetId;
  }
  if (event.targetType === 'space-object') {
    const object = state.spaceObjects.find((candidate) => candidate.id === event.targetId);
    return object === undefined
      ? event.targetId
      : `${object.kind} · ${object.systemId} · запас ${object.remainingYield}/${object.initialYield}`;
  }
  return state.planets.find((planet) => planet.id === event.targetId)?.name ?? event.targetId;
}

function intelResourceLine(planet: GalaxyIntelPlanet): string {
  const resources = planet.resources;
  if (resources === null || resources === undefined) return 'Экономика скрыта';
  return `M ${resources.metal} · C ${resources.crystal} · G ${resources.gas}`;
}

function intelTargetId(planet: GalaxyIntelPlanet): string {
  return planet.visibility === 'unclaimed'
    ? planet.galaxyPlanetId
    : planet.colonyId ?? planet.galaxyPlanetId;
}

export function mountOperationsWorkspace(options: OperationsWorkspaceOptions): OperationsWorkspace {
  const host = requireElement<HTMLElement>('#operations-workspace-host');
  const tabs = requireElement<HTMLElement>('#operations-route-tabs');
  let mode: OperationsShellMode = 'overview';
  let active = false;
  let pendingObjectId: string | null = null;
  let intelSearch = '';
  let intelOwner: GalaxyOwnerFilter = 'all';
  let intelVisibility: GalaxyIntelVisibility | 'all' = 'all';
  let intelBiome: PlanetBiome | 'all' = 'all';
  let intelMinimumSize = 0;

  const refreshTabs = (): void => {
    for (const button of tabs.querySelectorAll<HTMLButtonElement>('[data-operations-mode]')) {
      const candidate = button.dataset.operationsMode as OperationsShellMode;
      const selected = candidate === mode;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    }
  };

  const renderOverview = (state: GameState): void => {
    const data = createOperationsSummary(state);
    const summary = document.createElement('section');
    summary.className = 'operations-summary';
    summary.append(
      createMetric('Маршруты', `${data.activeRoutes}/${data.totalRoutes}`, 'активно / всего'),
      createMetric('Рынок', String(data.marketTrades), 'завершённых сделок'),
      createMetric(
        'Полевые операции',
        String(data.activeExpeditions + data.activeObjectOperations),
        `${data.activeExpeditions} эксп. · ${data.activeObjectOperations} объектов`,
      ),
      createMetric('Объекты', String(data.availableObjects), 'доступно'),
      createMetric('События', String(data.activeEvents), 'активно'),
      createMetric('Отчёты', String(data.reports), 'в журнале'),
      createMetric('Экзоматерия', String(data.exoticMatter), 'резерв'),
    );

    const launchers = document.createElement('section');
    launchers.className = 'operations-launchers';
    for (const [destination, title, description] of [
      ['expeditions', 'Экспедиции', 'Дальние маршруты и исследование свободных позиций.'],
      ['objects', 'Стратегические объекты', 'Астероиды, газовые облака и аномалии.'],
      ['events', 'Мировые события', 'Активные эффекты и временные цели.'],
      ['market', 'Динамический рынок', 'Обмен ресурсов через текущую модель резервов.'],
      ['logistics', 'Логистика', 'Постоянные межпланетные маршруты.'],
    ] as const) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'operations-launcher';
      const titleElement = document.createElement('strong');
      titleElement.textContent = title;
      const descriptionElement = document.createElement('small');
      descriptionElement.textContent = description;
      button.append(titleElement, descriptionElement);
      button.addEventListener('click', () => options.navigateToMode(destination));
      launchers.append(button);
    }

    const intel = document.createElement('section');
    intel.className = 'galaxy-intel-workspace';
    const heading = document.createElement('h2');
    heading.textContent = 'Галактическая разведка';
    const controls = document.createElement('div');
    controls.className = 'galaxy-intel-controls';
    const searchLabel = document.createElement('label');
    searchLabel.className = 'galaxy-intel-control galaxy-intel-search';
    const searchCaption = document.createElement('span');
    searchCaption.textContent = 'Поиск';
    const search = document.createElement('input');
    search.type = 'search';
    search.value = intelSearch;
    search.placeholder = 'Система, колония или ID';
    searchLabel.append(searchCaption, search);
    const owner = createSelect('Владелец', [
      { value: 'all', label: 'Все' },
      { value: 'self', label: 'Свои' },
      { value: 'foreign', label: 'Чужие контакты' },
      { value: 'unclaimed', label: 'Свободные' },
    ], intelOwner);
    const visibility = createSelect('Разведка', [
      { value: 'all', label: 'Любая' },
      ...Object.entries(VISIBILITY_LABELS).map(([value, label]) => ({ value, label })),
    ], intelVisibility);
    const biome = createSelect('Биом', [
      { value: 'all', label: 'Любой' },
      ...Object.entries(BIOME_LABELS).map(([value, label]) => ({ value, label })),
    ], intelBiome);
    const sizeLabel = document.createElement('label');
    sizeLabel.className = 'galaxy-intel-control';
    const sizeCaption = document.createElement('span');
    sizeCaption.textContent = 'Мин. размер';
    const size = document.createElement('input');
    size.type = 'number';
    size.min = '0';
    size.value = String(intelMinimumSize);
    sizeLabel.append(sizeCaption, size);
    controls.append(searchLabel, owner.label, visibility.label, biome.label, sizeLabel);
    const all = createGalaxyIntelligenceView(state, 'player');
    const filtered = filterGalaxyIntelligence(all, {
      search: intelSearch,
      owner: intelOwner,
      visibility: intelVisibility,
      biome: intelBiome,
      minimumSize: intelMinimumSize,
    });
    const totals = summarizeGalaxyIntelligence(all);
    const intelSummary = document.createElement('p');
    intelSummary.className = 'galaxy-intel-summary';
    intelSummary.textContent = `Позиций ${totals.totalPositions} · свои ${totals.owned} · актуальные ${totals.current} · устаревшие ${totals.stale} · контакты ${totals.contacts} · свободные ${totals.unclaimed} · показано ${filtered.length}`;
    const results = document.createElement('div');
    results.className = 'galaxy-intel-results';
    for (const planet of filtered) {
      const card = document.createElement('article');
      card.className = `galaxy-intel-card is-${planet.visibility}`;
      const title = document.createElement('h3');
      title.textContent = planet.displayName;
      const detail = document.createElement('p');
      detail.textContent = `${planet.systemName} · орбита ${planet.position} · ${BIOME_LABELS[planet.biome]} · размер ${planet.size}`;
      const ownerLine = document.createElement('p');
      ownerLine.textContent = planet.ownerEmpireId === null
        ? planet.visibility === 'unclaimed' ? 'Владелец: нет' : 'Владелец: скрыт'
        : `Владелец: ${planet.ownerEmpireId}`;
      const resources = document.createElement('strong');
      resources.textContent = intelResourceLine(planet);
      const action = document.createElement('button');
      action.type = 'button';
      action.textContent = planet.visibility === 'unclaimed'
        ? 'Подготовить колонизацию'
        : planet.ownerEmpireId === 'player'
          ? 'Подготовить снабжение'
          : 'Подготовить разведку';
      action.addEventListener('click', () => {
        dispatchFleetMissionTarget({
          targetId: intelTargetId(planet),
          label: `${planet.displayName} · ${planet.systemName}:${planet.position}`,
          mission: inferMissionForGalaxyTarget(planet.ownerEmpireId, planet.visibility),
        });
      });
      card.append(title, detail, ownerLine, resources, action);
      results.append(card);
    }
    if (filtered.length === 0) results.textContent = 'По заданным фильтрам ничего не найдено.';
    for (const input of [search, owner.select, visibility.select, biome.select, size]) {
      input.addEventListener('input', () => {
        intelSearch = search.value;
        intelOwner = owner.select.value as GalaxyOwnerFilter;
        intelVisibility = visibility.select.value as GalaxyIntelVisibility | 'all';
        intelBiome = biome.select.value as PlanetBiome | 'all';
        intelMinimumSize = Number(size.value) || 0;
        render();
      });
      input.addEventListener('change', () => {
        intelSearch = search.value;
        intelOwner = owner.select.value as GalaxyOwnerFilter;
        intelVisibility = visibility.select.value as GalaxyIntelVisibility | 'all';
        intelBiome = biome.select.value as PlanetBiome | 'all';
        intelMinimumSize = Number(size.value) || 0;
        render();
      });
    }
    intel.append(heading, controls, intelSummary, results);
    host.replaceChildren(summary, launchers, intel);
  };

  const renderExpeditions = (state: GameState): void => {
    const launch = document.createElement('section');
    launch.className = 'expedition-launch';
    const title = document.createElement('h2');
    title.textContent = 'Новая экспедиция';
    launch.append(title);
    const fleets = expeditionFleets(state);
    const targets = availableExpeditionTargets(state);
    if (fleets.length === 0 || targets.length === 0) {
      launch.append(fleets.length === 0
        ? 'Нужен станционированный флот минимум с одним разведчиком.'
        : 'Свободных позиций для экспедиции нет.');
    } else {
      const fleetSelect = document.createElement('select');
      for (const fleet of fleets) {
        const option = document.createElement('option');
        option.value = fleet.id;
        option.textContent = `${fleet.id} · скорость ${fleet.speed} · разведчиков ${getShipCountByRole(fleet.ships, 'scout')}`;
        fleetSelect.append(option);
      }
      const targetSelect = document.createElement('select');
      for (const target of targets) {
        const option = document.createElement('option');
        option.value = target.planet.id;
        option.textContent = `${target.system.name} · позиция ${target.planet.position} · ${target.planet.biome}`;
        targetSelect.append(option);
      }
      const preview = document.createElement('p');
      preview.className = 'expedition-preview';
      const start = document.createElement('button');
      start.type = 'button';
      start.textContent = 'Подтвердить экспедицию';
      const refresh = (): void => {
        const current = options.getState();
        const fleet = current.fleets.find((candidate) => candidate.id === fleetSelect.value);
        const originId = fleet?.location.type === 'planet' ? fleet.location.planetId : undefined;
        const origin = current.planets.find((planet) => planet.id === originId);
        if (fleet === undefined || origin === undefined) {
          start.disabled = true;
          preview.textContent = 'Маршрут недоступен.';
          return;
        }
        try {
          const estimate = estimateFlightToGalaxyPlanet(
            current.galaxy,
            current.planets,
            fleet,
            targetSelect.value,
            fleetSpeedBonus(current, fleet.empireId),
          );
          const fuel = estimate.fuelCost * 2;
          start.disabled = origin.economy.resources.gas.amount < fuel;
          preview.textContent = `Дистанция ${estimate.distance} · цикл ${formatGameDuration(estimate.durationSeconds * 2)} · газ ${fuel}/${origin.economy.resources.gas.amount}`;
        } catch {
          start.disabled = true;
          preview.textContent = 'Не удалось рассчитать маршрут.';
        }
      };
      fleetSelect.addEventListener('change', refresh);
      targetSelect.addEventListener('change', refresh);
      start.addEventListener('click', () => {
        if (options.execute({
          type: 'START_EXPEDITION',
          empireId: 'player',
          fleetId: fleetSelect.value,
          targetGalaxyPlanetId: targetSelect.value,
        }, 'Экспедиция отправлена')) render();
      });
      launch.append(fleetSelect, targetSelect, preview, start);
      refresh();
    }
    const activeSection = document.createElement('section');
    activeSection.className = 'expedition-active';
    const activeTitle = document.createElement('h2');
    activeTitle.textContent = 'Активные экспедиции';
    activeSection.append(activeTitle);
    const activeFleets = state.fleets.filter(
      (fleet) => fleet.empireId === 'player' && fleet.mission?.kind === 'expedition',
    );
    for (const fleet of activeFleets) {
      const card = document.createElement('article');
      const summary = document.createElement('strong');
      summary.textContent = `${fleet.id} · ${fleet.mission?.targetPlanetId ?? 'unknown'}`;
      const recall = document.createElement('button');
      recall.type = 'button';
      recall.textContent = 'Отозвать';
      recall.addEventListener('click', () => {
        if (options.execute(
          { type: 'RECALL_FLEET', empireId: 'player', fleetId: fleet.id },
          'Экспедиция отозвана',
        )) render();
      });
      card.append(summary, recall);
      activeSection.append(card);
    }
    if (activeFleets.length === 0) activeSection.append('Активных экспедиций нет.');
    const reports = document.createElement('section');
    reports.className = 'expedition-reports';
    const reportsTitle = document.createElement('h2');
    reportsTitle.textContent = 'Журнал экспедиций';
    reports.append(reportsTitle);
    const entries = state.eventLog
      .filter((entry) => entry.event.payload.type === 'EXPEDITION_RESOLVE')
      .slice(-12)
      .reverse();
    for (const entry of entries) {
      if (entry.event.payload.type !== 'EXPEDITION_RESOLVE') continue;
      const report = entry.event.payload.report;
      if (report.empireId !== 'player') continue;
      const card = document.createElement('article');
      card.innerHTML = `<strong>${report.outcome} · ${report.targetGalaxyPlanetId}</strong><p>M ${report.reward.metal} · C ${report.reward.crystal} · G ${report.reward.gas}</p><small>${report.narrative}</small>`;
      reports.append(card);
    }
    if (reports.childElementCount === 1) reports.append('Завершённых экспедиций пока нет.');
    host.replaceChildren(launch, activeSection, reports);
  };

  const renderObjects = (state: GameState): void => {
    const launch = document.createElement('section');
    launch.className = 'space-objects-launch';
    const title = document.createElement('h2');
    title.textContent = 'Новая операция на объекте';
    const objectSelect = document.createElement('select');
    objectSelect.dataset.testid = 'space-object-target';
    for (const object of state.spaceObjects) {
      const option = document.createElement('option');
      option.value = object.id;
      option.textContent = `${OBJECT_LABELS[object.kind]} · ${object.systemId} · запас ${object.remainingYield}/${object.initialYield}`;
      objectSelect.append(option);
    }
    if (pendingObjectId !== null && [...objectSelect.options].some((option) => option.value === pendingObjectId)) {
      objectSelect.value = pendingObjectId;
    }
    const fleetSelect = document.createElement('select');
    const preview = document.createElement('p');
    preview.className = 'space-object-preview';
    const start = document.createElement('button');
    start.type = 'button';
    start.textContent = 'Подтвердить операцию';
    const refresh = (): void => {
      const current = options.getState();
      const object = current.spaceObjects.find((candidate) => candidate.id === objectSelect.value);
      fleetSelect.replaceChildren();
      if (object === undefined) {
        start.disabled = true;
        preview.textContent = 'Объект не найден.';
        return;
      }
      const unavailable = objectUnavailable(current, object);
      const fleets = compatibleFleets(current, object);
      for (const fleet of fleets) {
        const option = document.createElement('option');
        option.value = fleet.id;
        option.textContent = `${fleet.id} · ${getUnitDefinition(getRequiredSpaceObjectShipId(object.kind))?.name ?? getRequiredSpaceObjectShipId(object.kind)}`;
        fleetSelect.append(option);
      }
      const fleet = fleets.find((candidate) => candidate.id === fleetSelect.value) ?? fleets[0];
      if (unavailable !== null || fleet === undefined) {
        start.disabled = true;
        preview.textContent = unavailable ?? 'Нет совместимого флота.';
        return;
      }
      try {
        const estimate = estimateSpaceObjectMission(current, fleet, object);
        const originId = fleet.location.type === 'planet' ? fleet.location.planetId : undefined;
        const originGas = current.planets.find((planet) => planet.id === originId)?.economy.resources.gas.amount ?? 0;
        start.disabled = originGas < estimate.totalFuelCost;
        preview.textContent = `Дистанция ${estimate.distance} · цикл ${formatGameDuration(estimate.totalDurationSeconds)} · газ ${estimate.totalFuelCost}/${originGas} · риск ${object.hazardPermille / 10}%`;
      } catch {
        start.disabled = true;
        preview.textContent = 'Маршрут недоступен.';
      }
    };
    objectSelect.addEventListener('change', refresh);
    fleetSelect.addEventListener('change', refresh);
    start.addEventListener('click', () => {
      if (options.execute({
        type: 'START_SPACE_OBJECT_MISSION',
        empireId: 'player',
        fleetId: fleetSelect.value,
        objectId: objectSelect.value,
      }, 'Операция на космическом объекте начата')) {
        pendingObjectId = null;
        render();
      }
    });
    launch.append(title, objectSelect, fleetSelect, preview, start);
    refresh();
    const grid = document.createElement('section');
    grid.className = 'space-objects-grid';
    for (const object of state.spaceObjects) {
      const card = document.createElement('article');
      card.className = `space-object-card is-${object.kind}`;
      card.innerHTML = `<strong>${OBJECT_LABELS[object.kind]} · ${object.systemId}</strong><p>Запас ${object.remainingYield}/${object.initialYield} · риск ${object.hazardPermille / 10}%</p>`;
      grid.append(card);
    }
    host.replaceChildren(launch, grid);
  };

  const renderEvents = (state: GameState): void => {
    const status = document.createElement('section');
    status.className = 'world-events-status';
    const untilEvaluation = Math.max(0, state.worldEvents.nextEvaluationAt - state.clock.elapsedSeconds);
    status.innerHTML = `<h2>Состояние галактики</h2><p>Активно ${state.worldEvents.active.length} · следующая проверка через ${formatGameDuration(untilEvaluation)} · завершено ${state.worldEvents.history.length}</p>`;
    const activeEvents = document.createElement('section');
    activeEvents.className = 'world-events-active';
    const title = document.createElement('h2');
    title.textContent = 'Активные события и цели';
    activeEvents.append(title);
    for (const event of state.worldEvents.active) {
      const card = document.createElement('article');
      card.className = `world-event-card is-${event.definitionId}`;
      const definition = WORLD_EVENT_CATALOG[event.definitionId];
      card.innerHTML = `<strong>${definition.name}</strong><p>Цель: ${targetLabel(state, event)}</p><small>Осталось ${formatGameDuration(Math.max(0, event.endsAt - state.clock.elapsedSeconds))}</small>`;
      activeEvents.append(card);
    }
    if (state.worldEvents.active.length === 0) activeEvents.append('Активных мировых событий нет.');
    const history = document.createElement('section');
    history.className = 'world-events-history';
    const historyTitle = document.createElement('h2');
    historyTitle.textContent = 'История событий';
    history.append(historyTitle);
    for (const event of state.worldEvents.history.slice(-16).reverse()) {
      const card = document.createElement('article');
      card.innerHTML = `<strong>${WORLD_EVENT_CATALOG[event.definitionId].name}</strong><p>${targetLabel(state, event)}</p>`;
      history.append(card);
    }
    if (history.childElementCount === 1) history.append('История событий пока пуста.');
    host.replaceChildren(status, activeEvents, history);
  };

  const render = (): void => {
    if (!active) return;
    refreshTabs();
    const state = options.getState();
    if (mode === 'overview') renderOverview(state);
    else if (mode === 'expeditions') renderExpeditions(state);
    else if (mode === 'objects') renderObjects(state);
    else if (mode === 'events') renderEvents(state);
    else if (mode === 'market') {
      renderMarketPanel(host, { ...options, refresh: render });
    } else {
      renderLogisticsRoutesPanel(host, { ...options, refresh: render });
    }
  };

  const onTabClick = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('[data-operations-mode]');
    if (button === null) return;
    options.navigateToMode(button.dataset.operationsMode as OperationsShellMode);
  };
  tabs.addEventListener('click', onTabClick);

  const onObjectTarget = ((event: Event): void => {
    pendingObjectId = (event as CustomEvent<SpaceObjectTargetRequest>).detail.objectId;
    options.navigateToMode('objects');
  }) as EventListener;
  window.addEventListener(SPACE_OBJECT_TARGET_EVENT, onObjectTarget);

  const onSystemSelected = ((event: Event): void => {
    intelSearch = (event as CustomEvent<GalaxySystemSelectionDetail>).detail.systemName;
    options.navigateToMode('overview');
  }) as EventListener;
  window.addEventListener(GALAXY_SYSTEM_SELECTED_EVENT, onSystemSelected);

  return {
    activate: (nextMode) => {
      mode = MODES.includes(nextMode) ? nextMode : 'overview';
      active = true;
      render();
    },
    refresh: render,
    deactivate: () => { active = false; },
    dispose: () => {
      tabs.removeEventListener('click', onTabClick);
      window.removeEventListener(SPACE_OBJECT_TARGET_EVENT, onObjectTarget);
      window.removeEventListener(GALAXY_SYSTEM_SELECTED_EVENT, onSystemSelected);
      host.replaceChildren();
    },
  };
}
