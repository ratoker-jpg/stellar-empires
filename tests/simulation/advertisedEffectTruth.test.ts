import { describe, expect, it } from 'vitest';
import { getFactionMechanicalCatalog } from '../../src/simulation/factions/factionMechanicalCatalogRegistry';
import { calculateBuildingOperationalSummary } from '../../src/simulation/planet/buildingOperations';
import { getCompleteBuildingIds } from '../../src/simulation/planet/completeBuildingCatalog';
import {
  COMPLETE_RESEARCH_CATALOGS,
  getCompleteResearchId,
} from '../../src/simulation/research/completeResearchCatalog';

const FACTIONS = ['aegis', 'synod', 'veyra'] as const;

describe('POST-1.0-PR3 advertised effect truth', () => {
  it.each(FACTIONS)(
    'does not expose producer-only salvage or market effects for %s',
    (factionId) => {
      const ids = getCompleteBuildingIds(factionId);
      const buildings = getFactionMechanicalCatalog(factionId).buildings;
      const scrapyard = buildings.find((building) => building.id === ids.scrapyard);
      const tradeCenter = buildings.find((building) => building.id === ids.tradeCenter);

      expect(scrapyard).toBeDefined();
      expect(tradeCenter).toBeDefined();
      expect(scrapyard?.operations).toBeUndefined();
      expect(tradeCenter?.operations).toBeUndefined();

      const summary = calculateBuildingOperationalSummary([
        { buildingId: ids.scrapyard, level: 10 },
        { buildingId: ids.tradeCenter, level: 10 },
      ]);
      expect(summary).not.toHaveProperty('salvageEfficiencyPercent');
      expect(summary).not.toHaveProperty('marketEfficiencyPercent');
    },
  );

  it.each(FACTIONS)(
    'does not advertise ecology capacity without an operational consumer for %s',
    (factionId) => {
      const ecologyId = getCompleteResearchId(factionId, 'ecology');
      const ecology = COMPLETE_RESEARCH_CATALOGS[factionId].find(
        (definition) => definition.id === ecologyId,
      );

      expect(ecology).toBeDefined();
      expect(ecology?.effects).not.toContainEqual(
        expect.objectContaining({ type: 'ECOLOGY_CAPACITY' }),
      );
      expect(ecology?.description).not.toMatch(/экологический предел|вместимост/i);
    },
  );

  it.each(FACTIONS)(
    'keeps the Bank credit effect evidence-gated and untouched for %s',
    (factionId) => {
      const ids = getCompleteBuildingIds(factionId);
      const bank = getFactionMechanicalCatalog(factionId).buildings.find(
        (building) => building.id === ids.bank,
      );

      expect(bank?.operations?.bankCreditEfficiencyPercent).toBe(5);
    },
  );
});
