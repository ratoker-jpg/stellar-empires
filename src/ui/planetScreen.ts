import type { AegisVerticalSliceAsset } from '../assets/aegisVerticalSliceAssets';
import { getBuildingDefinition } from '../simulation/planet/buildingCatalog';
import { getBuildingLevel } from '../simulation/planet/buildingProgression';
import {
  PLANET_DEVELOPMENT_TEMPLATES,
  PLANET_SPECIALIZATIONS,
} from '../simulation/planet/specialization';
import type { PlanetState, PlanetZoneId } from '../simulation/planet/types';
import { executeCommand } from '../simulation/reducer';
import type { GameCommand, GameState } from '../simulation/types';
import { createIndustryZoneViewModel } from './industryZoneViewModel';
import { createMilitaryZoneViewModel } from './militaryZoneViewModel';
import {
  createBuildingCardViewModels,
  formatGameDuration,
  type BuildingCardViewModel,
} from './planetViewModel';
import { createResourceZoneViewModel } from './resourceZoneViewModel';

const NUMBER_FORMAT = new Intl.NumberFormat('ru-RU');
const ZONE_IDS: readonly PlanetZoneId[] = ['resource', 'industry', 'military'];
const WORKSPACE_MODES = ['overview', ...ZONE_IDS] as const;

type PlanetWorkspaceMode = (typeof WORKSPACE_MODES)[number];

const ZONE_LABELS: Readonly<Record<PlanetZoneId, string>> = {
  resource: 'Ресурсная',
  industry: 'Промышленная',
  military: 'Военная',
};

const ZONE_DESCRIPTIONS: Readonly<Record<PlanetZoneId, string>> = {
  resource: 'Добывающие комплексы, энергетика и устойчивость ресурсного контура.',
  industry: 'Командование, исследования, производство кораблей и логистика колонии.',
  military: 'Сенсоры, оборонительная сеть, ремонт и готовность планетарного гарнизона.',
};

let currentState: GameState | undefined;
let activePlanetId: string | undefined;
let activeMode: PlanetWorkspaceMode = 'overview';
let selectedBuildingId: string | undefined;
let statusWriter: (message: string) => void = () => undefined;
let stateObserver: (state: GameState) => void = () => undefined;

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`Required element not found: ${selector}`);
  }
  return element;
}

function requireState(): GameState {
  if (currentState === undefined) {
    throw new Error('Planet screen is not mounted.');
  }
  return currentState;
}

function getPlayerPlanets(): readonly PlanetState[] {
  return requireState().planets.filter(
    (candidate) => candidate.ownerEmpireId === 'player',
  );
}

function getPlayerPlanet(): PlanetState {
  const planets = getPlayerPlanets();
  const planet =
    planets.find((candidate) => candidate.id === activePlanetId) ?? planets[0];
  if (planet === undefined) {
    throw new Error('Player planet is missing from the current game state.');
  }
  activePlanetId = planet.id;
  return planet;
}

