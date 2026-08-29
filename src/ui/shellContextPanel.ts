import '../styles/shellBreadcrumbs.css';
import { getEmpireCommandState } from '../simulation/command/commandDoctrine';
import { createIncomingFlightContacts } from '../simulation/intelligence/incomingFlights';
import { createUnifiedMissionReports } from '../simulation/reports/missionReports';
import type { GameState } from '../simulation/types';
import type { AutoSaveStatus } from '../storage/AutoSaveController';
import type { AppShellSnapshot } from './appShellController';
import { createPlayerCommandProfile } from './commandRanking';
import { createOperationsSummary } from './operationsWorkspace';
import { getShellRouteDisplayName } from './shellNavigationContext';

export interface ShellContextPanelOptions {
  readonly getState: () => GameState;
  readonly getActivePlanetId: () => string;
}

export interface ShellContextPanelController {
  refresh(snapshot: AppShellSnapshot): void;
  setAutoSaveStatus(status: AutoSaveStatus): void;
  dispose(): void;
}

export type ShellContextPanelMount = ShellContextPanelController | undefined;

function requireHost(): HTMLElement {
  const host = document.querySelector<HTMLElement>('#shell-context-content');
  if (host === null) throw new Error('Shell context host is missing.');
  return host;
}

function ensureBreadcrumbHost(): HTMLElement {
  const panel = document.querySelector<HTMLElement>('#shell-context-panel');
  if (panel === null) throw new Error('Shell context panel is missing.');
  const existing = panel.querySelector<HTMLElement>('#shell-breadcrumbs');
  if (existing !== null) return existing;
  const breadcrumbs = document.createElement('nav');
  breadcrumbs.id = 'shell-breadcrumbs';
  breadcrumbs.className = 'shell-breadcrumbs';
  breadcrumbs.dataset.shellBreadcrumbsHost = 'true';
  breadcrumbs.setAttribute('aria-label', 'Путь и возврат');
  panel.prepend(breadcrumbs);
  return breadcrumbs;
}

function createCard(kicker: string, title: string, description: string): HTMLElement {
  const card = document.createElement('section');
  card.className = 'panel-block shell-context-card';
  const eyebrow = document.createElement('p');
  eyebrow.className = 'panel-label';
  eyebrow.textContent = kicker;
  const heading = document.createElement('h2');
  heading.textContent = title;
  const body = document.createElement('p');
  body.textContent = description;
  card.append(eyebrow, heading, body);
  return card;
}

function createMetrics(entries: readonly (readonly [string, string])[]): HTMLElement {
  const grid = document.createElement('dl');
  grid.className = 'shell-context-metrics';
  for (const [label, value] of entries) {
    const row = document.createElement('div');
    const term = document.createElement('dt');
    term.textContent = label;
    const output = document.createElement('dd');
    output.textContent = value;
    row.append(term, output);
    grid.append(row);
  }
  return grid;
}

