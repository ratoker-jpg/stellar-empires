import { describe, expect, it } from 'vitest';
import { createCampaignSettings } from '../../src/simulation/campaign/settings';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeCommand } from '../../src/simulation/reducer';

function playerPlanet(profile: 'legacy-v1' | 'compressed-v1') {
  const state = createInitialGameState(`economy-${profile}`, {
    campaignSettings: createCampaignSettings({ progressionProfile: profile }),
  });
  const planet = state.planets.find((candidate) => candidate.ownerEmpireId === 'player');
  if (planet === undefined) throw new Error('Player planet was not created.');
  return { state, planet };
}

describe('compressed campaign economy profile', () => {
  it('uses the playable starting stocks, capacity and population', () => {
    const { planet } = playerPlanet('compressed-v1');

    expect(planet.economy.resources).toMatchObject({
      metal: { amount: 30_000, capacity: 60_000 },
      crystal: { amount: 30_000, capacity: 60_000 },
      gas: { amount: 15_000, capacity: 60_000 },
    });
    expect(planet.economy.population).toEqual({ used: 4, capacity: 70 });
  });

  it('applies production after faction tuning and preserves exact accrual partitioning', () => {
    const { state, planet } = playerPlanet('compressed-v1');

    expect(planet.economy.resources.metal.productionPerHour).toBe(774);
    expect(planet.economy.resources.crystal.productionPerHour).toBe(510);
    expect(planet.economy.resources.gas.productionPerHour).toBe(312);

    const single = executeCommand(state, { type: 'ADVANCE_TIME', seconds: 3_600 });
    let partitioned = state;
    for (let index = 0; index < 60; index += 1) {
      const result = executeCommand(partitioned, { type: 'ADVANCE_TIME', seconds: 60 });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error(result.message);
      partitioned = result.value;
    }

    expect(single.ok).toBe(true);
    if (!single.ok) return;
    expect(partitioned.planets.map((candidate) => candidate.economy)).toEqual(
      single.value.planets.map((candidate) => candidate.economy),
    );
  });

  it('leaves legacy starting economy unchanged', () => {
    const { planet } = playerPlanet('legacy-v1');

    expect(planet.economy.resources).toMatchObject({
      metal: { amount: 2_500, capacity: 10_000, productionPerHour: 129 },
      crystal: { amount: 1_800, capacity: 10_000, productionPerHour: 85 },
      gas: { amount: 900, capacity: 10_000, productionPerHour: 52 },
    });
    expect(planet.economy.population).toEqual({ used: 4, capacity: 55 });
  });
});
