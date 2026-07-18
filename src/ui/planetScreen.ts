import type { AegisVerticalSliceAsset } from '../assets/aegisVerticalSliceAssets';
import { getBuildingDefinition } from '../simulation/planet/buildingCatalog';
import type { PlanetState, PlanetZoneId } from '../simulation/planet/types';
import { executeCommand } from '../simulation/reducer';
import type { GameCommand, GameState } from '../simulation/types';
import {
  createBuildingCardViewModels,
  formatGameDuration,
  type BuildingCardViewModel,
} from './planetViewModel';

const NUMBER_FORMAT = new Intl.NumberFormat('ru-RU');
const ZONE_LABELS: Readonly<Record<PlanetZoneId, string>> = {
  resource: 'Ресурсная',
  industry: 'Промышленная',
  military: 'Военная',
};

let currentState: GameState | undefined;
let statusWriter: (message: string) => void = () => undefined;

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

function getPlayerPlanet(): PlanetState {
  const planet = requireState().planets.find(
    (candidate) => candidate.ownerEmpireId === 'player',
  );

  if (planet === undefined) {
    throw new Error('Player planet is missing from the current game state.');
  }

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
  statusWriter(successMessage);
  renderPlanetDashboard();
  return true;
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
  const columnPosition = column === 0 ? 0 : (column / 3) * 100;
  const rowPosition = row === 0 ? 0 : 100;

  element.style.backgroundImage = `url("${asset.atlasUrl}")`;
  element.style.backgroundSize = '400% 200%';
  element.style.backgroundPosition = `${columnPosition}% ${rowPosition}%`;
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

  for (const card of createBuildingCardViewModels(planet)) {
    grid.append(createBuildingCard(card, planet.id));
  }
}

function renderBuildQueue(planet: PlanetState): void {
  const state = requireState();
  const container = requireElement<HTMLElement>('#planet-build-queue');
  const nextEventButton = requireElement<HTMLButtonElement>('#advance-next-event');
  const item = planet.buildQueue[0];
  container.replaceChildren();
  nextEventButton.disabled = state.pendingEvents.length === 0;

  if (item === undefined) {
    return;
  }

  const definition = getBuildingDefinition(item.buildingId);
  const duration = Math.max(1, item.completesAt - item.startedAt);
  const elapsed = Math.max(
    0,
    Math.min(duration, state.clock.elapsedSeconds - item.startedAt),
  );
  const remaining = Math.max(0, item.completesAt - state.clock.elapsedSeconds);
  const progressPercent = Math.floor((elapsed * 100) / duration);

  const wrapper = document.createElement('div');
  wrapper.className = 'queue-item';
  const title = document.createElement('h3');
  title.textContent = `${definition?.name ?? item.buildingId} · ур. ${item.targetLevel}`;
  const description = document.createElement('p');
  description.textContent = `Завершение на отметке ${formatWorldTime(item.completesAt)}`;
  const progress = document.createElement('div');
  progress.className = 'queue-progress';
  const progressBar = document.createElement('i');
  progressBar.style.width = `${progressPercent}%`;
  progress.append(progressBar);

  const actions = document.createElement('div');
  actions.className = 'queue-actions';
  const remainingLabel = document.createElement('span');
  remainingLabel.textContent = `Осталось ${formatGameDuration(remaining)}`;
  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.textContent = 'Отменить · возврат 75%';
  cancelButton.addEventListener('click', () => {
    applyCommand(
      {
        type: 'CANCEL_BUILDING',
        empireId: 'player',
        planetId: planet.id,
        queueItemId: item.id,
      },
      'Строительство отменено · ресурсы частично возвращены',
    );
  });
  actions.append(remainingLabel, cancelButton);
  wrapper.append(title, description, progress, actions);
  container.append(wrapper);
}

