import { describe, expect, test } from 'vitest';
import type { ResourceCost } from '../../src/simulation/economy/types';
import { getStartingBuildingsForFaction } from '../../src/simulation/factions/factionMechanicalRoles';
import {
  COMPLETE_BUILDING_CATALOGS,
  getCompleteBuildingIds,
  type CompleteBuildingIds,
} from '../../src/simulation/planet/completeBuildingCatalog';
import type { BuildingDefinition } from '../../src/simulation/planet/buildingDefinitions';
import type { FactionId } from '../../src/simulation/planet/types';
import {
  COMPLETE_RESEARCH_CATALOGS,
  getCompleteResearchId,
} from '../../src/simulation/research/completeResearchCatalog';
import type { ResearchDefinition } from '../../src/simulation/research/types';
import {
  COMPLETE_SHIP_CATALOGS,
  getCompleteShipIds,
} from '../../src/simulation/units/completeShipCatalog';
import type { UnitDefinition } from '../../src/simulation/units/types';

interface CandidateProgressionProfile {
  readonly buildingCostGrowthPermille: number;
  readonly buildingTimeGrowthPermille: number;
  readonly buildingBaseTimePermille: number;
  readonly researchCostGrowthPermille: number;
  readonly researchTimeGrowthPermille: number;
  readonly researchBaseCostPermille: number;
  readonly researchBaseTimePermille: number;
  readonly unitCostPermille: number;
  readonly unitTimePermille: number;
  readonly endgameBaseSeconds: Readonly<Record<string, number>>;
  readonly buildingCaps: Readonly<Record<string, number>>;
  readonly researchCaps: Readonly<Record<string, number>>;
}

const ZERO_COST: ResourceCost = { metal: 0, crystal: 0, gas: 0 };

function addCost(left: ResourceCost, right: ResourceCost): ResourceCost {
  return {
    metal: left.metal + right.metal,
    crystal: left.crystal + right.crystal,
    gas: left.gas + right.gas,
  };
}

function scale(value: number, permille: number): number {
  return Math.max(0, Math.ceil((value * permille) / 1_000));
}

function grow(value: number, level: number, permille: number): number {
  let result = value;
  for (let current = 1; current < level; current += 1) result = scale(result, permille);
  return result;
}

function scaleCost(cost: ResourceCost, permille: number): ResourceCost {
  return {
    metal: scale(cost.metal, permille),
    crystal: scale(cost.crystal, permille),
    gas: scale(cost.gas, permille),
  };
}

