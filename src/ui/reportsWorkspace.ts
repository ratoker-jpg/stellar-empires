import { describeWorldEventEffect } from '../simulation/pve/pveOperationsView';
import { WORLD_EVENT_CATALOG } from '../simulation/pve/worldEvents';
import {
  compareEmpirePvePvp,
  createUnifiedMissionReports,
  filterMissionReports,
  summarizeMissionReports,
  type MissionReportKind,
  type MissionReportMode,
  type MissionReportReward,
  type UnifiedMissionReport,
  resolveMissionReportCoordinate,
} from '../simulation/reports/missionReports';
import type { SpaceCoordinate } from '../simulation/space/coordinates';
import type { GameState } from '../simulation/types';
import type { ReportShellFilter } from './appShellRoute';
import { createCampaignTerminalPresentation } from './endgameTerminalPresentation';
import { createIncomingFlightsSection } from './intelligencePresentation';
import { formatGameDuration } from './planetViewModel';
import {
  createPlanetDemolitionDetails,
  findPlanetDemolitionReport,
  findPlanetSiegeCoordinate,
} from './planetDemolitionReport';

export interface ReportsWorkspaceOptions {
  readonly getState: () => GameState;
  readonly navigateToCoordinate: (coordinate: SpaceCoordinate) => void;
  readonly navigateToFilter: (filter: ReportShellFilter) => void;
}

export interface ReportsWorkspace {
  activate(filter: ReportShellFilter): void;
  refresh(): void;
  deactivate(): void;
  dispose(): void;
}

const FILTERS: readonly ReportShellFilter[] = [
  'all',
  'combat',
  'expedition',
  'object',
  'event',
  'intelligence',
  'endgame',
];
const KIND_LABELS: Readonly<Record<MissionReportKind, string>> = {
  battle: 'Бой',
  expedition: 'Экспедиция',
  'space-object': 'Космический объект',
  'world-event': 'Мировое событие',
  intelligence: 'Разведка',
  'solar-war': 'Солнечная война',
};
const MODE_LABELS: Readonly<Record<MissionReportMode, string>> = {
  pve: 'PvE',
  pvp: 'PvP',
  system: 'Системное',
};

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`Reports workspace element is missing: ${selector}`);
  return element;
}

function ensureReportTab(
  tabs: HTMLElement,
  filter: ReportShellFilter,
  label: string,
  beforeSelector?: string,
): void {
  if (tabs.querySelector(`[data-report-filter="${filter}"]`) !== null) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('role', 'tab');
  button.dataset.reportFilter = filter;
  button.textContent = label;
  const before = beforeSelector === undefined ? null : tabs.querySelector(beforeSelector);
  tabs.insertBefore(button, before);
}

function ensureExtendedTabs(tabs: HTMLElement): void {
  ensureReportTab(tabs, 'endgame', 'Эндгейм', '[data-report-filter="intelligence"]');
  ensureReportTab(tabs, 'intelligence', 'Разведка');
  const endgame = tabs.querySelector('[data-report-filter="endgame"]');
  const intelligence = tabs.querySelector('[data-report-filter="intelligence"]');
  if (endgame !== null && intelligence !== null && endgame.nextElementSibling !== intelligence) {
    tabs.insertBefore(endgame, intelligence);
  }
}

function rewardText(reward: MissionReportReward): string {
  return `M ${reward.metal} · C ${reward.crystal} · G ${reward.gas} · X ${reward.exoticMatter}`;
}

function lossesText(losses: Readonly<Record<string, number>>): string {
  const entries = Object.entries(losses);
  return entries.length === 0
    ? 'нет'
    : entries.map(([unitId, count]) => `${unitId} × ${count}`).join(' · ');
}

function filterKind(filter: ReportShellFilter): MissionReportKind | 'all' {
  if (filter === 'combat') return 'battle';
  if (filter === 'expedition') return 'expedition';
  if (filter === 'object') return 'space-object';
  if (filter === 'event') return 'world-event';
  if (filter === 'intelligence') return 'intelligence';
  if (filter === 'endgame') return 'solar-war';
  return 'all';
}

export function isMissionReportVisibleToEmpire(
  report: UnifiedMissionReport,
  empireId: string,
): boolean {
  if (report.kind === 'intelligence' || report.kind === 'solar-war') {
    return report.primaryEmpireId === empireId;
  }
  return report.primaryEmpireId === empireId || report.secondaryEmpireId === empireId;
}

