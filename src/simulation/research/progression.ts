import type { ProgressionProfileId } from '../campaign/settings';
import type { ResourceCost } from '../economy/types';
import {
  getProgressionProfileRules,
  growProgressionInteger,
  scaleProgressionCost,
} from '../progression/profile';
import { getResearchDefinition } from './catalog';
import { getResearchLevel } from './researchState';
import type { EmpireResearchState, ResearchDefinition } from './types';

export function calculateResearchCost(
  definition: ResearchDefinition,
  targetLevel: number,
  profileId: ProgressionProfileId,
): ResourceCost {
  const rules = getProgressionProfileRules(profileId).research;
  const baseCost = scaleProgressionCost(definition.baseCost, rules.baseCostPermille);
  return {
    metal: growProgressionInteger(baseCost.metal, targetLevel, rules.costGrowthPermille),
    crystal: growProgressionInteger(baseCost.crystal, targetLevel, rules.costGrowthPermille),
    gas: growProgressionInteger(baseCost.gas, targetLevel, rules.costGrowthPermille),
  };
}

export function calculateResearchSeconds(
  definition: ResearchDefinition,
  targetLevel: number,
  profileId: ProgressionProfileId,
): number {
  const rules = getProgressionProfileRules(profileId).research;
  return growProgressionInteger(
    Math.max(1, Math.ceil((definition.baseSeconds * rules.baseTimePermille) / 1_000)),
    targetLevel,
    rules.timeGrowthPermille,
  );
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
    weaponStrengthPercent,
  };
}

export function applySpeedPercent(baseSeconds: number, speedPercent: number): number {
  if (speedPercent <= 0) {
    return baseSeconds;
  }
  return Math.max(1, Math.ceil((baseSeconds * 100) / (100 + speedPercent)));
}