function levelCost(cost: ResourceCost, level: number, growthPermille: number): ResourceCost {
  return {
    metal: grow(cost.metal, level, growthPermille),
    crystal: grow(cost.crystal, level, growthPermille),
    gas: grow(cost.gas, level, growthPermille),
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function createProfile(factionId: FactionId): CandidateProgressionProfile {
  const buildings: CompleteBuildingIds = getCompleteBuildingIds(factionId);
  const researchId = (slug: string): string => getCompleteResearchId(factionId, slug);
  return {
    buildingCostGrowthPermille: 1_280,
    buildingTimeGrowthPermille: 1_180,
    buildingBaseTimePermille: 600,
    researchCostGrowthPermille: 1_280,
    researchTimeGrowthPermille: 1_180,
    researchBaseCostPermille: 900,
    researchBaseTimePermille: 600,
    unitCostPermille: 850,
    unitTimePermille: 700,
    endgameBaseSeconds: {
      [buildings.galacticObelisk]: 14_400,
      [buildings.supremeGalacticGates]: 14_400,
    },
    buildingCaps: {
      [buildings.metalPrimary]: 10,
      [buildings.metalSecondary]: 6,
      [buildings.metalTertiary]: 4,
      [buildings.crystalPrimary]: 10,
      [buildings.crystalSecondary]: 6,
      [buildings.gasPrimary]: 10,
      [buildings.gasSecondary]: 6,
      [buildings.solarPower]: 10,
      [buildings.independentPower]: 5,
      [buildings.hangar]: 8,
      [buildings.constructionComplex]: 8,
      [buildings.advancedFactory]: 8,
      [buildings.metalStorage]: 6,
      [buildings.crystalStorage]: 6,
      [buildings.gasStorage]: 6,
      [buildings.scrapyard]: 5,
      [buildings.tradeCenter]: 5,
      [buildings.shipyard]: 8,
      [buildings.researchCenter]: 8,
      [buildings.spaceport]: 8,
      [buildings.government]: 6,
      [buildings.bank]: 5,
      [buildings.galacticObelisk]: 1,
      [buildings.supremeGalacticGates]: 1,
    },
    researchCaps: {
      [researchId('physics')]: 6,
      [researchId('chemistry')]: 6,
      [researchId('mathematics')]: 6,
      [researchId('astronomy')]: 6,
      [researchId('espionage')]: 6,
      [researchId('computer-systems')]: 6,
      [researchId('ship-armor')]: 6,
      [researchId('fuel-cells')]: 6,
      [researchId('jet-engines')]: 6,
      [researchId('laser-science')]: 6,
      [researchId('ion-science')]: 5,
      [researchId('plasma-science')]: 4,
      [researchId('ecology')]: 5,
      [researchId('hyperspace')]: 6,
      [researchId('parallel-universes')]: 3,
      [researchId('improved-construction')]: 6,
      [researchId('piercing-attack')]: 5,
      [researchId('maneuver-defense')]: 5,
      [researchId('critical-hit')]: 5,
      [researchId('light-armor')]: 1,
      [researchId('medium-armor')]: 1,
      [researchId('heavy-armor')]: 1,
    },
  };
}

function candidateBuildingCost(
  definition: BuildingDefinition,
  targetLevel: number,
  profile: CandidateProgressionProfile,
): ResourceCost {
  return levelCost(definition.baseCost, targetLevel, profile.buildingCostGrowthPermille);
}

function candidateBuildingSeconds(
  definition: BuildingDefinition,
  targetLevel: number,
  profile: CandidateProgressionProfile,
): number {
  const base = profile.endgameBaseSeconds[definition.id] ?? scale(
    definition.baseBuildSeconds,
    profile.buildingBaseTimePermille,
  );
  return grow(base, targetLevel, profile.buildingTimeGrowthPermille);
}

function candidateResearchCost(
  definition: ResearchDefinition,
  targetLevel: number,
  profile: CandidateProgressionProfile,
): ResourceCost {
  return levelCost(
    scaleCost(definition.baseCost, profile.researchBaseCostPermille),
    targetLevel,
    profile.researchCostGrowthPermille,
  );
}

function candidateResearchSeconds(
  definition: ResearchDefinition,
  targetLevel: number,
  profile: CandidateProgressionProfile,
): number {
  return grow(
    scale(definition.baseSeconds, profile.researchBaseTimePermille),
    targetLevel,
    profile.researchTimeGrowthPermille,
  );
}

function candidateUnitCost(
  definition: UnitDefinition,
  profile: CandidateProgressionProfile,
): ResourceCost {
  return scaleCost(definition.baseCost, profile.unitCostPermille);
}

function candidateUnitSeconds(
  definition: UnitDefinition,
  profile: CandidateProgressionProfile,
): number {
  return scale(definition.baseSeconds, profile.unitTimePermille);
}

function capRequirement(
  requirementId: string,
  level: number,
  caps: Readonly<Record<string, number>>,
): number {
  return Math.min(level, caps[requirementId] ?? level);
}

function measureMilestone(
  factionId: FactionId,
  profile: CandidateProgressionProfile,
  target: UnitDefinition | string,
) {
  const buildings = new Map(COMPLETE_BUILDING_CATALOGS[factionId].map((definition) => [definition.id, definition]));
  const research = new Map(COMPLETE_RESEARCH_CATALOGS[factionId].map((definition) => [definition.id, definition]));
  const startingBuildings = new Map(
    getStartingBuildingsForFaction(factionId).map((building) => [building.buildingId, building.level]),
  );
  const requiredBuildings = new Map<string, number>();
  const requiredResearch = new Map<string, number>();

  const requireBuilding = (buildingId: string, requestedLevel: number): void => {
    const level = capRequirement(buildingId, requestedLevel, profile.buildingCaps);
    const previous = requiredBuildings.get(buildingId) ?? startingBuildings.get(buildingId) ?? 0;
    if (previous >= level) return;
    const definition = buildings.get(buildingId);
    if (definition === undefined) throw new Error(`Unknown candidate building ${buildingId}`);
    for (const requirement of definition.requirements) {
      requireBuilding(requirement.buildingId, requirement.level);
    }
    requiredBuildings.set(buildingId, level);
  };

  const requireResearch = (technologyId: string, requestedLevel: number): void => {
    const level = capRequirement(technologyId, requestedLevel, profile.researchCaps);
    const previous = requiredResearch.get(technologyId) ?? 0;
    if (previous >= level) return;
    const definition = research.get(technologyId);
    if (definition === undefined) throw new Error(`Unknown candidate research ${technologyId}`);
    requireBuilding(
      getCompleteBuildingIds(factionId).researchCenter,
      definition.requiredLaboratoryLevel,
    );
    for (const requirement of definition.requirements) {
      requireResearch(requirement.technologyId, requirement.level);
    }
    requiredResearch.set(technologyId, level);
  };

  let targetUnit: UnitDefinition | undefined;
  if (typeof target === 'string') {
    requireBuilding(target, profile.buildingCaps[target] ?? buildings.get(target)?.maxLevel ?? 1);
  } else {
    targetUnit = target;
    for (const requirement of target.buildingRequirements) {
      requireBuilding(requirement.buildingId, requirement.level);
    }
    for (const requirement of target.researchRequirements) {
      requireResearch(requirement.technologyId, requirement.level);
    }
  }

  let cost = ZERO_COST;
  let gameSeconds = 0;
  for (const [buildingId, targetLevel] of requiredBuildings) {
    const definition = buildings.get(buildingId)!;
    const startingLevel = startingBuildings.get(buildingId) ?? 0;
    for (let level = startingLevel + 1; level <= targetLevel; level += 1) {
      cost = addCost(cost, candidateBuildingCost(definition, level, profile));
      gameSeconds += candidateBuildingSeconds(definition, level, profile);
    }
  }
  for (const [technologyId, targetLevel] of requiredResearch) {
    const definition = research.get(technologyId)!;
    for (let level = 1; level <= targetLevel; level += 1) {
      cost = addCost(cost, candidateResearchCost(definition, level, profile));
      gameSeconds += candidateResearchSeconds(definition, level, profile);
    }
  }
  if (targetUnit !== undefined) {
    cost = addCost(cost, candidateUnitCost(targetUnit, profile));
    gameSeconds += candidateUnitSeconds(targetUnit, profile);
  }

  return {
    cost,
    gameSeconds,
    realMinutesAtX2: round(gameSeconds / 120),
    buildingLevels: Object.fromEntries([...requiredBuildings].sort()),
    researchLevels: Object.fromEntries([...requiredResearch].sort()),
  };
}

describe('compressed-v1 progression candidate', () => {
  test('meets the audit critical-path envelope before economy waiting is simulated', () => {
    const factionId: FactionId = 'aegis';
    const profile = createProfile(factionId);
    const shipIds = getCompleteShipIds(factionId);
    const ships = new Map(COMPLETE_SHIP_CATALOGS[factionId].map((definition) => [definition.id, definition]));
    const requireShip = (id: string): UnitDefinition => {
      const definition = ships.get(id);
      if (definition === undefined) throw new Error(`Unknown candidate ship ${id}`);
      return definition;
    };
    const milestones = {
      firstCombatShip: measureMilestone(factionId, profile, requireShip(shipIds.lightFighter)),
      firstScout: measureMilestone(factionId, profile, requireShip(shipIds.spyProbe)),
      firstColonizer: measureMilestone(factionId, profile, requireShip(shipIds.colonizer)),
      firstPlanetDestroyer: measureMilestone(factionId, profile, requireShip(shipIds.planetDestroyer)),
      supremeGalacticGates: measureMilestone(
        factionId,
        profile,
        getCompleteBuildingIds(factionId).supremeGalacticGates,
      ),
    };

    console.info(`CAMPAIGN_PROGRESSION_CANDIDATE=${JSON.stringify({ profile, milestones })}`);

    expect(milestones.firstCombatShip.realMinutesAtX2).toBeLessThanOrEqual(15);
    expect(milestones.firstScout.realMinutesAtX2).toBeLessThanOrEqual(25);
    expect(milestones.firstColonizer.realMinutesAtX2).toBeLessThanOrEqual(120);
    expect(milestones.firstPlanetDestroyer.realMinutesAtX2).toBeLessThanOrEqual(360);
    expect(milestones.supremeGalacticGates.realMinutesAtX2).toBeLessThanOrEqual(720);
  });
});
