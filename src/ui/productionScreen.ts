import { AEGIS_VERTICAL_SLICE_ASSETS } from '../assets/aegisVerticalSliceAssets';
import { getEmpireResearch } from '../simulation/research/researchState';
import type { GameCommand, GameState } from '../simulation/types';
import { getUnitsByKind } from '../simulation/units/catalog';
import {
  findMissingUnitRequirements,
  getHangarCapacity,
  getHangarUsed,
  getReservedHangar,
  getReservedPopulation,
  getUnitCount,
  getUnitPopulationUsed,
} from '../simulation/units/inventory';
import {
  calculateUnitBatchCost,
  calculateUnitBatchSeconds,
} from '../simulation/units/production';
import type { UnitDefinition, UnitKind } from '../simulation/units/types';
import { formatGameDuration } from './planetViewModel';

export interface ProductionScreenOptions {
  readonly getState: () => GameState;
  readonly getActivePlanetId: () => string;
  readonly execute: (command: GameCommand, successMessage: string) => boolean;
}

const NUMBER_FORMAT = new Intl.NumberFormat('ru-RU');

function setUnitArtwork(element: HTMLElement, definition: UnitDefinition): void {
  const asset = AEGIS_VERTICAL_SLICE_ASSETS.find(
    (candidate) => candidate.id === definition.assetId,
  );
  if (asset === undefined) return;
  const columns = 3;
  const rows = definition.kind === 'ship' ? 2 : 1;
  const column = asset.frame.x / asset.frame.width;
  const row = asset.frame.y / asset.frame.height;
  element.style.backgroundImage = `url("${asset.atlasUrl}")`;
  element.style.backgroundSize = `${columns * 100}% ${rows * 100}%`;
  element.style.backgroundPosition = `${column === 0 ? 0 : (column / (columns - 1)) * 100}% ${row === 0 || rows === 1 ? 0 : 100}%`;
}

function canAfford(
  state: GameState,
  planetId: string,
  cost: ReturnType<typeof calculateUnitBatchCost>,
): boolean {
  const planet = state.planets.find((candidate) => candidate.id === planetId);
  return (
    planet !== undefined &&
    planet.economy.resources.metal.amount >= cost.metal &&
    planet.economy.resources.crystal.amount >= cost.crystal &&
    planet.economy.resources.gas.amount >= cost.gas
  );
}

function createProductionDialog(kind: UnitKind): HTMLDialogElement {
  const id = `${kind}-production-dialog`;
  const existing = document.querySelector<HTMLDialogElement>(`#${id}`);
  if (existing !== null) return existing;

  const dialog = document.createElement('dialog');
  dialog.id = id;
  dialog.className = 'production-dialog';
  const header = document.createElement('header');
  const text = document.createElement('div');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'panel-label';
  eyebrow.textContent = kind === 'ship' ? 'Industry Zone' : 'Military Zone';
  const title = document.createElement('h2');
  title.textContent = kind === 'ship' ? 'Орбитальная верфь' : 'Планетарная оборона';
  text.append(eyebrow, title);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'dialog-close';
  close.textContent = '×';
  close.setAttribute('aria-label', 'Закрыть производство');
  close.addEventListener('click', () => dialog.close());
  header.append(text, close);
  const summary = document.createElement('p');
  summary.className = 'production-summary';
  const queue = document.createElement('section');
  queue.className = 'production-queue';
  queue.dataset.kind = kind;
  const grid = document.createElement('div');
  grid.className = 'production-grid';
  grid.dataset.kind = kind;
  dialog.append(header, summary, queue, grid);
  document.body.append(dialog);
  return dialog;
}

