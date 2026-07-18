import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { createIndustryZoneViewModel } from '../../src/ui/industryZoneViewModel';

describe('industry zone view model', () => {
  it('keeps research and shipyard as gated routes inside Industry', () => {
    const state = createInitialGameState('industry-routes');
    const planet = state.planets.find((candidate) => candidate.ownerEmpireId === 'player');

    expect(planet).toBeDefined();

    if (planet === undefined) {
      return;
    }

    const view = createIndustryZoneViewModel(planet);

    expect(view.buildings.every((building) => building.zoneId === 'industry')).toBe(true);
    expect(view.gateways.map((gateway) => gateway.id)).toEqual(['research', 'shipyard']);
    expect(view.gateways.every((gateway) => !gateway.unlocked)).toBe(true);
  });
});