function createSelect(
  labelText: string,
  options: readonly { readonly value: string; readonly label: string }[],
  selected: string,
): { readonly label: HTMLLabelElement; readonly select: HTMLSelectElement } {
  const label = document.createElement('label');
  label.className = 'mission-report-control';
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

function createTerminalReportSummary(state: GameState): HTMLElement | null {
  const terminal = createCampaignTerminalPresentation(state, 'player');
  if (terminal === null) return null;
  const section = document.createElement('section');
  section.className = 'mission-reports-summary';
  section.dataset.testid = 'terminal-campaign-report';
  section.dataset.outcome = terminal.outcome;
  const title = document.createElement('h2');
  title.textContent = `Кампания завершена · ${terminal.outcomeLabel}`;
  const result = document.createElement('p');
  result.textContent = `Победитель: ${terminal.winningParticipationLabel}. Хост финальных Врат: ${terminal.hostLabel}.`;
  const timestamp = document.createElement('strong');
  timestamp.textContent = `Терминальная отметка ${formatGameDuration(terminal.terminalAt)}`;
  section.append(title, result, timestamp);
  return section;
}

function worldEventTargetLabel(state: GameState, targetId: string): string {
  const planet = state.planets.find((candidate) => candidate.id === targetId);
  if (planet !== undefined) return `${planet.name} · ${planet.coordinate.galaxy}:${planet.coordinate.solarSystem}:${planet.coordinate.position}`;
  const object = state.spaceObjects.find((candidate) => candidate.id === targetId);
  if (object !== undefined) {
    const coordinate = object.coordinate;
    return coordinate === undefined
      ? `${object.kind} · ${object.systemId}:${object.position}`
      : `${object.kind} · ${coordinate.galaxy}:${coordinate.solarSystem}:${coordinate.position}`;
  }
  const system = state.galaxy.systems.find((candidate) => candidate.id === targetId);
  return system === undefined
    ? targetId
    : `${system.name} · ${system.galaxy}:${system.solarSystem}`;
}

function worldEventPresentation(
  state: GameState,
  report: UnifiedMissionReport,
): { readonly title: string; readonly summary: string; readonly target: string } | undefined {
  if (report.kind !== 'world-event') return undefined;
  const event = state.worldEvents.history.find((candidate) => candidate.id === report.id);
  if (event === undefined) return undefined;
  const definition = WORLD_EVENT_CATALOG[event.definitionId];
  return {
    title: definition.name,
    summary: `${describeWorldEventEffect(event)} Завершение: ${event.completion}.`,
    target: worldEventTargetLabel(state, event.targetId),
  };
}

function playerTacticalSnapshot(report: UnifiedMissionReport) {
  if (report.primaryEmpireId === 'player') return report.tacticalContext?.primary;
  if (report.secondaryEmpireId === 'player') return report.tacticalContext?.secondary;
  return undefined;
}

function createTacticalFeedback(report: UnifiedMissionReport): HTMLElement | null {
  if (report.kind !== 'battle' && report.kind !== 'solar-war') return null;
  const playerInvolved = report.primaryEmpireId === 'player' || report.secondaryEmpireId === 'player';
  if (!playerInvolved) return null;
  const snapshot = playerTacticalSnapshot(report);
  const feedback = document.createElement('p');
  feedback.className = 'mission-report-tactical';
  feedback.dataset.testid = 'combat-tactical-context';
  feedback.textContent = snapshot === undefined
    ? 'Тактический контекст: не зафиксирован.'
    : `Доктрина: ${snapshot.doctrineId} · Уровень Адмирала: ${snapshot.commandLevel} · Флагман: ${snapshot.isFlagship ? 'да' : 'нет'} · Строй: ${snapshot.formation} · Приоритет цели: ${snapshot.targetPriority} · Командир: ${snapshot.commanderId ?? 'не назначен'}`;
  return feedback;
}

function createReportCard(
  state: GameState,
  report: UnifiedMissionReport,
  navigateToCoordinate: ReportsWorkspaceOptions['navigateToCoordinate'],
): HTMLElement {
  const card = document.createElement('article');
  card.className = `mission-report-card is-${report.kind} is-${report.mode}`;
  card.dataset.reportId = report.id;
  if (report.kind === 'world-event') card.dataset.testid = 'world-event-report';
  if (report.kind === 'solar-war') card.dataset.testid = 'solar-war-report';
  const presentation = worldEventPresentation(state, report);
  const header = document.createElement('header');
  const title = document.createElement('strong');
  title.textContent = presentation?.title ?? report.title;
  const badges = document.createElement('div');
  for (const label of [KIND_LABELS[report.kind] ?? report.kind, MODE_LABELS[report.mode], report.outcome]) {
    const badge = document.createElement('span');
    badge.textContent = label;
    badges.append(badge);
  }
  header.append(title, badges);
  const summary = document.createElement('p');
  summary.textContent = presentation?.summary ?? report.summary;
  const target = document.createElement('p');
  target.textContent = presentation === undefined
    ? `Цель: ${report.targetId} · участники ${report.primaryEmpireId ?? '—'} / ${report.secondaryEmpireId ?? '—'}`
    : `Цель: ${presentation.target}`;
  const balance = document.createElement('small');
  balance.textContent = report.kind === 'intelligence'
    ? `Время ${formatGameDuration(report.resolvedAt)} · данные получены из журнала разведки`
    : `Время ${formatGameDuration(report.resolvedAt)} · угроза ${report.threatMultiplierPermille / 10}% · награда ${report.rewardMultiplierPermille / 10}%`;
  const coordinate = resolveMissionReportCoordinate(state, report) ??
    findPlanetSiegeCoordinate(state, report.id);
  const mapLink = document.createElement('button');
  mapLink.type = 'button';
  mapLink.textContent = 'На карту';
  mapLink.dataset.reportMapLink = report.id;
  mapLink.disabled = coordinate === undefined;
  if (coordinate !== undefined) {
    mapLink.addEventListener('click', () => navigateToCoordinate(coordinate));
  }
  card.append(header, summary, target);
  if (report.kind !== 'intelligence') {
    const rewards = document.createElement('p');
    rewards.textContent = `Награда ${rewardText(report.reward)}`;
    const losses = document.createElement('p');
    losses.textContent = `Потери: свои ${lossesText(report.primaryLosses)} · противник ${lossesText(report.secondaryLosses)}`;
    card.append(rewards, losses);
  }
  const tacticalFeedback = createTacticalFeedback(report);
  if (tacticalFeedback !== null) card.append(tacticalFeedback);
  card.append(balance, mapLink);
  if ((report.combatBreakdown?.length ?? 0) > 0) {
    const details = document.createElement('details');
    const detailsSummary = document.createElement('summary');
    detailsSummary.textContent = `Расчёт combat v2 · строк ${report.combatBreakdown?.length ?? 0}`;
    const table = document.createElement('table');
    table.innerHTML = '<thead><tr><th>Раунд</th><th>Сторона</th><th>Цель</th><th>Урон</th><th>Потери</th></tr></thead>';
    const body = document.createElement('tbody');
    for (const line of report.combatBreakdown ?? []) {
      const row = document.createElement('tr');
      for (const value of [
        String(line.round),
        line.side === 'attacker' ? 'Атака' : 'Защита',
        `${line.targetUnitId} × ${line.targetCount}`,
        String(line.effectiveDamage),
        String(line.losses),
      ]) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      }
      body.append(row);
    }
    table.append(body);
    details.append(detailsSummary, table);
    card.append(details);
  }
  const siege = findPlanetDemolitionReport(state, report.id);
  if (siege !== undefined) card.append(createPlanetDemolitionDetails(siege));
  return card;
}

