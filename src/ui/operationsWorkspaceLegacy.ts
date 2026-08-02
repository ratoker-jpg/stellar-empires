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
  createPveOperationsView,
  filterPveOperationsView,
  type PveOpportunityEntry,
  type PveOpportunityKind,
} from '../simulation/pve/pveOperationsView';
import {
  estimateSpaceObjectMission,
  getRequiredSpaceObjectShipId,
  type SpaceObjectState,
} from '../simulation/pve/spaceObjects';
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
  dispatchSpaceObjectTarget,
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

const OPPORTUNITY_KIND_LABELS: Readonly<Record<PveOpportunityKind, string>> = {
  expedition: 'Экспедиция',
  'space-object': 'Космический объект',
  'pirate-base': 'Пиратская база',
  'world-event': 'Мировое событие',
};

const OPPORTUNITY_STATUS_LABELS = {
  'event-active': 'Активное событие',
  available: 'Доступно',
  'active-operation': 'Операция выполняется',
  recovering: 'Восстановление',
  unavailable: 'Недоступно',
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
  const opportunities = createPveOperationsView(state);
  return {
    activeRoutes: state.logisticsRoutes.filter(
      (route) => route.empireId === 'player' && route.status === 'active',
    ).length,
    totalRoutes: state.logisticsRoutes.filter((route) => route.empireId === 'player').length,
    marketTrades: state.market.trades.length,
    activeExpeditions: opportunities.filter(
      (entry) => entry.kind === 'expedition' && entry.status === 'active-operation',
    ).length,
    activeObjectOperations: opportunities.filter(
      (entry) => entry.kind === 'space-object' && entry.status === 'active-operation',
    ).length,
    availableObjects: opportunities.filter(
      (entry) => entry.kind === 'space-object' && entry.status === 'available',
    ).length,
    activeEvents: opportunities.filter((entry) => entry.kind === 'world-event').length,
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
  className = 'galaxy-intel-control',
): { readonly label: HTMLLabelElement; readonly select: HTMLSelectElement } {
  const label = document.createElement('label');
  label.className = className;
  const caption = document.createElement('span');
  caption.textContent = labelText;
  const select = document.createElement('select');
  select.setAttribute('aria-label', labelText);
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

function formatCoordinate(entry: PveOpportunityEntry): string {
  return `${entry.coordinate.galaxy}:${entry.coordinate.solarSystem}:${entry.coordinate.position}`;
}

function appendOpportunityDetail(
  list: HTMLUListElement,
  label: string,
  value: string | undefined,
): void {
  if (value === undefined) return;
  const item = document.createElement('li');
  const term = document.createElement('span');
  term.textContent = `${label}: `;
  const data = document.createElement('strong');
  data.textContent = value;
  item.append(term, data);
  list.append(item);
}

function opportunityActionLabel(entry: PveOpportunityEntry): string | null {
  if (entry.status === 'active-operation') return null;
  if (entry.kind === 'expedition' && entry.status === 'available') return 'Выбрать экспедицию';
  if (entry.kind === 'space-object' && entry.status === 'available') return 'Выбрать объект';
  if (entry.kind === 'pirate-base' && entry.status === 'available') return 'Подготовить атаку';
  if (entry.kind === 'world-event' && entry.eventDefinitionId === 'mineral-bloom') return 'Открыть объект';
  if (entry.kind === 'world-event' && entry.eventDefinitionId === 'pirate-hunt') return 'Подготовить атаку';
  return null;
}

function createOpportunityCard(
  state: GameState,
  entry: PveOpportunityEntry,
  onAction: (entry: PveOpportunityEntry) => void,
): HTMLElement {
  const card = document.createElement('article');
  card.className = `pve-opportunity-card is-${entry.status}`;
  card.dataset.opportunityKind = entry.kind;
  card.dataset.opportunityStatus = entry.status;
  card.dataset.targetId = entry.targetId;

  const header = document.createElement('header');
  const title = document.createElement('strong');
  title.textContent = entry.title;
  const badge = document.createElement('span');
  badge.className = 'pve-opportunity-status';
  badge.textContent = OPPORTUNITY_STATUS_LABELS[entry.status];
  header.append(title, badge);

  const context = document.createElement('p');
  context.textContent = `${OPPORTUNITY_KIND_LABELS[entry.kind]} · ${formatCoordinate(entry)} · ${entry.availabilityExplanation}`;

  const details = document.createElement('ul');
  details.className = 'pve-opportunity-details';
  appendOpportunityDetail(details, 'Нужная роль', entry.requiredShipRole);
  appendOpportunityDetail(details, 'Флот', entry.activeFleetId);
  appendOpportunityDetail(
    details,
    'Цикл',
    entry.flightDurationSeconds === undefined
      ? undefined
      : formatGameDuration(entry.flightDurationSeconds),
  );
  appendOpportunityDetail(
    details,
    'Газ',
    entry.fuelRequired === undefined ? undefined : String(entry.fuelRequired),
  );
  appendOpportunityDetail(
    details,
    'Запас',
    entry.yieldRemaining === undefined || entry.yieldInitial === undefined
      ? undefined
      : `${entry.yieldRemaining}/${entry.yieldInitial}`,
  );
  appendOpportunityDetail(
    details,
    'Риск',
    entry.hazardPermille === undefined ? undefined : `${entry.hazardPermille / 10}%`,
  );
  appendOpportunityDetail(
    details,
    'Контроль',
    entry.controllerEmpireId === undefined
      ? undefined
      : entry.controllerEmpireId ?? 'нет',
  );
  appendOpportunityDetail(
    details,
    'Восстановление',
    entry.recoveryAt === undefined
      ? undefined
      : entry.recoveryAt <= state.clock.elapsedSeconds
        ? 'при ближайшей проверке'
        : `через ${formatGameDuration(entry.recoveryAt - state.clock.elapsedSeconds)}`,
  );
  appendOpportunityDetail(
    details,
    'Событие завершится',
    entry.eventEndsAt === undefined
      ? undefined
      : `через ${formatGameDuration(Math.max(0, entry.eventEndsAt - state.clock.elapsedSeconds))}`,
  );
  appendOpportunityDetail(
    details,
    'Множитель награды',
    entry.rewardMultiplierPermille === undefined
      ? undefined
      : `${entry.rewardMultiplierPermille / 10}%`,
  );
  appendOpportunityDetail(
    details,
    'Множитель угрозы',
    entry.threatMultiplierPermille === undefined
      ? undefined
      : `${entry.threatMultiplierPermille / 10}%`,
  );

  card.append(header, context);
  if (details.childElementCount > 0) card.append(details);
  const actionLabel = opportunityActionLabel(entry);
  if (actionLabel !== null) {
    const action = document.createElement('button');
    action.type = 'button';
    action.textContent = actionLabel;
    action.addEventListener('click', () => onAction(entry));
    card.append(action);
  }
  return card;
}

function createOpportunitySection(
  state: GameState,
  entries: readonly PveOpportunityEntry[],
  titleText: string,
  onAction: (entry: PveOpportunityEntry) => void,
): HTMLElement {
  const section = document.createElement('section');
  section.className = 'pve-opportunity-intelligence';
  section.dataset.testid = 'pve-opportunity-intelligence';
  const heading = document.createElement('h2');
  heading.textContent = titleText;
  const grid = document.createElement('div');
  grid.className = 'pve-opportunity-grid';
  for (const entry of entries) grid.append(createOpportunityCard(state, entry, onAction));
  if (entries.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'Подходящих PvE-возможностей сейчас нет.';
    grid.append(empty);
  }
  section.append(heading, grid);
  return section;
}

export function mountOperationsWorkspace(options: OperationsWorkspaceOptions): OperationsWorkspace {
  const host = requireElement<HTMLElement>('#operations-workspace-host');
  const tabs = requireElement<HTMLElement>('#operations-route-tabs');
  let mode: OperationsShellMode = 'overview';
  let active = false;
  let pendingObjectId: string | null = null;
  let pendingExpeditionId: string | null = null;
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

  const chooseOpportunity = (entry: PveOpportunityEntry): void => {
    if (entry.kind === 'expedition') {
      pendingExpeditionId = entry.targetId;
      options.navigateToMode('expeditions');
      return;
    }
    if (entry.kind === 'space-object' || entry.eventDefinitionId === 'mineral-bloom') {
      dispatchSpaceObjectTarget({ objectId: entry.targetId, label: entry.title });
      return;
    }
    if (entry.kind === 'pirate-base' || entry.eventDefinitionId === 'pirate-hunt') {
      dispatchFleetMissionTarget({
        targetId: entry.targetId,
        label: entry.title,
        mission: 'attack',
      });
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
      createMetric('Объекты', String(data.availableObjects), 'доступно сейчас'),
      createMetric('События', String(data.activeEvents), 'активно'),
      createMetric('Отчёты', String(data.reports), 'в журнале'),
      createMetric('Экзоматерия', String(data.exoticMatter), 'резерв'),
    );

    const opportunities = createOpportunitySection(
      state,
      createPveOperationsView(state).slice(0, 12),
      'Приоритетные PvE-возможности',
      chooseOpportunity,
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
    search.setAttribute('aria-label', 'Поиск по галактической разведке');
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
    size.setAttribute('aria-label', 'Минимальный размер планеты');
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
      const update = (): void => {
        intelSearch = search.value;
        intelOwner = owner.select.value as GalaxyOwnerFilter;
        intelVisibility = visibility.select.value as GalaxyIntelVisibility | 'all';
        intelBiome = biome.select.value as PlanetBiome | 'all';
        intelMinimumSize = Number(size.value) || 0;
        render();
      };
      input.addEventListener('input', update);
      input.addEventListener('change', update);
    }
    intel.append(heading, controls, intelSummary, results);
    host.replaceChildren(summary, opportunities, launchers, intel);
  };

  const renderExpeditions = (state: GameState): void => {
    const allEntries = createPveOperationsView(state);
    const entries = filterPveOperationsView(allEntries, ['expedition']);
    const launch = document.createElement('section');
    launch.className = 'expedition-launch';
    const title = document.createElement('h2');
    title.textContent = 'Новая экспедиция';
    launch.append(title);
    const fleets = expeditionFleets(state);
    const targets = entries.filter((entry) => entry.status !== 'active-operation');
    if (fleets.length === 0 || targets.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = fleets.length === 0
        ? 'Нужен станционированный флот минимум с одним разведчиком.'
        : 'Свободных позиций для экспедиции нет.';
      launch.append(empty);
    } else {
      const fleetControl = createSelect(
        'Флот экспедиции',
        fleets.map((fleet) => ({
          value: fleet.id,
          label: `${fleet.id} · скорость ${fleet.speed} · разведчиков ${getShipCountByRole(fleet.ships, 'scout')}`,
        })),
        fleets[0]?.id ?? '',
        'pve-form-control',
      );
      const targetControl = createSelect(
        'Цель экспедиции',
        targets.map((entry) => ({ value: entry.targetId, label: entry.title })),
        pendingExpeditionId ?? targets[0]?.targetId ?? '',
        'pve-form-control',
      );
      if (![...targetControl.select.options].some((option) => option.value === targetControl.select.value)) {
        targetControl.select.value = targets[0]?.targetId ?? '';
      }
      const preview = document.createElement('p');
      preview.className = 'expedition-preview';
      const start = document.createElement('button');
      start.type = 'button';
      start.textContent = 'Подтвердить экспедицию';
      const refresh = (): void => {
        const current = options.getState();
        const fleet = current.fleets.find((candidate) => candidate.id === fleetControl.select.value);
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
            targetControl.select.value,
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
      fleetControl.select.addEventListener('change', refresh);
      targetControl.select.addEventListener('change', refresh);
      start.addEventListener('click', () => {
        if (options.execute({
          type: 'START_EXPEDITION',
          empireId: 'player',
          fleetId: fleetControl.select.value,
          targetGalaxyPlanetId: targetControl.select.value,
        }, 'Экспедиция отправлена')) {
          pendingExpeditionId = null;
          render();
        }
      });
      launch.append(fleetControl.label, targetControl.label, preview, start);
      refresh();
    }

    const opportunitySection = createOpportunitySection(
      state,
      entries,
      'Экспедиционные возможности',
      chooseOpportunity,
    );

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
    const reportEntries = createUnifiedMissionReports(state)
      .filter((report) => report.kind === 'expedition' && report.primaryEmpireId === 'player')
      .slice(0, 12);
    for (const report of reportEntries) {
      const card = document.createElement('article');
      const reportTitle = document.createElement('strong');
      reportTitle.textContent = `${report.title} · ${report.targetId}`;
      const reward = document.createElement('p');
      reward.textContent = `M ${report.reward.metal} · C ${report.reward.crystal} · G ${report.reward.gas}`;
      const narrative = document.createElement('small');
      narrative.textContent = report.summary;
      card.append(reportTitle, reward, narrative);
      reports.append(card);
    }
    if (reportEntries.length === 0) reports.append('Завершённых экспедиций пока нет.');
    host.replaceChildren(launch, opportunitySection, activeSection, reports);
  };

  const renderObjects = (state: GameState): void => {
    const entries = filterPveOperationsView(createPveOperationsView(state), ['space-object']);
    const launch = document.createElement('section');
    launch.className = 'space-objects-launch';
    const title = document.createElement('h2');
    title.textContent = 'Новая операция на объекте';
    const objectControl = createSelect(
      'Космический объект',
      state.spaceObjects.map((object) => ({
        value: object.id,
        label: `${OBJECT_LABELS[object.kind]} · ${object.systemId} · запас ${object.remainingYield}/${object.initialYield}`,
      })),
      pendingObjectId ?? state.spaceObjects[0]?.id ?? '',
      'pve-form-control',
    );
    objectControl.select.dataset.testid = 'space-object-target';
    const fleetControl = createSelect('Флот операции', [], '', 'pve-form-control');
    const preview = document.createElement('p');
    preview.className = 'space-object-preview';
    const start = document.createElement('button');
    start.type = 'button';
    start.textContent = 'Подтвердить операцию';
    const refresh = (): void => {
      const current = options.getState();
      const object = current.spaceObjects.find((candidate) => candidate.id === objectControl.select.value);
      fleetControl.select.replaceChildren();
      if (object === undefined) {
        start.disabled = true;
        preview.textContent = 'Объект не найден.';
        return;
      }
      const opportunity = createPveOperationsView(current).find(
        (entry) => entry.kind === 'space-object' && entry.targetId === object.id,
      );
      const fleets = compatibleFleets(current, object);
      for (const fleet of fleets) {
        const option = document.createElement('option');
        option.value = fleet.id;
        option.textContent = `${fleet.id} · ${getUnitDefinition(getRequiredSpaceObjectShipId(object.kind))?.name ?? getRequiredSpaceObjectShipId(object.kind)}`;
        fleetControl.select.append(option);
      }
      const fleet = fleets.find((candidate) => candidate.id === fleetControl.select.value) ?? fleets[0];
      if (opportunity === undefined || opportunity.status !== 'available' || fleet === undefined) {
        start.disabled = true;
        preview.textContent = opportunity?.availabilityExplanation ?? 'Нет совместимого флота.';
        return;
      }
      try {
        const estimate = estimateSpaceObjectMission(current, fleet, object);
        const originId = fleet.location.type === 'planet' ? fleet.location.planetId : undefined;
        const originGas = current.planets.find((planet) => planet.id === originId)?.economy.resources.gas.amount ?? 0;
        start.disabled = originGas < estimate.totalFuelCost;
        preview.textContent = `Дистанция ${estimate.distance} · цикл ${formatGameDuration(estimate.totalDurationSeconds)} · газ ${estimate.totalFuelCost}/${originGas} · риск ${(opportunity.hazardPermille ?? object.hazardPermille) / 10}%`;
      } catch {
        start.disabled = true;
        preview.textContent = 'Маршрут недоступен.';
      }
    };
    objectControl.select.addEventListener('change', refresh);
    fleetControl.select.addEventListener('change', refresh);
    start.addEventListener('click', () => {
      if (options.execute({
        type: 'START_SPACE_OBJECT_MISSION',
        empireId: 'player',
        fleetId: fleetControl.select.value,
        objectId: objectControl.select.value,
      }, 'Операция на космическом объекте начата')) {
        pendingObjectId = null;
        render();
      }
    });
    launch.append(title, objectControl.label, fleetControl.label, preview, start);
    refresh();

    const opportunitySection = createOpportunitySection(
      state,
      entries,
      'Космические объекты',
      chooseOpportunity,
    );
    host.replaceChildren(launch, opportunitySection);
  };

  const renderEvents = (state: GameState): void => {
    const entries = filterPveOperationsView(
      createPveOperationsView(state),
      ['world-event', 'pirate-base'],
    );
    const status = document.createElement('section');
    status.className = 'world-events-status';
    const heading = document.createElement('h2');
    heading.textContent = 'Состояние галактики';
    const untilEvaluation = Math.max(0, state.worldEvents.nextEvaluationAt - state.clock.elapsedSeconds);
    const detail = document.createElement('p');
    detail.textContent = `Активно ${state.worldEvents.active.length} · следующая проверка через ${formatGameDuration(untilEvaluation)} · завершено ${state.worldEvents.history.length}`;
    status.append(heading, detail);
    const opportunities = createOpportunitySection(
      state,
      entries,
      'События и пиратские цели',
      chooseOpportunity,
    );
    host.replaceChildren(status, opportunities);
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
    deactivate: () => {
      active = false;
      host.replaceChildren();
    },
    dispose: () => {
      active = false;
      tabs.removeEventListener('click', onTabClick);
      window.removeEventListener(SPACE_OBJECT_TARGET_EVENT, onObjectTarget);
      window.removeEventListener(GALAXY_SYSTEM_SELECTED_EVENT, onSystemSelected);
      host.replaceChildren();
    },
  };
}
