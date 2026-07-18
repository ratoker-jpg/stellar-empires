import { describe, expect, it } from 'vitest';
import { refreshPlanetEconomy } from '../../src/simulation/economy/planetEconomy';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { createPlanetZones } from '../../src/simulation/planet/zones';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState } from '../../src/simulation/types';

function preparePlayerProduction(state: GameState): GameState {
  const buildingLevels: Readonly<Record<string, number>> = {
    'building.aegis.shipyard': 2,
    'building.aegis.sensor-array': 2,
  };
  return {
    ...state,
    planets: state.planets.map((planet) => {
      if (planet.ownerEmpireId !== 'player') {
        return planet;
      }
      const buildings = [
        ...planet.buildings.filter(
          (building) => buildingLevels[building.buildingId] === undefined,
        ),
        ...Object.entries(buildingLevels).map(([buildingId, level]) => ({ buildingId, level })),
      ];
      return {
        ...planet,
        buildings,
        zones: createPlanetZones(buildings),
        economy: refreshPlanetEconomy(planet.economy, buildings),
      };
    }),
    research: state.research.map((research) =>
      research.empireId === 'player'
        ? {
            ...research,
            levels: {
              ...research.levels,
              'technology.aegis.construction': 2,
              'technology.aegis.energy': 2,
              'technology.aegis.sensors': 2,
              'technology.aegis.propulsion': 2,
              'technology.aegis.armor': 2,
              'technology.aegis.weapons': 2,
            },
          }
        : research,
    ),
  };
}

function playerPlanet(state: GameState) {
  const planet = state.planets.find((candidate) => candidate.ownerEmpireId === 'player');
  if (planet === undefined) {
    throw new Error('Player planet missing.');
  }
  return planet;
}

describe('unit production', () => {
  it('builds a ship batch and applies completion exactly once', () => {
    const initial = preparePlayerProduction(createInitialGameState('ship-production'));
    const planet = playerPlanet(initial);
    const queued = executeCommand(initial, {
      type: 'QUEUE_UNIT_BATCH',
      empireId: 'player',
      planetId: planet.id,
      unitId: 'ship.aegis.scout',
      quantity: 2,
    });
    expect(queued.ok).toBe(true);
    if (!queued.ok) {
      return;
    }
    const item = playerPlanet(queued.value).productionQueues.shipyard[0];
    expect(item).toBeDefined();
    if (item === undefined) {
      return;
    }

    const completed = executeCommand(queued.value, {
      type: 'ADVANCE_TIME',
      seconds: item.completesAt - queued.value.clock.elapsedSeconds,
    });
    expect(completed.ok).toBe(true);
    if (!completed.ok) {
      return;
    }
    expect(playerPlanet(completed.value).inventory.ships['ship.aegis.scout']).toBe(2);
    expect(playerPlanet(completed.value).productionQueues.shipyard).toEqual([]);

    const later = executeCommand(completed.value, { type: 'ADVANCE_TIME', seconds: 10_000 });
    expect(later.ok).toBe(true);
    if (later.ok) {
      expect(playerPlanet(later.value).inventory.ships['ship.aegis.scout']).toBe(2);
    }
  });

  it('allows independent shipyard and defense queues', () => {
    const initial = preparePlayerProduction(createInitialGameState('parallel-production'));
    const planet = playerPlanet(initial);
    const ship = executeCommand(initial, {
      type: 'QUEUE_UNIT_BATCH',
      empireId: 'player',
      planetId: planet.id,
      unitId: 'ship.aegis.scout',
      quantity: 1,
    });
    expect(ship.ok).toBe(true);
    if (!ship.ok) {
      return;
    }
    const defense = executeCommand(ship.value, {
      type: 'QUEUE_UNIT_BATCH',
      empireId: 'player',
      planetId: planet.id,
      unitId: 'defense.aegis.gun-battery',
      quantity: 1,
    });
    expect(defense.ok).toBe(true);
    if (defense.ok) {
      expect(playerPlanet(defense.value).productionQueues.shipyard).toHaveLength(1);
      expect(playerPlanet(defense.value).productionQueues.defense).toHaveLength(1);
    }
  });

  it('cancels a batch, removes its event and refunds 75 percent', () => {
    const initial = preparePlayerProduction(createInitialGameState('cancel-production'));
    const planet = playerPlanet(initial);
    const queued = executeCommand(initial, {
      type: 'QUEUE_UNIT_BATCH',
      empireId: 'player',
      planetId: planet.id,
      unitId: 'ship.aegis.scout',
      quantity: 1,
    });
    expect(queued.ok).toBe(true);
    if (!queued.ok) {
      return;
    }
    const item = playerPlanet(queued.value).productionQueues.shipyard[0];
    if (item === undefined) {
      throw new Error('Production queue item missing.');
    }
    const cancelled = executeCommand(queued.value, {
      type: 'CANCEL_UNIT_BATCH',
      empireId: 'player',
      planetId: planet.id,
      queueItemId: item.id,
    });
    expect(cancelled.ok).toBe(true);
    if (cancelled.ok) {
      expect(playerPlanet(cancelled.value).productionQueues.shipyard).toEqual([]);
      expect(cancelled.value.pendingEvents).toHaveLength(0);
      expect(playerPlanet(cancelled.value).economy.resources.metal.amount).toBe(
        planet.economy.resources.metal.amount -
          item.cost.metal +
          Math.floor((item.cost.metal * 750) / 1_000),
      );
    }
  });

  it('rejects batches that exceed hangar capacity', () => {
    const initial = preparePlayerProduction(createInitialGameState('hangar-limit'));
    const planet = playerPlanet(initial);
    const result = executeCommand(initial, {
      type: 'QUEUE_UNIT_BATCH',
      empireId: 'player',
      planetId: planet.id,
      unitId: 'ship.aegis.cargo',
      quantity: 30,
    });
    expect(result).toMatchObject({ ok: false, code: 'INSUFFICIENT_POPULATION' });
  });
});
