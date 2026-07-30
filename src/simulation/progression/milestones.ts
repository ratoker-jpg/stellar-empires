import type { ProgressionProfileId, WorldSpeed } from '../campaign/settings';
import type { ResourceCost } from '../economy/types';
import { getStartingBuildingsForFaction } from '../factions/factionMechanicalRoles';
import {
  COMPLETE_BUILDING_CATALOGS,
  getCompleteBuildingIds,
} from '../planet/completeBuildingCatalog';
import {
  calculateBuildSeconds,
  calculateBuildingCost,
} from '../planet/buildingProgression';
import type { FactionId } from '../planet/types';
import {
  getBuildingMaxLevelById,
  getProgressionProfileRules,
  getResearchMaxLevelById,
  resolveBuildingRequirement,
  resolveResearchRequirement,
  scaleProgressionInteger,
} from './profile';
import { COMPLETE_RESEARCH_CATALOGS } from '../research/completeResearchCatalog';
import {
  calculateResearchCost,
  calculateResearchSeconds,
} from '../research/progression';
import {
  COMPLETE_SHIP_CATALOGS,
  getCompleteShipIds,
} from '../units/completeShipCatalog';
import { calculateUnitBatchCost } from '../units/production';
import type { UnitDefinition } from '../units/types';

export const PROGRESSION_MILESTONE_IDS = [
  'first-combat-ship',
  'first-scout',
  'first-colonizer',
  'first-planet-destroyer',
  'endgame-ready-prerequisites',
] as const;

export type ProgressionMilestoneId = (typeof PROGRESSION_MILESTONE_IDS)[number];

export interface ProgressionMilestoneMeasurement {
  readonly milestoneId: ProgressionMilestoneId;
  readonly factionId: FactionId;
  readonly profileId: ProgressionProfileId;
  readonly canonicalSeconds: number;
  readonly realSeconds: number;
  readonly realMinutes: number;
  readonly cost: ResourceCost;
  readonly buildingLevels: Readonly<Record<string, number>>;
  readonly researchLevels: Readonly<Record<string, number>>;
}

const ZERO_COST: ResourceCost = { metal: 0, crystal: 0, gas: 0 };

function addCost(left: ResourceCost, right: ResourceCost): ResourceCost {
  return {
    metal: left.metal + right.metal,
    crystal: left.crystal + right.crystal,
    gas: left.gas + right.gas,
  };
}

function targetForMilestone(
  factionId: FactionId,
  milestoneId: ProgressionMilestoneId,
): UnitDefinition | string {
  const shipIds = getCompleteShipIds(factionId);
  const ships = new Map(
    COMPLETE_SHIP_CATALOGS[factionId].map((definition) => [definition.id, definition]),
  );
  const requireShip = (unitId: string): UnitDefinition => {
    const definition = ships.get(unitId);
    if (definition === undefined) throw new Error(`Unknown milestone ship: ${unitId}.`);
    return definition;
  };
  switch (milestoneId) {
    case 'first-combat-ship':
      return requireShip(shipIds.lightFighter);
    case 'first-scout':
      return requireShip(shipIds.spyProbe);
    case 'first-colonizer':
      return requireShip(shipIds.colonizer);
    case 'first-planet-destroyer':
      return requireShip(shipIds.planetDestroyer);
    case 'endgame-ready-prerequisites':
      return getCompleteBuildingIds(factionId).supremeGalacticGates;
  }
}

