import {
  compareEmpirePvePvp,
  createUnifiedMissionReports,
  filterMissionReports,
  summarizeMissionReports,
  type MissionCombatBreakdownLine,
  type MissionReportKind,
  type MissionReportMode,
  type MissionReportReward,
  type UnifiedMissionReport,
} from '../simulation/reports/missionReports';
import type { GameState } from '../simulation/types';
import { formatGameDuration } from './planetViewModel';

export interface MissionReportsPanelOptions {
  readonly getState: () => GameState;
}

const KIND_LABELS: Readonly<Record<MissionReportKind, string>> = {
  battle: 'Бой',
  expedition: 'Экспедиция',
  'space-object': 'Космический объект',
  'world-event': 'Мировое событие',
};

const MODE_LABELS: Readonly<Record<MissionReportMode, string>> = {
  pve: 'PvE',
  pvp: 'PvP',
  system: 'Системное',
};

const WEAPON_LABELS = {
  kinetic: 'Кинетика',
  plasma: 'Плазма',
  missile: 'Ракеты',
  disruptor: 'Дезинтегратор',
} as const;

const PROTECTION_LABELS = {
  'light-armor': 'Лёгкая броня',
  'heavy-armor': 'Тяжёлая броня',
  'shield-grid': 'Щитовая сеть',
  fortified: 'Укрепление',
} as const;

const SIZE_LABELS = {
  small: 'Малая',
  medium: 'Средняя',
  large: 'Крупная',
  installation: 'Установка',
} as const;

function createNavigationButton(): HTMLButtonElement {
  const existing = document.querySelector<HTMLButtonElement>('#nav-reports');
  if (existing !== null) return existing;
  const candidate = document.querySelector<HTMLButtonElement>('button[aria-label="Отчёты"]');
  if (candidate !== null) {
    candidate.id = 'nav-reports';
    candidate.disabled = false;
    return candidate;
  }
  const button = document.createElement('button');
  button.id = 'nav-reports';
  button.className = 'rail-button';
  button.type = 'button';
  button.setAttribute('aria-label', 'Отчёты');
  button.innerHTML = '<span>▤</span><small>Отчёты</small>';
  document.querySelector<HTMLElement>('.side-rail')?.append(button);
  return button;
}

function createDialog(): HTMLDialogElement {
  const existing = document.querySelector<HTMLDialogElement>('#mission-reports-dialog');
  if (existing !== null) return existing;
  const dialog = document.createElement('dialog');
  dialog.id = 'mission-reports-dialog';
  dialog.className = 'mission-reports-dialog';
  dialog.innerHTML = `
    <header class="mission-reports-header">
      <div><p class="panel-label">Operations Intelligence</p><h2>Единые отчёты</h2></div>
      <button type="button" class="dialog-close" aria-label="Закрыть">×</button>
    </header>
    <section class="mission-reports-summary"></section>
    <section class="mission-reports-controls"></section>
    <section class="mission-reports-comparison"></section>
    <section class="mission-reports-list"></section>
  `;
  dialog.querySelector<HTMLButtonElement>('.dialog-close')?.addEventListener('click', () => {
    dialog.close();
  });
  document.body.append(dialog);
  return dialog;
}

function createSelect(
  labelText: string,
  options: readonly { readonly value: string; readonly label: string }[],
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
  label.append(caption, select);
  return { label, select };
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

function weaponText(line: MissionCombatBreakdownLine): string {
  return line.weaponContributions
    .filter((entry) => entry.baseDamage > 0)
    .map(
      (entry) =>
        `${WEAPON_LABELS[entry.weaponType]} ${entry.baseDamage} × ${(entry.modifierPermille / 10).toFixed(0)}%`,
    )
    .join(' + ');
}

function createCombatDetails(
  breakdown: readonly MissionCombatBreakdownLine[],
): HTMLDetailsElement {
  const details = document.createElement('details');
  details.className = 'mission-combat-details';
  const summary = document.createElement('summary');
  summary.textContent = `Расчёт combat v2 · строк ${breakdown.length}`;
  const scroller = document.createElement('div');
  scroller.className = 'mission-combat-table-wrap';
  const table = document.createElement('table');
  table.innerHTML = `
    <thead><tr>
      <th>Раунд</th><th>Сторона</th><th>Цель</th><th>Профиль</th><th>Оружие</th>
      <th>База</th><th>Контр</th><th>Разброс</th><th>Урон</th><th>Накоплено</th><th>Прочность</th><th>Потери</th>
    </tr></thead>
  `;
  const body = document.createElement('tbody');
  for (const line of breakdown) {
    const row = document.createElement('tr');
    const values = [
      String(line.round),
      line.side === 'attacker' ? 'Атака' : 'Защита',
      `${line.targetUnitId} × ${line.targetCount}`,
      `${PROTECTION_LABELS[line.protectionType]} · ${SIZE_LABELS[line.targetSize]}`,
      weaponText(line),
      String(line.allocatedBaseDamage),
      `${(line.weightedModifierPermille / 10).toFixed(0)}%`,
      `${(line.variancePermille / 10).toFixed(0)}%`,
      String(line.effectiveDamage),
      String(line.carriedDamage),
      String(line.durability),
      String(line.losses),
    ];
    for (const value of values) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    }
    body.append(row);
  }
  table.append(body);
  scroller.append(table);
  const note = document.createElement('small');
  note.textContent = 'Формула: базовый урон × контр-модификатор × детерминированный разброс. Неполный урон переносится в следующий раунд.';
  details.append(summary, scroller, note);
  return details;
}

