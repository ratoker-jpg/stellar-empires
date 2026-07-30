import { resolveCompleteMechanicalAsset } from '../assets/completeMechanicalAssetManifest';
import { getFactionMechanicalAsset } from '../assets/factionMechanicalAssets';
import { applyMechanicalAssetArtwork } from '../assets/runtimeMechanicalAssets';
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

export interface ProductionScreensMount {
  activate(kind: UnitKind): void;
  deactivate(): void;
  refresh(): void;
  dispose(): void;
}

export const PRODUCTION_WORKSPACE_SELECTORS = {
  ship: '#ship-production-view',
  defense: '#defense-production-view',
} as const;

const NUMBER_FORMAT = new Intl.NumberFormat('ru-RU');

function setUnitArtwork(element: HTMLElement, definition: UnitDefinition): void {
  const complete = resolveCompleteMechanicalAsset(definition.assetId).asset;
  if (complete?.layout === 'image') {
    applyMechanicalAssetArtwork(element, complete);
    return;
  }
  const fallback = getFactionMechanicalAsset(definition.assetId);
  if (fallback !== undefined) applyMechanicalAssetArtwork(element, fallback);
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

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`Production workspace element is missing: ${selector}`);
  return element;
}

function createProductionWorkspace(host: HTMLElement, kind: UnitKind): void {
  if (host.querySelector(`.production-grid[data-kind="${kind}"]`) !== null) return;
  const header = document.createElement('header');
  const text = document.createElement('div');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'panel-label';
  eyebrow.textContent = kind === 'ship' ? 'Industry Zone' : 'Military Zone';
  const title = document.createElement('h1');
  title.tabIndex = -1;
  title.textContent = kind === 'ship' ? 'Орбитальная верфь' : 'Планетарная оборона';
  text.append(eyebrow, title);
  header.append(text);
  const summary = document.createElement('p');
  summary.className = 'production-summary';
  host.append(header, summary);
  if (kind === 'defense') {
    const overview = document.createElement('section');
    overview.className = 'defense-overview';
    const repairQueue = document.createElement('section');
    repairQueue.className = 'production-queue defense-repair-queue';
    repairQueue.dataset.testid = 'defense-repair-queue';
    host.append(overview, repairQueue);
  }
  const queue = document.createElement('section');
  queue.className = 'production-queue';
  queue.dataset.kind = kind;
  queue.dataset.testid = `${kind}-production-queue`;
  const grid = document.createElement('div');
  grid.className = 'production-grid';
  grid.dataset.kind = kind;
  grid.dataset.testid = `${kind}-production-grid`;
  host.append(queue, grid);
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

export function mountProductionScreens(options: ProductionScreenOptions): ProductionScreensMount {
  const hosts = {
    ship: requireElement<HTMLElement>(PRODUCTION_WORKSPACE_SELECTORS.ship),
    defense: requireElement<HTMLElement>(PRODUCTION_WORKSPACE_SELECTORS.defense),
  } as const;
  createProductionWorkspace(hosts.ship, 'ship');
  createProductionWorkspace(hosts.defense, 'defense');
  let activeKind: UnitKind | undefined;

  const render = (kind: UnitKind): void => {
    const state = options.getState();
    const planet = state.planets.find(
      (candidate) => candidate.id === options.getActivePlanetId(),
    );
    const research = getEmpireResearch(state.research, 'player');
    const host = hosts[kind];
    const summary = host.querySelector<HTMLElement>('.production-summary');
    const queueContainer = host.querySelector<HTMLElement>(`.production-queue[data-kind="${kind}"]`);
    const grid = host.querySelector<HTMLElement>(`.production-grid[data-kind="${kind}"]`);
    if (planet === undefined || research === undefined || summary === null || queueContainer === null || grid === null) return;

    const defenseGridCapacity = getDefenseGridCapacity(planet);
    const defenseGridUsed = getDefenseGridUsed(planet);
    const defenseGridAvailable = Math.max(0, defenseGridCapacity - defenseGridUsed);
    summary.textContent = kind === 'ship'
      ? `${planet.name} · ресурсы и вместимость резервируются сразу. Отмена возвращает 75% стоимости.`
      : `${planet.name} · оборонная сеть ${defenseGridUsed}/${defenseGridCapacity}. Активные, повреждённые и заказанные установки занимают общий лимит.`;

    if (kind === 'defense') {
      const overview = host.querySelector<HTMLElement>('.defense-overview');
      const repairQueueContainer = host.querySelector<HTMLElement>('.defense-repair-queue');
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
          repairQueueContainer.dataset.queueState = 'idle';
        } else {
          repairQueueContainer.dataset.queueState = 'active';
          renderProgressQueue(repairQueueContainer, {
            label: `Ремонт · ${repair.unitId} × ${repair.quantity}`,
            startedAt: repair.startedAt,
            completesAt: repair.completesAt,
            now: state.clock.elapsedSeconds,
            cancelLabel: 'Отменить ремонт',
            onCancel: () => {
              options.execute(
                {
                  type: 'CANCEL_DEFENSE_REPAIR',
                  empireId: 'player',
                  planetId: planet.id,
                  queueItemId: repair.id,
                },
                'Ремонт отменён',
              );
            },
          });
        }
      }
    }

    const queueKey = kind === 'ship' ? 'shipyard' : 'defense';
    const queued = planet.productionQueues[queueKey][0];
    queueContainer.replaceChildren();
    if (queued === undefined) {
      queueContainer.textContent = `${kind === 'ship' ? 'Верфь' : 'Оборонная линия'} ${planet.name} свободна.`;
      queueContainer.dataset.queueState = 'idle';
    } else {
      queueContainer.dataset.queueState = 'active';
      renderProgressQueue(queueContainer, {
        label: `${queued.unitId} × ${queued.quantity}`,
        startedAt: queued.startedAt,
        completesAt: queued.completesAt,
        now: state.clock.elapsedSeconds,
        cancelLabel: 'Отменить',
        onCancel: () => {
          options.execute(
            {
              type: 'CANCEL_UNIT_BATCH',
              empireId: 'player',
              planetId: planet.id,
              queueItemId: queued.id,
            },
            'Производство отменено',
          );
        },
      });
    }

    grid.replaceChildren();
    for (const definition of getUnitsByKind(kind, planet.factionId)) {
      const card = document.createElement('article');
      card.className = 'production-card';
      card.dataset.mechanicalId = definition.id;
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
      const title = document.createElement('h2');
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
        const cost = calculateUnitBatchCost(
          definition,
          amount,
          state.campaignSettings.progressionProfile,
        );
        const missing = findMissingUnitRequirements(
          definition,
          planet,
          research,
          state.campaignSettings.progressionProfile,
        );
        const populationRequired = definition.populationCost * amount;
        const populationAvailable = planet.economy.population.capacity -
          planet.economy.population.used - getUnitPopulationUsed(planet) - getReservedPopulation(planet);
        const hangarRequired = definition.hangarCost * amount;
        const hangarAvailable = getHangarCapacity(planet) - getHangarUsed(planet) - getReservedHangar(planet);
        const defenseGridRequired = definition.defenseGridCost * amount;
        const queueFree = planet.productionQueues[queueKey].length === 0;
        const affordable = canAfford(state, planet.id, cost);
        const capacityOk = populationRequired <= populationAvailable &&
          (kind === 'ship' ? hangarRequired <= hangarAvailable : defenseGridRequired <= defenseGridAvailable);
        action.disabled = !(missing.length === 0 && queueFree && affordable && capacityOk);
        const time = calculateUnitBatchSeconds(
          definition,
          amount,
          planet,
          state.campaignSettings.progressionProfile,
        );
        const capacityMessage = kind === 'defense' ? ` · сеть ${defenseGridRequired}/${defenseGridAvailable}` : '';
        status.textContent = `${formatCost(cost)} · ${formatGameDuration(time)}${capacityMessage}${missing.length > 0 ? ` · требования: ${missing.map((item) => `${item.id} ${item.currentLevel}/${item.requiredLevel}`).join(', ')}` : !queueFree ? ' · очередь занята' : !affordable ? ' · недостаточно ресурсов' : !capacityOk ? ' · не хватает вместимости' : ''}`;
      };
      quantity.addEventListener('change', refreshAvailability);
      action.addEventListener('click', () => {
        const amount = Math.max(1, Math.min(100, Math.floor(Number(quantity.value) || 1)));
        options.execute(
          {
            type: 'QUEUE_UNIT_BATCH',
            empireId: 'player',
            planetId: planet.id,
            unitId: definition.id,
            quantity: amount,
          },
          `Производство запущено · ${definition.name} × ${amount}`,
        );
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
          const repairAmount = Math.max(1, Math.min(Math.max(1, damagedAvailable), Math.floor(Number(repairQuantity.value) || 1)));
          repairQuantity.value = String(repairAmount);
          const repairCost = calculateDefenseRepairCost(
            definition,
            repairAmount,
            state.campaignSettings.progressionProfile,
          );
          const repairSeconds = calculateDefenseRepairSeconds(
            definition,
            repairAmount,
            state.campaignSettings.progressionProfile,
          );
          const repairQueueFree = planet.defense.repairQueue.length === 0;
          const repairAffordable = canAfford(state, planet.id, repairCost);
          repairAction.disabled = !(damagedAvailable > 0 && repairQueueFree && repairAffordable);
          repairStatus.textContent = damagedAvailable <= 0
            ? 'Повреждённых установок нет.'
            : `${formatCost(repairCost)} · ${formatGameDuration(repairSeconds)}${!repairQueueFree ? ' · ремонтный контур занят' : !repairAffordable ? ' · недостаточно ресурсов' : ''}`;
        };
        repairQuantity.addEventListener('change', refreshRepairAvailability);
        repairAction.addEventListener('click', () => {
          const repairAmount = Math.max(1, Math.min(Math.max(1, damagedAvailable), Math.floor(Number(repairQuantity.value) || 1)));
          options.execute(
            {
              type: 'QUEUE_DEFENSE_REPAIR',
              empireId: 'player',
              planetId: planet.id,
              unitId: definition.id,
              quantity: repairAmount,
            },
            `Ремонт запущен · ${definition.name} × ${repairAmount}`,
          );
        });
        refreshRepairAvailability();
        repairSection.append(repairTitle, repairQuantity, repairStatus, repairAction);
        body.append(repairSection);
      }
      card.append(art, body);
      grid.append(card);
    }
  };

  return {
    activate: (kind) => {
      activeKind = kind;
      hosts.ship.hidden = kind !== 'ship';
      hosts.defense.hidden = kind !== 'defense';
      render(kind);
      hosts[kind].querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    },
    deactivate: () => {
      activeKind = undefined;
      hosts.ship.hidden = true;
      hosts.defense.hidden = true;
    },
    refresh: () => {
      if (activeKind !== undefined) render(activeKind);
    },
    dispose: () => {
      activeKind = undefined;
      hosts.ship.replaceChildren();
      hosts.defense.replaceChildren();
    },
  };
}
