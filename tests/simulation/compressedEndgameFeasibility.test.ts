import { describe, expect, it } from 'vitest';
import { createPlanetEconomy } from '../../src/simulation/economy/planetEconomy';
import { getCompleteBuildingIds } from '../../src/simulation/planet/completeBuildingCatalog';
import { getBuildingDefinition } from '../../src/simulation/planet/buildingCatalog';
import { calculateBuildingCost } from '../../src/simulation/planet/buildingProgression';
import type { FactionId } from '../../src/simulation/planet/types';
import { getEconomyProgressionProfile } from '../../src/simulation/progression/economyProfile';
import { getBuildingMaxLevel } from '../../src/simulation/progression/profile';

const PROFILE_ID = 'compressed-v1' as const;
const RESOURCE_IDS = ['metal', 'crystal', 'gas'] as const;
const FACTIONS: readonly FactionId[] = ['aegis', 'synod', 'veyra'];

function requireBuilding(buildingId: string) {
  const definition = getBuildingDefinition(buildingId);
  if (definition === undefined) {
    throw new Error(`Missing building definition: ${buildingId}`);
  }
  return definition;
}

describe('compressed endgame feasibility', () => {
  it.each(FACTIONS)(
    '%s keeps the Galactic Obelisk atomically affordable at legal maximum storage',
    (factionId) => {
      const ids = getCompleteBuildingIds(factionId);
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
      const compressedCost = calculateBuildingCost(obelisk, 1, PROFILE_ID);
      const legacyCost = calculateBuildingCost(obelisk, 1, 'legacy-v1');
      const compressedStartingResources = getEconomyProgressionProfile(PROFILE_ID).startingResources;

      expect(legacyCost).toEqual(obelisk.baseCost);
      expect(compressedCost).not.toEqual(legacyCost);
      for (const resourceId of RESOURCE_IDS) {
        expect(
          compressedCost[resourceId],
          `${factionId} ${resourceId} Obelisk cost must fit legal compressed storage capacity`,
        ).toBeLessThanOrEqual(maximumStorageEconomy.resources[resourceId].capacity);
        expect(
          compressedCost[resourceId],
          `${factionId} ${resourceId} Obelisk cost must still require organic accumulation`,
        ).toBeGreaterThan(compressedStartingResources[resourceId]);
      }
    },
  );
});
