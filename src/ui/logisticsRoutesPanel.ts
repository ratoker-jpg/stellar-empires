import {
  createEmpireEconomyPortfolio,
  type EmpireResourcePortfolio,
} from '../simulation/economy/empireEconomy';
import type { ResourceId } from '../simulation/economy/types';
import type { LogisticsRoute } from '../simulation/logistics/types';
import type { GameCommand, GameState } from '../simulation/types';
import { formatGameDuration } from './planetViewModel';

export interface LogisticsRoutesBridge {
  readonly getState: () => GameState;
  readonly execute: (command: GameCommand, successMessage: string) => boolean;
  readonly refresh: () => void;
}

const RESOURCE_LABELS: Readonly<Record<ResourceId, string>> = {
  metal: 'Металл',
  crystal: 'Минералы',
  gas: 'Газ',
};

const INTERVALS = [
  [300, '5 мин'],
  [900, '15 мин'],
  [1800, '30 мин'],
  [3600, '1 час'],
  [10800, '3 часа'],
  [21600, '6 часов'],
] as const;

function createField(labelText: string, control: HTMLElement): HTMLLabelElement {
  const label = document.createElement('label');
  const caption = document.createElement('span');
  caption.textContent = labelText;
  label.append(caption, control);
  return label;
}

function createPlanetSelect(
  planets: GameState['planets'],
  selected?: string,
): HTMLSelectElement {
  const select = document.createElement('select');
  for (const planet of planets) {
    const option = document.createElement('option');
    option.value = planet.id;
    option.textContent = planet.name;
    select.append(option);
  }
  if (selected !== undefined) select.value = selected;
  return select;
}

function createResourceSelect(selected: ResourceId = 'metal'): HTMLSelectElement {
  const select = document.createElement('select');
  for (const resourceId of ['metal', 'crystal', 'gas'] as const) {
    const option = document.createElement('option');
    option.value = resourceId;
    option.textContent = RESOURCE_LABELS[resourceId];
    select.append(option);
  }
  select.value = selected;
  return select;
}

function createIntervalSelect(selected = 3600): HTMLSelectElement {
  const select = document.createElement('select');
  for (const [seconds, label] of INTERVALS) {
    const option = document.createElement('option');
    option.value = String(seconds);
    option.textContent = label;
    select.append(option);
  }
  if (![...select.options].some((option) => Number(option.value) === selected)) {
    const custom = document.createElement('option');
    custom.value = String(selected);
    custom.textContent = formatGameDuration(selected);
    select.append(custom);
  }
  select.value = String(selected);
  return select;
}

function createPrioritySelect(selected: 1 | 2 | 3 = 2): HTMLSelectElement {
  const select = document.createElement('select');
  for (const [value, label] of [[3, 'Высокий'], [2, 'Обычный'], [1, 'Низкий']] as const) {
    const option = document.createElement('option');
    option.value = String(value);
    option.textContent = label;
    select.append(option);
  }
  select.value = String(selected);
  return select;
}

function routeStatus(route: LogisticsRoute): string {
  if (route.lastResult === null) return 'Ожидает первого рейса';
  if (route.lastResult.code === 'transferred') {
    return `Доставлено ${route.lastResult.amount} в ${formatGameDuration(route.lastResult.executedAt)}`;
  }
  if (route.lastResult.code === 'origin-reserve') return 'Недостаток сверх резерва';
  if (route.lastResult.code === 'target-full') return 'Склад назначения заполнен';
  if (route.lastResult.code === 'origin-missing') return 'Планета отправления потеряна';
  return 'Планета назначения потеряна';
}

function configuredPerHour(route: LogisticsRoute): number {
  return (route.amountPerTrip * 3600) / route.intervalSeconds;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value);
}

function pressureText(resource: EmpireResourcePortfolio): string {
  return `${formatNumber(resource.amount)}/${formatNumber(resource.capacity)} · ${formatNumber(resource.fillPermille / 10)}% · итог ${formatNumber(resource.effectiveNetFlowPerHour)}/ч`;
}

function createEndpointLink(planetId: string, name: string, testId: string): HTMLAnchorElement {
  const link = document.createElement('a');
  link.href = `#/planet/${encodeURIComponent(planetId)}/overview`;
  link.dataset.testid = testId;
  link.textContent = name;
  return link;
}

function commandFeedback(
  output: HTMLOutputElement,
  accepted: boolean,
  successText: string,
): void {
  output.dataset.state = accepted ? 'success' : 'error';
  output.textContent = accepted
    ? successText
    : 'Команда отклонена. Проверь параметры маршрута и доступность колоний.';
}

