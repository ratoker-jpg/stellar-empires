import type { ColonyEconomyHealthCode, EmpireResourcePortfolio } from '../simulation/economy/empireEconomy';
import type { ResourceId } from '../simulation/economy/types';
import {
  PLANET_DEVELOPMENT_TEMPLATES,
  PLANET_SPECIALIZATIONS,
} from '../simulation/planet/specialization';
import type { GameState } from '../simulation/types';
import { createEmpireOverviewViewModel } from './empireOverviewViewModel';

export interface EmpireOverviewOptions {
  readonly getState: () => GameState;
  readonly getActivePlanetId: () => string;
  readonly selectPlanet: (planetId: string) => void;
}

export interface EmpireOverviewMount {
  activate(): void;
  deactivate(): void;
  refresh(): void;
  dispose(): void;
}

const NUMBER_FORMAT = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });
const RESOURCE_LABELS: Readonly<Record<ResourceId, string>> = {
  metal: 'Металл',
  crystal: 'Минералы',
  gas: 'Газ',
};
const HEALTH_LABELS: Readonly<Record<ColonyEconomyHealthCode, string>> = {
  'energy-deficit': 'Дефицит энергии',
  'population-deficit': 'Дефицит населения',
  'stability-deficit': 'Низкая стабильность',
  'storage-pressure': 'Склад почти заполнен',
  'resource-deficit': 'Критический запас',
  'route-stalled': 'Маршрут не выполняется',
};

function formatSigned(value: number): string {
  if (value > 0) return `+${NUMBER_FORMAT.format(value)}`;
  return NUMBER_FORMAT.format(value);
}

function formatPermille(value: number): string {
  return `${NUMBER_FORMAT.format(value / 10)}%`;
}

function resourceLine(
  label: string,
  resource: EmpireResourcePortfolio,
): HTMLElement {
  const item = document.createElement('div');
  const name = document.createElement('span');
  name.textContent = label;
  const stock = document.createElement('strong');
  stock.textContent = `${NUMBER_FORMAT.format(resource.amount)} / ${NUMBER_FORMAT.format(resource.capacity)} · ${formatPermille(resource.fillPermille)}`;
  const localRate = document.createElement('em');
  localRate.textContent = `Добыча ${formatSigned(resource.productionPerHour)}/ч`;
  const routeRate = document.createElement('small');
  routeRate.textContent = `Маршруты +${NUMBER_FORMAT.format(resource.scheduledInboundPerHour)} / −${NUMBER_FORMAT.format(resource.scheduledOutboundPerHour)} · итог ${formatSigned(resource.effectiveNetFlowPerHour)}/ч`;
  item.append(name, stock, localRate, routeRate);
  return item;
}

function createHealthList(
  reasons: readonly ColonyEconomyHealthCode[],
  stableLabel: string,
): HTMLElement {
  const list = document.createElement('div');
  list.className = 'empire-health-list';
  if (reasons.length === 0) {
    const stable = document.createElement('span');
    stable.className = 'is-stable';
    stable.textContent = stableLabel;
    list.append(stable);
    return list;
  }
  for (const reason of reasons) {
    const badge = document.createElement('span');
    badge.dataset.healthReason = reason;
    badge.textContent = HEALTH_LABELS[reason];
    list.append(badge);
  }
  return list;
}

function createColonyResourceFlow(
  resourceId: ResourceId,
  resource: EmpireResourcePortfolio,
): HTMLElement {
  const item = document.createElement('div');
  item.dataset.resourceId = resourceId;
  const label = document.createElement('strong');
  label.textContent = RESOURCE_LABELS[resourceId];
  const stock = document.createElement('span');
  stock.textContent = `${NUMBER_FORMAT.format(resource.amount)} / ${NUMBER_FORMAT.format(resource.capacity)} · ${formatPermille(resource.fillPermille)}`;
  const flow = document.createElement('small');
  flow.textContent = `локально ${formatSigned(resource.productionPerHour)} · вход +${NUMBER_FORMAT.format(resource.scheduledInboundPerHour)} · выход −${NUMBER_FORMAT.format(resource.scheduledOutboundPerHour)} · итог ${formatSigned(resource.effectiveNetFlowPerHour)}/ч`;
  item.append(label, stock, flow);
  return item;
}

