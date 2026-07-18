import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { createMilitaryZoneViewModel } from '../../src/ui/militaryZoneViewModel';

describe('military zone view model', () => {
  it('exposes defense and fleet routes without inventing extra planet zones', () => {
    const state = createInitialGameState('military-routes');
    const planet = state.planets.find((candidate) => candidate.ownerEmpireId === 'player');

    expect(planet).toBeDefined();

    if (planet === undefined) {
      return;
    }

    const view = createMilitaryZoneViewModel(planet);

    expect(view.buildings.every((building) => building.zoneId === 'military')).toBe(true);
    expect(view.gateways.map((gateway) => gateway.id)).toEqual(['defense', 'fleet']);
    expect(view.gateways.every((gateway) => !gateway.unlocked)).toBe(true);
    expect(Object.keys(planet.zones).sort()).toEqual(
      ['industry', 'military', 'resource'].sort(),
    );
  });
});
