import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  DEFAULT_PIRATE_BASE_COUNT,
  PIRATE_EMPIRE_ID,
  isPiratePlanet,
} from '../../src/simulation/pve/neutralForces';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState } from '../../src/simulation/types';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

const ZERO_CARGO = { metal: 0, crystal: 0, gas: 0 } as const;

function addPlayerFleet(
  state: GameState,
  id: string,
  ships: Readonly<Record<string, number>>,
): GameState {
  const origin = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
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
                  amount: 1_000_000,
                  capacity: 1_000_000,
                },
              },
            },
          }
        : planet,
    ),
    fleets: [
      ...state.fleets,
      {
        id,
        empireId: 'player',
        originPlanetId: origin.id,
        location: { type: 'planet' as const, planetId: origin.id },
        status: 'stationed' as const,
        ships,
        cargo: ZERO_CARGO,
        speed: 13,
        cargoCapacity: 120,
        mission: null,
      },
    ],
  };
}

describe('neutral pirate bases', () => {
  it('generates deterministic occupied non-gas positions for new games', () => {
    const first = createInitialGameState('neutral-pirates');
    const second = createInitialGameState('neutral-pirates');
    const pirates = first.planets.filter(isPiratePlanet);
    expect(pirates).toHaveLength(DEFAULT_PIRATE_BASE_COUNT);
    expect(second.planets.filter(isPiratePlanet)).toEqual(pirates);
    expect(
      pirates.every((base) => {
        const galaxyPlanet = first.galaxy.systems
          .flatMap((system) => system.planets)
          .find((planet) => planet.id === base.galaxyPlanetId);
        return galaxyPlanet?.ownerEmpireId === null && galaxyPlanet.biome !== 'gas';
      }),
    ).toBe(true);
    expect(new Set(pirates.map((base) => base.galaxyPlanetId)).size).toBe(pirates.length);
  });

  it('keeps pirates outside managed empire, research and scheduler collections', () => {
    const state = createInitialGameState('neutral-pirate-isolation');
    expect(state.empires).not.toContain(PIRATE_EMPIRE_ID);
    expect(state.research.some((entry) => entry.empireId === PIRATE_EMPIRE_ID)).toBe(false);
    expect(state.intelligence.some((entry) => entry.empireId === PIRATE_EMPIRE_ID)).toBe(false);
    expect(state.fleets).toEqual([]);
    expect(
      state.planets.filter(isPiratePlanet).every(
        (base) => Object.values(base.inventory.defenses).reduce((sum, count) => sum + count, 0) > 0,
      ),
    ).toBe(true);
  });

  it('reveals a pirate owner through the normal scout mission', () => {
    const state = addPlayerFleet(
      createInitialGameState('neutral-pirate-scout'),
      'player-pirate-scout',
      { 'ship.aegis.scout': 1 },
    );
    const target = state.planets.find(isPiratePlanet)!;
    const sent = executeCommand(state, {
      type: 'SEND_FLEET',
      empireId: 'player',
      fleetId: 'player-pirate-scout',
      targetPlanetId: target.id,
      mission: 'scout',
    });
    expect(sent.ok).toBe(true);
    if (!sent.ok) return;
    const arrival = sent.value.pendingEvents.find(
      (event) =>
        event.payload.type === 'FLEET_ARRIVE' &&
        event.payload.fleetId === 'player-pirate-scout',
    );
    expect(arrival).toBeDefined();
    if (arrival === undefined) return;
    const advanced = executeCommand(sent.value, {
      type: 'ADVANCE_TIME',
      seconds: arrival.executeAt - sent.value.clock.elapsedSeconds,
    });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) return;
    const observation = advanced.value.intelligence
      .find((entry) => entry.empireId === 'player')
      ?.observations.find((entry) => entry.targetPlanetId === target.id);
    expect(observation?.snapshot.ownerEmpireId).toBe(PIRATE_EMPIRE_ID);
  });

  it('accepts a pirate base as a normal attack target', () => {
    const state = addPlayerFleet(
      createInitialGameState('neutral-pirate-attack'),
      'player-pirate-strike',
      { 'ship.aegis.fighter': 3 },
    );
    const target = state.planets.find(isPiratePlanet)!;
    const sent = executeCommand(state, {
      type: 'SEND_FLEET',
      empireId: 'player',
      fleetId: 'player-pirate-strike',
      targetPlanetId: target.id,
      mission: 'attack',
    });
    expect(sent.ok).toBe(true);
    if (sent.ok) {
      expect(sent.value.fleets.find((fleet) => fleet.id === 'player-pirate-strike')).toMatchObject({
        status: 'outbound',
        mission: { kind: 'attack', targetPlanetId: target.id },
      });
    }
  });

  it('round-trips pirate bases through the current save format', () => {
    const state = createInitialGameState('neutral-pirate-save');
    const save = createSaveEnvelope('pirates', state, '2026-07-20T07:00:00.000Z');
    const parsed = parseSaveJson(serializeSave(save));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.state.planets.filter(isPiratePlanet)).toEqual(
        state.planets.filter(isPiratePlanet),
      );
    }
  });
});
