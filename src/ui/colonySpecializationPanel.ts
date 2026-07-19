import {
  COLONY_SPECIALIZATIONS,
  COLONY_SPECIALIZATION_CHANGE_COST,
} from '../simulation/planet/specialization';
import type { GameCommand, GameState } from '../simulation/types';

export interface ColonySpecializationPanelOptions {
  readonly getState: () => GameState;
  readonly getActivePlanetId: () => string;
  readonly execute: (command: GameCommand, successMessage: string) => boolean;
}

function effectsText(
  effects: (typeof COLONY_SPECIALIZATIONS)[number]['effects'],
): string {
  const effectsList: string[] = [];
  if (effects.resourceProductionPercent > 0) {
    effectsList.push(`добыча +${effects.resourceProductionPercent}%`);
  }
  if (effects.researchSpeedPercent > 0) {
    effectsList.push(`скорость исследований +${effects.researchSpeedPercent}%`);
  }
  if (effects.shipProductionSpeedPercent > 0) {
    effectsList.push(`производство кораблей +${effects.shipProductionSpeedPercent}%`);
  }
  if (effects.defenseProductionSpeedPercent > 0) {
    effectsList.push(`производство обороны +${effects.defenseProductionSpeedPercent}%`);
  }
  return effectsList.length === 0 ? 'Без дополнительных бонусов' : effectsList.join(' · ');
}

export function mountColonySpecializationPanel(
  options: ColonySpecializationPanelOptions,
): void {
  const controls = document.querySelector<HTMLElement>('.planet-header-controls');
  if (controls === null) return;

  const openButton = document.createElement('button');
  openButton.id = 'open-colony-specialization';
  openButton.type = 'button';
  openButton.className = 'colony-specialization-open';
  openButton.textContent = 'Специализация';
  controls.prepend(openButton);

  const dialog = document.createElement('dialog');
  dialog.id = 'colony-specialization-dialog';
  dialog.className = 'colony-specialization-dialog';
  const header = document.createElement('header');
  const heading = document.createElement('div');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'panel-label';
  eyebrow.textContent = 'Colony doctrine · specialization';
  const title = document.createElement('h2');
  title.textContent = 'Специализация колонии';
  heading.append(eyebrow, title);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'dialog-close';
  close.textContent = '×';
  close.addEventListener('click', () => dialog.close());
  header.append(heading, close);
  const summary = document.createElement('p');
  summary.className = 'colony-specialization-summary';
  const grid = document.createElement('div');
  grid.className = 'colony-specialization-grid';
  dialog.append(header, summary, grid);
  document.body.append(dialog);

  const render = (): void => {
    const state = options.getState();
    const planet = state.planets.find(
      (candidate) => candidate.id === options.getActivePlanetId(),
    );
    grid.replaceChildren();
    if (planet === undefined) {
      summary.textContent = 'Активная колония недоступна.';
      return;
    }
    const researchBusy = state.research
      .find((research) => research.empireId === 'player')
      ?.queue.some((item) => item.planetId === planet.id) ?? false;
    const queuesBusy =
      planet.buildQueue.length > 0 ||
      planet.productionQueues.shipyard.length > 0 ||
      planet.productionQueues.defense.length > 0 ||
      researchBusy;
    summary.textContent = `${planet.name} · реорганизация стоит M ${COLONY_SPECIALIZATION_CHANGE_COST.metal}, C ${COLONY_SPECIALIZATION_CHANGE_COST.crystal}, G ${COLONY_SPECIALIZATION_CHANGE_COST.gas}. Все локальные очереди должны быть свободны.`;

    for (const definition of COLONY_SPECIALIZATIONS) {
      const card = document.createElement('article');
      card.className = `colony-specialization-card${definition.id === planet.specialization ? ' is-active' : ''}`;
      const name = document.createElement('h3');
      name.textContent = definition.name;
      const description = document.createElement('p');
      description.textContent = definition.description;
      const effects = document.createElement('strong');
      effects.textContent = effectsText(definition.effects);
      const action = document.createElement('button');
      action.type = 'button';
      action.textContent =
        definition.id === planet.specialization
          ? 'Активна'
          : 'Назначить специализацию';
      action.disabled = definition.id === planet.specialization || queuesBusy;
      action.addEventListener('click', () => {
        if (
          options.execute(
            {
              type: 'SET_PLANET_SPECIALIZATION',
              empireId: 'player',
              planetId: planet.id,
              specialization: definition.id,
            },
            `Специализация назначена · ${definition.name}`,
          )
        ) {
          render();
          openButton.textContent = definition.name;
        }
      });
      card.append(name, description, effects, action);
      grid.append(card);
    }
    const active = COLONY_SPECIALIZATIONS.find(
      (definition) => definition.id === planet.specialization,
    );
    openButton.textContent = active?.name ?? 'Специализация';
  };

  openButton.addEventListener('click', () => {
    render();
    dialog.showModal();
  });
}