export function mountProductionScreens(options: ProductionScreenOptions): void {
  const dialogs = {
    ship: createProductionDialog('ship'),
    defense: createProductionDialog('defense'),
  } as const;

  const render = (kind: UnitKind): void => {
    const state = options.getState();
    const planet = state.planets.find(
      (candidate) => candidate.id === options.getActivePlanetId(),
    );
    const research = getEmpireResearch(state.research, 'player');
    const dialog = dialogs[kind];
    const summary = dialog.querySelector<HTMLElement>('.production-summary');
    const queueContainer = dialog.querySelector<HTMLElement>('.production-queue');
    const grid = dialog.querySelector<HTMLElement>('.production-grid');
    if (
      planet === undefined ||
      research === undefined ||
      summary === null ||
      queueContainer === null ||
      grid === null
    ) return;

    summary.textContent = `${planet.name} · ресурсы и вместимость резервируются сразу. Отмена возвращает 75% стоимости.`;
    const queueKey = kind === 'ship' ? 'shipyard' : 'defense';
    const active = planet.productionQueues[queueKey][0];
    queueContainer.replaceChildren();
    if (active === undefined) {
      queueContainer.textContent = `${kind === 'ship' ? 'Верфь' : 'Оборонная линия'} ${planet.name} свободна.`;
    } else {
      const duration = Math.max(1, active.completesAt - active.startedAt);
      const elapsed = Math.max(
        0,
        Math.min(duration, state.clock.elapsedSeconds - active.startedAt),
      );
      const remaining = Math.max(0, active.completesAt - state.clock.elapsedSeconds);
      const label = document.createElement('strong');
      label.textContent = `${active.unitId} × ${active.quantity}`;
      const progress = document.createElement('div');
      progress.className = 'production-progress';
      const bar = document.createElement('i');
      bar.style.width = `${Math.floor((elapsed * 100) / duration)}%`;
      progress.append(bar);
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.textContent = `Отменить · ${formatGameDuration(remaining)}`;
      cancel.addEventListener('click', () => {
        if (
          options.execute(
            {
              type: 'CANCEL_UNIT_BATCH',
              empireId: 'player',
              planetId: planet.id,
              queueItemId: active.id,
            },
            'Производство отменено',
          )
        ) render(kind);
      });
      queueContainer.append(label, progress, cancel);
    }

    grid.replaceChildren();
    for (const definition of getUnitsByKind(kind)) {
      const card = document.createElement('article');
      card.className = 'production-card';
      const art = document.createElement('div');
      art.className = 'production-art';
      art.setAttribute('role', 'img');
      art.setAttribute('aria-label', definition.name);
      setUnitArtwork(art, definition);
      const body = document.createElement('div');
      const meta = document.createElement('div');
      meta.className = 'production-meta';
      meta.textContent = `${definition.role} · в наличии ${getUnitCount(planet, definition.id, kind)} · ${planet.name}`;
      const title = document.createElement('h3');
      title.textContent = definition.name;
      const description = document.createElement('p');
      description.textContent = definition.description;
      const quantity = document.createElement('input');
      quantity.type = 'number';
      quantity.min = '1';
      quantity.max = '100';
      quantity.value = '1';
      quantity.setAttribute('aria-label', `Количество ${definition.name}`);
      const status = document.createElement('p');
      status.className = 'production-status';
      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'production-action';
      action.textContent = 'Запустить производство';

      const refreshAvailability = (): void => {
        const amount = Math.max(1, Math.min(100, Math.floor(Number(quantity.value) || 1)));
        quantity.value = String(amount);
        const cost = calculateUnitBatchCost(definition, amount);
        const missing = findMissingUnitRequirements(definition, planet, research);
        const populationRequired = definition.populationCost * amount;
        const populationAvailable =
          planet.economy.population.capacity -
          planet.economy.population.used -
          getUnitPopulationUsed(planet) -
          getReservedPopulation(planet);
        const hangarRequired = definition.hangarCost * amount;
        const hangarAvailable =
          getHangarCapacity(planet) - getHangarUsed(planet) - getReservedHangar(planet);
        const queueFree = planet.productionQueues[queueKey].length === 0;
        const affordable = canAfford(state, planet.id, cost);
        const capacityOk =
          populationRequired <= populationAvailable &&
          (kind === 'defense' || hangarRequired <= hangarAvailable);
        action.disabled = !(
          missing.length === 0 &&
          queueFree &&
          affordable &&
          capacityOk
        );
        const time = calculateUnitBatchSeconds(definition, amount, planet);
        status.textContent = `M ${NUMBER_FORMAT.format(cost.metal)} · C ${NUMBER_FORMAT.format(cost.crystal)} · G ${NUMBER_FORMAT.format(cost.gas)} · ${formatGameDuration(time)}${missing.length > 0 ? ` · требования: ${missing.map((item) => `${item.id} ${item.currentLevel}/${item.requiredLevel}`).join(', ')}` : !queueFree ? ' · очередь занята' : !affordable ? ' · недостаточно ресурсов' : !capacityOk ? ' · не хватает вместимости' : ''}`;
      };

      quantity.addEventListener('change', refreshAvailability);
      action.addEventListener('click', () => {
        const amount = Math.max(1, Math.min(100, Math.floor(Number(quantity.value) || 1)));
        if (
          options.execute(
            {
              type: 'QUEUE_UNIT_BATCH',
              empireId: 'player',
              planetId: planet.id,
              unitId: definition.id,
              quantity: amount,
            },
            `Производство запущено · ${definition.name} × ${amount}`,
          )
        ) render(kind);
      });
      refreshAvailability();
      body.append(meta, title, description, quantity, status, action);
      card.append(art, body);
      grid.append(card);
    }
  };

  const open = (kind: UnitKind): void => {
    render(kind);
    dialogs[kind].showModal();
  };

  document.addEventListener(
    'click',
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const gateway = target.closest<HTMLButtonElement>('.zone-gateway');
      const label = gateway?.querySelector('strong')?.textContent;
      const kind =
        label === 'Орбитальная верфь'
          ? 'ship'
          : label === 'Планетарная оборона'
            ? 'defense'
            : undefined;
      if (kind === undefined) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      open(kind);
    },
    { capture: true },
  );
}