function formatWorldTime(seconds: number): string {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const remainingSeconds = seconds % 60;
  const time = [hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
  return days === 0 ? time : `${days}д ${time}`;
}

function formatPercent(permille: number): string {
  return `${permille / 10}%`;
}

function sumRecord(record: Readonly<Record<string, number>>): number {
  return Object.values(record).reduce((total, value) => total + value, 0);
}

function setText(selector: string, value: string): void {
  requireElement<HTMLElement>(selector).textContent = value;
}

function applyCommand(command: GameCommand, successMessage: string): boolean {
  const result = executeCommand(requireState(), command);
  if (!result.ok) {
    statusWriter(`Отклонено · ${result.code}`);
    return false;
  }
  currentState = result.value;
  stateObserver(currentState);
  statusWriter(successMessage);
  renderPlanetDashboard();
  return true;
}

function ensureWorkspaceDialog(): HTMLDialogElement {
  const existing = document.querySelector<HTMLDialogElement>('#workspace-dialog');
  if (existing !== null) return existing;

  const dialog = document.createElement('dialog');
  dialog.id = 'workspace-dialog';
  dialog.className = 'workspace-dialog';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'workspace-dialog__close';
  close.textContent = '×';
  close.setAttribute('aria-label', 'Закрыть экран');
  close.addEventListener('click', () => dialog.close());
  const content = document.createElement('div');
  content.id = 'workspace-dialog-content';
  dialog.append(close, content);
  document.body.append(dialog);
  return dialog;
}

function openWorkspace(title: string, description: string, unlocked: boolean): void {
  const dialog = ensureWorkspaceDialog();
  const content = requireElement<HTMLElement>('#workspace-dialog-content');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'panel-label';
  eyebrow.textContent = unlocked ? 'Рабочий экран' : 'Контур заблокирован';
  const heading = document.createElement('h2');
  heading.textContent = title;
  const text = document.createElement('p');
  text.textContent = description;
  const state = document.createElement('strong');
  state.className = unlocked ? 'workspace-state is-ready' : 'workspace-state';
  state.textContent = unlocked
    ? 'Доменное подключение активно. Откройте соответствующий раздел основного HUD.'
    : 'Сначала выполните требования на планете.';
  content.replaceChildren(eyebrow, heading, text, state);
  dialog.showModal();
}

function createLabelValue(label: string, value: string, className = ''): HTMLElement {
  const row = document.createElement('div');
  row.className = `planet-context-stat${className === '' ? '' : ` ${className}`}`;
  const term = document.createElement('span');
  term.textContent = label;
  const output = document.createElement('strong');
  output.textContent = value;
  row.append(term, output);
  return row;
}

function createProgressMetric(
  label: string,
  value: number,
  maximum: number,
  detail: string,
): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'planet-progress-metric';
  const heading = document.createElement('div');
  const title = document.createElement('span');
  title.textContent = label;
  const output = document.createElement('strong');
  output.textContent = detail;
  heading.append(title, output);
  const track = document.createElement('div');
  track.className = 'planet-progress-track';
  const fill = document.createElement('i');
  fill.style.width = `${Math.min(100, Math.max(0, maximum === 0 ? 0 : (value * 100) / maximum))}%`;
  track.append(fill);
  wrapper.append(heading, track);
  return wrapper;
}

function createGatewayButton(
  title: string,
  hint: string,
  unlocked: boolean,
  onOpen: () => void,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `zone-gateway${unlocked ? ' is-ready' : ''}`;
  const label = document.createElement('strong');
  label.textContent = title;
  const description = document.createElement('span');
  description.textContent = hint;
  button.append(label, description);
  button.addEventListener('click', onOpen);
  return button;
}

function setBuildingArtwork(element: HTMLElement, asset: AegisVerticalSliceAsset): void {
  const column = asset.frame.x / asset.frame.width;
  const row = asset.frame.y / asset.frame.height;
  element.style.backgroundImage = `url("${asset.atlasUrl}")`;
  element.style.backgroundSize = '400% 200%';
  element.style.backgroundPosition = `${column === 0 ? 0 : (column / 3) * 100}% ${row === 0 ? 0 : 100}%`;
}

function getZoneBuildingCards(planet: PlanetState, zoneId: PlanetZoneId): readonly BuildingCardViewModel[] {
  return createBuildingCardViewModels(planet).filter((candidate) => candidate.zoneId === zoneId);
}

function selectDefaultBuilding(planet: PlanetState, zoneId: PlanetZoneId): void {
  const cards = getZoneBuildingCards(planet, zoneId);
  if (!cards.some((card) => card.id === selectedBuildingId)) {
    selectedBuildingId = cards[0]?.id;
  }
}

function createBuildingNode(card: BuildingCardViewModel, planet: PlanetState): HTMLElement {
  const article = document.createElement('article');
  article.className = `planet-building-node${card.available ? '' : ' is-locked'}${selectedBuildingId === card.id ? ' is-selected' : ''}`;
  article.setAttribute('role', 'listitem');

  const selector = document.createElement('button');
  selector.type = 'button';
  selector.className = 'planet-building-node__selector';
  selector.setAttribute('aria-label', `Выбрать ${card.name}`);
  selector.setAttribute('aria-pressed', String(selectedBuildingId === card.id));
  selector.addEventListener('click', () => {
    selectedBuildingId = card.id;
    renderPlanetZoneStage(planet);
    renderPlanetDetails(planet);
  });

  const artwork = document.createElement('span');
  artwork.className = 'building-art planet-building-node__art';
  artwork.setAttribute('role', 'img');
  artwork.setAttribute('aria-label', card.name);
  setBuildingArtwork(artwork, card.asset);

  const body = document.createElement('span');
  body.className = 'planet-building-node__body';
  const meta = document.createElement('span');
  meta.className = 'planet-building-node__meta';
  meta.textContent = `Уровень ${card.level}/${card.maxLevel}`;
  const title = document.createElement('strong');
  title.textContent = card.name;
  const status = document.createElement('small');
  status.textContent = card.available
    ? `Готово к уровню ${card.targetLevel}`
    : (card.blockReason ?? 'Недоступно');
  body.append(meta, title, status);
  selector.append(artwork, body);
  article.append(selector);
  return article;
}

