import { describe, expect, it } from 'vitest';
import {
  calculateDebrisFromLosses,
  collectDebris,
} from '../../src/simulation/combat/debris';
import { resolveAttackMission } from '../../src/simulation/combat/resolveAttackMission';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeGameCommand } from '../../src/simulation/executeGameCommand';
import { estimateFlight } from '../../src/simulation/fleets/flightCalculations';
import type { FleetState } from '../../src/simulation/fleets/types';
import type { GameState } from '../../src/simulation/types';

function playerPlanet(state: GameState) {
  const planet = state.planets.find((candidate) => candidate.ownerEmpireId === 'player');
  if (planet === undefined) throw new Error('Player planet missing.');
  return planet;
}

function enemyPlanet(state: GameState) {
  const planet = state.planets.find((candidate) => candidate.ownerEmpireId !== 'player');
  if (planet === undefined) throw new Error('Enemy planet missing.');
  return planet;
}

function withHighFuel(state: GameState): GameState {
  const origin = playerPlanet(state);
  return {
    ...state,
    planets: state.planets.map((planet) =>
      planet.id === origin.id
        ? {
            ...planet,
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
  };
}

describe('debris and recycling', () => {
  it('converts destroyed unit costs into deterministic metal and crystal debris', () => {
    expect(
      calculateDebrisFromLosses(
        { 'ship.aegis.fighter': 2 },
        {},
        { 'defense.aegis.gun-battery': 1 },
        {},
      ),
    ).toEqual({ metal: 462, crystal: 318 });
  });

  it('creates a debris field and bounded plunder in a resolved attack', () => {
    const state = createInitialGameState('battle-salvage');
    const target = enemyPlanet(state);
    const attacker: FleetState = {
      id: 'salvage-attacker',
      empireId: 'player',
      originPlanetId: playerPlanet(state).id,
      location: { type: 'planet', planetId: target.id },
      status: 'stationed',
      ships: { 'ship.aegis.frigate': 20 },
      cargo: { metal: 0, crystal: 0, gas: 0 },
      speed: 9,
      cargoCapacity: 2_400,
      mission: { kind: 'attack', targetPlanetId: target.id },
    };
    const prepared: GameState = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.id === target.id
          ? {
              ...planet,
              inventory: {
                ...planet.inventory,
                defenses: { 'defense.aegis.gun-battery': 4 },
              },
            }
          : planet,
      ),
      fleets: [attacker],
    };
    const targetBefore = enemyPlanet(prepared);
    const result = resolveAttackMission(prepared, attacker, targetBefore, 3);

    expect(result.report.debrisCreated?.metal).toBeGreaterThan(0);
    expect(result.state.debrisFields[0]).toMatchObject({
      planetId: target.id,
      metal: result.report.debrisCreated?.metal,
      crystal: result.report.debrisCreated?.crystal,
    });
    const plunder = result.report.plunderedCargo!;
    const plunderedTotal = plunder.metal + plunder.crystal + plunder.gas;
    expect(plunderedTotal).toBeLessThanOrEqual(attacker.cargoCapacity);
    const targetAfter = result.state.planets.find((planet) => planet.id === target.id)!;
    expect(targetBefore.economy.resources.metal.amount - targetAfter.economy.resources.metal.amount)
      .toBe(plunder.metal);
  });

  it('collects debris up to free cargo capacity and leaves the remainder', () => {
    const fleet: FleetState = {
      id: 'recycler',
      empireId: 'player',
      originPlanetId: 'p1',
      location: { type: 'planet', planetId: 'p2' },
      status: 'stationed',
      ships: { 'ship.aegis.recycler': 1 },
      cargo: { metal: 100, crystal: 0, gas: 0 },
      speed: 8,
      cargoCapacity: 800,
      mission: { kind: 'recycle', targetPlanetId: 'p2' },
    };
    const result = collectDebris(
      [{ id: 'debris-p2', planetId: 'p2', metal: 600, crystal: 400, createdAt: 0 }],
      'p2',
      fleet,
    );
    expect(result.collected).toEqual({ metal: 600, crystal: 100 });
    expect(result.fleet.cargo).toEqual({ metal: 700, crystal: 100, gas: 0 });
    expect(result.fields[0]).toMatchObject({ metal: 0, crystal: 300 });
  });

  it('runs a recycling mission and returns the collected cargo', () => {
    let state = withHighFuel(createInitialGameState('recycle-mission'));
    const origin = playerPlanet(state);
    const target = enemyPlanet(state);
    state = {
      ...state,
      debrisFields: [
        {
          id: `debris-${target.id}`,
          planetId: target.id,
          metal: 500,
          crystal: 250,
          createdAt: 0,
        },
      ],
      planets: state.planets.map((planet) =>
        planet.id === origin.id
          ? {
              ...planet,
              inventory: {
                ...planet.inventory,
                ships: { 'ship.aegis.recycler': 1 },
              },
            }
          : planet,
      ),
    };
    const created = executeGameCommand(state, {
      type: 'CREATE_FLEET',
      empireId: 'player',
      planetId: origin.id,
      ships: { 'ship.aegis.recycler': 1 },
      cargo: { metal: 0, crystal: 0, gas: 0 },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const fleet = created.value.fleets[0]!;
    const estimate = estimateFlight(
      created.value.galaxy,
      created.value.planets,
      fleet,
      target.id,
    );
    const sent = executeGameCommand(created.value, {
      type: 'SEND_FLEET',
      empireId: 'player',
      fleetId: fleet.id,
      targetPlanetId: target.id,
      mission: 'recycle',
    });
    expect(sent.ok).toBe(true);
    if (!sent.ok) return;
    const arrived = executeGameCommand(sent.value, {
      type: 'ADVANCE_TIME',
      seconds: estimate.durationSeconds,
    });
    expect(arrived.ok).toBe(true);
    if (!arrived.ok) return;
    expect(arrived.value.fleets[0]).toMatchObject({
      status: 'returning',
      cargo: { metal: 500, crystal: 250, gas: 0 },
    });
    expect(arrived.value.debrisFields).toEqual([]);
  });
});
