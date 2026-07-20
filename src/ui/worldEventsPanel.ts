import {
  WORLD_EVENT_CATALOG,
  type WorldEventInstance,
} from '../simulation/pve/worldEvents';
import type { GameState } from '../simulation/types';
import { formatGameDuration } from './planetViewModel';

export interface WorldEventsPanelOptions {
  readonly getState: () => GameState;
}

function createNavigationButton(): HTMLButtonElement {
  const existing = document.querySelector<HTMLButtonElement>('#nav-world-events');
  if (existing !== null) return existing;
  const anchor = document.querySelector<HTMLButtonElement>('#nav-space-objects')
    ?? document.querySelector<HTMLButtonElement>('#nav-expeditions')
    ?? document.querySelector<HTMLButtonElement>('#nav-galaxy');
  const clone = anchor?.cloneNode(true) as HTMLButtonElement | undefined;
  const button = clone ?? document.createElement('button');
  button.id = 'nav-world-events';
  button.type = 'button';
  button.classList.remove('is-active');
  button.setAttribute('aria-label', 'Мировые события');
  const icon = button.querySelector('span');
  if (icon !== null) icon.textContent = '⚡';
  const label = button.querySelector('small');
  if (label !== null) label.textContent = 'События';
  anchor?.insertAdjacentElement('afterend', button);
  return button;
}

function createDialog(): HTMLDialogElement {
  const existing = document.querySelector<HTMLDialogElement>('#world-events-dialog');
  if (existing !== null) return existing;
  const dialog = document.createElement('dialog');
  dialog.id = 'world-events-dialog';
  dialog.className = 'world-events-dialog';
  dialog.innerHTML = `
    <header class="world-events-header">
      <div><p class="panel-label">Living Galaxy</p><h2>Мировые события</h2></div>
      <button type="button" class="dialog-close" aria-label="Закрыть">×</button>
    </header>
    <section class="world-events-status"></section>
    <section class="world-events-active"></section>
    <section class="world-events-cooldowns"></section>
    <section class="world-events-history"></section>
  `;
  dialog.querySelector<HTMLButtonElement>('.dialog-close')?.addEventListener('click', () => {
    dialog.close();
  });
  document.body.append(dialog);
  return dialog;
}

function targetLabel(state: GameState, event: WorldEventInstance): string {
  if (event.targetType === 'system') {
    return state.galaxy.systems.find((system) => system.id === event.targetId)?.name ?? event.targetId;
  }
  if (event.targetType === 'space-object') {
    const object = state.spaceObjects.find((candidate) => candidate.id === event.targetId);
    return object === undefined
      ? event.targetId
      : `${object.kind} · ${object.systemId} · запас ${object.remainingYield}/${object.initialYield}`;
  }
  return state.planets.find((planet) => planet.id === event.targetId)?.name ?? event.targetId;
}

function effectLabel(event: WorldEventInstance): string {
  switch (event.definitionId) {
    case 'solar-storm':
      return 'Риск операций в системе +20%';
    case 'anomaly-aftershock':
      return 'Риск операций в системе +30%';
    case 'mineral-bloom':
      return 'Добыча объекта +30%';
    case 'pirate-hunt':
      return 'Временная цель: атаковать пиратский оплот';
  }
}

export function mountWorldEventsPanel(options: WorldEventsPanelOptions): void {
  const button = createNavigationButton();
  const dialog = createDialog();
  const status = dialog.querySelector<HTMLElement>('.world-events-status');
  const active = dialog.querySelector<HTMLElement>('.world-events-active');
  const cooldowns = dialog.querySelector<HTMLElement>('.world-events-cooldowns');
  const history = dialog.querySelector<HTMLElement>('.world-events-history');
  if (status === null || active === null || cooldowns === null || history === null) {
    throw new Error('World event panel containers are missing.');
  }

  const render = (): void => {
    const state = options.getState();
    const untilEvaluation = Math.max(
      0,
      state.worldEvents.nextEvaluationAt - state.clock.elapsedSeconds,
    );
    status.replaceChildren();
    const statusTitle = document.createElement('h3');
    statusTitle.textContent = 'Состояние галактики';
    const statusText = document.createElement('p');
    statusText.textContent = `Активно ${state.worldEvents.active.length} · следующая проверка через ${formatGameDuration(untilEvaluation)} · завершено ${state.worldEvents.history.length}`;
    status.append(statusTitle, statusText);

    active.replaceChildren();
    const activeTitle = document.createElement('h3');
    activeTitle.textContent = 'Активные события и цели';
    active.append(activeTitle);
    for (const event of state.worldEvents.active) {
      const definition = WORLD_EVENT_CATALOG[event.definitionId];
      const card = document.createElement('article');
      card.className = `world-event-card is-${event.definitionId}`;
      const title = document.createElement('strong');
      title.textContent = definition.name;
      const target = document.createElement('p');
      target.textContent = `Цель: ${targetLabel(state, event)}`;
      const effect = document.createElement('p');
      effect.textContent = effectLabel(event);
      const remaining = document.createElement('small');
      remaining.textContent = `Осталось ${formatGameDuration(Math.max(0, event.endsAt - state.clock.elapsedSeconds))} · цепочка ${event.chainDepth}`;
      card.append(title, target, effect, remaining);
      active.append(card);
    }
    if (state.worldEvents.active.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'Активных мировых событий нет.';
      active.append(empty);
    }

    cooldowns.replaceChildren();
    const cooldownTitle = document.createElement('h3');
    cooldownTitle.textContent = 'Cooldown сценариев';
    cooldowns.append(cooldownTitle);
    const entries = Object.entries(state.worldEvents.cooldowns)
      .filter(([, until]) => until !== undefined && until > state.clock.elapsedSeconds)
      .sort((left, right) => left[0].localeCompare(right[0]));
    for (const [definitionId, until] of entries) {
      if (until === undefined) continue;
      const row = document.createElement('div');
      const definition = WORLD_EVENT_CATALOG[definitionId as keyof typeof WORLD_EVENT_CATALOG];
      const name = document.createElement('strong');
      name.textContent = definition.name;
      const time = document.createElement('span');
      time.textContent = formatGameDuration(until - state.clock.elapsedSeconds);
      row.append(name, time);
      cooldowns.append(row);
    }
    if (entries.length === 0) cooldowns.append('Активных cooldown нет.');

    history.replaceChildren();
    const historyTitle = document.createElement('h3');
    historyTitle.textContent = 'История событий';
    history.append(historyTitle);
    const recent = state.worldEvents.history.slice(-16).reverse();
    for (const event of recent) {
      const definition = WORLD_EVENT_CATALOG[event.definitionId];
      const card = document.createElement('article');
      const title = document.createElement('strong');
      title.textContent = definition.name;
      const details = document.createElement('p');
      details.textContent = `${targetLabel(state, event)} · ${event.completion === 'recovered' ? 'восстановлено после загрузки' : 'завершено штатно'}`;
      const time = document.createElement('small');
      time.textContent = `Время мира ${formatGameDuration(event.completedAt)}`;
      card.append(title, details, time);
      history.append(card);
    }
    if (recent.length === 0) history.append('История событий пока пуста.');
  };

  button.addEventListener('click', () => {
    render();
    dialog.showModal();
  });
}