function renderPlanetSelector(planet: PlanetState): void {
  const selector = requireElement<HTMLSelectElement>('#planet-selector');
  const planets = getPlayerPlanets();
  selector.replaceChildren();
  for (const candidate of planets) {
    const option = document.createElement('option');
    option.value = candidate.id;
    option.textContent = `${candidate.name} · ${candidate.systemId}:${candidate.position}`;
    selector.append(option);
  }
  selector.value = planet.id;
  setText('#planet-role-label', planets[0]?.id === planet.id ? 'Домашняя колония' : 'Колониальный мир');
}

function renderModeTabs(planet: PlanetState): void {
  for (const mode of WORKSPACE_MODES) {
    const button = requireElement<HTMLButtonElement>(`[data-planet-mode="${mode}"]`);
    const active = mode === activeMode;
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  }

  for (const zoneId of ZONE_IDS) {
    const zone = planet.zones[zoneId];
    setText(`#zone-${zoneId}-fields`, `${zone.usedFields} / ${zone.fieldLimit}`);
  }
}

function renderOverviewContext(planet: PlanetState, panel: HTMLElement): void {
  const eyebrow = document.createElement('p');
  eyebrow.className = 'panel-label';
  eyebrow.textContent = 'Паспорт колонии';
  const heading = document.createElement('h2');
  heading.textContent = planet.name;
  const badge = document.createElement('span');
  badge.className = 'planet-context-badge';
  badge.textContent = planet.factionId.toUpperCase();
  const header = document.createElement('div');
  header.className = 'planet-context-heading';
  header.append(heading, badge);

  const specialization = PLANET_SPECIALIZATIONS[planet.specializationId];
  const description = document.createElement('p');
  description.className = 'planet-context-description';
  description.textContent = specialization.description;

  const resourceStock = Object.values(planet.economy.resources)
    .reduce((total, stock) => total + stock.amount, 0);
  const stats = document.createElement('div');
  stats.className = 'planet-context-stats';
  stats.append(
    createLabelValue('Координаты', `${planet.systemId}:${planet.position}`),
    createLabelValue('Роль', specialization.name),
    createLabelValue('Ресурсный запас', NUMBER_FORMAT.format(resourceStock)),
    createLabelValue('Население', `${planet.economy.population.used} / ${planet.economy.population.capacity}`),
    createLabelValue('Стабильность', formatPercent(planet.economy.stability.efficiencyPermille)),
    createLabelValue('Состояние', planet.economy.stability.efficiencyPermille >= 900 ? 'Стабильно' : 'Требует внимания'),
  );
  panel.replaceChildren(eyebrow, header, description, stats);
}

function renderResourceContext(planet: PlanetState, panel: HTMLElement): void {
  const view = createResourceZoneViewModel(planet);
  const eyebrow = document.createElement('p');
  eyebrow.className = 'panel-label';
  eyebrow.textContent = 'Ресурсный контур';
  const heading = document.createElement('h2');
  heading.textContent = 'Добыча и снабжение';
  const metrics = document.createElement('div');
  metrics.className = 'planet-context-progress-list';
  for (const stock of view.stocks) {
    const label = stock.id === 'metal' ? 'Металл' : stock.id === 'crystal' ? 'Минералы' : 'Газ';
    metrics.append(
      createProgressMetric(
        label,
        stock.amount,
        stock.capacity,
        `${NUMBER_FORMAT.format(stock.amount)} · +${NUMBER_FORMAT.format(stock.productionPerHour)}/ч`,
      ),
    );
  }
  const stats = document.createElement('div');
  stats.className = 'planet-context-stats';
  stats.append(
    createLabelValue('Население', `${view.populationUsed} / ${view.populationCapacity}`),
    createLabelValue('Энергия', formatPercent(view.energyEfficiencyPermille)),
    createLabelValue('Стабильность', formatPercent(view.stabilityEfficiencyPermille)),
    createLabelValue('Итоговая эффективность', formatPercent(view.productionEfficiencyPermille), 'is-accent'),
  );
  panel.replaceChildren(eyebrow, heading, metrics, stats);
}