export function mountReportsWorkspace(options: ReportsWorkspaceOptions): ReportsWorkspace {
  const host = requireElement<HTMLElement>('#mission-reports-view');
  const tabs = requireElement<HTMLElement>('#reports-route-tabs');
  ensureExtendedTabs(tabs);
  let filter: ReportShellFilter = 'all';
  let active = false;
  let searchValue = '';
  let modeValue: MissionReportMode | 'all' = 'all';
  let empireValue = 'all';

  const refreshTabs = (): void => {
    for (const button of tabs.querySelectorAll<HTMLButtonElement>('[data-report-filter]')) {
      const candidate = button.dataset.reportFilter as ReportShellFilter;
      const selected = candidate === filter;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    }
  };

  const render = (): void => {
    if (!active) return;
    refreshTabs();
    const state = options.getState();
    const visible = createUnifiedMissionReports(state).filter((report) =>
      (report.kind !== 'intelligence' && report.kind !== 'solar-war') ||
      isMissionReportVisibleToEmpire(report, 'player'),
    );
    const filtered = filterMissionReports(visible, {
      search: searchValue,
      kind: filterKind(filter),
      mode: modeValue,
      empireId: empireValue,
    });
    const totals = summarizeMissionReports(filtered);

    const summary = document.createElement('section');
    summary.className = 'mission-reports-summary';
    const title = document.createElement('h2');
    title.textContent = 'Сводка';
    const text = document.createElement('p');
    text.textContent = `Отчётов ${totals.total} · PvE ${totals.pve} · PvP ${totals.pvp} · системных ${totals.system} · успехов ${totals.successes} · потерь ${totals.losses}`;
    const reward = document.createElement('strong');
    reward.textContent = `Получено ${rewardText(totals.rewards)}`;
    summary.append(title, text, reward);

    const controls = document.createElement('section');
    controls.className = 'mission-reports-controls';
    const searchLabel = document.createElement('label');
    searchLabel.className = 'mission-report-control mission-report-search';
    const searchCaption = document.createElement('span');
    searchCaption.textContent = 'Поиск';
    const search = document.createElement('input');
    search.type = 'search';
    search.placeholder = 'Цель, империя или результат';
    search.value = searchValue;
    search.setAttribute('aria-label', 'Поиск по отчётам');
    searchLabel.append(searchCaption, search);
    const mode = createSelect('Режим', [
      { value: 'all', label: 'Все' },
      ...Object.entries(MODE_LABELS).map(([value, label]) => ({ value, label })),
    ], modeValue);
    const empire = createSelect('Империя', [
      { value: 'all', label: 'Все' },
      ...state.empires.map((empireId) => ({ value: empireId, label: empireId })),
      { value: 'pirate-neutral', label: 'Пираты' },
    ], empireValue);
    for (const input of [search, mode.select, empire.select]) {
      input.addEventListener('input', () => {
        searchValue = search.value;
        modeValue = mode.select.value as MissionReportMode | 'all';
        empireValue = empire.select.value;
        render();
      });
      input.addEventListener('change', () => {
        searchValue = search.value;
        modeValue = mode.select.value as MissionReportMode | 'all';
        empireValue = empire.select.value;
        render();
      });
    }
    controls.append(searchLabel, mode.label, empire.label);

    const comparison = document.createElement('section');
    comparison.className = 'mission-reports-comparison';
    const comparisonTitle = document.createElement('h2');
    comparisonTitle.textContent = 'Сравнение империй';
    comparison.append(comparisonTitle);
    for (const row of compareEmpirePvePvp(state)) {
      const card = document.createElement('article');
      const name = document.createElement('strong');
      name.textContent = row.empireId;
      const activity = document.createElement('p');
      activity.textContent = `PvE ${row.pveSuccesses}/${row.pveOperations} · PvP побед ${row.pvpWins}/${row.pvpBattles} · потери ${row.losses}`;
      const rewards = document.createElement('small');
      rewards.textContent = rewardText(row.reward);
      card.append(name, activity, rewards);
      comparison.append(card);
    }

    const list = document.createElement('section');
    list.className = 'mission-reports-list';
    list.replaceChildren(...filtered.map((report) => createReportCard(state, report, options.navigateToCoordinate)));
    if (filtered.length === 0) list.textContent = 'По заданным фильтрам отчётов нет.';
    const incoming = createIncomingFlightsSection(state, 'player');
    incoming.hidden = filter !== 'all' && filter !== 'intelligence';
    const terminalSummary = filter === 'all' || filter === 'endgame'
      ? createTerminalReportSummary(state)
      : null;
    host.replaceChildren(
      summary,
      ...(terminalSummary === null ? [] : [terminalSummary]),
      controls,
      incoming,
      comparison,
      list,
    );
  };

  const onTabClick = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('[data-report-filter]');
    if (button === null) return;
    options.navigateToFilter(button.dataset.reportFilter as ReportShellFilter);
  };
  tabs.addEventListener('click', onTabClick);

  return {
    activate: (nextFilter) => {
      filter = FILTERS.includes(nextFilter) ? nextFilter : 'all';
      active = true;
      render();
    },
    refresh: render,
    deactivate: () => { active = false; },
    dispose: () => {
      tabs.removeEventListener('click', onTabClick);
      host.replaceChildren();
    },
  };
}
