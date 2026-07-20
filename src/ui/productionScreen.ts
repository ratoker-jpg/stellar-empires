import { AEGIS_VERTICAL_SLICE_ASSETS } from '../assets/aegisVerticalSliceAssets';
import {
  calculateDefenseRepairCost,
  calculateDefenseRepairSeconds,
  getDefenseGridCapacity,
  getDefenseGridUsed,
} from '../simulation/defense/planetaryDefense';
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
  cost: { readonly metal: number; readonly crystal: number; readonly gas: number },
): boolean {
  const planet = state.planets.find((candidate) => candidate.id === planetId);
  return (
    planet !== undefined &&
    planet.economy.resources.metal.amount >= cost.metal &&
    planet.economy.resources.crystal.amount >= cost.crystal &&
    planet.economy.resources.gas.amount >= cost.gas
  );
}

function formatCost(cost: { readonly metal: number; readonly crystal: number; readonly gas: number }): string {
  return `M ${NUMBER_FORMAT.format(cost.metal)} · C ${NUMBER_FORMAT.format(cost.crystal)} · G ${NUMBER_FORMAT.format(cost.gas)}`;
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
  dialog.append(header, summary);

  if (kind === 'defense') {
    const overview = document.createElement('section');
    overview.className = 'defense-overview';
    const repairQueue = document.createElement('section');
    repairQueue.className = 'production-queue defense-repair-queue';
    dialog.append(overview, repairQueue);
  }

  const queue = document.createElement('section');
  queue.className = 'production-queue';
  queue.dataset.kind = kind;
  const grid = document.createElement('div');
  grid.className = 'production-grid';
  grid.dataset.kind = kind;
  dialog.append(queue, grid);
  document.body.append(dialog);
  return dialog;
}

