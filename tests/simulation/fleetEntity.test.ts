import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeGameCommand } from '../../src/simulation/executeGameCommand';
import type { GameState } from '../../src/simulation/types';

function withShips(state: GameState): GameState {
  return {
    ...state,
    planets: state.planets.map((planet) =>
      planet.ownerEmpireId === 'player'
        ? {
            ...planet,
            inventory: {
              ...planet.inventory,
              ships: {
                'ship.aegis.scout': 4,
                'ship.aegis.cargo': 2,
              },
            },
          }
        : planet,
    ),
  };
}

function playerPlanet(state: GameState) {
  const planet = state.planets.find((candidate) => candidate.ownerEmpireId === 'player');
  if (planet === undefined) throw new Error('Player planet missing.');
  return planet;
}

describe('fleet entity', () => {
  it('creates a serialized fleet and reserves ships and cargo', () => {
    const initial = withShips(createInitialGameState('fleet-create'));
    const planet = playerPlanet(initial);
    const result = executeGameCommand(initial, {
      type: 'CREATE_FLEET',
      empireId: 'player',
      planetId: planet.id,
      ships: { 'ship.aegis.scout': 2, 'ship.aegis.cargo': 1 },
      cargo: { metal: 500, crystal: 300, gas: 100 },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const fleet = result.value.fleets[0];
    expect(fleet).toMatchObject({
      id: 'fleet-0',
      empireId: 'player',
      status: 'stationed',
      speed: 9,
      cargoCapacity: 1_240,
    });
    const after = playerPlanet(result.value);
    expect(after.inventory.ships).toEqual({
      'ship.aegis.scout': 2,
      'ship.aegis.cargo': 1,
    });
    expect(after.economy.resources.metal.amount).toBe(
      planet.economy.resources.metal.amount - 500,
    );
  });

  it('rejects unavailable ships and cargo above combined capacity', () => {
    const initial = withShips(createInitialGameState('fleet-invalid'));
    const planet = playerPlanet(initial);

    expect(
      executeGameCommand(initial, {
        type: 'CREATE_FLEET',
        empireId: 'player',
        planetId: planet.id,
        ships: { 'ship.aegis.scout': 5 },
        cargo: { metal: 0, crystal: 0, gas: 0 },
      }),
    ).toMatchObject({ ok: false, code: 'INSUFFICIENT_SHIPS' });

    expect(
      executeGameCommand(initial, {
        type: 'CREATE_FLEET',
        empireId: 'player',
        planetId: planet.id,
        ships: { 'ship.aegis.scout': 1 },
        cargo: { metal: 21, crystal: 0, gas: 0 },
      }),
    ).toMatchObject({ ok: false, code: 'FLEET_CARGO_OVER_CAPACITY' });
  });

  it('disbands a stationed fleet and restores ships and cargo exactly once', () => {
    const initial = withShips(createInitialGameState('fleet-disband'));
    const planet = playerPlanet(initial);
    const created = executeGameCommand(initial, {
      type: 'CREATE_FLEET',
      empireId: 'player',
      planetId: planet.id,
      ships: { 'ship.aegis.cargo': 1 },
      cargo: { metal: 300, crystal: 100, gas: 50 },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const disbanded = executeGameCommand(created.value, {
      type: 'DISBAND_FLEET',
      empireId: 'player',
      fleetId: created.value.fleets[0]!.id,
    });
    expect(disbanded.ok).toBe(true);
    if (!disbanded.ok) return;
    expect(disbanded.value.fleets).toEqual([]);
    expect(playerPlanet(disbanded.value).inventory.ships).toEqual(
      planet.inventory.ships,
    );
    expect(playerPlanet(disbanded.value).economy.resources).toEqual(
      planet.economy.resources,
    );

    expect(
      executeGameCommand(disbanded.value, {
        type: 'DISBAND_FLEET',
        empireId: 'player',
        fleetId: 'fleet-0',
      }),
    ).toMatchObject({ ok: false, code: 'FLEET_NOT_FOUND' });
  });
});
