import { getBuildingDefinition } from '../simulation/planet/buildingCatalog';
import {
  PLANET_DEVELOPMENT_TEMPLATES,
  PLANET_SPECIALIZATIONS,
  getRecommendedBuildingIds,
  hasActivePlanetQueues,
  type PlanetDevelopmentTemplateId,
  type PlanetSpecializationId,
} from '../simulation/planet/specialization';
import type { GameCommand, GameState } from '../simulation/types';

export interface PlanetDevelopmentControlsBridge {
  readonly getState: () => GameState;
  readonly getActivePlanetId: () => string;
  readonly execute: (command: GameCommand, successMessage: string) => boolean;
}

export interface PlanetDevelopmentControlsMount {
  refresh(): void;
  dispose(): void;
}

function createSelect<T extends string>(
  values: readonly T[],
  selected: T,
  labelFor: (value: T) => string,
): HTMLSelectElement {
  const select = document.createElement('select');
  for (const value of values) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = labelFor(value);
    select.append(option);
  }
  select.value = selected;
  return select;
}

export function mountPlanetDevelopmentControls(
  bridge: PlanetDevelopmentControlsBridge,
): PlanetDevelopmentControlsMount {
  const host = document.querySelector<HTMLElement>('.planet-operations');
  if (host === null) return { refresh: () => undefined, dispose: () => undefined };

  const existing = document.querySelector<HTMLElement>('#planet-development-card');
  const section = existing ?? document.createElement('section');
  section.className = 'operation-card planet-development-card';
  section.id = 'planet-development-card';
  if (existing === null) host.prepend(section);

  const render = (): void => {
    const planetId = bridge.getActivePlanetId();
    const planet = bridge.getState().planets.find((candidate) => candidate.id === planetId);
    if (planet === undefined) {
      section.textContent = 'Данные развития колонии недоступны.';
      return;
    }

    const eyebrow = document.createElement('p');
    eyebrow.className = 'panel-label';
    eyebrow.textContent = 'Стратегия колонии';
    const heading = document.createElement('h2');
    heading.textContent = 'Специализация';

    const specializationLabel = document.createElement('label');
    specializationLabel.textContent = 'Роль планеты';
    const specializationSelect = createSelect(
      Object.keys(PLANET_SPECIALIZATIONS) as PlanetSpecializationId[],
      planet.specializationId,
      (value) => PLANET_SPECIALIZATIONS[value].name,
    );
    specializationSelect.disabled = hasActivePlanetQueues(planet);
    specializationSelect.addEventListener('change', () => {
      const specializationId = specializationSelect.value as PlanetSpecializationId;
      const changed = bridge.execute(
        {
          type: 'SET_PLANET_SPECIALIZATION',
          empireId: 'player',
          planetId: planet.id,
          specializationId,
        },
        `Специализация изменена · ${PLANET_SPECIALIZATIONS[specializationId].name}`,
      );
      if (!changed) specializationSelect.value = planet.specializationId;
    });
    specializationLabel.append(specializationSelect);

    const specializationHint = document.createElement('p');
    specializationHint.className = 'operation-hint';
    specializationHint.textContent = hasActivePlanetQueues(planet)
      ? 'Смена роли заблокирована, пока на планете активна очередь.'
      : PLANET_SPECIALIZATIONS[planet.specializationId].description;

    const templateLabel = document.createElement('label');
    templateLabel.textContent = 'Шаблон развития';
    const templateSelect = createSelect(
      Object.keys(PLANET_DEVELOPMENT_TEMPLATES) as PlanetDevelopmentTemplateId[],
      planet.developmentTemplateId,
      (value) => PLANET_DEVELOPMENT_TEMPLATES[value].name,
    );
    templateSelect.addEventListener('change', () => {
      const developmentTemplateId = templateSelect.value as PlanetDevelopmentTemplateId;
      const changed = bridge.execute(
        {
          type: 'SET_PLANET_DEVELOPMENT_TEMPLATE',
          empireId: 'player',
          planetId: planet.id,
          developmentTemplateId,
        },
        `Шаблон изменён · ${PLANET_DEVELOPMENT_TEMPLATES[developmentTemplateId].name}`,
      );
      if (!changed) templateSelect.value = planet.developmentTemplateId;
    });
    templateLabel.append(templateSelect);

    const template = PLANET_DEVELOPMENT_TEMPLATES[planet.developmentTemplateId];
    const templateHint = document.createElement('p');
    templateHint.className = 'operation-hint';
    templateHint.textContent = template.description;
    const recommendations = document.createElement('ul');
    recommendations.className = 'development-recommendations';
    for (const buildingId of getRecommendedBuildingIds(
      planet.developmentTemplateId,
      planet.factionId,
    )) {
      const item = document.createElement('li');
      item.textContent = getBuildingDefinition(buildingId)?.name ?? buildingId;
      recommendations.append(item);
    }

    section.replaceChildren(
      eyebrow,
      heading,
      specializationLabel,
      specializationHint,
      templateLabel,
      templateHint,
      recommendations,
    );
  };

  render();
  return {
    refresh: render,
    dispose: () => section.remove(),
  };
}
