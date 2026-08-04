import type { AutoSaveStatus } from '../storage/AutoSaveController';
import type { GameState } from '../simulation/types';
import {
  createGlobalHudViewModel,
  type HudCapacityViewModel,
  type HudWarningLevel,
} from './globalHudViewModel';

export interface GlobalHudOptions {
  readonly getState: () => GameState;
  readonly getActivePlanetId: () => string;
}

export interface GlobalHudController {
  refresh(): void;
  setAutoSaveStatus(status: AutoSaveStatus): void;
  dispose(): void;
}

export type GlobalHudMount = GlobalHudController | undefined;

const NUMBER_FORMAT = new Intl.NumberFormat('ru-RU');

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`Global HUD element is missing: ${selector}`);
  return element;
}

function formatWorldTime(seconds: number): string {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const remaining = seconds % 60;
  const clock = [hours, minutes, remaining].map((value) => String(value).padStart(2, '0')).join(':');
  return days > 0 ? `${days}д ${clock}` : clock;
}

function applyWarning(element: HTMLElement, level: HudWarningLevel, label: string): void {
  element.dataset.warningLevel = level;
  element.setAttribute('aria-label', `${element.textContent?.trim() ?? ''}. Состояние: ${label}`);
}

function renderCapacity(
  rootSelector: string,
  valueSelector: string,
  stateSelector: string,
  capacity: HudCapacityViewModel,
): void {
  requireElement<HTMLElement>(valueSelector).textContent =
    `${NUMBER_FORMAT.format(capacity.used)} / ${NUMBER_FORMAT.format(capacity.capacity)}`;
  requireElement<HTMLElement>(stateSelector).textContent = `${capacity.label} · ${capacity.percent}%`;
  applyWarning(requireElement<HTMLElement>(rootSelector), capacity.level, capacity.label);
}

function renderBadge(id: string, label: string, value: number): void {
  const badge = document.querySelector<HTMLElement>(`#${id}`);
  if (badge === null) return;
  badge.hidden = value <= 0;
  badge.textContent = String(value);
  badge.setAttribute('aria-label', `${label}: ${value}`);
}

function renderActivity(id: string, label: string, text: string, count: number): void {
  const activity = requireElement<HTMLElement>(`#${id}`);
  activity.textContent = text;
  activity.dataset.activityCount = String(count);
  activity.setAttribute('aria-label', `${label}: ${count}`);
  activity.title = 'Информационный индикатор. Открой соответствующий раздел в основной навигации.';
}

function ensureSolarWarActivity(): HTMLElement {
  const existing = document.querySelector<HTMLElement>('#hud-endgame-badge');
  if (existing !== null) return existing;
  const container = requireElement<HTMLElement>('.hud-activity-badges');
  const badge = document.createElement('span');
  badge.id = 'hud-endgame-badge';
  badge.dataset.testid = 'hud-solar-war-indicator';
  badge.title = 'Состояние текущего цикла Солнечной войны.';
  container.append(badge);
  return badge;
}

