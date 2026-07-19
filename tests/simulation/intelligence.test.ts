import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeGameCommand } from '../../src/simulation/executeGameCommand';
import { estimateFlight } from '../../src/simulation/fleets/flightCalculations';
import { getCurrentObservations } from '../../src/simulation/intelligence/intelligenceState';
import { resolveScoutArrival } from '../../src/simulation/intelligence/resolveScout';
import type { GameState } from '../../src/simulation/types';

function prepareScoutState(seed: string): GameState {
  const state = createInitialGameState(seed);
  const origin = state.planets.find((planet) => planet.ownerEmpireId === 'player');
  if (origin === undefined) throw new Error('Player planet missing.');
  return {
    ...state,
    planets: state.planets.map((planet) =>
      planet.id === origin.id
        ? {
            ...planet,
            inventory: {
              ...planet.inventory,
              ships: { 'ship.aegis.scout': 2, 'ship.aegis.cargo': 1 },
            },
            economy: {
              ...planet.economy,
              resources: {
                ...planet.economy.resources,
                gas: {
                  ...planet.economy.resources.gas,
                  amount: 100_000,
                  capacity: 100_000,
                },
              },
            },
          }
        : planet,
    ),
    research: state.research.map((research) =>
      research.empireId === 'player'
        ? {
            ...research,
            levels: {
              ...research.levels,
              'technology.aegis.sensors': 4,
            },
          }
        : research,
    ),
  };
}

function createScoutFleet(state: GameState): GameState {
  const origin = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
  const created = executeGameCommand(state, {
    type: 'CREATE_FLEET',
    empireId: 'player',
    planetId: origin.id,
    ships: { 'ship.aegis.scout': 1 },
    cargo: { metal: 0, crystal: 0, gas: 0 },
  });
  if (!created.ok) throw new Error(created.code);
  return created.value;
}

describe('intelligence and counter-intelligence', () => {
  it('scouts an enemy planet, stores a level-three snapshot and returns', () => {
    const initial = createScoutFleet(prepareScoutState('scout-mission'));
    const fleet = initial.fleets[0]!;
    const target = initial.planets.find(
      (planet) => planet.ownerEmpireId !== 'player',
    )!;
    const estimate = estimateFlight(initial.galaxy, initial.planets, fleet, target.id);
    const sent = executeGameCommand(initial, {
      type: 'SEND_FLEET',
      empireId: 'player',
      fleetId: fleet.id,
      targetPlanetId: target.id,
      mission: 'scout',
    });
    expect(sent.ok).toBe(true);
    if (!sent.ok) return;

    const arrived = executeGameCommand(sent.value, {
      type: 'ADVANCE_TIME',
      seconds: estimate.durationSeconds,
    });
    expect(arrived.ok).toBe(true);
    if (!arrived.ok) return;

    const playerIntel = arrived.value.intelligence.find(
      (entry) => entry.empireId === 'player',
    )!;
    const observation = playerIntel.observations[0];
    expect(observation).toMatchObject({
      targetPlanetId: target.id,
      snapshot: { level: 3, ownerEmpireId: target.ownerEmpireId },
    });
    expect(observation?.snapshot.resources).toBeDefined();
    expect(observation?.snapshot.defenses).toBeDefined();
    expect(arrived.value.fleets[0]?.status).toBe('returning');
  });

  it('rejects scouting without a scout ship', () => {
    const state = prepareScoutState('missing-scout');
    const origin = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    const created = executeGameCommand(state, {
      type: 'CREATE_FLEET',
      empireId: 'player',
      planetId: origin.id,
      ships: { 'ship.aegis.cargo': 1 },
      cargo: { metal: 0, crystal: 0, gas: 0 },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const target = state.planets.find((planet) => planet.ownerEmpireId !== 'player')!;
    expect(
      executeGameCommand(created.value, {
        type: 'SEND_FLEET',
        empireId: 'player',
        fleetId: created.value.fleets[0]!.id,
        targetPlanetId: target.id,
        mission: 'scout',
      }),
    ).toMatchObject({ ok: false, code: 'SCOUT_SHIP_REQUIRED' });
  });

  it('produces deterministic detection and defender alerts', () => {
    const state = createScoutFleet(prepareScoutState('counter-intel'));
    const fleet = state.fleets[0]!;
    const target = state.planets.find((planet) => planet.ownerEmpireId !== 'player')!;
    let detected: GameState | undefined;

    for (let sequence = 0; sequence < 50; sequence += 1) {
      const result = resolveScoutArrival(state, fleet, target, sequence);
      const observation = result.intelligence
        .find((entry) => entry.empireId === 'player')
        ?.observations[0];
      if (observation?.detected) {
        detected = result;
        break;
      }
    }

    expect(detected).toBeDefined();
    if (detected === undefined) return;
    expect(
      detected.intelligence.find(
        (entry) => entry.empireId === target.ownerEmpireId,
      )?.alerts,
    ).toHaveLength(1);
  });

  it('filters stale observations without mutating saved history', () => {
    const state = createScoutFleet(prepareScoutState('intel-staleness'));
    const fleet = state.fleets[0]!;
    const target = state.planets.find((planet) => planet.ownerEmpireId !== 'player')!;
    const observed = resolveScoutArrival(state, fleet, target, 7);
    const intelligence = observed.intelligence.find(
      (entry) => entry.empireId === 'player',
    )!;
    const expiresAt = intelligence.observations[0]!.expiresAt;

    expect(getCurrentObservations(intelligence, expiresAt - 1)).toHaveLength(1);
    expect(getCurrentObservations(intelligence, expiresAt)).toHaveLength(0);
    expect(intelligence.observations).toHaveLength(1);
  });
});
