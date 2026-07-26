import type { ResourceCost } from '../economy/types';
import { getResearchDefinition } from './catalog';
import { getResearchLevel } from './researchState';
import type { EmpireResearchState, ResearchDefinition } from './types';

const COST_SCALE_PERMILLE = 1_600;
const TIME_SCALE_PERMILLE = 1_450;

function scaleInteger(base: number, level: number, scalePermille: number): number {
  let value = base;
  for (let current = 1; current < level; current += 1) {
    value = Math.ceil((value * scalePermille) / 1_000);
  }
  return value;
}

export function calculateResearchCost(
  definition: ResearchDefinition,
  targetLevel: number,
): ResourceCost {
  return {
    metal: scaleInteger(definition.baseCost.metal, targetLevel, COST_SCALE_PERMILLE),
    crystal: scaleInteger(definition.baseCost.crystal, targetLevel, COST_SCALE_PERMILLE),
    gas: scaleInteger(definition.baseCost.gas, targetLevel, COST_SCALE_PERMILLE),
  };
}

export function calculateResearchSeconds(
  definition: ResearchDefinition,
  targetLevel: number,
): number {
  return scaleInteger(definition.baseSeconds, targetLevel, TIME_SCALE_PERMILLE);
}

export interface ResearchEffectSummary {
  readonly constructionSpeedPercent: number;
  readonly researchSpeedPercent: number;
  readonly energyOutputPercent: number;
  readonly fleetSpeedPercent: number;
  readonly fuelEfficiencyPercent: number;
  readonly flightSlots: number;
  readonly sensorStrength: number;
  readonly armorStrengthPercent: number;
  readonly shipDurabilityPercent: number;
  readonly armorPenetrationPercent: number;
  readonly criticalChanceBasisPoints: number;
  readonly ecologyCapacity: number;
  readonly weaponStrengthPercent: number;
}

export function calculateResearchEffects(
  research: EmpireResearchState,
  catalog: readonly ResearchDefinition[],
): ResearchEffectSummary {
  let constructionSpeedPercent = 0;
  let researchSpeedPercent = 0;
  let energyOutputPercent = 0;
  let fleetSpeedPercent = 0;
  let fuelEfficiencyPercent = 0;
  let flightSlots = 0;
  let sensorStrength = 0;
  let armorStrengthPercent = 0;
  let shipDurabilityPercent = 0;
  let armorPenetrationPercent = 0;
  let criticalChanceBasisPoints = 0;
  let ecologyCapacity = 0;
  let weaponStrengthPercent = 0;

  const definitions = new Map(catalog.map((definition) => [definition.id, definition]));
  for (const technologyId of Object.keys(research.levels)) {
    const definition = getResearchDefinition(technologyId);
    if (definition !== undefined) definitions.set(definition.id, definition);
  }

  for (const definition of definitions.values()) {
    const level = getResearchLevel(research, definition.id);
    for (const effect of definition.effects) {
      switch (effect.type) {
        case 'CONSTRUCTION_SPEED':
          constructionSpeedPercent += effect.percentPerLevel * level;
          break;
        case 'RESEARCH_SPEED':
          researchSpeedPercent += effect.percentPerLevel * level;
          break;
        case 'ENERGY_OUTPUT':
          energyOutputPercent += effect.percentPerLevel * level;
          break;
        case 'FLEET_SPEED':
          fleetSpeedPercent += effect.percentPerLevel * level;
          break;
        case 'FUEL_EFFICIENCY':
          fuelEfficiencyPercent += effect.percentPerLevel * level;
          break;
        case 'FLIGHT_SLOTS':
          flightSlots += effect.pointsPerLevel * level;
          break;
        case 'SENSOR_STRENGTH':
          sensorStrength += effect.pointsPerLevel * level;
          break;
        case 'ARMOR_STRENGTH':
          armorStrengthPercent += effect.percentPerLevel * level;
          break;
        case 'SHIP_DURABILITY':
          shipDurabilityPercent += effect.percentPerLevel * level;
          break;
        case 'ARMOR_PENETRATION':
          armorPenetrationPercent += effect.percentPerLevel * level;
          break;
        case 'CRITICAL_CHANCE':
          criticalChanceBasisPoints += effect.basisPointsPerLevel * level;
          break;
        case 'ECOLOGY_CAPACITY':
          ecologyCapacity += effect.pointsPerLevel * level;
          break;
        case 'WEAPON_STRENGTH':
          weaponStrengthPercent += effect.percentPerLevel * level;
          break;
      }
    }
  }

  return {
    constructionSpeedPercent,
    researchSpeedPercent,
    energyOutputPercent,
    fleetSpeedPercent,
    fuelEfficiencyPercent,
    flightSlots,
    sensorStrength,
    armorStrengthPercent,
    shipDurabilityPercent,
    armorPenetrationPercent,
    criticalChanceBasisPoints: Math.min(1_200, criticalChanceBasisPoints),
    ecologyCapacity,
    weaponStrengthPercent,
  };
}

export function applySpeedPercent(baseSeconds: number, speedPercent: number): number {
  if (speedPercent <= 0) {
    return baseSeconds;
  }
  return Math.max(1, Math.ceil((baseSeconds * 100) / (100 + speedPercent)));
}
