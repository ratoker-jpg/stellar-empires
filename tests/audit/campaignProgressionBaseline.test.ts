import { describe, expect, test } from 'vitest';
import type { ResourceCost } from '../../src/simulation/economy/types';
import { getStartingBuildingsForFaction } from '../../src/simulation/factions/factionMechanicalRoles';
import {
  calculateBuildSeconds,
  calculateBuildingCost,
} from '../../src/simulation/planet/buildingProgression';
import {
  COMPLETE_BUILDING_CATALOGS,
  getCompleteBuildingIds,
} from '../../src/simulation/planet/completeBuildingCatalog';
import type { FactionId } from '../../src/simulation/planet/types';
import {
  COMPLETE_RESEARCH_CATALOGS,
  getCompleteResearchId,
} from '../../src/simulation/research/completeResearchCatalog';
import {
  calculateResearchCost,
  calculateResearchSeconds,
} from '../../src/simulation/research/progression';
import { COMPLETE_DEFENSE_CATALOGS } from '../../src/simulation/units/completeDefenseCatalog';
import {
  COMPLETE_SHIP_CATALOGS,
  getCompleteShipIds,
} from '../../src/simulation/units/completeShipCatalog';
import type { UnitDefinition } from '../../src/simulation/units/types';

interface ProgressionTotals {
  readonly cost: ResourceCost;
  readonly gameSeconds: number;
}

interface ProgressionMilestone extends ProgressionTotals {
  readonly buildingLevels: Readonly<Record<string, number>>;
  readonly researchLevels: Readonly<Record<string, number>>;
  readonly realHoursAtRecommendedX2: number;
}

const ZERO_COST: ResourceCost = { metal: 0, crystal: 0, gas: 0 };

