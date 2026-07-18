import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  accruePlanetEconomy,
  createPlanetEconomy,
} from '../../src/simulation/economy/planetEconomy';
import { executeCommand } from '../../src/simulation/reducer';

function getPlayerPlanet(seed: string) {
  const state = createInitialGameState(seed);
  const planet = state.planets.find((candidate) => candidate.ownerEmpireId === 'player');

  if (planet === undefined) {
    throw new Error('Player planet was not created.');
  }

  return { state, planet };
}

describe('planet economy', () => {
  it('derives starting production and energy from buildings', () => {
    const { planet } = getPlayerPlanet('economy-start');

    expect(planet.economy.energy).toEqual({
      produced: 120,
      consumed: 70,
      efficiencyPermille: 1_000,
    });
    expect(planet.economy.resources.metal.productionPerHour).toBe(140);
    expect(planet.economy.resources.crystal.productionPerHour).toBe(90);
    expect(planet.economy.resources.gas.productionPerHour).toBe(60);
    expect(planet.economy.resources.metal.capacity).toBe(12_000);
  });

  it('accrues one exact hour when world time advances', () => {
    const { state, planet } = getPlayerPlanet('economy-hour');
    const result = executeCommand(state, { type: 'ADVANCE_TIME', seconds: 3_600 });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    const updated = result.value.planets.find((candidate) => candidate.id === planet.id);
    expect(updated?.economy.resources.metal.amount).toBe(
      planet.economy.resources.metal.amount + 140,
    );
    expect(updated?.economy.resources.crystal.amount).toBe(
      planet.economy.resources.crystal.amount + 90,
    );
    expect(updated?.economy.resources.gas.amount).toBe(
      planet.economy.resources.gas.amount + 60,
    );
  });

  it('produces the same result in one large step and many small steps', () => {
    const initial = createInitialGameState('economy-chunks');
    const single = executeCommand(initial, { type: 'ADVANCE_TIME', seconds: 3_600 });
    let chunked = initial;

    for (let index = 0; index < 60; index += 1) {
      const result = executeCommand(chunked, { type: 'ADVANCE_TIME', seconds: 60 });
      expect(result.ok).toBe(true);

      if (!result.ok) {
        throw new Error(result.message);
      }

      chunked = result.value;
    }

    expect(single.ok).toBe(true);

    if (!single.ok) {
      return;
    }

    expect(chunked.planets.map((planet) => planet.economy)).toEqual(
      single.value.planets.map((planet) => planet.economy),
    );
  });

  it('reduces production predictably during an energy deficit', () => {
    const economy = createPlanetEconomy([
      { buildingId: 'building.aegis.power-plant', level: 1 },
      { buildingId: 'building.aegis.metal-extractor', level: 10 },
    ]);

    expect(economy.energy.produced).toBe(120);
    expect(economy.energy.consumed).toBe(180);
    expect(economy.energy.efficiencyPermille).toBe(666);
    expect(economy.resources.metal.productionPerHour).toBe(932);
  });

  it('never exceeds storage capacity', () => {
    const { planet } = getPlayerPlanet('economy-cap');
    const nearlyFull = {
      ...planet,
      economy: {
        ...planet.economy,
        resources: {
          ...planet.economy.resources,
          metal: {
            ...planet.economy.resources.metal,
            amount: planet.economy.resources.metal.capacity - 1,
          },
        },
      },
    };

    const updated = accruePlanetEconomy(nearlyFull, 86_400);
    expect(updated.economy.resources.metal.amount).toBe(
      updated.economy.resources.metal.capacity,
    );
    expect(updated.economy.resources.metal.productionRemainder).toBe(0);
  });
});