function renderEditForm(
  card: HTMLElement,
  route: LogisticsRoute,
  bridge: LogisticsRoutesBridge,
): void {
  card.querySelector('.logistics-edit-form')?.remove();
  const form = document.createElement('form');
  form.className = 'logistics-form logistics-edit-form';
  form.dataset.testid = `logistics-edit-form-${route.id}`;
  const amount = document.createElement('input');
  amount.type = 'number';
  amount.min = '1';
  amount.max = '100000';
  amount.value = String(route.amountPerTrip);
  const reserve = document.createElement('input');
  reserve.type = 'number';
  reserve.min = '0';
  reserve.value = String(route.originReserve);
  const interval = createIntervalSelect(route.intervalSeconds);
  const priority = createPrioritySelect(route.priority);
  const feedback = document.createElement('output');
  feedback.className = 'operations-command-feedback';
  feedback.setAttribute('aria-live', 'polite');
  const save = document.createElement('button');
  save.type = 'submit';
  save.textContent = 'Сохранить изменения';
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.textContent = 'Отмена';
  cancel.addEventListener('click', () => form.remove());
  form.append(
    createField('Объём рейса', amount),
    createField('Резерв отправителя', reserve),
    createField('Интервал', interval),
    createField('Приоритет', priority),
    feedback,
    save,
    cancel,
  );
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const accepted = bridge.execute({
      type: 'UPDATE_LOGISTICS_ROUTE',
      empireId: 'player',
      routeId: route.id,
      amountPerTrip: Number(amount.value),
      originReserve: Number(reserve.value),
      intervalSeconds: Number(interval.value),
      priority: Number(priority.value) as 1 | 2 | 3,
    }, 'Параметры маршрута обновлены');
    commandFeedback(feedback, accepted, 'Параметры маршрута сохранены.');
    if (accepted) bridge.refresh();
  });
  card.append(form);
}