function renderIndustryContext(planet: PlanetState, panel: HTMLElement): void {
  const view = createIndustryZoneViewModel(planet);
  const eyebrow = document.createElement('p');
  eyebrow.className = 'panel-label';
  eyebrow.textContent = 'Промышленный контур';
  const heading = document.createElement('h2');
  heading.textContent = 'Шлюзы производства';
  const gateways = document.createElement('div');
  gateways.className = 'zone-context-content';

  for (const gateway of view.gateways) {
    gateways.append(
      createGatewayButton(gateway.label, gateway.hint, gateway.unlocked, () => {
        openWorkspace(
          gateway.label,
          gateway.id === 'research'
            ? 'Глобальные исследования открываются через лабораторию промышленной зоны.'
            : 'Производство кораблей открывается через верфь промышленной зоны.',
          gateway.unlocked,
        );
      }),
    );
  }

  const commandLevel = getBuildingLevel(planet.buildings, 'building.aegis.command');
  const storageCapacity = Object.values(planet.economy.resources)
    .reduce((total, stock) => total + stock.capacity, 0);
  gateways.append(
    createGatewayButton(
      'Склады и логистика',
      commandLevel > 0 ? `Совокупная ёмкость ${NUMBER_FORMAT.format(storageCapacity)}` : 'Требуется центр командования',
      commandLevel > 0,
      () => openWorkspace(
        'Склады и логистика',
        'Маршруты снабжения и управление резервами используют промышленный контур колонии.',
        commandLevel > 0,
      ),
    ),
  );

  panel.replaceChildren(eyebrow, heading, gateways);
}

function renderMilitaryContext(planet: PlanetState, panel: HTMLElement): void {
  const view = createMilitaryZoneViewModel(planet);
  const activeDefenses = sumRecord(planet.inventory.defenses);
  const damagedDefenses = sumRecord(planet.defense.damaged);
  const queuedRepairs = planet.defense.repairQueue.reduce((total, item) => total + item.quantity, 0);
  const readiness = activeDefenses + damagedDefenses === 0
    ? 100
    : Math.max(0, Math.round((activeDefenses * 100) / (activeDefenses + damagedDefenses)));

  const eyebrow = document.createElement('p');
  eyebrow.className = 'panel-label';
  eyebrow.textContent = 'Военный контур';
  const heading = document.createElement('h2');
  heading.textContent = 'Оборонительная сеть';
  const stats = document.createElement('div');
  stats.className = 'planet-context-stats';
  const militaryZone = planet.zones.military;
  stats.append(
    createLabelValue('Активные установки', NUMBER_FORMAT.format(activeDefenses)),
    createLabelValue('Повреждено', NUMBER_FORMAT.format(damagedDefenses), damagedDefenses > 0 ? 'is-warning' : ''),
    createLabelValue('В ремонте', NUMBER_FORMAT.format(queuedRepairs)),
    createLabelValue('Ёмкость сети', `${militaryZone.usedFields} / ${militaryZone.fieldLimit}`),
    createLabelValue('Угроза', damagedDefenses > 0 ? 'Повышенная' : 'Контролируемая', damagedDefenses > 0 ? 'is-warning' : ''),
    createLabelValue('Боеготовность', `${readiness}%`, readiness < 75 ? 'is-warning' : 'is-accent'),
  );

  const gateways = document.createElement('div');
  gateways.className = 'zone-context-content';
  for (const gateway of view.gateways) {
    gateways.append(
      createGatewayButton(gateway.label, gateway.hint, gateway.unlocked, () => {
        openWorkspace(
          gateway.label,
          gateway.id === 'defense'
            ? 'Планетарная оборона использует военную инфраструктуру и очередь ремонта.'
            : 'Командование флотом связывает планету с миссиями и сенсорной сетью.',
          gateway.unlocked,
        );
      }),
    );
  }
  panel.replaceChildren(eyebrow, heading, stats, gateways);
}

function renderPlanetContext(planet: PlanetState): void {
  const panel = requireElement<HTMLElement>('#planet-context-panel');
  panel.dataset.mode = activeMode;
  if (activeMode === 'overview') {
    renderOverviewContext(planet, panel);
  } else if (activeMode === 'resource') {
    renderResourceContext(planet, panel);
  } else if (activeMode === 'industry') {
    renderIndustryContext(planet, panel);
  } else {
    renderMilitaryContext(planet, panel);
  }
}

