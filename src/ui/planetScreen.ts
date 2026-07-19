import type { AegisVerticalSliceAsset } from '../assets/aegisVerticalSliceAssets';
import { getBuildingDefinition } from '../simulation/planet/buildingCatalog';
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
const ZONE_LABELS: Readonly<Record<PlanetZoneId, string>> = {
  resource: 'Ресурсная',
  industry: 'Промышленная',
  military: 'Военная',
};

let currentState: GameState | undefined;
let activePlanetId: string | undefined;
let activeZone: PlanetZoneId = 'resource';
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
    ? 'Доменное подключение активно. Контент появится в следующем вертикальном слое.'
    : 'Сначала выполните требования на планете.';
  content.replaceChildren(eyebrow, heading, text, state);
  dialog.showModal();
}

function createCostElement(card: BuildingCardViewModel): HTMLElement {
  const cost = document.createElement('div');
  cost.className = 'building-cost';
  for (const [label, value] of [
    ['M', card.cost.metal],
    ['C', card.cost.crystal],
    ['G', card.cost.gas],
  ] as const) {
    const item = document.createElement('span');
    item.textContent = `${label} ${NUMBER_FORMAT.format(value)}`;
    cost.append(item);
  }
  return cost;
}

function setBuildingArtwork(element: HTMLElement, asset: AegisVerticalSliceAsset): void {
  const column = asset.frame.x / asset.frame.width;
  const row = asset.frame.y / asset.frame.height;
  element.style.backgroundImage = `url("${asset.atlasUrl}")`;
  element.style.backgroundSize = '400% 200%';
  element.style.backgroundPosition = `${column === 0 ? 0 : (column / 3) * 100}% ${row === 0 ? 0 : 100}%`;
}

function createBuildingCard(card: BuildingCardViewModel, planetId: string): HTMLElement {
  const article = document.createElement('article');
  article.className = `building-card${card.available ? '' : ' is-locked'}`;
  const artwork = document.createElement('div');
  artwork.className = 'building-art';
  artwork.setAttribute('role', 'img');
  artwork.setAttribute('aria-label', card.name);
  setBuildingArtwork(artwork, card.asset);
  const body = document.createElement('div');
  body.className = 'building-card__body';
  const meta = document.createElement('div');
  meta.className = 'building-card__meta';
  const zone = document.createElement('span');
  zone.textContent = ZONE_LABELS[card.zoneId];
  const level = document.createElement('span');
  level.textContent = `Ур. ${card.level}/${card.maxLevel}`;
  meta.append(zone, level);
  const title = document.createElement('h3');
  title.textContent = card.name;
  const duration = document.createElement('div');
  duration.className = 'building-card__status';
  duration.textContent = card.available
    ? `Улучшение до ур. ${card.targetLevel} · ${formatGameDuration(card.buildSeconds)}`
    : card.blockReason;
  duration.classList.toggle('is-ready', card.available);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'building-action';
  button.disabled = !card.available;
  button.textContent = card.level === 0 ? 'Построить' : `Улучшить до ${card.targetLevel}`;
  button.addEventListener('click', () => {
    applyCommand(
      {
        type: 'QUEUE_BUILDING',
        empireId: 'player',
        planetId,
        buildingId: card.id,
      },
      `Строительство запущено · ${card.name}`,
    );
  });
  body.append(meta, title, createCostElement(card), duration, button);
  article.append(artwork, body);
  return article;
}