export function measureProgressionMilestone(
  factionId: FactionId,
  profileId: ProgressionProfileId,
  milestoneId: ProgressionMilestoneId,
  worldSpeed: WorldSpeed = 2,
): ProgressionMilestoneMeasurement {
  const buildings = new Map(
    COMPLETE_BUILDING_CATALOGS[factionId].map((definition) => [definition.id, definition]),
  );
  const research = new Map(
    COMPLETE_RESEARCH_CATALOGS[factionId].map((definition) => [definition.id, definition]),
  );
  const startingBuildings = new Map(
    getStartingBuildingsForFaction(factionId).map((building) => [building.buildingId, building.level]),
  );
  const requiredBuildings = new Map<string, number>();
  const requiredResearch = new Map<string, number>();

  const requireBuilding = (buildingId: string, requestedLevel: number): void => {
    const maximum = getBuildingMaxLevelById(profileId, buildingId) ?? requestedLevel;
    const level = Math.min(requestedLevel, maximum);
    const previous = Math.max(
      requiredBuildings.get(buildingId) ?? 0,
      startingBuildings.get(buildingId) ?? 0,
    );
    if (previous >= level) return;
    const definition = buildings.get(buildingId);
    if (definition === undefined) throw new Error(`Unknown milestone building: ${buildingId}.`);
    for (const rawRequirement of definition.requirements) {
      const requirement = resolveBuildingRequirement(profileId, rawRequirement);
      requireBuilding(requirement.buildingId, requirement.level);
    }
    requiredBuildings.set(buildingId, level);
  };

  const requireResearch = (technologyId: string, requestedLevel: number): void => {
    const maximum = getResearchMaxLevelById(profileId, technologyId) ?? requestedLevel;
    const level = Math.min(requestedLevel, maximum);
    const previous = requiredResearch.get(technologyId) ?? 0;
    if (previous >= level) return;
    const definition = research.get(technologyId);
    if (definition === undefined) throw new Error(`Unknown milestone research: ${technologyId}.`);
    requireBuilding(
      getCompleteBuildingIds(factionId).researchCenter,
      definition.requiredLaboratoryLevel,
    );
    for (const rawRequirement of definition.requirements) {
      const requirement = resolveResearchRequirement(profileId, rawRequirement);
      requireResearch(requirement.technologyId, requirement.level);
    }
    requiredResearch.set(technologyId, level);
  };

  const target = targetForMilestone(factionId, milestoneId);
  let targetUnit: UnitDefinition | undefined;
  if (typeof target === 'string') {
    requireBuilding(target, getBuildingMaxLevelById(profileId, target) ?? 1);
  } else {
    targetUnit = target;
    for (const rawRequirement of target.buildingRequirements) {
      const requirement = resolveBuildingRequirement(profileId, rawRequirement);
      requireBuilding(requirement.buildingId, requirement.level);
    }
    for (const rawRequirement of target.researchRequirements) {
      const requirement = resolveResearchRequirement(profileId, rawRequirement);
      requireResearch(requirement.technologyId, requirement.level);
    }
  }

  let cost = ZERO_COST;
  let canonicalSeconds = 0;
  for (const [buildingId, targetLevel] of requiredBuildings) {
    const definition = buildings.get(buildingId);
    if (definition === undefined) throw new Error(`Unknown measured building: ${buildingId}.`);
    const startingLevel = startingBuildings.get(buildingId) ?? 0;
    for (let level = startingLevel + 1; level <= targetLevel; level += 1) {
      cost = addCost(cost, calculateBuildingCost(definition, level, profileId));
      canonicalSeconds += calculateBuildSeconds(definition, level, profileId);
    }
  }
  for (const [technologyId, targetLevel] of requiredResearch) {
    const definition = research.get(technologyId);
    if (definition === undefined) throw new Error(`Unknown measured research: ${technologyId}.`);
    for (let level = 1; level <= targetLevel; level += 1) {
      cost = addCost(cost, calculateResearchCost(definition, level, profileId));
      canonicalSeconds += calculateResearchSeconds(definition, level, profileId);
    }
  }
  if (targetUnit !== undefined) {
    cost = addCost(cost, calculateUnitBatchCost(targetUnit, 1, profileId));
    canonicalSeconds += scaleProgressionInteger(
      targetUnit.baseSeconds,
      getProgressionProfileRules(profileId).unit.timePermille,
    );
  }

  const realSeconds = canonicalSeconds / worldSpeed;
  return {
    milestoneId,
    factionId,
    profileId,
    canonicalSeconds,
    realSeconds,
    realMinutes: realSeconds / 60,
    cost,
    buildingLevels: Object.fromEntries([...requiredBuildings].sort()),
    researchLevels: Object.fromEntries([...requiredResearch].sort()),
  };
}

export function measureAllProgressionMilestones(
  factionId: FactionId,
  profileId: ProgressionProfileId,
  worldSpeed: WorldSpeed = 2,
): Readonly<Record<ProgressionMilestoneId, ProgressionMilestoneMeasurement>> {
  return Object.fromEntries(
    PROGRESSION_MILESTONE_IDS.map((milestoneId) => [
      milestoneId,
      measureProgressionMilestone(factionId, profileId, milestoneId, worldSpeed),
    ]),
  ) as Readonly<Record<ProgressionMilestoneId, ProgressionMilestoneMeasurement>>;
}