function renderProgressQueue(
  container: HTMLElement,
  options: {
    readonly label: string;
    readonly startedAt: number;
    readonly completesAt: number;
    readonly now: number;
    readonly cancelLabel: string;
    readonly onCancel: () => void;
  },
): void {
  const duration = Math.max(1, options.completesAt - options.startedAt);
  const elapsed = Math.max(0, Math.min(duration, options.now - options.startedAt));
  const remaining = Math.max(0, options.completesAt - options.now);
  const label = document.createElement('strong');
  label.textContent = options.label;
  const progress = document.createElement('div');
  progress.className = 'production-progress';
  const bar = document.createElement('i');
  bar.style.width = `${Math.floor((elapsed * 100) / duration)}%`;
  progress.append(bar);
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.textContent = `${options.cancelLabel} · ${formatGameDuration(remaining)}`;
  cancel.addEventListener('click', options.onCancel);
  container.append(label, progress, cancel);
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
    const queueContainer = dialog.querySelector<HTMLElement>(`.production-queue[data-kind="${kind}"]`);
    const grid = dialog.querySelector<HTMLElement>(`.production-grid[data-kind="${kind}"]`);
    if (
      planet === undefined ||
      research === undefined ||
      summary === null ||
      queueContainer === null ||
      grid === null
    ) return;

    const defenseGridCapacity = getDefenseGridCapacity(planet);
    const defenseGridUsed = getDefenseGridUsed(planet);
    const defenseGridAvailable = Math.max(0, defenseGridCapacity - defenseGridUsed);
    summary.textContent = kind === 'ship'
      ? `${planet.name} · ресурсы и вместимость резервируются сразу. Отмена возвращает 75% стоимости.`
      : `${planet.name} · оборонная сеть ${defenseGridUsed}/${defenseGridCapacity}. Активные, повреждённые и заказанные установки занимают общий лимит.`;

    if (kind === 'defense') {
      const overview = dialog.querySelector<HTMLElement>('.defense-overview');
      const repairQueueContainer = dialog.querySelector<HTMLElement>('.defense-repair-queue');
      if (overview !== null) {
        const activeCount = Object.values(planet.inventory.defenses).reduce((total, count) => total + count, 0);
        const damagedCount = Object.values(planet.defense.damaged).reduce((total, count) => total + count, 0);
        overview.innerHTML = `
          <div><span>Сеть</span><strong>${defenseGridUsed}/${defenseGridCapacity}</strong><small>свободно ${defenseGridAvailable}</small></div>
          <div><span>Боеспособно</span><strong>${NUMBER_FORMAT.format(activeCount)}</strong><small>участвуют в боях</small></div>
          <div><span>Повреждено</span><strong>${NUMBER_FORMAT.format(damagedCount)}</strong><small>не участвуют до ремонта</small></div>
          <div><span>Восстановление</span><strong>40%</strong><small>стоимости новой установки</small></div>
        `;
      }
      if (repairQueueContainer !== null) {
        repairQueueContainer.replaceChildren();
        const repair = planet.defense.repairQueue[0];
        if (repair === undefined) {
          repairQueueContainer.textContent = 'Ремонтный контур свободен.';
        } else {
          renderProgressQueue(repairQueueContainer, {
            label: `Ремонт · ${repair.unitId} × ${repair.quantity}`,
            startedAt: repair.startedAt,
            completesAt: repair.completesAt,
            now: state.clock.elapsedSeconds,
            cancelLabel: 'Отменить ремонт',
            onCancel: () => {
              if (
                options.execute(
                  {
                    type: 'CANCEL_DEFENSE_REPAIR',
                    empireId: 'player',
                    planetId: planet.id,
                    queueItemId: repair.id,
                  },
                  'Ремонт отменён',
                )
              ) render(kind);
            },
          });
        }
      }
    }

    const queueKey = kind === 'ship' ? 'shipyard' : 'defense';
    const active = planet.productionQueues[queueKey][0];
    queueContainer.replaceChildren();
    if (active === undefined) {
      queueContainer.textContent = `${kind === 'ship' ? 'Верфь' : 'Оборонная линия'} ${planet.name} свободна.`;
    } else {
      renderProgressQueue(queueContainer, {
        label: `${active.unitId} × ${active.quantity}`,
        startedAt: active.startedAt,
        completesAt: active.completesAt,
        now: state.clock.elapsedSeconds,
        cancelLabel: 'Отменить',
        onCancel: () => {
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
        },
      });
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
      const activeCount = getUnitCount(planet, definition.id, kind);
      const damagedAvailable = kind === 'defense' ? planet.defense.damaged[definition.id] ?? 0 : 0;
      meta.textContent = kind === 'defense'
        ? `${definition.role} · активно ${activeCount} · повреждено ${damagedAvailable} · сеть ${definition.defenseGridCost}`
        : `${definition.role} · в наличии ${activeCount} · ${planet.name}`;
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
        const defenseGridRequired = definition.defenseGridCost * amount;
        const queueFree = planet.productionQueues[queueKey].length === 0;
        const affordable = canAfford(state, planet.id, cost);
        const capacityOk =
          populationRequired <= populationAvailable &&
          (kind === 'ship'
            ? hangarRequired <= hangarAvailable
            : defenseGridRequired <= defenseGridAvailable);
        action.disabled = !(
          missing.length === 0 &&
          queueFree &&
          affordable &&
          capacityOk
        );
        const time = calculateUnitBatchSeconds(definition, amount, planet);
        const capacityMessage = kind === 'defense'
          ? ` · сеть ${defenseGridRequired}/${defenseGridAvailable}`
          : '';
        status.textContent = `${formatCost(cost)} · ${formatGameDuration(time)}${capacityMessage}${missing.length > 0 ? ` · требования: ${missing.map((item) => `${item.id} ${item.currentLevel}/${item.requiredLevel}`).join(', ')}` : !queueFree ? ' · очередь занята' : !affordable ? ' · недостаточно ресурсов' : !capacityOk ? ' · не хватает вместимости' : ''}`;
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

      if (kind === 'defense') {
        const repairSection = document.createElement('section');
        repairSection.className = 'defense-repair-controls';
        const repairTitle = document.createElement('strong');
        repairTitle.textContent = 'Восстановление повреждённых';
        const repairQuantity = document.createElement('input');
        repairQuantity.type = 'number';
        repairQuantity.min = '1';
        repairQuantity.max = String(Math.max(1, damagedAvailable));
        repairQuantity.value = '1';
        repairQuantity.setAttribute('aria-label', `Количество для ремонта ${definition.name}`);
        const repairStatus = document.createElement('p');
        repairStatus.className = 'production-status';
        const repairAction = document.createElement('button');
        repairAction.type = 'button';
        repairAction.className = 'production-action';
        repairAction.textContent = 'Запустить ремонт';

        const refreshRepairAvailability = (): void => {
          const repairAmount = Math.max(
            1,
            Math.min(Math.max(1, damagedAvailable), Math.floor(Number(repairQuantity.value) || 1)),
          );
          repairQuantity.value = String(repairAmount);
          const repairCost = calculateDefenseRepairCost(definition, repairAmount);
          const repairSeconds = calculateDefenseRepairSeconds(definition, repairAmount);
          const repairQueueFree = planet.defense.repairQueue.length === 0;
          const repairAffordable = canAfford(state, planet.id, repairCost);
          repairAction.disabled = !(
            damagedAvailable > 0 &&
            repairQueueFree &&
            repairAffordable
          );
          repairStatus.textContent = damagedAvailable <= 0
            ? 'Повреждённых установок нет.'
            : `${formatCost(repairCost)} · ${formatGameDuration(repairSeconds)}${!repairQueueFree ? ' · ремонтный контур занят' : !repairAffordable ? ' · недостаточно ресурсов' : ''}`;
        };
        repairQuantity.addEventListener('change', refreshRepairAvailability);
        repairAction.addEventListener('click', () => {
          const repairAmount = Math.max(
            1,
            Math.min(Math.max(1, damagedAvailable), Math.floor(Number(repairQuantity.value) || 1)),
          );
          if (
            options.execute(
              {
                type: 'QUEUE_DEFENSE_REPAIR',
                empireId: 'player',
                planetId: planet.id,
                unitId: definition.id,
                quantity: repairAmount,
              },
              `Ремонт запущен · ${definition.name} × ${repairAmount}`,
            )
          ) render(kind);
        });
        refreshRepairAvailability();
        repairSection.append(repairTitle, repairQuantity, repairStatus, repairAction);
        body.append(repairSection);
      }

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