function setResourceValue(
  resourceId: 'metal' | 'crystal' | 'gas',
  planet: PlanetState,
): void {
  const stock = planet.economy.resources[resourceId];
  requireElement<HTMLElement>(`#resource-${resourceId}-value`).textContent =
    `${NUMBER_FORMAT.format(stock.amount)} / ${NUMBER_FORMAT.format(stock.capacity)}`;
  requireElement<HTMLElement>(`#resource-${resourceId}-rate`).textContent =
    `+${NUMBER_FORMAT.format(stock.productionPerHour)}/ч`;
}

function renderPlanetDashboard(): void {
  const state = requireState();
  const planet = getPlayerPlanet();
  requireElement<HTMLElement>('#planet-name').textContent = planet.name;
  requireElement<HTMLElement>('#world-time').textContent = formatWorldTime(
    state.clock.elapsedSeconds,
  );
  requireElement<HTMLElement>('#planet-count').textContent = String(state.planets.length);

  setResourceValue('metal', planet);
  setResourceValue('crystal', planet);
  setResourceValue('gas', planet);

  requireElement<HTMLElement>('#resource-energy-value').textContent =
    `${planet.economy.energy.produced} / ${planet.economy.energy.consumed}`;
  requireElement<HTMLElement>('#resource-energy-state').textContent =
    planet.economy.energy.efficiencyPermille === 1_000
      ? 'стабильно'
      : `${planet.economy.energy.efficiencyPermille / 10}%`;

  for (const zoneId of Object.keys(planet.zones) as PlanetZoneId[]) {
    const zone = planet.zones[zoneId];
    requireElement<HTMLElement>(`#zone-${zoneId}-fields`).textContent =
      `${zone.usedFields} / ${zone.fieldLimit}`;
  }

  requireElement<HTMLElement>('#economy-efficiency').textContent =
    `${planet.economy.energy.efficiencyPermille / 10}%`;
  requireElement<HTMLElement>('#economy-energy-produced').textContent = String(
    planet.economy.energy.produced,
  );
  requireElement<HTMLElement>('#economy-energy-consumed').textContent = String(
    planet.economy.energy.consumed,
  );

  renderBuildingCatalog(planet);
  renderBuildQueue(planet);
}

function setActiveView(view: 'galaxy' | 'planet'): void {
  const galaxyView = requireElement<HTMLElement>('#galaxy-view');
  const planetView = requireElement<HTMLElement>('#planet-view');
  const galaxyButton = requireElement<HTMLButtonElement>('#nav-galaxy');
  const planetButton = requireElement<HTMLButtonElement>('#nav-planet');

  galaxyView.hidden = view !== 'galaxy';
  planetView.hidden = view !== 'planet';
  galaxyButton.classList.toggle('is-active', view === 'galaxy');
  planetButton.classList.toggle('is-active', view === 'planet');
}

function bindPlanetControls(): void {
  requireElement<HTMLButtonElement>('#nav-galaxy').addEventListener('click', () => {
    setActiveView('galaxy');
  });
  requireElement<HTMLButtonElement>('#nav-planet').addEventListener('click', () => {
    setActiveView('planet');
    renderPlanetDashboard();
  });

  for (const button of document.querySelectorAll<HTMLButtonElement>(
    '[data-advance-seconds]',
  )) {
    button.addEventListener('click', () => {
      const seconds = Number(button.dataset.advanceSeconds);

      if (Number.isInteger(seconds) && seconds > 0) {
        applyCommand(
          { type: 'ADVANCE_TIME', seconds },
          `Время ускорено · +${formatGameDuration(seconds)}`,
        );
      }
    });
  }

  requireElement<HTMLButtonElement>('#advance-next-event').addEventListener('click', () => {
    const state = requireState();
    const nextEvent = state.pendingEvents[0];

    if (nextEvent === undefined) {
      statusWriter('Нет ожидающих событий');
      return;
    }

    const seconds = Math.max(0, nextEvent.executeAt - state.clock.elapsedSeconds);
    applyCommand({ type: 'ADVANCE_TIME', seconds }, 'Следующее событие обработано');
  });
}

export function mountPlanetScreen(
  initialState: GameState,
  writeStatus: (message: string) => void,
): void {
  currentState = initialState;
  statusWriter = writeStatus;
  bindPlanetControls();
  renderPlanetDashboard();
}
