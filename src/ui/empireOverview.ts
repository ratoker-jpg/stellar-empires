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

const NUMBER_FORMAT = new Intl.NumberFormat('ru-RU');

function resourceLine(
  label: string,
  amount: number,
  capacity: number,
  productionPerHour: number,
): HTMLElement {
  const item = document.createElement('div');
  const name = document.createElement('span');
  name.textContent = label;
  const stock = document.createElement('strong');
  stock.textContent = `${NUMBER_FORMAT.format(amount)} / ${NUMBER_FORMAT.format(capacity)}`;
  const rate = document.createElement('em');
  rate.textContent = `+${NUMBER_FORMAT.format(productionPerHour)}/ч`;
  item.append(name, stock, rate);
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
    const resourceGrid = document.createElement('div');
    resourceGrid.className = 'empire-resource-grid';
    resourceGrid.append(
      resourceLine('Металл', view.resources.metal.amount, view.resources.metal.capacity, view.resources.metal.productionPerHour),
      resourceLine('Минералы', view.resources.crystal.amount, view.resources.crystal.capacity, view.resources.crystal.productionPerHour),
      resourceLine('Газ', view.resources.gas.amount, view.resources.gas.capacity, view.resources.gas.productionPerHour),
    );
    summary.append(summaryTitle, fleetStatus, resourceGrid);
    host.append(summary);

    const colonies = document.createElement('section');
    colonies.className = 'empire-colony-grid';
    for (const colony of view.colonies) {
      const card = document.createElement('article');
      card.className = `empire-colony-card${colony.id === activePlanetId ? ' is-active' : ''}`;
      const cardHeader = document.createElement('div');
      const name = document.createElement('h3');
      name.textContent = colony.name;
      const coordinates = document.createElement('span');
      coordinates.textContent = `${colony.systemId} · позиция ${colony.position}`;
      cardHeader.append(name, coordinates);
      const resources = document.createElement('p');
      resources.textContent = `M ${NUMBER_FORMAT.format(colony.resources.metal.amount)} · C ${NUMBER_FORMAT.format(colony.resources.crystal.amount)} · G ${NUMBER_FORMAT.format(colony.resources.gas.amount)}`;
      const production = document.createElement('p');
      production.textContent = `Производство/ч: M ${NUMBER_FORMAT.format(colony.resources.metal.productionPerHour)} · C ${NUMBER_FORMAT.format(colony.resources.crystal.productionPerHour)} · G ${NUMBER_FORMAT.format(colony.resources.gas.productionPerHour)}`;
      const operations = document.createElement('p');
      operations.textContent = `Эффективность ${colony.efficiencyPermille / 10}% · очереди ${colony.buildingQueueCount + colony.shipQueueCount + colony.defenseQueueCount} · флоты ${colony.stationedFleetCount} · вылеты ${colony.activeMissionCount}`;
      const open = document.createElement('button');
      open.type = 'button';
      open.textContent = colony.id === activePlanetId ? 'Активная колония' : 'Открыть колонию';
      open.disabled = colony.id === activePlanetId;
      open.addEventListener('click', () => options.selectPlanet(colony.id));
      card.append(cardHeader, resources, production, operations, open);
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