function createZoneMarker(planet: PlanetState, zoneId: PlanetZoneId): HTMLButtonElement {
  const zone = planet.zones[zoneId];
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `planet-zone-marker planet-zone-marker--${zoneId}`;
  const label = document.createElement('span');
  label.textContent = ZONE_LABELS[zoneId];
  const fill = document.createElement('strong');
  fill.textContent = `${zone.usedFields}/${zone.fieldLimit}`;
  button.append(label, fill);
  button.addEventListener('click', () => setPlanetMode(zoneId));
  return button;
}

function renderPlanetOverview(planet: PlanetState): void {
  const overview = requireElement<HTMLElement>('#planet-overview-stage');
  const zoneStage = requireElement<HTMLElement>('#planet-zone-stage');
  overview.hidden = false;
  zoneStage.hidden = true;

  const hero = document.createElement('div');
  hero.className = 'planet-overview-hero';
  const visual = document.createElement('div');
  visual.className = 'planet-visual';
  visual.dataset.faction = planet.factionId;
  const orbit = document.createElement('div');
  orbit.className = 'planet-orbit';
  const sphere = document.createElement('div');
  sphere.className = 'planet-sphere';
  sphere.setAttribute('role', 'img');
  sphere.setAttribute('aria-label', `Планета ${planet.name}`);
  visual.append(orbit, sphere);

  const copy = document.createElement('div');
  copy.className = 'planet-overview-copy';
  const eyebrow = document.createElement('p');
  eyebrow.className = 'panel-label';
  eyebrow.textContent = `${planet.systemId}:${planet.position} · ${planet.factionId.toUpperCase()}`;
  const heading = document.createElement('h2');
  heading.textContent = planet.name;
  const specialization = PLANET_SPECIALIZATIONS[planet.specializationId];
  const text = document.createElement('p');
  text.textContent = `${specialization.name}. ${specialization.description}`;
  copy.append(eyebrow, heading, text);
  hero.append(visual, copy);

  const markers = document.createElement('div');
  markers.className = 'planet-zone-markers';
  for (const zoneId of ZONE_IDS) markers.append(createZoneMarker(planet, zoneId));

  const overviewStock = Object.values(planet.economy.resources)
    .reduce((total, stock) => total + stock.amount, 0);
  const metrics = document.createElement('div');
  metrics.className = 'planet-overview-metrics';
  metrics.append(
    createLabelValue('Ресурсы', NUMBER_FORMAT.format(overviewStock)),
    createLabelValue('Население', `${planet.economy.population.used} / ${planet.economy.population.capacity}`),
    createLabelValue('Энергия', `${planet.economy.energy.produced} / ${planet.economy.energy.consumed}`),
    createLabelValue('Стабильность', formatPercent(planet.economy.stability.efficiencyPermille)),
    createLabelValue('Очередь', planet.buildQueue.length === 0 ? 'Свободна' : 'Активна'),
  );
  overview.replaceChildren(hero, markers, metrics);
}

function renderPlanetZoneStage(planet: PlanetState): void {
  const overview = requireElement<HTMLElement>('#planet-overview-stage');
  const zoneStage = requireElement<HTMLElement>('#planet-zone-stage');
  overview.hidden = true;
  zoneStage.hidden = false;
  if (activeMode === 'overview') return;

  selectDefaultBuilding(planet, activeMode);
  zoneStage.dataset.zone = activeMode;
  setText('#planet-zone-title', `${ZONE_LABELS[activeMode]} зона`);
  setText('#planet-zone-description', ZONE_DESCRIPTIONS[activeMode]);
  setText(
    '#planet-zone-kicker',
    activeMode === 'resource'
      ? 'Добывающий сектор'
      : activeMode === 'industry'
        ? 'Производственный сектор'
        : 'Оборонительный сектор',
  );

  const grid = requireElement<HTMLElement>('#planet-building-grid');
  grid.replaceChildren();
  for (const card of getZoneBuildingCards(planet, activeMode)) {
    grid.append(createBuildingNode(card, planet));
  }
}

function renderPlanetStage(planet: PlanetState): void {
  if (activeMode === 'overview') {
    renderPlanetOverview(planet);
  } else {
    renderPlanetZoneStage(planet);
  }
}

