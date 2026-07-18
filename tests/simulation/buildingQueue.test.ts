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
    const definition = getBuildingDefinition('building.aegis.command');

    expect(definition).toBeDefined();

    if (definition === undefined) {
      return;
    }

    const cost = calculateBuildingCost(definition, 2);
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
    const first = queue(createInitialGameState('queue-busy'), 'building.aegis.command');
    expect(first.ok).toBe(true);

    if (!first.ok) {
      return;
    }

    const second = queue(first.value, 'building.aegis.power-plant');
    expect(second).toEqual(
      expect.objectContaining({ ok: false, code: 'BUILD_QUEUE_BUSY' }),
    );
  });

  it('completes an upgrade once and recalculates production at the event time', () => {
    const initial = createInitialGameState('queue-complete');
    const definition = getBuildingDefinition('building.aegis.metal-extractor');

    expect(definition).toBeDefined();

    if (definition === undefined) {
      return;
    }

    const queued = queue(initial, definition.id);
    expect(queued.ok).toBe(true);

    if (!queued.ok) {
      return;
    }

    const duration = calculateBuildSeconds(definition, 2);
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
    expect(planet.economy.resources.metal.productionPerHour).toBe(280);
    expect(advanced.value.eventLog.filter((entry) => entry.event.payload.type === 'BUILDING_COMPLETE')).toHaveLength(1);

    const later = executeCommand(advanced.value, { type: 'ADVANCE_TIME', seconds: 3_600 });
    expect(later.ok).toBe(true);

    if (later.ok) {
      expect(getBuildingLevel(getPlayerPlanet(later.value).buildings, definition.id)).toBe(2);
    }
  });

  it('enforces building requirements', () => {
    const initial = createInitialGameState('queue-requirements');
    const blocked = queue(initial, 'building.aegis.research-lab');

    expect(blocked).toEqual(
      expect.objectContaining({ ok: false, code: 'BUILDING_REQUIREMENTS_NOT_MET' }),
    );

    const commandUpgrade = queue(initial, 'building.aegis.command');
    expect(commandUpgrade.ok).toBe(true);

    if (!commandUpgrade.ok) {
      return;
    }

    const item = getPlayerPlanet(commandUpgrade.value).buildQueue[0];
    expect(item).toBeDefined();

    if (item === undefined) {
      return;
    }

    const completed = executeCommand(commandUpgrade.value, {
      type: 'ADVANCE_TIME',
      seconds: item.completesAt - commandUpgrade.value.clock.elapsedSeconds,
    });
    expect(completed.ok).toBe(true);

    if (!completed.ok) {
      return;
    }

    expect(queue(completed.value, 'building.aegis.research-lab').ok).toBe(true);
  });

  it('cancels an order with a 75 percent refund', () => {
    const initial = createInitialGameState('queue-cancel');
    const queued = queue(initial, 'building.aegis.command');
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
        buildingId: 'building.aegis.command',
        targetLevel: 9,
      },
    });

    expect(result).toEqual(expect.objectContaining({ ok: false, code: 'RESERVED_EVENT_TYPE' }));
  });
});
