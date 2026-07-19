import type { GameState } from '../simulation/types';
import { createEmpireOverviewViewModel } from './empireOverviewViewModel';

export interface EmpireOverviewOptions {
  readonly getState: () => GameState;
  readonly getActivePlanetId: () => string;
  readonly selectPlanet: (planetId: string) => void;
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

export function mountEmpireOverview(options: EmpireOverviewOptions): void {
  const dialog = document.createElement('dialog');
  dialog.id = 'empire-overview-dialog';
  dialog.className = 'empire-overview-dialog';
  const header = document.createElement('header');
  const heading = document.createElement('div');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'panel-label';
  eyebrow.textContent = 'Strategic Command · empire';
  const title = document.createElement('h2');
  title.textContent = 'Обзор империи';
  heading.append(eyebrow, title);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'dialog-close';
  close.textContent = '×';
  close.setAttribute('aria-label', 'Закрыть обзор империи');
  close.addEventListener('click', () => dialog.close());
  header.append(heading, close);
  const content = document.createElement('div');
  content.className = 'empire-overview-content';
  dialog.append(header, content);
  document.body.append(dialog);

  const render = (): void => {
    const state = options.getState();
    const view = createEmpireOverviewViewModel(state, 'player');
    const activePlanetId = options.getActivePlanetId();
    content.replaceChildren();

    const summary = document.createElement('section');
    summary.className = 'empire-overview-summary';
    const summaryTitle = document.createElement('h3');
    summaryTitle.textContent = `Колонии ${view.colonyCount}/${view.colonyLimit}`;
    const fleetStatus = document.createElement('p');
    fleetStatus.textContent = `Флоты ${view.totalFleetCount} · активные миссии ${view.activeFleetCount}`;
    const resourceGrid = document.createElement('div');
    resourceGrid.className = 'empire-resource-grid';
    resourceGrid.append(
      resourceLine(
        'Металл',
        view.resources.metal.amount,
        view.resources.metal.capacity,
        view.resources.metal.productionPerHour,
      ),
      resourceLine(
        'Кристалл',
        view.resources.crystal.amount,
        view.resources.crystal.capacity,
        view.resources.crystal.productionPerHour,
      ),
      resourceLine(
        'Газ',
        view.resources.gas.amount,
        view.resources.gas.capacity,
        view.resources.gas.productionPerHour,
      ),
    );
    summary.append(summaryTitle, fleetStatus, resourceGrid);
    content.append(summary);

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
      open.textContent = colony.id === activePlanetId
        ? 'Активная колония'
        : 'Открыть колонию';
      open.disabled = colony.id === activePlanetId;
      open.addEventListener('click', () => {
        options.selectPlanet(colony.id);
        dialog.close();
      });
      card.append(cardHeader, resources, production, operations, open);
      colonies.append(card);
    }
    content.append(colonies);
  };

  const open = (): void => {
    render();
    dialog.showModal();
  };

  document.querySelector<HTMLButtonElement>('#nav-empire')?.addEventListener(
    'click',
    open,
  );
}
