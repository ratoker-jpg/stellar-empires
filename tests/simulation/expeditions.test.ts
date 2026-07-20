import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState } from '../../src/simulation/types';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

function withExpeditionFleet(
  state: GameState,
  fleetId = 'player-expedition',
  scoutCount = 2,
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
        id: fleetId,
        empireId: 'player',
        originPlanetId: origin.id,
        location: { type: 'planet' as const, planetId: origin.id },
        status: 'stationed' as const,
        ships: { 'ship.aegis.scout': scoutCount },
        cargo: { metal: 0, crystal: 0, gas: 0 },
        speed: 14,
        cargoCapacity: 20 * scoutCount,
        mission: null,
      },
    ],
  };
}

function firstExpeditionTarget(state: GameState): string {
  const occupied = new Set(state.planets.map((planet) => planet.galaxyPlanetId));
  const target = state.galaxy.systems
    .flatMap((system) => system.planets)
    .find((planet) => !occupied.has(planet.id));
  if (target === undefined) throw new Error('Expedition target missing.');
  return target.id;
}

describe('expeditions and deterministic space events', () => {
  it('starts a round-trip expedition through a dedicated command', () => {
    const state = withExpeditionFleet(createInitialGameState('expedition-start'));
    const target = firstExpeditionTarget(state);
    const origin = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    const beforeGas = origin.economy.resources.gas.amount;
    const started = executeCommand(state, {
      type: 'START_EXPEDITION',
      empireId: 'player',
      fleetId: 'player-expedition',
      targetGalaxyPlanetId: target,
    });
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    const fleet = started.value.fleets.find((candidate) => candidate.id === 'player-expedition');
    expect(fleet).toMatchObject({
      status: 'outbound',
      mission: { kind: 'expedition', targetPlanetId: target },
      location: { type: 'transit', toPlanetId: target },
    });
    const event = started.value.pendingEvents.find(
      (candidate) => candidate.payload.type === 'EXPEDITION_RESOLVE',
    );
    expect(event?.payload).toMatchObject({
      type: 'EXPEDITION_RESOLVE',
      report: {
        empireId: 'player',
        fleetId: 'player-expedition',
        targetGalaxyPlanetId: target,
      },
    });
    expect(
      started.value.planets.find((planet) => planet.id === origin.id)?.economy.resources.gas.amount,
    ).toBeLessThan(beforeGas);
  });

  it('creates the same report for identical seed, state and command', () => {
    const first = withExpeditionFleet(createInitialGameState('expedition-determinism'));
    const second = withExpeditionFleet(createInitialGameState('expedition-determinism'));
    const target = firstExpeditionTarget(first);
    const command = {
      type: 'START_EXPEDITION' as const,
      empireId: 'player',
      fleetId: 'player-expedition',
      targetGalaxyPlanetId: target,
    };
    const firstResult = executeCommand(first, command);
    const secondResult = executeCommand(second, command);
    expect(firstResult.ok).toBe(true);
    expect(secondResult.ok).toBe(true);
    if (!firstResult.ok || !secondResult.ok) return;
    expect(
      firstResult.value.pendingEvents.find(
        (event) => event.payload.type === 'EXPEDITION_RESOLVE',
      ),
    ).toEqual(
      secondResult.value.pendingEvents.find(
        (event) => event.payload.type === 'EXPEDITION_RESOLVE',
      ),
    );
  });

  it('resolves once, returns survivors and records the event report', () => {
    const state = withExpeditionFleet(createInitialGameState('expedition-resolve'));
    const target = firstExpeditionTarget(state);
    const started = executeCommand(state, {
      type: 'START_EXPEDITION',
      empireId: 'player',
      fleetId: 'player-expedition',
      targetGalaxyPlanetId: target,
    });
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    const event = started.value.pendingEvents.find(
      (candidate) => candidate.payload.type === 'EXPEDITION_RESOLVE',
    );
    expect(event).toBeDefined();
    if (event === undefined || event.payload.type !== 'EXPEDITION_RESOLVE') return;
    const advanced = executeCommand(started.value, {
      type: 'ADVANCE_TIME',
      seconds: event.executeAt - started.value.clock.elapsedSeconds,
    });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) return;
    expect(
      advanced.value.pendingEvents.some(
        (candidate) => candidate.payload.type === 'EXPEDITION_RESOLVE',
      ),
    ).toBe(false);
    expect(
      advanced.value.eventLog.filter(
        (entry) => entry.event.payload.type === 'EXPEDITION_RESOLVE',
      ),
    ).toHaveLength(1);
    const fleet = advanced.value.fleets.find((candidate) => candidate.id === 'player-expedition');
    expect(fleet).toMatchObject({
      status: 'stationed',
      mission: null,
      location: { type: 'planet', planetId: event.payload.report.originPlanetId },
    });

    const secondAdvance = executeCommand(advanced.value, { type: 'ADVANCE_TIME', seconds: 1 });
    expect(secondAdvance.ok).toBe(true);
    if (secondAdvance.ok) {
      expect(
        secondAdvance.value.eventLog.filter(
          (entry) => entry.event.payload.type === 'EXPEDITION_RESOLVE',
        ),
      ).toHaveLength(1);
    }
  });

  it('rejects missing scouts, occupied targets and insufficient fuel', () => {
    const noScout = withExpeditionFleet(
      createInitialGameState('expedition-reject-scout'),
      'no-scout',
      0,
    );
    const openTarget = firstExpeditionTarget(noScout);
    expect(
      executeCommand(noScout, {
        type: 'START_EXPEDITION',
        empireId: 'player',
        fleetId: 'no-scout',
        targetGalaxyPlanetId: openTarget,
      }),
    ).toMatchObject({ ok: false, code: 'EXPEDITION_SCOUT_REQUIRED' });

    const state = withExpeditionFleet(createInitialGameState('expedition-reject-target'));
    const occupied = state.planets.find((planet) => planet.ownerEmpireId === 'aegis-bot')!;
    expect(
      executeCommand(state, {
        type: 'START_EXPEDITION',
        empireId: 'player',
        fleetId: 'player-expedition',
        targetGalaxyPlanetId: occupied.galaxyPlanetId,
      }),
    ).toMatchObject({ ok: false, code: 'EXPEDITION_TARGET_OCCUPIED' });

    const origin = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    const noFuel = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.id === origin.id
          ? {
              ...planet,
              economy: {
                ...planet.economy,
                resources: {
                  ...planet.economy.resources,
                  gas: { ...planet.economy.resources.gas, amount: 0 },
                },
              },
            }
          : planet,
      ),
    };
    expect(
      executeCommand(noFuel, {
        type: 'START_EXPEDITION',
        empireId: 'player',
        fleetId: 'player-expedition',
        targetGalaxyPlanetId: firstExpeditionTarget(noFuel),
      }),
    ).toMatchObject({ ok: false, code: 'INSUFFICIENT_EXPEDITION_FUEL' });
  });

  it('requires the dedicated command instead of SEND_FLEET expedition', () => {
    const state = withExpeditionFleet(createInitialGameState('expedition-guard'));
    expect(
      executeCommand(state, {
        type: 'SEND_FLEET',
        empireId: 'player',
        fleetId: 'player-expedition',
        targetPlanetId: state.planets.find((planet) => planet.ownerEmpireId === 'aegis-bot')!.id,
        mission: 'expedition',
      }),
    ).toMatchObject({ ok: false, code: 'EXPEDITION_COMMAND_REQUIRED' });
  });

  it('recall cancels the expedition event and schedules a normal return', () => {
    const state = withExpeditionFleet(createInitialGameState('expedition-recall'));
    const started = executeCommand(state, {
      type: 'START_EXPEDITION',
      empireId: 'player',
      fleetId: 'player-expedition',
      targetGalaxyPlanetId: firstExpeditionTarget(state),
    });
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    const recalled = executeCommand(started.value, {
      type: 'RECALL_FLEET',
      empireId: 'player',
      fleetId: 'player-expedition',
    });
    expect(recalled.ok).toBe(true);
    if (!recalled.ok) return;
    expect(
      recalled.value.pendingEvents.some(
        (event) => event.payload.type === 'EXPEDITION_RESOLVE',
      ),
    ).toBe(false);
    expect(
      recalled.value.pendingEvents.some(
        (event) => event.payload.type === 'FLEET_RETURN',
      ),
    ).toBe(true);
    expect(recalled.value.fleets.find((fleet) => fleet.id === 'player-expedition')).toMatchObject({
      status: 'returning',
    });
  });

  it('round-trips a pending expedition through the current save format', () => {
    const state = withExpeditionFleet(createInitialGameState('expedition-save'));
    const started = executeCommand(state, {
      type: 'START_EXPEDITION',
      empireId: 'player',
      fleetId: 'player-expedition',
      targetGalaxyPlanetId: firstExpeditionTarget(state),
    });
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    const save = createSaveEnvelope(
      'expedition',
      started.value,
      '2026-07-20T09:00:00.000Z',
    );
    expect(parseSaveJson(serializeSave(save))).toEqual({ ok: true, value: save });
  });
});
