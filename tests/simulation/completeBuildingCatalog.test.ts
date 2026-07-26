import { describe, expect, it } from 'vitest';
import { resolveCompleteMechanicalAsset } from '../../src/assets/completeMechanicalAssetManifest';
import { getFactionMechanicalCatalog } from '../../src/simulation/factions/factionMechanicalCatalogRegistry';
import { resolveCanonicalBuildingId } from '../../src/simulation/planet/buildingAliases';
import {
  calculateBuildingOperationalSummary,
  isBuildingEndgameLocked,
} from '../../src/simulation/planet/buildingOperations';
import { getCompleteBuildingIds } from '../../src/simulation/planet/completeBuildingCatalog';

const FACTIONS = ['aegis', 'synod', 'veyra'] as const;

describe('complete building economy', () => {
  it('registers exactly 24 unique functional buildings for every faction', () => {
    for (const factionId of FACTIONS) {
      const buildings = getFactionMechanicalCatalog(factionId).buildings;
      expect(buildings).toHaveLength(24);
      expect(new Set(buildings.map((building) => building.id)).size).toBe(24);
      expect(buildings.every((building) => building.id.startsWith(`building.${factionId}.`))).toBe(true);
      expect(buildings.filter((building) => building.zoneId === 'resource')).toHaveLength(10);
      expect(buildings.filter((building) => building.zoneId === 'industry')).toHaveLength(7);
      expect(buildings.filter((building) => building.zoneId === 'military')).toHaveLength(7);
    }
  });

  it('keeps all prerequisites inside the same faction catalog', () => {
    for (const factionId of FACTIONS) {
      const buildings = getFactionMechanicalCatalog(factionId).buildings;
      const ids = new Set(buildings.map((building) => building.id));
      for (const building of buildings) {
        for (const requirement of building.requirements) {
          expect(ids.has(requirement.buildingId)).toBe(true);
          expect(requirement.buildingId.startsWith(`building.${factionId}.`)).toBe(true);
        }
      }
    }
  });

  it('provides real operational effects for construction, production, research and hangars', () => {
    const ids = getCompleteBuildingIds('aegis');
    const summary = calculateBuildingOperationalSummary([
      { buildingId: ids.constructionComplex, level: 3 },
      { buildingId: ids.advancedFactory, level: 2 },
      { buildingId: ids.shipyard, level: 4 },
      { buildingId: ids.researchCenter, level: 2 },
      { buildingId: ids.hangar, level: 3 },
      { buildingId: ids.scrapyard, level: 2 },
      { buildingId: ids.tradeCenter, level: 2 },
      { buildingId: ids.spaceport, level: 2 },
      { buildingId: ids.bank, level: 2 },
    ]);

    expect(summary).toMatchObject({
      constructionSpeedPercent: 18,
      shipProductionSpeedPercent: 26,
      defenseProductionSpeedPercent: 32,
      researchSpeedPercent: 14,
      hangarCapacity: 240,
      salvageEfficiencyPercent: 10,
      marketEfficiencyPercent: 4,
      shipUpgradeCapacity: 2,
      bankCreditEfficiencyPercent: 10,
    });
  });

  it('keeps old saves and unit requirements compatible through canonical aliases', () => {
    expect(resolveCanonicalBuildingId('building.aegis.command')).toBe(
      'building.aegis.control-chamber',
    );
    expect(resolveCanonicalBuildingId('building.synod.lattice-yard')).toBe(
      'building.synod.shipyard',
    );
    expect(resolveCanonicalBuildingId('building.veyra.carapace-forge')).toBe(
      'building.veyra.teret-factory',
    );
  });

  it('ships with asset fallbacks for every card and keeps endgame structures locked', () => {
    for (const factionId of FACTIONS) {
      const ids = getCompleteBuildingIds(factionId);
      const buildings = getFactionMechanicalCatalog(factionId).buildings;
      expect(buildings.every((building) => resolveCompleteMechanicalAsset(building.id).asset !== undefined)).toBe(true);
      expect(isBuildingEndgameLocked(ids.galacticObelisk)).toBe(true);
      expect(isBuildingEndgameLocked(ids.supremeGalacticGates)).toBe(true);
      expect(isBuildingEndgameLocked(ids.shipyard)).toBe(false);
    }
  });
});