function createCostElement(card: BuildingCardViewModel): HTMLElement {
  const cost = document.createElement('div');
  cost.className = 'building-cost planet-details-cost';
  for (const [label, value] of [
    ['Металл', card.cost.metal],
    ['Минералы', card.cost.crystal],
    ['Газ', card.cost.gas],
  ] as const) {
    const item = document.createElement('span');
    const name = document.createElement('small');
    name.textContent = label;
    const amount = document.createElement('strong');
    amount.textContent = NUMBER_FORMAT.format(value);
    item.append(name, amount);
    cost.append(item);
  }
  return cost;
}

function renderOverviewDetails(planet: PlanetState, panel: HTMLElement): void {
  const specialization = PLANET_SPECIALIZATIONS[planet.specializationId];
  const template = PLANET_DEVELOPMENT_TEMPLATES[planet.developmentTemplateId];
  const eyebrow = document.createElement('p');
  eyebrow.className = 'panel-label';
  eyebrow.textContent = 'Развитие колонии';
  const heading = document.createElement('h2');
  heading.textContent = specialization.name;
  const description = document.createElement('p');
  description.className = 'planet-details-description';
  description.textContent = template.description;
  const meta = document.createElement('div');
  meta.className = 'planet-details-meta';
  meta.append(
    createLabelValue('Шаблон', template.name),
    createLabelValue('Построено объектов', String(planet.buildings.length)),
    createLabelValue('Занято полей', String(ZONE_IDS.reduce((total, zoneId) => total + planet.zones[zoneId].usedFields, 0))),
  );
  const action = document.createElement('button');
  action.type = 'button';
  action.className = 'se-button se-button--primary planet-primary-action';
  action.textContent = 'Перейти к развитию';
  action.addEventListener('click', () => setPlanetMode('resource'));
  panel.replaceChildren(eyebrow, heading, description, meta, action);
}

function renderBuildingDetails(planet: PlanetState, panel: HTMLElement): void {
  if (activeMode === 'overview') return;
  const cards = getZoneBuildingCards(planet, activeMode);
  const card = cards.find((candidate) => candidate.id === selectedBuildingId) ?? cards[0];
  if (card === undefined) {
    panel.textContent = 'В этой зоне нет доступных зданий.';
    return;
  }
  selectedBuildingId = card.id;

  const eyebrow = document.createElement('p');
  eyebrow.className = 'panel-label';
  eyebrow.textContent = `${ZONE_LABELS[card.zoneId]} зона`;
  const heading = document.createElement('h2');
  heading.textContent = card.name;
  const level = document.createElement('p');
  level.className = 'planet-details-level';
  level.textContent = `Текущий уровень ${card.level} из ${card.maxLevel}`;
  const cost = createCostElement(card);
  const duration = createLabelValue('Время', formatGameDuration(card.buildSeconds));
  const requirement = createLabelValue(
    'Статус',
    card.available ? `Готово к уровню ${card.targetLevel}` : (card.blockReason ?? 'Недоступно'),
    card.available ? 'is-accent' : 'is-warning',
  );
  const meta = document.createElement('div');
  meta.className = 'planet-details-meta';
  meta.append(duration, requirement);
  const action = document.createElement('button');
  action.type = 'button';
  action.className = 'se-button se-button--primary planet-primary-action';
  action.disabled = !card.available;
  action.textContent = card.level === 0 ? 'Построить' : `Улучшить до ${card.targetLevel}`;
  action.addEventListener('click', () => {
    applyCommand(
      {
        type: 'QUEUE_BUILDING',
        empireId: 'player',
        planetId: planet.id,
        buildingId: card.id,
      },
      `Строительство запущено · ${card.name}`,
    );
  });
  panel.replaceChildren(eyebrow, heading, level, cost, meta, action);
}

function renderPlanetDetails(planet: PlanetState): void {
  const panel = requireElement<HTMLElement>('#planet-details-card');
  panel.dataset.mode = activeMode;
  if (activeMode === 'overview') {
    renderOverviewDetails(planet, panel);
  } else {
    renderBuildingDetails(planet, panel);
  }
}

