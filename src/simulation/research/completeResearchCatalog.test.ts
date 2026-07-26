import { describe, expect, it } from 'vitest';
import { getFactionMechanicalCatalog, validateFactionMechanicalCatalog } from '../factions/factionMechanicalCatalogRegistry';
import { COMPLETE_RESEARCH_CATALOGS, getCompleteResearchId } from './completeResearchCatalog';
import { calculateResearchEffects } from './progression';
import { resolveCanonicalResearchId } from './researchAliases';
import { getResearchLevel } from './researchState';

const FACTIONS = ['aegis', 'synod', 'veyra'] as const;

describe('complete research catalog', () => {
  it.each(FACTIONS)('registers exactly 22 reachable technologies for %s', (factionId) => {
    const catalog = COMPLETE_RESEARCH_CATALOGS[factionId];
    const ids = new Set(catalog.map((definition) => definition.id));

    expect(catalog).toHaveLength(22);
    expect(ids.size).toBe(22);
    expect(catalog.every((definition) => definition.effects.length > 0)).toBe(true);
    for (const definition of catalog) {
      for (const requirement of definition.requirements) {
        expect(ids.has(requirement.technologyId)).toBe(true);
      }
    }
    expect(validateFactionMechanicalCatalog(getFactionMechanicalCatalog(factionId))).toEqual([]);
  });

  it('resolves legacy technology ids and levels without losing old saves', () => {
    const legacyId = 'technology.aegis.construction';
    const canonicalId = getCompleteResearchId('aegis', 'improved-construction');
    const research = {
      empireId: 'empire-aegis',
      levels: { [legacyId]: 4 },
      queue: [],
    } as const;

    expect(resolveCanonicalResearchId(legacyId)).toBe(canonicalId);
    expect(getResearchLevel(research, canonicalId)).toBe(4);
  });

  it('calculates the extended effects and caps critical chance at 12 percent', () => {
    const research = {
      empireId: 'empire-aegis',
      levels: {
        [getCompleteResearchId('aegis', 'computer-systems')]: 3,
        [getCompleteResearchId('aegis', 'fuel-cells')]: 2,
        [getCompleteResearchId('aegis', 'critical-hit')]: 10,
        [getCompleteResearchId('aegis', 'ecology')]: 2,
      },
      queue: [],
    } as const;

    const effects = calculateResearchEffects(research, COMPLETE_RESEARCH_CATALOGS.aegis);
    expect(effects.flightSlots).toBe(3);
    expect(effects.fuelEfficiencyPercent).toBe(8);
    expect(effects.criticalChanceBasisPoints).toBe(1_200);
    expect(effects.ecologyCapacity).toBe(3_000);
  });
});