function renderBuildingCatalog(planet: PlanetState): void {
  const grid = requireElement<HTMLElement>('#planet-building-grid');
  grid.replaceChildren();
  for (const card of createBuildingCardViewModels(planet).filter(
    (candidate) => candidate.zoneId === activeZone,
  )) {
    grid.append(createBuildingCard(card, planet.id));
  }
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

function renderZoneContext(planet: PlanetState): void {
  let panel = document.querySelector<HTMLElement>('#zone-context-panel');
  if (panel === null) {
    panel = document.createElement('section');
    panel.id = 'zone-context-panel';
    panel.className = 'operation-card zone-context-panel';
    requireElement<HTMLElement>('.planet-operations').prepend(panel);
  }

  const heading = document.createElement('h2');
  heading.textContent = `${ZONE_LABELS[activeZone]} зона`;
  const eyebrow = document.createElement('p');
  eyebrow.className = 'panel-label';
  eyebrow.textContent = 'Домен планеты';
  const content = document.createElement('div');
  content.className = 'zone-context-content';

  if (activeZone === 'resource') {
    const view = createResourceZoneViewModel(planet);
    content.innerHTML = `<p>Население: <strong>${view.populationUsed} / ${view.populationCapacity}</strong></p><p>Энергия: <strong>${view.energyEfficiencyPermille / 10}%</strong></p><p>Стабильность: <strong>${view.stabilityEfficiencyPermille / 10}%</strong></p>`;
  } else if (activeZone === 'industry') {
    const view = createIndustryZoneViewModel(planet);
    for (const gateway of view.gateways) {
      content.append(
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
  } else {
    const view = createMilitaryZoneViewModel(planet);
    for (const gateway of view.gateways) {
      content.append(
        createGatewayButton(gateway.label, gateway.hint, gateway.unlocked, () => {
          openWorkspace(
            gateway.label,
            gateway.id === 'defense'
              ? 'Планетарная оборона использует военную инфраструктуру.'
              : 'Командование флотом связывает планету с будущими миссиями.',
            gateway.unlocked,
          );
        }),
      );
    }
  }

  panel.replaceChildren(eyebrow, heading, content);
}

function renderBuildQueue(planet: PlanetState): void {
  const state = requireState();
  const container = requireElement<HTMLElement>('#planet-build-queue');
  const nextEventButton = requireElement<HTMLButtonElement>('#advance-next-event');
  const item = planet.buildQueue[0];
  container.replaceChildren();
  nextEventButton.disabled = state.pendingEvents.length === 0;

  if (item === undefined) {
    container.textContent = 'Очередь свободна';
    return;
  }

  const definition = getBuildingDefinition(item.buildingId);
  const duration = Math.max(1, item.completesAt - item.startedAt);
  const elapsed = Math.max(0, Math.min(duration, state.clock.elapsedSeconds - item.startedAt));
  const remaining = Math.max(0, item.completesAt - state.clock.elapsedSeconds);
  const wrapper = document.createElement('div');
  wrapper.className = 'queue-item';
  const title = document.createElement('h3');
  title.textContent = `${definition?.name ?? item.buildingId} · ур. ${item.targetLevel}`;
  const progress = document.createElement('div');
  progress.className = 'queue-progress';
  const progressBar = document.createElement('i');
  progressBar.style.width = `${Math.floor((elapsed * 100) / duration)}%`;
  progress.append(progressBar);
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.textContent = `Отменить · осталось ${formatGameDuration(remaining)}`;
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
  wrapper.append(title, progress, cancel);
  container.append(wrapper);
}

function setResourceValue(resourceId: 'metal' | 'crystal' | 'gas', planet: PlanetState): void {
  const stock = planet.economy.resources[resourceId];
  requireElement<HTMLElement>(`#resource-${resourceId}-value`).textContent =
    `${NUMBER_FORMAT.format(stock.amount)} / ${NUMBER_FORMAT.format(stock.capacity)}`;
  requireElement<HTMLElement>(`#resource-${resourceId}-rate`).textContent =
    `+${NUMBER_FORMAT.format(stock.productionPerHour)}/ч`;
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
  requireElement<HTMLElement>('#planet-role-label').textContent =
    planets[0]?.id === planet.id ? 'Домашняя колония' : 'Колониальный мир';
}

function renderPlanetDashboard(): void {
  const state = requireState();
  const planet = getPlayerPlanet();
  renderPlanetSelector(planet);
  requireElement<HTMLElement>('#planet-name').textContent = planet.name;
  requireElement<HTMLElement>('#world-time').textContent = formatWorldTime(state.clock.elapsedSeconds);
  requireElement<HTMLElement>('#planet-count').textContent = String(getPlayerPlanets().length);
  setResourceValue('metal', planet);
  setResourceValue('crystal', planet);
  setResourceValue('gas', planet);
  requireElement<HTMLElement>('#resource-energy-value').textContent =
    `${planet.economy.energy.produced} / ${planet.economy.energy.consumed}`;
  requireElement<HTMLElement>('#resource-energy-state').textContent =
    `${Math.min(planet.economy.energy.efficiencyPermille, planet.economy.stability.efficiencyPermille) / 10}%`;

  for (const zoneId of ZONE_IDS) {
    const zone = planet.zones[zoneId];
    const output = requireElement<HTMLElement>(`#zone-${zoneId}-fields`);
    output.textContent = `${zone.usedFields} / ${zone.fieldLimit}`;
    output.parentElement?.classList.toggle('is-active', zoneId === activeZone);
  }

  requireElement<HTMLElement>('#economy-efficiency').textContent =
    `${Math.min(planet.economy.energy.efficiencyPermille, planet.economy.stability.efficiencyPermille) / 10}%`;
  requireElement<HTMLElement>('#economy-energy-produced').textContent = String(planet.economy.energy.produced);
  requireElement<HTMLElement>('#economy-energy-consumed').textContent = String(planet.economy.energy.consumed);
  renderZoneContext(planet);
  renderBuildingCatalog(planet);
  renderBuildQueue(planet);
}

function setActiveView(view: 'galaxy' | 'planet'): void {
  requireElement<HTMLElement>('#galaxy-view').hidden = view !== 'galaxy';
  requireElement<HTMLElement>('#planet-view').hidden = view !== 'planet';
  requireElement<HTMLButtonElement>('#nav-galaxy').classList.toggle('is-active', view === 'galaxy');
  requireElement<HTMLButtonElement>('#nav-planet').classList.toggle('is-active', view === 'planet');
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

  for (const zoneId of ZONE_IDS) {
    const zoneElement = requireElement<HTMLElement>(`#zone-${zoneId}-fields`).parentElement;
    if (zoneElement !== null) {
      zoneElement.tabIndex = 0;
      zoneElement.setAttribute('role', 'button');
      zoneElement.addEventListener('click', () => {
        activeZone = zoneId;
        renderPlanetDashboard();
      });
      zoneElement.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          activeZone = zoneId;
          renderPlanetDashboard();
        }
      });
    }
  }

  const scienceButton = document.querySelector<HTMLButtonElement>('[aria-label="Исследования"]');
  const fleetButton = document.querySelector<HTMLButtonElement>('[aria-label="Флот"]');
  scienceButton?.removeAttribute('disabled');
  fleetButton?.removeAttribute('disabled');
  scienceButton?.addEventListener('click', () => {
    activeZone = 'industry';
    setActiveView('planet');
    renderPlanetDashboard();
    openWorkspace('Исследования', 'Отдельный экран науки связан с лабораторией Industry Zone.', false);
  });
  fleetButton?.addEventListener('click', () => {
    activeZone = 'military';
    setActiveView('planet');
    renderPlanetDashboard();
    openWorkspace('Командование флотом', 'Отдельный экран флота связан с Military Zone.', false);
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
  bindPlanetControls();
  renderPlanetDashboard();
}