export function mountEmpireOverview(options: EmpireOverviewOptions): EmpireOverviewMount {
  const host = document.querySelector<HTMLElement>('#command-overview-view');
  if (host === null) throw new Error('Empire overview workspace is missing.');
  let active = false;

  const render = (): void => {
    if (!active) return;
    const state = options.getState();
    const view = createEmpireOverviewViewModel(state, 'player');
    const activePlanetId = options.getActivePlanetId();
    host.replaceChildren();

    const summary = document.createElement('section');
    summary.className = 'empire-overview-summary';
    const summaryTitle = document.createElement('h2');
    summaryTitle.textContent = `Колонии ${view.colonyCount}/${view.colonyLimit}`;
    const fleetStatus = document.createElement('p');
    fleetStatus.textContent = `Флоты ${view.totalFleetCount} · активные миссии ${view.activeFleetCount}`;
    const health = createHealthList(view.healthReasons, 'Экономика империи стабильна');
    health.classList.add('empire-overview-health');
    const resourceGrid = document.createElement('div');
    resourceGrid.className = 'empire-resource-grid';
    resourceGrid.append(
      resourceLine('Металл', view.resources.metal),
      resourceLine('Минералы', view.resources.crystal),
      resourceLine('Газ', view.resources.gas),
    );
    summary.append(summaryTitle, fleetStatus, health, resourceGrid);
    host.append(summary);

    const colonies = document.createElement('section');
    colonies.className = 'empire-colony-grid';
    for (const colony of view.colonies) {
      const card = document.createElement('article');
      card.className = `empire-colony-card${colony.id === activePlanetId ? ' is-active' : ''}`;
      card.dataset.colonyId = colony.id;
      const cardHeader = document.createElement('div');
      const name = document.createElement('h3');
      name.textContent = colony.name;
      const coordinates = document.createElement('span');
      coordinates.textContent = `${colony.systemId} · позиция ${colony.position}`;
      cardHeader.append(name, coordinates);

      const role = document.createElement('p');
      role.className = 'empire-colony-role';
      role.textContent = `Роль: ${PLANET_SPECIALIZATIONS[colony.specializationId].name} · ${PLANET_DEVELOPMENT_TEMPLATES[colony.developmentTemplateId].name}`;

      const resourceFlow = document.createElement('div');
      resourceFlow.className = 'empire-colony-flow';
      resourceFlow.append(
        createColonyResourceFlow('metal', colony.resources.metal),
        createColonyResourceFlow('crystal', colony.resources.crystal),
        createColonyResourceFlow('gas', colony.resources.gas),
      );

      const operations = document.createElement('p');
      operations.className = 'empire-colony-operations';
      operations.textContent = `Эффективность ${formatPermille(colony.efficiencyPermille)} · энергия ${colony.energy.produced}/${colony.energy.consumed} · население ${colony.population.used}/${colony.population.capacity} · стабильность ${colony.stability.capacity}/${colony.stability.demand}`;
      const activity = document.createElement('p');
      activity.textContent = `Очереди ${colony.buildingQueueCount + colony.shipQueueCount + colony.defenseQueueCount} · флоты ${colony.stationedFleetCount} · вылеты ${colony.activeMissionCount}`;
      const healthReasons = createHealthList(colony.healthReasons, 'Колония стабильна');

      const open = document.createElement('button');
      open.type = 'button';
      open.textContent = colony.id === activePlanetId ? 'Активная колония' : 'Открыть колонию';
      open.disabled = colony.id === activePlanetId;
      open.addEventListener('click', () => options.selectPlanet(colony.id));
      card.append(cardHeader, role, resourceFlow, operations, activity, healthReasons, open);
      colonies.append(card);
    }
    host.append(colonies);
  };

  return {
    activate: () => {
      active = true;
      host.hidden = false;
      render();
    },
    deactivate: () => {
      active = false;
      host.hidden = true;
    },
    refresh: render,
    dispose: () => host.replaceChildren(),
  };
}
