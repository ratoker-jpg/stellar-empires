import type { ResourceId } from '../simulation/economy/types';
import type { LogisticsRoute } from '../simulation/logistics/types';
import type { GameCommand, GameState } from '../simulation/types';

export interface LogisticsRoutesBridge {
  readonly getState: () => GameState;
  readonly execute: (command: GameCommand, successMessage: string) => boolean;
}

const RESOURCE_LABELS: Readonly<Record<ResourceId, string>> = {
  metal: 'Металл',
  crystal: 'Минералы',
  gas: 'Газ',
};

function createPlanetSelect(planets: GameState['planets']): HTMLSelectElement {
  const select = document.createElement('select');
  for (const planet of planets) {
    const option = document.createElement('option');
    option.value = planet.id;
    option.textContent = planet.name;
    select.append(option);
  }
  return select;
}

function routeStatus(route: LogisticsRoute): string {
  if (route.lastResult === null) return 'Ожидает первого рейса';
  if (route.lastResult.code === 'transferred') return `Доставлено: ${route.lastResult.amount}`;
  if (route.lastResult.code === 'origin-reserve') return 'Недостаток сверх резерва';
  if (route.lastResult.code === 'target-full') return 'Склад назначения заполнен';
  return 'Маршрут потерял конечную точку';
}

export function mountLogisticsRoutesPanel(bridge: LogisticsRoutesBridge): void {
  const host = document.querySelector<HTMLElement>('.command-panel');
  if (host === null) return;
  const section = document.createElement('section');
  section.className = 'panel-block logistics-panel';
  host.append(section);

  const render = (): void => {
    const state = bridge.getState();
    const planets = state.planets.filter((planet) => planet.ownerEmpireId === 'player');
    const routes = state.logisticsRoutes.filter((route) => route.empireId === 'player');
    const eyebrow = document.createElement('p');
    eyebrow.className = 'panel-label';
    eyebrow.textContent = 'Межпланетное снабжение';
    const heading = document.createElement('h2');
    heading.textContent = 'Логистические маршруты';
    const summary = document.createElement('p');
    summary.textContent = `${routes.filter((route) => route.status === 'active').length} активных · ${routes.length} всего`;
    section.replaceChildren(eyebrow, heading, summary);

    if (planets.length < 2) {
      const hint = document.createElement('p');
      hint.className = 'operation-hint';
      hint.textContent = 'Для постоянного маршрута требуется минимум две колонии.';
      section.append(hint);
      return;
    }

    const form = document.createElement('form');
    form.className = 'logistics-form';
    const origin = createPlanetSelect(planets);
    const target = createPlanetSelect(planets);
    target.selectedIndex = 1;
    const resource = document.createElement('select');
    for (const resourceId of ['metal', 'crystal', 'gas'] as const) {
      const option = document.createElement('option');
      option.value = resourceId;
      option.textContent = RESOURCE_LABELS[resourceId];
      resource.append(option);
    }
    const amount = document.createElement('input');
    amount.type = 'number';
    amount.min = '1';
    amount.value = '500';
    amount.setAttribute('aria-label', 'Объём рейса');
    const reserve = document.createElement('input');
    reserve.type = 'number';
    reserve.min = '0';
    reserve.value = '1000';
    reserve.setAttribute('aria-label', 'Резерв на планете отправления');
    const interval = document.createElement('select');
    for (const [seconds, label] of [[1800, '30 мин'], [3600, '1 час'], [10800, '3 часа']] as const) {
      const option = document.createElement('option');
      option.value = String(seconds);
      option.textContent = label;
      interval.append(option);
    }
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.textContent = 'Создать маршрут';
    form.append(origin, target, resource, amount, reserve, interval, submit);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (origin.value === target.value) return;
      const created = bridge.execute(
        {
          type: 'CREATE_LOGISTICS_ROUTE',
          empireId: 'player',
          originPlanetId: origin.value,
          targetPlanetId: target.value,
          resourceId: resource.value as ResourceId,
          amountPerTrip: Number(amount.value),
          originReserve: Number(reserve.value),
          intervalSeconds: Number(interval.value),
          priority: 2,
        },
        'Постоянный маршрут создан',
      );
      if (created) render();
    });
    section.append(form);

    const list = document.createElement('div');
    list.className = 'logistics-list';
    for (const route of routes) {
      const originPlanet = planets.find((planet) => planet.id === route.originPlanetId);
      const targetPlanet = planets.find((planet) => planet.id === route.targetPlanetId);
      const card = document.createElement('article');
      const title = document.createElement('strong');
      title.textContent = `${originPlanet?.name ?? '—'} → ${targetPlanet?.name ?? '—'}`;
      const details = document.createElement('span');
      details.textContent = `${RESOURCE_LABELS[route.resourceId]} · ${route.amountPerTrip} · резерв ${route.originReserve}`;
      const status = document.createElement('small');
      status.textContent = `${route.status === 'active' ? 'Активен' : 'Пауза'} · ${routeStatus(route)}`;
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.textContent = route.status === 'active' ? 'Пауза' : 'Запустить';
      toggle.addEventListener('click', () => {
        bridge.execute(
          {
            type: 'UPDATE_LOGISTICS_ROUTE',
            empireId: 'player',
            routeId: route.id,
            status: route.status === 'active' ? 'paused' : 'active',
          },
          route.status === 'active' ? 'Маршрут приостановлен' : 'Маршрут запущен',
        );
        render();
      });
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Удалить';
      remove.addEventListener('click', () => {
        bridge.execute(
          { type: 'DELETE_LOGISTICS_ROUTE', empireId: 'player', routeId: route.id },
          'Маршрут удалён',
        );
        render();
      });
      card.append(title, details, status, toggle, remove);
      list.append(card);
    }
    section.append(list);
  };

  render();
}
