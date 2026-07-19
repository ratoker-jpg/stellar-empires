import type { PlanetState } from './types';

export type PlanetSpecializationId = 'balanced' | 'resource' | 'industry' | 'military';
export type PlanetDevelopmentTemplateId =
  | 'balanced'
  | 'resource-hub'
  | 'industrial-hub'
  | 'fortress';

export interface PlanetSpecializationEffects {
  readonly resourceProductionPercent: number;
  readonly constructionSpeedPercent: number;
  readonly shipProductionSpeedPercent: number;
  readonly defenseProductionSpeedPercent: number;
}

export interface PlanetSpecializationDefinition {
  readonly id: PlanetSpecializationId;
  readonly name: string;
  readonly description: string;
  readonly effects: PlanetSpecializationEffects;
}

export interface PlanetDevelopmentTemplateDefinition {
  readonly id: PlanetDevelopmentTemplateId;
  readonly name: string;
  readonly description: string;
  readonly recommendedBuildingIds: readonly string[];
}

export const PLANET_SPECIALIZATIONS: Readonly<
  Record<PlanetSpecializationId, PlanetSpecializationDefinition>
> = {
  balanced: {
    id: 'balanced',
    name: 'Сбалансированная',
    description: 'Без штрафов и узкой специализации.',
    effects: {
      resourceProductionPercent: 0,
      constructionSpeedPercent: 0,
      shipProductionSpeedPercent: 0,
      defenseProductionSpeedPercent: 0,
    },
  },
  resource: {
    id: 'resource',
    name: 'Ресурсная',
    description: 'Усиленная добыча ценой более медленного строительства и производства.',
    effects: {
      resourceProductionPercent: 20,
      constructionSpeedPercent: -10,
      shipProductionSpeedPercent: -10,
      defenseProductionSpeedPercent: -10,
    },
  },
  industry: {
    id: 'industry',
    name: 'Промышленная',
    description: 'Быстрое строительство и выпуск кораблей при сниженной добыче.',
    effects: {
      resourceProductionPercent: -10,
      constructionSpeedPercent: 20,
      shipProductionSpeedPercent: 15,
      defenseProductionSpeedPercent: 5,
    },
  },
  military: {
    id: 'military',
    name: 'Военная',
    description: 'Ускоренное производство обороны и флота при заметном снижении добычи.',
    effects: {
      resourceProductionPercent: -15,
      constructionSpeedPercent: 0,
      shipProductionSpeedPercent: 10,
      defenseProductionSpeedPercent: 25,
    },
  },
};

export const PLANET_DEVELOPMENT_TEMPLATES: Readonly<
  Record<PlanetDevelopmentTemplateId, PlanetDevelopmentTemplateDefinition>
> = {
  balanced: {
    id: 'balanced',
    name: 'Равномерное развитие',
    description: 'Поддерживает экономику, энергетику и доступ к базовым рабочим маршрутам.',
    recommendedBuildingIds: [
      'building.aegis.command',
      'building.aegis.power-plant',
      'building.aegis.metal-extractor',
      'building.aegis.crystal-refinery',
      'building.aegis.gas-extractor',
    ],
  },
  'resource-hub': {
    id: 'resource-hub',
    name: 'Ресурсный узел',
    description: 'Приоритет добычи, складов и устойчивой энергосети.',
    recommendedBuildingIds: [
      'building.aegis.metal-extractor',
      'building.aegis.crystal-refinery',
      'building.aegis.gas-extractor',
      'building.aegis.power-plant',
      'building.aegis.storage',
    ],
  },
  'industrial-hub': {
    id: 'industrial-hub',
    name: 'Промышленный узел',
    description: 'Приоритет лаборатории, верфи и инфраструктуры производства.',
    recommendedBuildingIds: [
      'building.aegis.command',
      'building.aegis.power-plant',
      'building.aegis.research-lab',
      'building.aegis.shipyard',
      'building.aegis.storage',
    ],
  },
  fortress: {
    id: 'fortress',
    name: 'Крепость',
    description: 'Приоритет военной зоны, сенсоров, обороны и снабжения гарнизона.',
    recommendedBuildingIds: [
      'building.aegis.command',
      'building.aegis.power-plant',
      'building.aegis.sensor-array',
      'building.aegis.shipyard',
      'building.aegis.storage',
    ],
  },
};

export function getPlanetSpecializationEffects(
  specializationId: PlanetSpecializationId,
): PlanetSpecializationEffects {
  return PLANET_SPECIALIZATIONS[specializationId].effects;
}

export function applySpecializationPercent(value: number, percent: number): number {
  return Math.max(1, Math.floor((value * 100) / Math.max(1, 100 + percent)));
}

export function hasActivePlanetQueues(planet: PlanetState): boolean {
  return (
    planet.buildQueue.length > 0 ||
    planet.productionQueues.shipyard.length > 0 ||
    planet.productionQueues.defense.length > 0
  );
}

export function isPlanetSpecializationId(value: unknown): value is PlanetSpecializationId {
  return value === 'balanced' || value === 'resource' || value === 'industry' || value === 'military';
}

export function isPlanetDevelopmentTemplateId(
  value: unknown,
): value is PlanetDevelopmentTemplateId {
  return (
    value === 'balanced' ||
    value === 'resource-hub' ||
    value === 'industrial-hub' ||
    value === 'fortress'
  );
}