export function renderLogisticsRoutesPanel(
  host: HTMLElement,
  bridge: LogisticsRoutesBridge,
): void {
  const state = bridge.getState();
  const planets = state.planets
    .filter((planet) => planet.ownerEmpireId === 'player')
    .sort((left, right) =>
      left.systemId.localeCompare(right.systemId) ||
      left.position - right.position ||
      left.id.localeCompare(right.id));
  const routes = state.logisticsRoutes
    .filter((route) => route.empireId === 'player')
    .sort((left, right) => left.id.localeCompare(right.id));
  const portfolio = createEmpireEconomyPortfolio(state, 'player');
  const section = document.createElement('section');
  section.className = 'logistics-panel operations-embedded-panel';
  section.dataset.testid = 'canonical-logistics-panel';
  const heading = document.createElement('h2');
  heading.textContent = 'Логистические маршруты';
  const summary = document.createElement('p');
  summary.textContent = `${routes.filter((route) => route.status === 'active').length} активных · ${routes.length} всего`;
  section.append(heading, summary);

  if (planets.length < 2) {
    const hint = document.createElement('p');
    hint.className = 'operation-hint';
    hint.textContent = 'Для постоянного маршрута требуется минимум две колонии.';
    section.append(hint);
    host.replaceChildren(section);
    return;
  }

  const form = document.createElement('form');
  form.className = 'logistics-form logistics-create-form';
  form.dataset.testid = 'logistics-create-form';
  const origin = createPlanetSelect(planets, planets[0]?.id);
  const target = createPlanetSelect(planets, planets[1]?.id);
  const resource = createResourceSelect();
  const amount = document.createElement('input');
  amount.type = 'number';
  amount.min = '1';
  amount.max = '100000';
  amount.value = '500';
  const reserve = document.createElement('input');
  reserve.type = 'number';
  reserve.min = '0';
  reserve.value = '1000';
  const interval = createIntervalSelect();
  const priority = createPrioritySelect();
  const feedback = document.createElement('output');
  feedback.className = 'operations-command-feedback';
  feedback.dataset.testid = 'logistics-feedback';
  feedback.setAttribute('aria-live', 'polite');
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.textContent = 'Создать маршрут';
  form.append(
    createField('Планета отправления', origin),
    createField('Планета назначения', target),
    createField('Ресурс', resource),
    createField('Объём рейса', amount),
    createField('Резерв отправителя', reserve),
    createField('Интервал', interval),
    createField('Приоритет', priority),
    feedback,
    submit,
  );
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (origin.value === target.value) {
      commandFeedback(feedback, false, '');
      feedback.textContent = 'Планеты отправления и назначения должны различаться.';
      return;
    }
    const duplicate = bridge.getState().logisticsRoutes.some((route) =>
      route.empireId === 'player' &&
      route.originPlanetId === origin.value &&
      route.targetPlanetId === target.value &&
      route.resourceId === resource.value);
    if (duplicate) {
      commandFeedback(feedback, false, '');
      feedback.textContent = 'Такой маршрут уже существует.';
      return;
    }
    const accepted = bridge.execute({
      type: 'CREATE_LOGISTICS_ROUTE',
      empireId: 'player',
      originPlanetId: origin.value,
      targetPlanetId: target.value,
      resourceId: resource.value as ResourceId,
      amountPerTrip: Number(amount.value),
      originReserve: Number(reserve.value),
      intervalSeconds: Number(interval.value),
      priority: Number(priority.value) as 1 | 2 | 3,
    }, 'Постоянный маршрут создан');
    commandFeedback(feedback, accepted, 'Маршрут создан.');
    if (accepted) bridge.refresh();
  });
  section.append(form);

  const list = document.createElement('div');
  list.className = 'logistics-list';
  list.dataset.testid = 'logistics-route-list';
  for (const route of routes) {
    const originPlanet = planets.find((planet) => planet.id === route.originPlanetId);
    const targetPlanet = planets.find((planet) => planet.id === route.targetPlanetId);
    const originPortfolio = portfolio.colonies.find((colony) => colony.id === route.originPlanetId);
    const targetPortfolio = portfolio.colonies.find((colony) => colony.id === route.targetPlanetId);
    const card = document.createElement('article');
    card.dataset.routeId = route.id;
    const title = document.createElement('div');
    title.className = 'logistics-route-title';
    if (originPlanet !== undefined) {
      title.append(createEndpointLink(originPlanet.id, originPlanet.name, 'logistics-origin-link'));
    } else title.append('—');
    title.append(' → ');
    if (targetPlanet !== undefined) {
      title.append(createEndpointLink(targetPlanet.id, targetPlanet.name, 'logistics-target-link'));
    } else title.append('—');
    const details = document.createElement('span');
    details.textContent = `${RESOURCE_LABELS[route.resourceId]} · ${formatNumber(route.amountPerTrip)} за рейс · ${formatNumber(configuredPerHour(route))}/ч · резерв ${formatNumber(route.originReserve)} · приоритет ${route.priority}`;
    const schedule = document.createElement('small');
    schedule.textContent = route.status === 'active'
      ? `Следующий рейс через ${formatGameDuration(Math.max(0, route.nextDepartureAt - state.clock.elapsedSeconds))}`
      : 'Маршрут приостановлен';
    const result = document.createElement('small');
    result.textContent = `${routeStatus(route)} · пропусков подряд ${route.consecutiveMisses}`;
    const pressure = document.createElement('div');
    pressure.className = 'logistics-route-pressure';
    const originPressure = document.createElement('span');
    originPressure.textContent = `Отправитель: ${originPortfolio === undefined ? 'нет данных' : pressureText(originPortfolio.resources[route.resourceId])}`;
    const targetPressure = document.createElement('span');
    targetPressure.textContent = `Получатель: ${targetPortfolio === undefined ? 'нет данных' : pressureText(targetPortfolio.resources[route.resourceId])}`;
    pressure.append(originPressure, targetPressure);
    const actions = document.createElement('div');
    actions.className = 'logistics-route-actions';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.textContent = 'Изменить';
    edit.dataset.testid = 'logistics-edit';
    edit.addEventListener('click', () => renderEditForm(card, route, bridge));
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.textContent = route.status === 'active' ? 'Пауза' : 'Запустить';
    toggle.dataset.testid = 'logistics-toggle';
    toggle.addEventListener('click', () => {
      const accepted = bridge.execute({
        type: 'UPDATE_LOGISTICS_ROUTE',
        empireId: 'player',
        routeId: route.id,
        status: route.status === 'active' ? 'paused' : 'active',
      }, route.status === 'active' ? 'Маршрут приостановлен' : 'Маршрут запущен');
      if (accepted) bridge.refresh();
    });
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Удалить';
    remove.dataset.testid = 'logistics-delete';
    remove.addEventListener('click', () => {
      const accepted = bridge.execute(
        { type: 'DELETE_LOGISTICS_ROUTE', empireId: 'player', routeId: route.id },
        'Маршрут удалён',
      );
      if (accepted) bridge.refresh();
    });
    actions.append(edit, toggle, remove);
    card.append(title, details, schedule, result, pressure, actions);
    list.append(card);
  }
  if (routes.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'Маршрутов пока нет.';
    list.append(empty);
  }
  section.append(list);
  host.replaceChildren(section);
}
