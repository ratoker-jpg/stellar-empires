import { describe, expect, it } from 'vitest';
import { AEGIS_BUILDING_CATALOG } from '../../src/simulation/planet/buildingCatalog';
import { validateBuildingCatalog } from '../../src/simulation/planet/buildingCatalogValidation';

describe('building catalog validation', () => {
  it('accepts the Aegis dependency graph', () => {
    expect(validateBuildingCatalog(AEGIS_BUILDING_CATALOG)).toEqual([]);
  });

  it('detects unknown requirements and cycles', () => {
    const first = {
      ...AEGIS_BUILDING_CATALOG[0],
      id: 'test.first',
      requirements: [{ buildingId: 'test.second', level: 1 }],
    };
    const second = {
      ...AEGIS_BUILDING_CATALOG[1],
      id: 'test.second',
      requirements: [{ buildingId: 'test.first', level: 1 }],
    };
    const unknown = {
      ...AEGIS_BUILDING_CATALOG[2],
      id: 'test.unknown',
      requirements: [{ buildingId: 'missing.building', level: 1 }],
    };

    const issues = validateBuildingCatalog([first, second, unknown]);

    expect(issues.some((issue) => issue.code === 'REQUIREMENT_CYCLE')).toBe(true);
    expect(issues).toContainEqual({
      code: 'UNKNOWN_REQUIREMENT',
      buildingId: 'test.unknown',
      relatedBuildingId: 'missing.building',
    });
  });
});