function renderBuildQueue(planet: PlanetState): void {
  const state = requireState();
  const container = requireElement<HTMLElement>('#planet-build-queue');
  const nextEventButton = requireElement<HTMLButtonElement>('#advance-next-event');
  const item = planet.buildQueue[0];
  container.replaceChildren();
  nextEventButton.disabled = state.pendingEvents.length === 0;

  const activeSlot = document.createElement('div');
  activeSlot.className = `planet-queue-slot${item === undefined ? ' is-empty' : ' is-active'}`;
  if (item === undefined) {
    const meta = document.createElement('small');
    meta.textContent = 'Слот 01';
    const title = document.createElement('strong');
    title.textContent = 'Свободен';
    activeSlot.append(meta, title);
  } else {
    const definition = getBuildingDefinition(item.buildingId);
    const duration = Math.max(1, item.completesAt - item.startedAt);
    const elapsed = Math.max(0, Math.min(duration, state.clock.elapsedSeconds - item.startedAt));
    const remaining = Math.max(0, item.completesAt - state.clock.elapsedSeconds);
    const meta = document.createElement('small');
    meta.textContent = `Слот 01 · ${formatGameDuration(remaining)}`;
    const title = document.createElement('strong');
    title.textContent = `${definition?.name ?? item.buildingId} · ур. ${item.targetLevel}`;
    const progress = document.createElement('div');
    progress.className = 'queue-progress';
    const progressBar = document.createElement('i');
    progressBar.style.width = `${Math.floor((elapsed * 100) / duration)}%`;
    progress.append(progressBar);
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'planet-queue-cancel';
    cancel.textContent = 'Отменить';
    cancel.addEventListener('click', () => {
      applyCommand(
        {
          type: 'CANCEL_BUILDING',
          empireId: 'player',
          planetId: planet.id,
          queueItemId: item.id,
        },
        'Строительство отменено',
      );
    });
    activeSlot.append(meta, title, progress, cancel);
  }
  container.append(activeSlot);

  for (let slot = 2; slot <= 4; slot += 1) {
    const emptySlot = document.createElement('div');
    emptySlot.className = 'planet-queue-slot is-locked';
    const meta = document.createElement('small');
    meta.textContent = `Слот 0${slot}`;
    const title = document.createElement('strong');
    title.textContent = 'Резерв';
    emptySlot.append(meta, title);
    container.append(emptySlot);
  }
}

function setResourceValue(resourceId: 'metal' | 'crystal' | 'gas', planet: PlanetState): void {
  const stock = planet.economy.resources[resourceId];
  setText(
    `#resource-${resourceId}-value`,
    `${NUMBER_FORMAT.format(stock.amount)} / ${NUMBER_FORMAT.format(stock.capacity)}`,
  );
  setText(
    `#resource-${resourceId}-rate`,
    `+${NUMBER_FORMAT.format(stock.productionPerHour)}/ч`,
  );
}

function renderPlanetDashboard(): void {
  const state = requireState();
  const planet = getPlayerPlanet();
  renderPlanetSelector(planet);
  setText('#planet-name', planet.name);
  setText('#planet-coordinates', `${planet.systemId}:${planet.position}`);
  setText('#planet-specialization-label', `${PLANET_SPECIALIZATIONS[planet.specializationId].name} специализация`);
  setText('#world-time', formatWorldTime(state.clock.elapsedSeconds));
  setText('#planet-count', String(getPlayerPlanets().length));
  setResourceValue('metal', planet);
  setResourceValue('crystal', planet);
  setResourceValue('gas', planet);
  setText('#resource-energy-value', `${planet.economy.energy.produced} / ${planet.economy.energy.consumed}`);
  setText(
    '#resource-energy-state',
    formatPercent(Math.min(planet.economy.energy.efficiencyPermille, planet.economy.stability.efficiencyPermille)),
  );
  setText(
    '#economy-efficiency',
    formatPercent(Math.min(planet.economy.energy.efficiencyPermille, planet.economy.stability.efficiencyPermille)),
  );
  setText('#economy-energy-produced', String(planet.economy.energy.produced));
  setText('#economy-energy-consumed', String(planet.economy.energy.consumed));

  renderModeTabs(planet);
  renderBuildQueue(planet);
  renderPlanetContext(planet);
  renderPlanetStage(planet);
  renderPlanetDetails(planet);
}

function setActiveView(view: 'galaxy' | 'planet'): void {
  requireElement<HTMLElement>('#galaxy-view').hidden = view !== 'galaxy';
  requireElement<HTMLElement>('#planet-view').hidden = view !== 'planet';
  requireElement<HTMLButtonElement>('#nav-galaxy').classList.toggle('is-active', view === 'galaxy');
  requireElement<HTMLButtonElement>('#nav-planet').classList.toggle('is-active', view === 'planet');
  requireElement<HTMLElement>('.game-layout').classList.toggle('is-planet-view', view === 'planet');
}