function createReportCard(report: UnifiedMissionReport): HTMLElement {
  const card = document.createElement('article');
  card.className = `mission-report-card is-${report.kind} is-${report.mode}`;
  const header = document.createElement('header');
  const title = document.createElement('strong');
  title.textContent = report.title;
  const badges = document.createElement('div');
  const kind = document.createElement('span');
  kind.textContent = KIND_LABELS[report.kind];
  const mode = document.createElement('span');
  mode.textContent = MODE_LABELS[report.mode];
  const outcome = document.createElement('span');
  outcome.textContent = report.outcome;
  badges.append(kind, mode, outcome);
  header.append(title, badges);

  const summary = document.createElement('p');
  summary.textContent = report.summary;
  const target = document.createElement('p');
  target.textContent = `Цель: ${report.targetId} · участники ${report.primaryEmpireId ?? '—'} / ${report.secondaryEmpireId ?? '—'}`;
  const rewards = document.createElement('p');
  rewards.textContent = `Награда ${rewardText(report.reward)}`;
  const losses = document.createElement('p');
  losses.textContent = `Потери: свои ${lossesText(report.primaryLosses)} · противник ${lossesText(report.secondaryLosses)}`;
  const balance = document.createElement('small');
  balance.textContent = `Время ${formatGameDuration(report.resolvedAt)} · угроза ${report.threatMultiplierPermille / 10}% · награда ${report.rewardMultiplierPermille / 10}%`;
  card.append(header, summary, target, rewards, losses, balance);
  if ((report.combatBreakdown?.length ?? 0) > 0) {
    card.append(createCombatDetails(report.combatBreakdown ?? []));
  }
  return card;
}

export function mountMissionReportsPanel(options: MissionReportsPanelOptions): void {
  const button = createNavigationButton();
  const dialog = createDialog();
  const summary = dialog.querySelector<HTMLElement>('.mission-reports-summary');
  const controls = dialog.querySelector<HTMLElement>('.mission-reports-controls');
  const comparison = dialog.querySelector<HTMLElement>('.mission-reports-comparison');
  const list = dialog.querySelector<HTMLElement>('.mission-reports-list');
  if (summary === null || controls === null || comparison === null || list === null) {
    throw new Error('Mission report panel containers are missing.');
  }

  const searchLabel = document.createElement('label');
  searchLabel.className = 'mission-report-control mission-report-search';
  const searchCaption = document.createElement('span');
  searchCaption.textContent = 'Поиск';
  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = 'Цель, империя или результат';
  searchLabel.append(searchCaption, search);

  const kind = createSelect('Тип', [
    { value: 'all', label: 'Все' },
    ...Object.entries(KIND_LABELS).map(([value, label]) => ({ value, label })),
  ]);
  const mode = createSelect('Режим', [
    { value: 'all', label: 'Все' },
    ...Object.entries(MODE_LABELS).map(([value, label]) => ({ value, label })),
  ]);
  const empire = createSelect('Империя', [{ value: 'all', label: 'Все' }]);
  controls.append(searchLabel, kind.label, mode.label, empire.label);

  const render = (): void => {
    const state = options.getState();
    const currentEmpireValue = empire.select.value;
    empire.select.replaceChildren();
    for (const option of [
      { value: 'all', label: 'Все' },
      ...state.empires.map((empireId) => ({ value: empireId, label: empireId })),
      { value: 'pirate-neutral', label: 'Пираты' },
    ]) {
      const element = document.createElement('option');
      element.value = option.value;
      element.textContent = option.label;
      empire.select.append(element);
    }
    empire.select.value = [...empire.select.options].some((option) => option.value === currentEmpireValue)
      ? currentEmpireValue
      : 'all';

    const all = createUnifiedMissionReports(state);
    const filtered = filterMissionReports(all, {
      search: search.value,
      kind: kind.select.value as MissionReportKind | 'all',
      mode: mode.select.value as MissionReportMode | 'all',
      empireId: empire.select.value,
    });
    const totals = summarizeMissionReports(filtered);
    summary.replaceChildren();
    const summaryTitle = document.createElement('h3');
    summaryTitle.textContent = 'Сводка';
    const summaryText = document.createElement('p');
    summaryText.textContent = `Отчётов ${totals.total} · PvE ${totals.pve} · PvP ${totals.pvp} · системных ${totals.system} · успехов ${totals.successes} · потерь ${totals.losses}`;
    const summaryReward = document.createElement('strong');
    summaryReward.textContent = `Получено ${rewardText(totals.rewards)}`;
    summary.append(summaryTitle, summaryText, summaryReward);

    comparison.replaceChildren();
    const comparisonTitle = document.createElement('h3');
    comparisonTitle.textContent = 'Сравнение империй';
    comparison.append(comparisonTitle);
    for (const row of compareEmpirePvePvp(state)) {
      const article = document.createElement('article');
      const title = document.createElement('strong');
      title.textContent = row.empireId;
      const activity = document.createElement('p');
      activity.textContent = `PvE ${row.pveSuccesses}/${row.pveOperations} · PvP побед ${row.pvpWins}/${row.pvpBattles} · потери ${row.losses}`;
      const rewards = document.createElement('small');
      rewards.textContent = rewardText(row.reward);
      article.append(title, activity, rewards);
      comparison.append(article);
    }

    list.replaceChildren(...filtered.map(createReportCard));
    if (filtered.length === 0) list.textContent = 'По заданным фильтрам отчётов нет.';
  };

  for (const input of [search, kind.select, mode.select, empire.select]) {
    input.addEventListener('input', render);
    input.addEventListener('change', render);
  }
  button.addEventListener('click', () => {
    render();
    dialog.showModal();
  });
}
