import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeGameCommand } from '../../src/simulation/executeGameCommand';
import { estimateFlight } from '../../src/simulation/fleets/flightCalculations';
import type { GameState } from '../../src/simulation/types';

function prepareState(seed: string): GameState {
  const state = createInitialGameState(seed);
  const origin = state.planets.find((planet) => planet.ownerEmpireId === 'player');
  const target = state.planets.find((planet) => planet.id !== origin?.id);
  if (origin === undefined || target === undefined) throw new Error('Test planets missing.');
  return {
    ...state,
    planets: state.planets.map((planet) => {
      if (planet.id === origin.id) {
        return {
          ...planet,
          inventory: {
            ...planet.inventory,
            ships: { 'ship.aegis.scout': 2, 'ship.aegis.cargo': 2 },
          },
        };
      }
      return planet.id === target.id
        ? { ...planet, ownerEmpireId: 'player', factionId: 'aegis' as const }
        : planet;
    }),
  };
}

function playerPlanets(state: GameState) {
  return state.planets.filter((planet) => planet.ownerEmpireId === 'player');
}

function createFleet(state: GameState): GameState {
  const origin = playerPlanets(state)[0]!;
  const result = executeGameCommand(state, {
    type: 'CREATE_FLEET',
    empireId: 'player',
    planetId: origin.id,
    ships: { 'ship.aegis.scout': 1, 'ship.aegis.cargo': 1 },
    cargo: { metal: 200, crystal: 100, gas: 40 },
  });
  if (!result.ok) throw new Error(result.code);
  return result.value;
}

describe('transport and deploy missions', () => {
  it('unloads transport cargo deterministically and returns home', () => {
    const initial = createFleet(prepareState('transport'));
    const [origin, target] = playerPlanets(initial);
    const fleet = initial.fleets[0]!;
    const targetMetal = target!.economy.resources.metal.amount;
    const estimate = estimateFlight(initial.galaxy, initial.planets, fleet, target!.id);

    const sent = executeGameCommand(initial, {
      type: 'SEND_FLEET',
      empireId: 'player',
      fleetId: fleet.id,
      targetPlanetId: target!.id,
      mission: 'transport',
    });
    expect(sent.ok).toBe(true);
    if (!sent.ok) return;

    const arrived = executeGameCommand(sent.value, {
      type: 'ADVANCE_TIME',
      seconds: estimate.durationSeconds,
    });
    expect(arrived.ok).toBe(true);
    if (!arrived.ok) return;
    expect(arrived.value.fleets[0]?.status).toBe('returning');
    expect(
      arrived.value.planets.find((planet) => planet.id === target!.id)?.economy.resources.metal.amount,
    ).toBe(targetMetal + 200);

    const returnEvent = arrived.value.pendingEvents.find(
      (event) => event.payload.type === 'FLEET_RETURN',
    );
    expect(returnEvent).toBeDefined();
    if (returnEvent === undefined) return;
    const returned = executeGameCommand(arrived.value, {
      type: 'ADVANCE_TIME',
      seconds: returnEvent.executeAt - arrived.value.clock.elapsedSeconds,
    });
    expect(returned.ok).toBe(true);
    if (returned.ok) {
      expect(returned.value.fleets[0]).toMatchObject({
        status: 'stationed',
        location: { type: 'planet', planetId: origin!.id },
        cargo: { metal: 0, crystal: 0, gas: 0 },
      });
    }
  });

  it('deploys a fleet and changes its home planet', () => {
    const initial = createFleet(prepareState('deploy'));
    const target = playerPlanets(initial)[1]!;
    const fleet = initial.fleets[0]!;
    const estimate = estimateFlight(initial.galaxy, initial.planets, fleet, target.id);
    const sent = executeGameCommand(initial, {
      type: 'SEND_FLEET',
      empireId: 'player',
      fleetId: fleet.id,
      targetPlanetId: target.id,
      mission: 'deploy',
    });
    expect(sent.ok).toBe(true);
    if (!sent.ok) return;
    const arrived = executeGameCommand(sent.value, {
      type: 'ADVANCE_TIME',
      seconds: estimate.durationSeconds,
    });
    expect(arrived.ok).toBe(true);
    if (arrived.ok) {
      expect(arrived.value.fleets[0]).toMatchObject({
        originPlanetId: target.id,
        status: 'stationed',
        location: { type: 'planet', planetId: target.id },
        mission: null,
      });
    }
  });

  it('returns automatically when the target is lost before arrival', () => {
    const initial = createFleet(prepareState('lost-target'));
    const target = playerPlanets(initial)[1]!;
    const fleet = initial.fleets[0]!;
    const estimate = estimateFlight(initial.galaxy, initial.planets, fleet, target.id);
    const sent = executeGameCommand(initial, {
      type: 'SEND_FLEET',
      empireId: 'player',
      fleetId: fleet.id,
      targetPlanetId: target.id,
      mission: 'deploy',
    });
    expect(sent.ok).toBe(true);
    if (!sent.ok) return;
    const lost = {
      ...sent.value,
      planets: sent.value.planets.map((planet) =>
        planet.id === target.id ? { ...planet, ownerEmpireId: 'aegis-bot' } : planet,
      ),
    };
    const arrived = executeGameCommand(lost, {
      type: 'ADVANCE_TIME',
      seconds: estimate.durationSeconds,
    });
    expect(arrived.ok).toBe(true);
    if (arrived.ok) {
      expect(arrived.value.fleets[0]?.status).toBe('returning');
      expect(
        arrived.value.pendingEvents.some((event) => event.payload.type === 'FLEET_RETURN'),
      ).toBe(true);
    }
  });

  it('recalls an outbound fleet using elapsed travel time', () => {
    const initial = createFleet(prepareState('recall'));
    const target = playerPlanets(initial)[1]!;
    const fleet = initial.fleets[0]!;
    const estimate = estimateFlight(initial.galaxy, initial.planets, fleet, target.id);
    const sent = executeGameCommand(initial, {
      type: 'SEND_FLEET',
      empireId: 'player',
      fleetId: fleet.id,
      targetPlanetId: target.id,
      mission: 'transport',
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
    if (recalled.ok) {
      const returnEvent = recalled.value.pendingEvents.find(
        (event) => event.payload.type === 'FLEET_RETURN',
      );
      expect(returnEvent?.executeAt).toBe(recalled.value.clock.elapsedSeconds + elapsed);
    }
  });
});
