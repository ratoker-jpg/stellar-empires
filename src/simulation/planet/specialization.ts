import type { ResourceCost } from '../economy/types';
import type { UnitKind } from '../units/types';
import type { ColonySpecializationId } from './types';

export interface ColonySpecializationEffects {
  readonly resourceProductionPercent: number;
  readonly researchSpeedPercent: number;
  readonly shipProductionSpeedPercent: number;
  readonly defenseProductionSpeedPercent: number;
}

export interface ColonySpecializationDefinition {
  readonly id: ColonySpecializationId;
  readonly name: string;
  readonly description: string;
  readonly effects: ColonySpecializationEffects;
}

export const COLONY_SPECIALIZATION_CHANGE_COST: ResourceCost = {
  metal: 500,
  crystal: 300,
  gas: 100,
};

export const COLONY_SPECIALIZATIONS: readonly ColonySpecializationDefinition[] = [
  {
    id: 'balanced',
    name: 'Универсальная колония',
    description: 'Без узкой специализации и дополнительных модификаторов.',
    effects: {
      resourceProductionPercent: 0,
      researchSpeedPercent: 0,
      shipProductionSpeedPercent: 0,
      defenseProductionSpeedPercent: 0,
    },
  },
  {
    id: 'mining',
    name: 'Добывающий мир',
    description: 'Усиливает добычу металла, кристалла и газа на 15%.',
    effects: {
      resourceProductionPercent: 15,
      researchSpeedPercent: 0,
      shipProductionSpeedPercent: 0,
      defenseProductionSpeedPercent: 0,
    },
  },
  {
    id: 'science',
    name: 'Научный центр',
    description: 'Исследования, оплаченные этой колонией, выполняются на 20% быстрее.',
    effects: {
      resourceProductionPercent: 0,
      researchSpeedPercent: 20,
      shipProductionSpeedPercent: 0,
      defenseProductionSpeedPercent: 0,
    },
  },
  {
    id: 'shipyard',
    name: 'Мир-верфь',
    description: 'Производство кораблей на этой колонии ускоряется на 20%.',
    effects: {
      resourceProductionPercent: 0,
      researchSpeedPercent: 0,
      shipProductionSpeedPercent: 20,
      defenseProductionSpeedPercent: 0,
    },
  },
  {
    id: 'fortress',
    name: 'Мир-крепость',
    description: 'Производство планетарной обороны ускоряется на 20%.',
    effects: {
      resourceProductionPercent: 0,
      researchSpeedPercent: 0,
      shipProductionSpeedPercent: 0,
      defenseProductionSpeedPercent: 20,
    },
  },
] as const;

const SPECIALIZATION_BY_ID = new Map(
  COLONY_SPECIALIZATIONS.map((definition) => [definition.id, definition]),
);

export function isColonySpecializationId(
  value: unknown,
): value is ColonySpecializationId {
  return typeof value === 'string' && SPECIALIZATION_BY_ID.has(value as ColonySpecializationId);
}

export function getColonySpecialization(
  id: ColonySpecializationId,
): ColonySpecializationDefinition {
  const definition = SPECIALIZATION_BY_ID.get(id);
  if (definition === undefined) {
    throw new Error(`Unknown colony specialization: ${id}`);
  }
  return definition;
}

export function getResourceProductionBonusPercent(
  id: ColonySpecializationId,
): number {
  return getColonySpecialization(id).effects.resourceProductionPercent;
}

export function getResearchSpeedBonusPercent(
  id: ColonySpecializationId,
): number {
  return getColonySpecialization(id).effects.researchSpeedPercent;
}

export function getUnitProductionSpeedBonusPercent(
  id: ColonySpecializationId,
  kind: UnitKind,
): number {
  const effects = getColonySpecialization(id).effects;
  return kind === 'ship'
    ? effects.shipProductionSpeedPercent
    : effects.defenseProductionSpeedPercent;
}
