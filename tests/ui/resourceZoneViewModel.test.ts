import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { createResourceZoneViewModel } from '../../src/ui/resourceZoneViewModel';

describe('resource zone view model', () => {
  it('explains production limits and storage forecasts', () => {
    const state = createInitialGameState('resource-zone-view');
    const planet = state.planets.find((candidate) => candidate.ownerEmpireId === 'player');

    expect(planet).toBeDefined();

    if (planet === undefined) {
      return;
    }

    const view = createResourceZoneViewModel(planet);

    expect(view.stocks.map((stock) => stock.id)).toEqual(['metal', 'crystal', 'gas']);
    expect(view.stocks.every((stock) => stock.secondsUntilFull !== null)).toBe(true);
    expect(view.energyEfficiencyPermille).toBe(1_000);
    expect(view.stabilityEfficiencyPermille).toBe(1_000);
    expect(view.productionEfficiencyPermille).toBe(1_000);
    expect(view.populationUsed).toBe(4);
    expect(view.populationCapacity).toBe(50);
  });
});