function setPlanetMode(mode: PlanetWorkspaceMode, focusTab = false): void {
  activeMode = mode;
  if (mode === 'overview') selectedBuildingId = undefined;
  renderPlanetDashboard();
  if (focusTab) {
    requireElement<HTMLButtonElement>(`[data-planet-mode="${mode}"]`).focus();
  }
}

function bindModeTabs(): void {
  const tabs = WORKSPACE_MODES.map((mode) =>
    requireElement<HTMLButtonElement>(`[data-planet-mode="${mode}"]`),
  );

  tabs.forEach((tab, index) => {
    const mode = WORKSPACE_MODES[index];
    if (mode === undefined) return;
    tab.addEventListener('click', () => setPlanetMode(mode));
    tab.addEventListener('keydown', (event) => {
      let nextIndex: number | undefined;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = tabs.length - 1;
      if (nextIndex === undefined) return;
      event.preventDefault();
      const nextMode = WORKSPACE_MODES[nextIndex];
      if (nextMode !== undefined) setPlanetMode(nextMode, true);
    });
  });
}

function bindPlanetControls(): void {
  requireElement<HTMLButtonElement>('#nav-galaxy').addEventListener('click', () => setActiveView('galaxy'));
  requireElement<HTMLButtonElement>('#nav-planet').addEventListener('click', () => {
    setActiveView('planet');
    renderPlanetDashboard();
  });
  requireElement<HTMLSelectElement>('#planet-selector').addEventListener(
    'change',
    (event) => {
      const selector = event.currentTarget;
      if (selector instanceof HTMLSelectElement) {
        selectPlanetScreenPlanet(selector.value, false);
      }
    },
  );

  bindModeTabs();

  const scienceButton = document.querySelector<HTMLButtonElement>('[aria-label="Исследования"]');
  const fleetButton = document.querySelector<HTMLButtonElement>('[aria-label="Флот"]');
  scienceButton?.removeAttribute('disabled');
  fleetButton?.removeAttribute('disabled');
  scienceButton?.addEventListener('click', () => {
    activeMode = 'industry';
    setActiveView('planet');
    renderPlanetDashboard();
    openWorkspace('Исследования', 'Отдельный экран науки связан с промышленной зоной.', false);
  });
  fleetButton?.addEventListener('click', () => {
    activeMode = 'military';
    setActiveView('planet');
    renderPlanetDashboard();
    openWorkspace('Командование флотом', 'Отдельный экран флота связан с военной зоной.', false);
  });

  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-advance-seconds]')) {
    button.addEventListener('click', () => {
      const seconds = Number(button.dataset.advanceSeconds);
      if (Number.isInteger(seconds) && seconds > 0) {
        applyCommand({ type: 'ADVANCE_TIME', seconds }, `Время ускорено · +${formatGameDuration(seconds)}`);
      }
    });
  }

  requireElement<HTMLButtonElement>('#advance-next-event').addEventListener('click', () => {
    const nextEvent = requireState().pendingEvents[0];
    if (nextEvent === undefined) {
      statusWriter('Нет ожидающих событий');
      return;
    }
    const seconds = Math.max(0, nextEvent.executeAt - requireState().clock.elapsedSeconds);
    applyCommand({ type: 'ADVANCE_TIME', seconds }, 'Следующее событие обработано');
  });
}

export function applyPlanetScreenCommand(
  command: GameCommand,
  successMessage: string,
): boolean {
  return applyCommand(command, successMessage);
}

export function getPlanetScreenActivePlanetId(): string {
  return getPlayerPlanet().id;
}

export function selectPlanetScreenPlanet(
  planetId: string,
  openPlanetView = true,
): boolean {
  const planet = getPlayerPlanets().find((candidate) => candidate.id === planetId);
  if (planet === undefined) {
    statusWriter('Колония недоступна');
    return false;
  }
  activePlanetId = planet.id;
  selectedBuildingId = undefined;
  if (openPlanetView) setActiveView('planet');
  renderPlanetDashboard();
  statusWriter(`Активная колония · ${planet.name}`);
  return true;
}

export function mountPlanetScreen(
  initialState: GameState,
  writeStatus: (message: string) => void,
  onStateChange: (state: GameState) => void = () => undefined,
): void {
  currentState = initialState;
  statusWriter = writeStatus;
  stateObserver = onStateChange;
  activePlanetId = getPlayerPlanets()[0]?.id;
  activeMode = 'overview';
  selectedBuildingId = undefined;
  bindPlanetControls();
  renderPlanetDashboard();
}