export function mountShellContextPanel(options: ShellContextPanelOptions): ShellContextPanelController {
  const host = requireHost();
  const breadcrumbs = ensureBreadcrumbHost();
  let savePhase: AutoSaveStatus['phase'] = 'idle';

  const refresh = (snapshot: AppShellSnapshot): void => {
    const state = options.getState();
    const route = snapshot.route;
    breadcrumbs.toggleAttribute('data-normalization-code', snapshot.normalizationCode !== null);
    if (snapshot.normalizationCode === null) delete breadcrumbs.dataset.normalizationCode;
    else breadcrumbs.dataset.normalizationCode = snapshot.normalizationCode;

    const activePlanet = state.planets.find(
      (planet) => planet.id === options.getActivePlanetId() && planet.ownerEmpireId === 'player',
    ) ?? state.planets.find((planet) => planet.ownerEmpireId === 'player');
    if (activePlanet === undefined) {
      host.replaceChildren(createCard('Контекст', 'Колония недоступна', 'В текущем состоянии нет колонии игрока.'));
      return;
    }

    const routeLabel = getShellRouteDisplayName(route, state);
    if (route.family === 'planet') {
      const queueCount = activePlanet.buildQueue.length +
        activePlanet.productionQueues.shipyard.length +
        activePlanet.productionQueues.defense.length +
        activePlanet.defense.repairQueue.length;
      host.replaceChildren(
        createCard('Планетарный контур', activePlanet.name, routeLabel),
        createMetrics([
          ['Координаты', `${activePlanet.systemId}:${activePlanet.position}`],
          ['Очереди', String(queueCount)],
          ['Население', `${activePlanet.economy.population.used}/${activePlanet.economy.population.capacity}`],
          ['Энергия', `${activePlanet.economy.energy.produced}/${activePlanet.economy.energy.consumed}`],
        ]),
      );
      return;
    }

    if (route.family === 'fleets') {
      const fleets = state.fleets.filter((fleet) => fleet.empireId === 'player');
      const incoming = createIncomingFlightContacts(state, 'player');
      host.replaceChildren(
        createCard('Флотский контур', 'Флоты и миссии', `${routeLabel} · колония ${activePlanet.name}`),
        createMetrics([
          ['Всего флотов', String(fleets.length)],
          ['На орбите', String(fleets.filter((fleet) => fleet.status === 'stationed').length)],
          ['В полёте', String(fleets.filter((fleet) => fleet.status !== 'stationed').length)],
          ['Входящие контакты', String(incoming.length)],
          ['Активная колония', activePlanet.name],
        ]),
      );
      return;
    }

    if (route.family === 'space') {
      host.replaceChildren(
        createCard('Космическая навигация', routeLabel, `Активная колония: ${activePlanet.name}`),
        createMetrics([
          ['Маршрут', route.hash],
          ['Колония отправления', activePlanet.name],
          ['Координаты колонии', `${activePlanet.systemId}:${activePlanet.position}`],
        ]),
      );
      return;
    }

    if (route.family === 'research') {
      const research = state.research.find((entry) => entry.empireId === 'player');
      const item = research?.queue[0];
      host.replaceChildren(
        createCard('Научный контур', 'Исследования', `${routeLabel} · лаборатория ${activePlanet.name}`),
        createMetrics([
          ['Активных исследований', String(research?.queue.length ?? 0)],
          ['Изучено уровней', String(Object.values(research?.levels ?? {}).reduce((sum, value) => sum + value, 0))],
          ['Текущая работа', item === undefined ? 'Очередь свободна' : `${item.technologyId} · уровень ${item.targetLevel}`],
        ]),
      );
      return;
    }

    if (route.family === 'operations') {
      const summary = createOperationsSummary(state);
      host.replaceChildren(
        createCard('Операционный контур', 'Операции империи', `${routeLabel} · колония ${activePlanet.name}`),
        createMetrics([
          ['Маршруты', `${summary.activeRoutes}/${summary.totalRoutes}`],
          ['Экспедиции', String(summary.activeExpeditions)],
          ['Объекты', String(summary.availableObjects)],
          ['События', String(summary.activeEvents)],
        ]),
      );
      return;
    }

    if (route.family === 'command' || route.family === 'ranking') {
      const profile = createPlayerCommandProfile(state);
      const command = getEmpireCommandState(state.commanders, 'player');
      host.replaceChildren(
        createCard('Стратегическое командование', profile.factionName, routeLabel),
        createMetrics([
          ['Очки', String(profile.score)],
          ['Колонии', String(profile.colonies)],
          ['Адмирал', command === undefined ? 'нет данных' : `уровень ${command.level}`],
          ['Флоты', String(profile.fleets)],
        ]),
      );
      return;
    }

    if (route.family === 'reports') {
      const reports = createUnifiedMissionReports(state).filter((report) => {
        if (report.kind === 'intelligence') return report.primaryEmpireId === 'player';
        return report.primaryEmpireId === 'player' || report.secondaryEmpireId === 'player';
      });
      host.replaceChildren(
        createCard('Оперативная разведка', 'Единые отчёты', routeLabel),
        createMetrics([
          ['Всего отчётов', String(reports.length)],
          ['Боевые', String(reports.filter((report) => report.kind === 'battle').length)],
          ['Разведка', String(reports.filter((report) => report.kind === 'intelligence').length)],
          ['PvE', String(reports.filter((report) => report.mode === 'pve').length)],
        ]),
      );
      return;
    }

    host.replaceChildren(
      createCard('Системный контур', 'Локальная партия', routeLabel),
      createMetrics([
        ['Автосохранение', savePhase],
        ['Схема', `v${state.schemaVersion}`],
        ['Seed', String(state.seed)],
        ['Время мира', String(state.clock.elapsedSeconds)],
      ]),
    );
  };

  return {
    refresh,
    setAutoSaveStatus: (status) => { savePhase = status.phase; },
    dispose: () => {
      host.replaceChildren();
      breadcrumbs.remove();
    },
  };
}