export function mountGlobalHud(options: GlobalHudOptions): GlobalHudController {
  const selector = requireElement<HTMLSelectElement>('#hud-planet-selector');
  const coordinate = requireElement<HTMLElement>('#hud-active-coordinate');
  const worldTime = requireElement<HTMLElement>('#hud-world-time');
  const saveState = requireElement<HTMLElement>('#hud-save-state');
  const solarWarActivity = ensureSolarWarActivity();

  const refresh = (): void => {
    const state = options.getState();
    const view = createGlobalHudViewModel(state, options.getActivePlanetId());
    const playerPlanets = state.planets.filter((planet) => planet.ownerEmpireId === 'player');
    const currentOptions = Array.from(selector.options).map((option) => option.value).join('|');
    const nextOptions = playerPlanets.map((planet) => planet.id).join('|');
    if (currentOptions !== nextOptions) {
      selector.replaceChildren(...playerPlanets.map((planet) => {
        const option = document.createElement('option');
        option.value = planet.id;
        option.textContent = planet.name;
        return option;
      }));
    }
    selector.disabled = playerPlanets.length === 0;
    selector.value = view.planetId;
    coordinate.textContent = view.coordinate;
    worldTime.textContent = formatWorldTime(view.elapsedSeconds);

    for (const id of ['metal', 'crystal', 'gas'] as const) {
      const resource = view.resources[id];
      requireElement<HTMLElement>(`#resource-${id}-value`).textContent =
        `${NUMBER_FORMAT.format(resource.used)} / ${NUMBER_FORMAT.format(resource.capacity)}`;
      requireElement<HTMLElement>(`#resource-${id}-rate`).textContent =
        `+${NUMBER_FORMAT.format(resource.productionPerHour)}/ч · ${resource.label}`;
      applyWarning(requireElement<HTMLElement>(`#hud-resource-${id}`), resource.level, resource.label);
    }

    requireElement<HTMLElement>('#resource-energy-value').textContent =
      `${NUMBER_FORMAT.format(view.energy.produced)} / ${NUMBER_FORMAT.format(view.energy.consumed)}`;
    requireElement<HTMLElement>('#resource-energy-state').textContent =
      `${view.energy.label} · ${view.energy.free >= 0 ? '+' : ''}${NUMBER_FORMAT.format(view.energy.free)}`;
    applyWarning(requireElement<HTMLElement>('#hud-energy'), view.energy.level, view.energy.label);
    renderCapacity('#hud-population', '#hud-population-value', '#hud-population-state', view.population);
    renderCapacity('#hud-hangar', '#hud-hangar-value', '#hud-hangar-state', view.hangar);

    const missionCount = view.activeMissionCount + view.incomingContactCount;
    renderActivity('hud-queue-badge', 'Активные очереди', `Очереди ${view.queueCount}`, view.queueCount);
    renderActivity(
      'hud-mission-badge',
      'Активные и входящие миссии',
      `Миссии ${view.activeMissionCount} · входящие ${view.incomingContactCount}`,
      missionCount,
    );
    renderActivity('hud-report-badge', 'Доступные отчёты', `Отчёты ${view.reportCount}`, view.reportCount);
    solarWarActivity.textContent = view.solarWar.activeEntry
      ? `Солнечная война · цикл ${view.solarWar.cycleIndex} · флот ${view.solarWar.fleetId}`
      : `Солнечная война · цикл ${view.solarWar.cycleIndex} · ${formatWorldTime(view.solarWar.remainingSeconds)}`;
    solarWarActivity.dataset.activeEntry = String(view.solarWar.activeEntry);
    solarWarActivity.dataset.cycleIndex = String(view.solarWar.cycleIndex);
    solarWarActivity.dataset.resultCount = String(view.solarWar.resultCount);
    solarWarActivity.setAttribute(
      'aria-label',
      view.solarWar.activeEntry
        ? `Солнечная война: активный вход, цикл ${view.solarWar.cycleIndex}, флот ${view.solarWar.fleetId}`
        : `Солнечная война: цикл ${view.solarWar.cycleIndex}, до завершения ${formatWorldTime(view.solarWar.remainingSeconds)}`,
    );
    renderBadge('nav-planet-badge', 'Активные очереди', view.queueCount);
    renderBadge('nav-fleet-badge', 'Активные и входящие миссии', missionCount);
    renderBadge('nav-research-badge', 'Активные исследования', state.research.find((item) => item.empireId === 'player')?.queue.length ?? 0);
    renderBadge(
      'nav-operations-badge',
      'Активные события и входы в Солнечную войну',
      state.worldEvents.active.length + (view.solarWar.activeEntry ? 1 : 0),
    );
    renderBadge('nav-reports-badge', 'Отчёты', view.reportCount);
  };

  refresh();
  return {
    refresh,
    setAutoSaveStatus: (status) => {
      const label = status.phase === 'pending'
        ? 'ожидает'
        : status.phase === 'saving'
          ? 'сохранение'
          : status.phase === 'saved'
            ? 'сохранено'
            : status.phase === 'error'
              ? 'ошибка'
              : 'готово';
      saveState.textContent = `Автосохранение: ${label}`;
      saveState.dataset.savePhase = status.phase;
      renderBadge('nav-system-badge', 'Состояние сохранения', status.phase === 'error' ? 1 : 0);
    },
    dispose: () => {
      selector.replaceChildren();
      solarWarActivity.remove();
    },
  };
}