function addCost(left: ResourceCost, right: ResourceCost): ResourceCost {
  return {
    metal: left.metal + right.metal,
    crystal: left.crystal + right.crystal,
    gas: left.gas + right.gas,
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function sumBuildingCatalog(factionId: FactionId): ProgressionTotals {
  let cost = ZERO_COST;
  let gameSeconds = 0;
  for (const definition of COMPLETE_BUILDING_CATALOGS[factionId]) {
    for (let level = 1; level <= definition.maxLevel; level += 1) {
      cost = addCost(cost, calculateBuildingCost(definition, level, 'legacy-v1'));
      gameSeconds += calculateBuildSeconds(definition, level, 'legacy-v1');
    }
  }
  return { cost, gameSeconds };
}

function sumResearchCatalog(factionId: FactionId): ProgressionTotals {
  let cost = ZERO_COST;
  let gameSeconds = 0;
  for (const definition of COMPLETE_RESEARCH_CATALOGS[factionId]) {
    for (let level = 1; level <= definition.maxLevel; level += 1) {
      cost = addCost(cost, calculateResearchCost(definition, level, 'legacy-v1'));
      gameSeconds += calculateResearchSeconds(definition, level, 'legacy-v1');
    }
  }
  return { cost, gameSeconds };
}

function createMilestone(
  factionId: FactionId,
  target: UnitDefinition | string,
): ProgressionMilestone {
  const buildings = new Map(COMPLETE_BUILDING_CATALOGS[factionId].map((definition) => [definition.id, definition]));
  const research = new Map(COMPLETE_RESEARCH_CATALOGS[factionId].map((definition) => [definition.id, definition]));
  const startingBuildings = new Map(
    getStartingBuildingsForFaction(factionId).map((building) => [building.buildingId, building.level]),
  );
  const requiredBuildings = new Map<string, number>();
  const requiredResearch = new Map<string, number>();

  const requireBuilding = (buildingId: string, level: number): void => {
    const previous = requiredBuildings.get(buildingId) ?? startingBuildings.get(buildingId) ?? 0;
    if (previous >= level) return;
    const definition = buildings.get(buildingId);
    if (definition === undefined) throw new Error(`Unknown progression building ${buildingId}`);
    for (const requirement of definition.requirements) {
      requireBuilding(requirement.buildingId, requirement.level);
    }
    requiredBuildings.set(buildingId, level);
  };

  const requireResearch = (technologyId: string, level: number): void => {
    const previous = requiredResearch.get(technologyId) ?? 0;
    if (previous >= level) return;
    const definition = research.get(technologyId);
    if (definition === undefined) throw new Error(`Unknown progression technology ${technologyId}`);
    requireBuilding(getCompleteBuildingIds(factionId).researchCenter, definition.requiredLaboratoryLevel);
    for (const requirement of definition.requirements) {
      requireResearch(requirement.technologyId, requirement.level);
    }
    requiredResearch.set(technologyId, level);
  };

  let targetUnit: UnitDefinition | undefined;
  if (typeof target === 'string') {
    requireBuilding(target, buildings.get(target)?.maxLevel ?? 1);
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
      cost = addCost(cost, calculateBuildingCost(definition, level, 'legacy-v1'));
      gameSeconds += calculateBuildSeconds(definition, level, 'legacy-v1');
    }
  }
  for (const [technologyId, targetLevel] of requiredResearch) {
    const definition = research.get(technologyId)!;
    for (let level = 1; level <= targetLevel; level += 1) {
      cost = addCost(cost, calculateResearchCost(definition, level, 'legacy-v1'));
      gameSeconds += calculateResearchSeconds(definition, level, 'legacy-v1');
    }
  }
  if (targetUnit !== undefined) {
    cost = addCost(cost, targetUnit.baseCost);
    gameSeconds += targetUnit.baseSeconds;
  }

  return {
    cost,
    gameSeconds,
    buildingLevels: Object.fromEntries([...requiredBuildings].sort()),
    researchLevels: Object.fromEntries([...requiredResearch].sort()),
    realHoursAtRecommendedX2: round(gameSeconds / 7_200),
  };
}

describe('campaign progression audit baseline', () => {
  test('prints reproducible catalog and milestone measurements without changing gameplay', () => {
    const factionId: FactionId = 'aegis';
    const ships = getCompleteShipIds(factionId);
    const buildings = getCompleteBuildingIds(factionId);
    const shipCatalog = new Map(COMPLETE_SHIP_CATALOGS[factionId].map((definition) => [definition.id, definition]));
    const requireShip = (shipId: string): UnitDefinition => {
      const definition = shipCatalog.get(shipId);
      if (definition === undefined) throw new Error(`Unknown progression ship ${shipId}`);
      return definition;
    };

    const buildingTotals = sumBuildingCatalog(factionId);
    const researchTotals = sumResearchCatalog(factionId);
    const report = {
      graphBaseline: {
        stateSchema: 16,
        saveFormat: 3,
        recommendedWorldSpeed: 2,
      },
      catalogCounts: {
        buildings: COMPLETE_BUILDING_CATALOGS[factionId].length,
        research: COMPLETE_RESEARCH_CATALOGS[factionId].length,
        ships: COMPLETE_SHIP_CATALOGS[factionId].length,
        defenses: COMPLETE_DEFENSE_CATALOGS[factionId].length,
      },
      rawCatalogTotals: {
        buildings: {
          ...buildingTotals,
          gameHours: round(buildingTotals.gameSeconds / 3_600),
          realHoursAtRecommendedX2: round(buildingTotals.gameSeconds / 7_200),
        },
        research: {
          ...researchTotals,
          gameHours: round(researchTotals.gameSeconds / 3_600),
          realHoursAtRecommendedX2: round(researchTotals.gameSeconds / 7_200),
        },
      },
      milestones: {
        firstCombatShip: createMilestone(factionId, requireShip(ships.lightFighter)),
        firstScout: createMilestone(factionId, requireShip(ships.spyProbe)),
        firstColonizer: createMilestone(factionId, requireShip(ships.colonizer)),
        firstPlanetDestroyer: createMilestone(factionId, requireShip(ships.planetDestroyer)),
        supremeGalacticGates: createMilestone(factionId, buildings.supremeGalacticGates),
      },
      selectedResearchCaps: {
        physics: COMPLETE_RESEARCH_CATALOGS[factionId].find(
          (definition) => definition.id === getCompleteResearchId(factionId, 'physics'),
        )?.maxLevel,
        parallelUniverses: COMPLETE_RESEARCH_CATALOGS[factionId].find(
          (definition) => definition.id === getCompleteResearchId(factionId, 'parallel-universes'),
        )?.maxLevel,
      },
    };

    console.info(`CAMPAIGN_PROGRESSION_BASELINE=${JSON.stringify(report)}`);

    expect(report.catalogCounts).toEqual({ buildings: 24, research: 22, ships: 13, defenses: 9 });
    expect(report.milestones.firstScout.gameSeconds).toBeGreaterThan(0);
    expect(report.milestones.firstColonizer.realHoursAtRecommendedX2).toBeGreaterThan(
      report.milestones.firstScout.realHoursAtRecommendedX2,
    );
    expect(report.milestones.firstPlanetDestroyer.realHoursAtRecommendedX2).toBeGreaterThan(
      report.milestones.firstColonizer.realHoursAtRecommendedX2,
    );
    expect(report.milestones.supremeGalacticGates.realHoursAtRecommendedX2).toBeGreaterThan(
      report.milestones.firstPlanetDestroyer.realHoursAtRecommendedX2,
    );
  });
});
