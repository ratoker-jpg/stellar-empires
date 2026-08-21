import { describe, expect, it } from 'vitest';
import { createPlanetEconomy } from '../../src/simulation/economy/planetEconomy';
import { getCompleteBuildingIds } from '../../src/simulation/planet/completeBuildingCatalog';
import { getBuildingDefinition } from '../../src/simulation/planet/buildingCatalog';
import { calculateBuildingCost } from '../../src/simulation/planet/buildingProgression';
import { getBuildingMaxLevel } from '../../src/simulation/progression/profile';

const PROFILE_ID = 'compressed-v1' as const;
const RESOURCE_IDS = ['metal', 'crystal', 'gas'] as const;

function requireBuilding(buildingId: string) {
  const definition = getBuildingDefinition(buildingId);
  if (definition === undefined) {
    throw new Error(`Missing building definition: ${buildingId}`);
  }
  return definition;
}

describe('compressed endgame feasibility', () => {
  it('keeps the Galactic Obelisk atomically affordable at legal maximum storage', () => {
    const ids = getCompleteBuildingIds('aegis');
    const storageDefinitions = [
      requireBuilding(ids.metalStorage),
      requireBuilding(ids.crystalStorage),
      requireBuilding(ids.gasStorage),
    ];
    const storageBuildings = storageDefinitions.map((definition) => ({
      buildingId: definition.id,
      level: getBuildingMaxLevel(PROFILE_ID, definition),
    }));
    const maximumStorageEconomy = createPlanetEconomy(PROFILE_ID, storageBuildings);
    const obelisk = requireBuilding(ids.galacticObelisk);
    const obeliskCost = calculateBuildingCost(obelisk, 1, PROFILE_ID);

    for (const resourceId of RESOURCE_IDS) {
      expect(
        obeliskCost[resourceId],
        `${resourceId} Obelisk cost must fit legal compressed storage capacity`,
      ).toBeLessThanOrEqual(maximumStorageEconomy.resources[resourceId].capacity);
    }
  });
});
