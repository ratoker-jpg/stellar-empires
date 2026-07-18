import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeGameCommand } from '../../src/simulation/executeGameCommand';
import {
  calculatePlanetDistance,
  estimateFlight,
} from '../../src/simulation/fleets/flightCalculations';
import type { GameState } from '../../src/simulation/types';

function withFleetShips(state: GameState): GameState {
  return {
    ...state,
    planets: state.planets.map((planet) =>
      planet.ownerEmpireId === 'player'
        ? {
            ...planet,
            inventory: {
              ...planet.inventory,
              ships: { 'ship.aegis.scout': 2, 'ship.aegis.cargo': 1 },
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

function targetPlanet(state: GameState) {
  const origin = playerPlanet(state);
  const target = state.planets.find((candidate) => candidate.id !== origin.id);
  if (target === undefined) throw new Error('Target planet missing.');
  return target;
}

function createTestFleet(state: GameState): GameState {
  const origin = playerPlanet(state);
  const created = executeGameCommand(state, {
    type: 'CREATE_FLEET',
    empireId: 'player',
    planetId: origin.id,
    ships: { 'ship.aegis.scout': 1, 'ship.aegis.cargo': 1 },
    cargo: { metal: 100, crystal: 50, gas: 20 },
  });
  if (!created.ok) throw new Error(created.code);
  return created.value;
}

describe('flight lifecycle', () => {
  it('uses one symmetric distance function', () => {
    const state = createInitialGameState('flight-distance');
    const origin = playerPlanet(state);
    const target = targetPlanet(state);
    const forward = calculatePlanetDistance(state.galaxy, origin, target);
    const backward = calculatePlanetDistance(state.galaxy, target, origin);
    expect(forward).toBeGreaterThan(0);
    expect(forward).toBe(backward);
    expect(calculatePlanetDistance(state.galaxy, origin, origin)).toBe(0);
  });

  it('spends round-trip fuel, arrives and returns after recall', () => {
    const initial = createTestFleet(withFleetShips(createInitialGameState('flight-arrive')));
    const origin = playerPlanet(initial);
    const target = targetPlanet(initial);
    const fleet = initial.fleets[0]!;
    const estimate = estimateFlight(initial.galaxy, initial.planets, fleet, target.id);
    const gasBefore = origin.economy.resources.gas.amount;

    const sent = executeGameCommand(initial, {
      type: 'SEND_FLEET',
      empireId: 'player',
      fleetId: fleet.id,
      targetPlanetId: target.id,
    });
    expect(sent.ok).toBe(true);
    if (!sent.ok) return;
    expect(sent.value.fleets[0]?.status).toBe('outbound');
    expect(playerPlanet(sent.value).economy.resources.gas.amount).toBe(
      gasBefore - estimate.fuelCost * 2,
    );

    const arrived = executeGameCommand(sent.value, {
      type: 'ADVANCE_TIME',
      seconds: estimate.durationSeconds,
    });
    expect(arrived.ok).toBe(true);
    if (!arrived.ok) return;
    expect(arrived.value.fleets[0]).toMatchObject({
      status: 'holding',
      location: { type: 'planet', planetId: target.id },
    });

    const recalled = executeGameCommand(arrived.value, {
      type: 'RECALL_FLEET',
      empireId: 'player',
      fleetId: fleet.id,
    });
    expect(recalled.ok).toBe(true);
    if (!recalled.ok) return;
    const returnEvent = recalled.value.pendingEvents.find(
      (event) => event.payload.type === 'FLEET_RETURN',
    );
    expect(returnEvent).toBeDefined();
    if (returnEvent === undefined) return;

    const returned = executeGameCommand(recalled.value, {
      type: 'ADVANCE_TIME',
      seconds: returnEvent.executeAt - recalled.value.clock.elapsedSeconds,
    });
    expect(returned.ok).toBe(true);
    if (returned.ok) {
      expect(returned.value.fleets[0]).toMatchObject({
        status: 'stationed',
        location: { type: 'planet', planetId: origin.id },
      });
    }
  });

  it('recalls an outbound fleet based on elapsed travel time', () => {
    const initial = createTestFleet(withFleetShips(createInitialGameState('flight-recall')));
    const target = targetPlanet(initial);
    const fleet = initial.fleets[0]!;
    const estimate = estimateFlight(initial.galaxy, initial.planets, fleet, target.id);
    const sent = executeGameCommand(initial, {
      type: 'SEND_FLEET',
      empireId: 'player',
      fleetId: fleet.id,
      targetPlanetId: target.id,
    });
    expect(sent.ok).toBe(true);
    if (!sent.ok) return;

    const elapsed = Math.max(1, Math.floor(estimate.durationSeconds / 2));
    const halfway = executeGameCommand(sent.value, {
      type: 'ADVANCE_TIME',
      seconds: elapsed,
    });
    expect(halfway.ok).toBe(true);
    if (!halfway.ok) return;
    const recalled = executeGameCommand(halfway.value, {
      type: 'RECALL_FLEET',
      empireId: 'player',
      fleetId: fleet.id,
    });
    expect(recalled.ok).toBe(true);
    if (!recalled.ok) return;
    const returnEvent = recalled.value.pendingEvents.find(
      (event) => event.payload.type === 'FLEET_RETURN',
    );
    expect(returnEvent?.executeAt).toBe(recalled.value.clock.elapsedSeconds + elapsed);
    expect(
      recalled.value.pendingEvents.some(
        (event) => event.payload.type === 'FLEET_ARRIVE',
      ),
    ).toBe(false);
  });
});
