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
import { formatGameDuration } from './planetViewModel';

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
];
const KIND_LABELS: Readonly<Record<MissionReportKind, string>> = {
  battle: 'Бой',
  expedition: 'Экспедиция',
  'space-object': 'Космический объект',
  'world-event': 'Мировое событие',
  intelligence: 'Разведка',
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
  return 'all';
}

export function isMissionReportVisibleToEmpire(
  report: UnifiedMissionReport,
  empireId: string,
): boolean {
  if (report.kind === 'intelligence') return report.primaryEmpireId === empireId;
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

function createReportCard(
  state: GameState,
  report: UnifiedMissionReport,
  navigateToCoordinate: ReportsWorkspaceOptions['navigateToCoordinate'],
): HTMLElement {
  const card = document.createElement('article');
  card.className = `mission-report-card is-${report.kind} is-${report.mode}`;
  card.dataset.reportId = report.id;
  const header = document.createElement('header');
  const title = document.createElement('strong');
  title.textContent = report.title;
  const badges = document.createElement('div');
  for (const label of [KIND_LABELS[report.kind], MODE_LABELS[report.mode], report.outcome]) {
    const badge = document.createElement('span');
    badge.textContent = label;
    badges.append(badge);
  }
  header.append(title, badges);
  const summary = document.createElement('p');
  summary.textContent = report.summary;
  const target = document.createElement('p');
  target.textContent = `Цель: ${report.targetId} · участники ${report.primaryEmpireId ?? '—'} / ${report.secondaryEmpireId ?? '—'}`;
  const balance = document.createElement('small');
  balance.textContent = report.kind === 'intelligence'
    ? `Время ${formatGameDuration(report.resolvedAt)} · данные получены из журнала разведки`
    : `Время ${formatGameDuration(report.resolvedAt)} · угроза ${report.threatMultiplierPermille / 10}% · награда ${report.rewardMultiplierPermille / 10}%`;
  const coordinate = resolveMissionReportCoordinate(state, report);
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
  return card;
}

export function mountReportsWorkspace(options: ReportsWorkspaceOptions): ReportsWorkspace {
  const host = requireElement<HTMLElement>('#mission-reports-view');
  const tabs = requireElement<HTMLElement>('#reports-route-tabs');
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
    const visible = createUnifiedMissionReports(state).filter(
      (report) => report.kind !== 'intelligence' || isMissionReportVisibleToEmpire(report, 'player'),
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
    host.replaceChildren(summary, controls, comparison, list);
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
