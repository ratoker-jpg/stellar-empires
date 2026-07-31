import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getBuildingDefinition } from '../../src/simulation/planet/buildingCatalog';
import {
  calculateBuildingCost,
  calculateBuildSeconds,
  getBuildingLevel,
} from '../../src/simulation/planet/buildingProgression';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState } from '../../src/simulation/types';

function getPlayerPlanet(state: GameState) {
  const planet = state.planets.find((candidate) => candidate.ownerEmpireId === 'player');

  if (planet === undefined) {
    throw new Error('Player planet was not created.');
  }

  return planet;
}

function queue(state: GameState, buildingId: string) {
  const planet = getPlayerPlanet(state);
  return executeCommand(state, {
    type: 'QUEUE_BUILDING',
    empireId: 'player',
    planetId: planet.id,
    buildingId,
  });
}

describe('building queue', () => {
  it('reserves resources and creates one completion event', () => {
    const state = createInitialGameState('queue-building');
    const planet = getPlayerPlanet(state);
    const definition = getBuildingDefinition('building.aegis.metal-bot-1');

    expect(definition).toBeDefined();

    if (definition === undefined) {
      return;
    }

    const cost = calculateBuildingCost(definition, 2, 'compressed-v1');
    const result = queue(state, definition.id);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    const updated = getPlayerPlanet(result.value);
    expect(updated.buildQueue).toHaveLength(1);
    expect(result.value.pendingEvents).toHaveLength(1);
    expect(updated.economy.resources.metal.amount).toBe(
      planet.economy.resources.metal.amount - cost.metal,
    );
    expect(updated.economy.resources.crystal.amount).toBe(
      planet.economy.resources.crystal.amount - cost.crystal,
    );
    expect(updated.economy.resources.gas.amount).toBe(
      planet.economy.resources.gas.amount - cost.gas,
    );
  });

  it('blocks a second order while the queue is occupied', () => {
    const first = queue(createInitialGameState('queue-busy'), 'building.aegis.metal-bot-1');
    expect(first.ok).toBe(true);

    if (!first.ok) {
      return;
    }

    const second = queue(first.value, 'building.aegis.infrared-bot');
    expect(second).toEqual(
      expect.objectContaining({ ok: false, code: 'BUILD_QUEUE_BUSY' }),
    );
  });

  it('completes an upgrade once and recalculates production at the event time', () => {
    const initial = createInitialGameState('queue-complete');
    const definition = getBuildingDefinition('building.aegis.metal-bot-1');

    expect(definition).toBeDefined();

    if (definition === undefined) {
      return;
    }

    const queued = queue(initial, definition.id);
    expect(queued.ok).toBe(true);

    if (!queued.ok) {
      return;
    }

    const duration = calculateBuildSeconds(definition, 2, 'compressed-v1');
    const advanced = executeCommand(queued.value, {
      type: 'ADVANCE_TIME',
      seconds: duration + 3_600,
    });

    expect(advanced.ok).toBe(true);

    if (!advanced.ok) {
      return;
    }

    const planet = getPlayerPlanet(advanced.value);
    expect(getBuildingLevel(planet.buildings, definition.id)).toBe(2);
    expect(planet.buildQueue).toHaveLength(0);
    expect(planet.economy.resources.metal.productionPerHour).toBe(1_548);
    expect(advanced.value.eventLog.filter((entry) => entry.event.payload.type === 'BUILDING_COMPLETE')).toHaveLength(1);

    const later = executeCommand(advanced.value, { type: 'ADVANCE_TIME', seconds: 3_600 });
    expect(later.ok).toBe(true);

    if (later.ok) {
      expect(getBuildingLevel(getPlayerPlanet(later.value).buildings, definition.id)).toBe(2);
    }
  });

  it('enforces building requirements', () => {
    const initial = createInitialGameState('queue-requirements');
    const blocked = queue(initial, 'building.aegis.metal-bot-2');

    expect(blocked).toEqual(
      expect.objectContaining({ ok: false, code: 'BUILDING_REQUIREMENTS_NOT_MET' }),
    );

    const prepared: GameState = {
      ...initial,
      planets: initial.planets.map((planet) =>
        planet.ownerEmpireId === 'player'
          ? {
              ...planet,
              buildings: planet.buildings.map((building) =>
                building.buildingId === 'building.aegis.metal-bot-1'
                  ? { ...building, level: 10 }
                  : building,
              ),
            }
          : planet,
      ),
    };

    expect(queue(prepared, 'building.aegis.metal-bot-2').ok).toBe(true);
  });

  it('cancels an order with a 75 percent refund', () => {
    const initial = createInitialGameState('queue-cancel');
    const queued = queue(initial, 'building.aegis.metal-bot-1');
    expect(queued.ok).toBe(true);

    if (!queued.ok) {
      return;
    }

    const queuedPlanet = getPlayerPlanet(queued.value);
    const item = queuedPlanet.buildQueue[0];
    expect(item).toBeDefined();

    if (item === undefined) {
      return;
    }

    const cancelled = executeCommand(queued.value, {
      type: 'CANCEL_BUILDING',
      empireId: 'player',
      planetId: queuedPlanet.id,
      queueItemId: item.id,
    });
    expect(cancelled.ok).toBe(true);

    if (!cancelled.ok) {
      return;
    }

    const planet = getPlayerPlanet(cancelled.value);
    expect(planet.buildQueue).toHaveLength(0);
    expect(cancelled.value.pendingEvents).toHaveLength(0);
    expect(planet.economy.resources.metal.amount).toBe(
      queuedPlanet.economy.resources.metal.amount + Math.floor(item.cost.metal * 0.75),
    );
  });

  it('rejects manually forged completion events', () => {
    const state = createInitialGameState('reserved-event');
    const result = executeCommand(state, {
      type: 'SCHEDULE_EVENT',
      executeAt: 10,
      payload: {
        type: 'BUILDING_COMPLETE',
        planetId: 'fake',
        queueItemId: 'fake',
        buildingId: 'building.aegis.metal-bot-1',
        targetLevel: 9,
      },
    });

    expect(result).toEqual(expect.objectContaining({ ok: false, code: 'RESERVED_EVENT_TYPE' }));
  });
});
