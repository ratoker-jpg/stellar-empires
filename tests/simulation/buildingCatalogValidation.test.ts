import { describe, expect, it } from 'vitest';
import {
  AEGIS_BUILDING_CATALOG,
  type BuildingDefinition,
} from '../../src/simulation/planet/buildingCatalog';
import { validateBuildingCatalog } from '../../src/simulation/planet/buildingCatalogValidation';

function createDefinition(
  id: string,
  requirements: BuildingDefinition['requirements'],
): BuildingDefinition {
  return {
    id,
    name: id,
    factionId: 'aegis',
    zoneId: 'industry',
    fieldCost: 1,
    maxLevel: 1,
    assetId: 'building.aegis.command',
    baseCost: { metal: 0, crystal: 0, gas: 0 },
    baseBuildSeconds: 1,
    requirements,
  };
}

describe('building catalog validation', () => {
  it('accepts the Aegis dependency graph', () => {
    expect(validateBuildingCatalog(AEGIS_BUILDING_CATALOG)).toEqual([]);
  });

  it('detects unknown requirements and cycles', () => {
    const first = createDefinition('test.first', [
      { buildingId: 'test.second', level: 1 },
    ]);
    const second = createDefinition('test.second', [
      { buildingId: 'test.first', level: 1 },
    ]);
    const unknown = createDefinition('test.unknown', [
      { buildingId: 'missing.building', level: 1 },
    ]);

    const issues = validateBuildingCatalog([first, second, unknown]);

    expect(issues.some((issue) => issue.code === 'REQUIREMENT_CYCLE')).toBe(true);
    expect(issues).toContainEqual({
      code: 'UNKNOWN_REQUIREMENT',
      buildingId: 'test.unknown',
      relatedBuildingId: 'missing.building',
    });
  });
});
