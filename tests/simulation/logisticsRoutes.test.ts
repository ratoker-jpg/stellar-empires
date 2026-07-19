import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState } from '../../src/simulation/types';

function createTwoColonyState(seed: string): GameState {
  const state = createInitialGameState(seed);
  const origin = state.planets.find((planet) => planet.ownerEmpireId === 'player');
  if (origin === undefined) throw new Error('Player planet missing.');
  const zeroProduction = (planet: typeof origin) => ({
    ...planet,
    buildings: [],
    economy: {
      ...planet.economy,
      resources: {
        metal: { ...planet.economy.resources.metal, productionPerHour: 0 },
        crystal: { ...planet.economy.resources.crystal, productionPerHour: 0 },
        gas: { ...planet.economy.resources.gas, productionPerHour: 0 },
      },
    },
  });
  const target = zeroProduction({
    ...origin,
    id: 'colony-logistics-target',
    galaxyPlanetId: 'planet-logistics-target',
    name: 'Логистическая цель',
    economy: {
      ...origin.economy,
      resources: {
        metal: { ...origin.economy.resources.metal, amount: 0 },
        crystal: { ...origin.economy.resources.crystal, amount: 0 },
        gas: { ...origin.economy.resources.gas, amount: 0 },
      },
    },
  });
  return { ...state, planets: [zeroProduction(origin), target] };
}

describe('logistics routes', () => {
  it('transfers resources on every deterministic interval', () => {
    const state = createTwoColonyState('logistics-transfer');
    const origin = state.planets[0]!;
    const target = state.planets[1]!;
    const created = executeCommand(state, {
      type: 'CREATE_LOGISTICS_ROUTE',
      empireId: 'player',
      originPlanetId: origin.id,
      targetPlanetId: target.id,
      resourceId: 'metal',
      amountPerTrip: 100,
      originReserve: 500,
      intervalSeconds: 600,
      priority: 2,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const advanced = executeCommand(created.value, { type: 'ADVANCE_TIME', seconds: 1_200 });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) return;

    const updatedOrigin = advanced.value.planets.find((planet) => planet.id === origin.id)!;
    const updatedTarget = advanced.value.planets.find((planet) => planet.id === target.id)!;
    expect(updatedOrigin.economy.resources.metal.amount).toBe(
      origin.economy.resources.metal.amount - 200,
    );
    expect(updatedTarget.economy.resources.metal.amount).toBe(200);
    expect(advanced.value.logisticsRoutes[0]?.lastResult).toMatchObject({
      executedAt: 1_200,
      code: 'transferred',
      amount: 100,
    });
  });

  it('respects origin reserve and records repeated misses', () => {
    let state = createTwoColonyState('logistics-reserve');
    const origin = state.planets[0]!;
    const target = state.planets[1]!;
    state = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.id === origin.id
          ? {
              ...planet,
              economy: {
                ...planet.economy,
                resources: {
                  ...planet.economy.resources,
                  metal: { ...planet.economy.resources.metal, amount: 500 },
                },
              },
            }
          : planet,
      ),
    };
    const created = executeCommand(state, {
      type: 'CREATE_LOGISTICS_ROUTE',
      empireId: 'player',
      originPlanetId: origin.id,
      targetPlanetId: target.id,
      resourceId: 'metal',
      amountPerTrip: 100,
      originReserve: 500,
      intervalSeconds: 300,
      priority: 1,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const advanced = executeCommand(created.value, { type: 'ADVANCE_TIME', seconds: 600 });
    expect(advanced.ok).toBe(true);
    if (advanced.ok) {
      expect(advanced.value.logisticsRoutes[0]?.consecutiveMisses).toBe(2);
      expect(advanced.value.logisticsRoutes[0]?.lastResult?.code).toBe('origin-reserve');
    }
  });

  it('pauses and deletes routes through normal commands', () => {
    const state = createTwoColonyState('logistics-control');
    const created = executeCommand(state, {
      type: 'CREATE_LOGISTICS_ROUTE',
      empireId: 'player',
      originPlanetId: state.planets[0]!.id,
      targetPlanetId: state.planets[1]!.id,
      resourceId: 'gas',
      amountPerTrip: 50,
      originReserve: 100,
      intervalSeconds: 900,
      priority: 3,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const routeId = created.value.logisticsRoutes[0]!.id;
    const paused = executeCommand(created.value, {
      type: 'UPDATE_LOGISTICS_ROUTE',
      empireId: 'player',
      routeId,
      status: 'paused',
    });
    expect(paused.ok).toBe(true);
    if (!paused.ok) return;
    expect(paused.value.logisticsRoutes[0]?.status).toBe('paused');
    const deleted = executeCommand(paused.value, {
      type: 'DELETE_LOGISTICS_ROUTE',
      empireId: 'player',
      routeId,
    });
    expect(deleted.ok).toBe(true);
    if (deleted.ok) expect(deleted.value.logisticsRoutes).toEqual([]);
  });
});
