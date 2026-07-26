import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  accruePlanetEconomy,
  createPlanetEconomy,
  getSecondsUntilResourceFull,
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
  it('derives starting production and operating limits from buildings', () => {
    const { planet } = getPlayerPlanet('economy-start');

    expect(planet.economy.energy).toEqual({
      produced: 130,
      consumed: 58,
      efficiencyPermille: 1_000,
    });
    expect(planet.economy.population).toEqual({ used: 4, capacity: 55 });
    expect(planet.economy.stability).toEqual({
      capacity: 73,
      demand: 18,
      efficiencyPermille: 1_000,
    });
    expect(planet.economy.resources.metal.productionPerHour).toBe(129);
    expect(planet.economy.resources.crystal.productionPerHour).toBe(85);
    expect(planet.economy.resources.gas.productionPerHour).toBe(52);
    expect(planet.economy.resources.metal.capacity).toBe(10_000);
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
      planet.economy.resources.metal.amount + 129,
    );
    expect(updated?.economy.resources.crystal.amount).toBe(
      planet.economy.resources.crystal.amount + 85,
    );
    expect(updated?.economy.resources.gas.amount).toBe(
      planet.economy.resources.gas.amount + 52,
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

  it('uses the strictest operating limit during a deficit', () => {
    const economy = createPlanetEconomy([
      { buildingId: 'building.aegis.infrared-bot', level: 1 },
      { buildingId: 'building.aegis.metal-bot-1', level: 10 },
    ]);

    expect(economy.energy.efficiencyPermille).toBe(1_000);
    expect(economy.stability.efficiencyPermille).toBe(300);
    expect(economy.resources.metal.productionPerHour).toBe(387);
  });

  it('forecasts storage completion and never exceeds capacity', () => {
    const { planet } = getPlayerPlanet('economy-cap');
    const stock = planet.economy.resources.metal;
    expect(getSecondsUntilResourceFull(stock)).toBe(
      Math.ceil(((stock.capacity - stock.amount) * 3_600) / stock.productionPerHour),
    );

    const nearlyFull = {
      ...planet,
      economy: {
        ...planet.economy,
        resources: {
          ...planet.economy.resources,
          metal: {
            ...stock,
            amount: stock.capacity - 1,
          },
        },
      },
    };

    const updated = accruePlanetEconomy(nearlyFull, 86_400);
    expect(updated.economy.resources.metal.amount).toBe(
      updated.economy.resources.metal.capacity,
    );
    expect(updated.economy.resources.metal.productionRemainder).toBe(0);
    expect(getSecondsUntilResourceFull(updated.economy.resources.metal)).toBe(0);
  });
});
