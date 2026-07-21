import '../styles/operationsWorkspace.css';
import { createUnifiedMissionReports } from '../simulation/reports/missionReports';
import type { GameState } from '../simulation/types';

export interface OperationsWorkspaceOptions {
  readonly getState: () => GameState;
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

function createNavigationButton(): HTMLButtonElement {
  const existing = document.querySelector<HTMLButtonElement>('#nav-operations');
  if (existing !== null) return existing;
  const reports = document.querySelector<HTMLButtonElement>('#nav-reports')
    ?? document.querySelector<HTMLButtonElement>('button[aria-label="Отчёты"]');
  const button = document.createElement('button');
  button.id = 'nav-operations';
  button.className = 'rail-button rail-button--utility';
  button.type = 'button';
  button.setAttribute('aria-label', 'Операционный центр');
  button.innerHTML = '<span class="rail-button__icon">◎</span><small>Операции</small>';
  if (reports !== null) reports.insertAdjacentElement('beforebegin', button);
  else document.querySelector<HTMLElement>('.side-rail')?.append(button);
  return button;
}

function createDialog(): HTMLDialogElement {
  const existing = document.querySelector<HTMLDialogElement>('#operations-workspace-dialog');
  if (existing !== null) return existing;
  const dialog = document.createElement('dialog');
  dialog.id = 'operations-workspace-dialog';
  dialog.className = 'operations-workspace-dialog';
  dialog.innerHTML = `
    <header class="operations-workspace-header">
      <div><p class="panel-label">Empire Operations</p><h2>Операционный центр</h2><p>Снабжение, торговля и активность живой галактики в одном контуре.</p></div>
      <button type="button" class="dialog-close" aria-label="Закрыть операционный центр">×</button>
    </header>
    <section class="operations-summary" aria-label="Сводка операций"></section>
    <section class="operations-launchers" aria-label="Стратегические операции"></section>
    <section class="operations-core-grid" aria-label="Рынок и логистика"></section>
  `;
  dialog.querySelector<HTMLButtonElement>('.dialog-close')?.addEventListener('click', () => {
    dialog.close();
  });
  document.body.append(dialog);
  return dialog;
}

const LAUNCHERS = [
  {
    selector: '#nav-expeditions',
    title: 'Экспедиции',
    description: 'Свободные позиции, дальние маршруты и результаты исследования.',
    icon: '✦',
  },
  {
    selector: '#nav-space-objects',
    title: 'Стратегические объекты',
    description: 'Астероиды, газовые облака, аномалии и экзотическая материя.',
    icon: '☄',
  },
  {
    selector: '#nav-world-events',
    title: 'Мировые события',
    description: 'Активные эффекты, временные цели и история живой галактики.',
    icon: '⚡',
  },
  {
    selector: '#nav-reports',
    title: 'Единые отчёты',
    description: 'PvE, PvP, экспедиции, объекты и системные события.',
    icon: '▤',
  },
] as const;

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

export function mountOperationsWorkspace(options: OperationsWorkspaceOptions): void {
  const button = createNavigationButton();
  const dialog = createDialog();
  const summaryHost = dialog.querySelector<HTMLElement>('.operations-summary');
  const launchersHost = dialog.querySelector<HTMLElement>('.operations-launchers');
  const coreHost = dialog.querySelector<HTMLElement>('.operations-core-grid');
  if (summaryHost === null || launchersHost === null || coreHost === null) {
    throw new Error('Operations workspace containers are missing.');
  }

  const market = document.querySelector<HTMLElement>('.market-panel');
  const logistics = document.querySelector<HTMLElement>('.logistics-panel');
  if (market !== null) coreHost.append(market);
  if (logistics !== null) coreHost.append(logistics);

  launchersHost.replaceChildren();
  for (const launcher of LAUNCHERS) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'operations-launcher';
    const icon = document.createElement('span');
    icon.textContent = launcher.icon;
    const copy = document.createElement('span');
    const title = document.createElement('strong');
    title.textContent = launcher.title;
    const description = document.createElement('small');
    description.textContent = launcher.description;
    copy.append(title, description);
    card.append(icon, copy);
    card.addEventListener('click', () => {
      dialog.close();
      document.querySelector<HTMLButtonElement>(launcher.selector)?.click();
    });
    launchersHost.append(card);
  }

  const render = (): void => {
    const data = createOperationsSummary(options.getState());
    summaryHost.replaceChildren(
      createMetric('Маршруты', `${data.activeRoutes}/${data.totalRoutes}`, 'активно / всего'),
      createMetric('Рынок', String(data.marketTrades), 'завершённых сделок'),
      createMetric(
        'Полевые операции',
        String(data.activeExpeditions + data.activeObjectOperations),
        `${data.activeExpeditions} эксп. · ${data.activeObjectOperations} объектов`,
      ),
      createMetric('Объекты', String(data.availableObjects), 'доступно для операций'),
      createMetric('События', String(data.activeEvents), 'активно сейчас'),
      createMetric('Отчёты', String(data.reports), 'в едином журнале'),
      createMetric('Экзоматерия', String(data.exoticMatter), 'стратегический резерв'),
    );
  };

  button.addEventListener('click', () => {
    render();
    dialog.showModal();
  });
}
