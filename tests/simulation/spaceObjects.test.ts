import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  getRequiredSpaceObjectShipId,
  type SpaceObjectKind,
} from '../../src/simulation/pve/spaceObjects';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState } from '../../src/simulation/types';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

function withSpaceObjectFleet(
  state: GameState,
  kind: SpaceObjectKind,
  fleetId = 'player-space-object',
): GameState {
  const origin = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
  const requiredShipId = getRequiredSpaceObjectShipId(kind);
  return {
    ...state,
    planets: state.planets.map((planet) =>
      planet.id === origin.id
        ? {
            ...planet,
            economy: {
              ...planet.economy,
              resources: {
                metal: { ...planet.economy.resources.metal, amount: 0, capacity: 1_000_000 },
                crystal: { ...planet.economy.resources.crystal, amount: 0, capacity: 1_000_000 },
                gas: { ...planet.economy.resources.gas, amount: 1_000_000, capacity: 1_000_000 },
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
        ships: { [requiredShipId]: 2 },
        cargo: { metal: 0, crystal: 0, gas: 0 },
        speed: 10,
        cargoCapacity: 2_000,
        mission: null,
      },
    ],
  };
}

function startMission(state: GameState, objectId: string, fleetId = 'player-space-object') {
  return executeCommand(state, {
    type: 'START_SPACE_OBJECT_MISSION',
    empireId: 'player',
    fleetId,
    objectId,
  });
}

describe('space objects', () => {
  it('generates deterministic asteroid, gas and anomaly objects', () => {
    const first = createInitialGameState('space-object-generation');
    const second = createInitialGameState('space-object-generation');
    expect(first.spaceObjects).toEqual(second.spaceObjects);
    expect(first.spaceObjects).toHaveLength(first.galaxy.systems.length);
    expect(new Set(first.spaceObjects.map((object) => object.kind))).toEqual(
      new Set(['asteroid', 'gas-cloud', 'anomaly']),
    );
    expect(first.spaceObjects.every((object) => object.remainingYield > 0)).toBe(true);
    expect(first.strategicResources).toEqual(
      first.empires.map((empireId) => ({ empireId, exoticMatter: 0 })),
    );
  });

  it('requires the specialist ship for each object kind', () => {
    const base = createInitialGameState('space-object-specialist');
    const asteroid = base.spaceObjects.find((object) => object.kind === 'asteroid')!;
    const state = withSpaceObjectFleet(base, 'anomaly', 'wrong-specialist');
    expect(startMission(state, asteroid.id, 'wrong-specialist')).toMatchObject({
      ok: false,
      code: 'SPACE_OBJECT_SPECIALIST_REQUIRED',
    });
  });

  it('resolves mining once, depletes the object and returns survivors', () => {
    const base = createInitialGameState('space-object-mining');
    const asteroid = base.spaceObjects.find((object) => object.kind === 'asteroid')!;
    const state = withSpaceObjectFleet(base, asteroid.kind);
    const started = startMission(state, asteroid.id);
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    const event = started.value.pendingEvents.find(
      (candidate) => candidate.payload.type === 'SPACE_OBJECT_MISSION_RESOLVE',
    );
    expect(event).toBeDefined();
    if (event === undefined || event.payload.type !== 'SPACE_OBJECT_MISSION_RESOLVE') return;
    const advanced = executeCommand(started.value, {
      type: 'ADVANCE_TIME',
      seconds: event.executeAt - started.value.clock.elapsedSeconds,
    });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) return;
    const updated = advanced.value.spaceObjects.find((object) => object.id === asteroid.id)!;
    expect(updated.remainingYield).toBeLessThan(asteroid.remainingYield);
    expect(updated.controllerEmpireId).toBe('player');
    expect(updated.controlExpiresAt).toBeGreaterThan(advanced.value.clock.elapsedSeconds);
    expect(
      advanced.value.eventLog.filter(
        (entry) => entry.event.payload.type === 'SPACE_OBJECT_MISSION_RESOLVE',
      ),
    ).toHaveLength(1);
    expect(advanced.value.fleets.find((fleet) => fleet.id === 'player-space-object')).toMatchObject({
      status: 'stationed',
      mission: null,
    });
    const origin = advanced.value.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    expect(origin.economy.resources.metal.amount + origin.economy.resources.crystal.amount).toBeGreaterThan(0);
  });

  it('extracts exotic matter from anomalies', () => {
    const base = createInitialGameState('space-object-anomaly');
    const anomaly = base.spaceObjects.find((object) => object.kind === 'anomaly')!;
    const state = withSpaceObjectFleet(base, anomaly.kind);
    const started = startMission(state, anomaly.id);
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    const event = started.value.pendingEvents.find(
      (candidate) => candidate.payload.type === 'SPACE_OBJECT_MISSION_RESOLVE',
    );
    if (event === undefined) throw new Error('Space object event missing.');
    const advanced = executeCommand(started.value, {
      type: 'ADVANCE_TIME',
      seconds: event.executeAt - started.value.clock.elapsedSeconds,
    });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) return;
    expect(
      advanced.value.strategicResources.find((entry) => entry.empireId === 'player')?.exoticMatter,
    ).toBeGreaterThan(0);
  });

  it('allows a later empire to contest temporary control', () => {
    const base = createInitialGameState('space-object-control');
    const asteroid = base.spaceObjects.find((object) => object.kind === 'asteroid')!;
    const controlled: GameState = {
      ...base,
      spaceObjects: base.spaceObjects.map((object) =>
        object.id === asteroid.id
          ? {
              ...object,
              controllerEmpireId: 'aegis-bot',
              controlExpiresAt: base.clock.elapsedSeconds + 10_000,
            }
          : object,
      ),
    };
    const state = withSpaceObjectFleet(controlled, asteroid.kind);
    const started = startMission(state, asteroid.id);
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    const event = started.value.pendingEvents.find(
      (candidate) => candidate.payload.type === 'SPACE_OBJECT_MISSION_RESOLVE',
    );
    if (event === undefined) throw new Error('Space object event missing.');
    const advanced = executeCommand(started.value, {
      type: 'ADVANCE_TIME',
      seconds: event.executeAt - started.value.clock.elapsedSeconds,
    });
    expect(advanced.ok).toBe(true);
    if (advanced.ok) {
      expect(
        advanced.value.spaceObjects.find((object) => object.id === asteroid.id)?.controllerEmpireId,
      ).toBe('player');
    }
  });

  it('recall cancels the object operation and schedules a normal return', () => {
    const base = createInitialGameState('space-object-recall');
    const gas = base.spaceObjects.find((object) => object.kind === 'gas-cloud')!;
    const state = withSpaceObjectFleet(base, gas.kind);
    const started = startMission(state, gas.id);
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    const recalled = executeCommand(started.value, {
      type: 'RECALL_FLEET',
      empireId: 'player',
      fleetId: 'player-space-object',
    });
    expect(recalled.ok).toBe(true);
    if (!recalled.ok) return;
    expect(
      recalled.value.pendingEvents.some(
        (event) => event.payload.type === 'SPACE_OBJECT_MISSION_RESOLVE',
      ),
    ).toBe(false);
    expect(
      recalled.value.pendingEvents.some((event) => event.payload.type === 'FLEET_RETURN'),
    ).toBe(true);
  });

  it('round-trips missions and additively migrates old schema-v12 states', () => {
    const base = createInitialGameState('space-object-save');
    const gas = base.spaceObjects.find((object) => object.kind === 'gas-cloud')!;
    const state = withSpaceObjectFleet(base, gas.kind);
    const started = startMission(state, gas.id);
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    const save = createSaveEnvelope('space-object', started.value, '2026-07-20T10:00:00.000Z');
    const parsed = parseSaveJson(serializeSave(save));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.state.spaceObjects).toEqual(started.value.spaceObjects);
      expect(parsed.value.state.fleets).toEqual(started.value.fleets);
    }

    const { spaceObjects: _spaceObjects, strategicResources: _strategicResources, ...legacy } = base;
    const legacySave = createSaveEnvelope(
      'legacy-space-object',
      legacy as GameState,
      '2026-07-20T10:05:00.000Z',
    );
    const migrated = parseSaveJson(serializeSave(legacySave));
    expect(migrated.ok).toBe(true);
    if (migrated.ok) {
      expect(migrated.value.state.spaceObjects).toHaveLength(base.galaxy.systems.length);
      expect(migrated.value.state.strategicResources).toHaveLength(base.empires.length);
    }
  });
});
