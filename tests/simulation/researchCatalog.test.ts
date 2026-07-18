import { describe, expect, it } from 'vitest';
import { AEGIS_RESEARCH_CATALOG } from '../../src/simulation/research/catalog';
import { validateResearchCatalog } from '../../src/simulation/research/validateResearchCatalog';
import type { ResearchDefinition } from '../../src/simulation/research/types';

describe('research catalog', () => {
  it('has a valid acyclic Aegis dependency graph', () => {
    expect(validateResearchCatalog(AEGIS_RESEARCH_CATALOG)).toEqual([]);
    expect(AEGIS_RESEARCH_CATALOG).toHaveLength(6);
  });

  it('reports duplicate, unknown and cyclic dependencies', () => {
    const base = AEGIS_RESEARCH_CATALOG[0];
    expect(base).toBeDefined();
    if (base === undefined) {
      return;
    }

    const left: ResearchDefinition = {
      ...base,
      id: 'technology.test.left',
      requirements: [{ technologyId: 'technology.test.right', level: 1 }],
    };
    const right: ResearchDefinition = {
      ...base,
      id: 'technology.test.right',
      requirements: [{ technologyId: 'technology.test.left', level: 1 }],
    };
    const missing: ResearchDefinition = {
      ...base,
      id: 'technology.test.missing',
      requirements: [{ technologyId: 'technology.unknown', level: 1 }],
    };

    const issues = validateResearchCatalog([left, right, missing, left]);
    expect(issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'DUPLICATE_RESEARCH_ID',
        'UNKNOWN_RESEARCH_REQUIREMENT',
        'RESEARCH_DEPENDENCY_CYCLE',
      ]),
    );
  });
});
