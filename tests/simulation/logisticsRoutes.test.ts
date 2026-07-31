import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeAdvanceTimeWithTelemetry, executeCommand } from '../../src/simulation/reducer';
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

function createRoute(
  state: GameState,
  overrides: Partial<Extract<Parameters<typeof executeCommand>[1], { type: 'CREATE_LOGISTICS_ROUTE' }>> = {},
) {
  return executeCommand(state, {
    type: 'CREATE_LOGISTICS_ROUTE',
    empireId: 'player',
    originPlanetId: state.planets[0]!.id,
    targetPlanetId: state.planets[1]!.id,
    resourceId: 'metal',
    amountPerTrip: 100,
    originReserve: 500,
    intervalSeconds: 600,
    priority: 2,
    ...overrides,
  });
}

describe('logistics routes', () => {
  it('transfers resources on every deterministic interval and emits one receipt per departure', () => {
    const state = createTwoColonyState('logistics-transfer');
    const origin = state.planets[0]!;
    const target = state.planets[1]!;
    const created = createRoute(state);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const advanced = executeAdvanceTimeWithTelemetry(created.value, {
      type: 'ADVANCE_TIME',
      seconds: 1_200,
    });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) return;

    const updatedOrigin = advanced.value.state.planets.find((planet) => planet.id === origin.id)!;
    const updatedTarget = advanced.value.state.planets.find((planet) => planet.id === target.id)!;
    expect(updatedOrigin.economy.resources.metal.amount).toBe(
      origin.economy.resources.metal.amount - 200,
    );
    expect(updatedTarget.economy.resources.metal.amount).toBe(200);
    expect(advanced.value.state.logisticsRoutes[0]?.lastResult).toMatchObject({
      executedAt: 1_200,
      code: 'transferred',
      amount: 100,
    });
    expect(advanced.value.logisticsReceipts).toEqual([
      {
        routeId: advanced.value.state.logisticsRoutes[0]!.id,
        empireId: 'player',
        executedAt: 600,
        resultCode: 'transferred',
        amount: 100,
      },
      {
        routeId: advanced.value.state.logisticsRoutes[0]!.id,
        empireId: 'player',
        executedAt: 1_200,
        resultCode: 'transferred',
        amount: 100,
      },
    ]);
  });

  it('respects origin reserve and records repeated misses', () => {
    let state = createTwoColonyState('logistics-reserve');
    const origin = state.planets[0]!;
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
    const created = createRoute(state, { intervalSeconds: 300, priority: 1 });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const advanced = executeAdvanceTimeWithTelemetry(created.value, {
      type: 'ADVANCE_TIME',
      seconds: 600,
    });
    expect(advanced.ok).toBe(true);
    if (advanced.ok) {
      expect(advanced.value.state.logisticsRoutes[0]?.consecutiveMisses).toBe(2);
      expect(advanced.value.state.logisticsRoutes[0]?.lastResult?.code).toBe('origin-reserve');
      expect(advanced.value.logisticsReceipts.map((receipt) => receipt.resultCode)).toEqual([
        'origin-reserve',
        'origin-reserve',
      ]);
    }
  });

  it('rejects duplicate keys even when the existing route is paused', () => {
    const state = createTwoColonyState('logistics-duplicate');
    const created = createRoute(state);
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

    expect(createRoute(paused.value)).toMatchObject({
      ok: false,
      code: 'LOGISTICS_ROUTE_DUPLICATE',
    });
    expect(createRoute(paused.value, { resourceId: 'crystal' }).ok).toBe(true);
  });

  it('pauses without departures and resumes from current game time', () => {
    const state = createTwoColonyState('logistics-resume');
    const created = createRoute(state, { intervalSeconds: 300 });
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
    const elapsed = executeCommand(paused.value, { type: 'ADVANCE_TIME', seconds: 900 });
    expect(elapsed.ok).toBe(true);
    if (!elapsed.ok) return;
    expect(elapsed.value.planets[1]!.economy.resources.metal.amount).toBe(0);

    const resumed = executeCommand(elapsed.value, {
      type: 'UPDATE_LOGISTICS_ROUTE',
      empireId: 'player',
      routeId,
      status: 'active',
    });
    expect(resumed.ok).toBe(true);
    if (!resumed.ok) return;
    expect(resumed.value.logisticsRoutes[0]?.nextDepartureAt).toBe(1_200);
    const beforeDeparture = executeCommand(resumed.value, { type: 'ADVANCE_TIME', seconds: 299 });
    expect(beforeDeparture.ok).toBe(true);
    if (!beforeDeparture.ok) return;
    expect(beforeDeparture.value.planets[1]!.economy.resources.metal.amount).toBe(0);
    const departure = executeCommand(beforeDeparture.value, { type: 'ADVANCE_TIME', seconds: 1 });
    expect(departure.ok).toBe(true);
    if (departure.ok) {
      expect(departure.value.planets[1]!.economy.resources.metal.amount).toBe(100);
    }
  });

  it('rebases active interval edits but preserves departure time for other edits', () => {
    const state = createTwoColonyState('logistics-edit');
    const created = createRoute(state, { intervalSeconds: 600 });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const routeId = created.value.logisticsRoutes[0]!.id;
    const advanced = executeCommand(created.value, { type: 'ADVANCE_TIME', seconds: 100 });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) return;
    const amountEdited = executeCommand(advanced.value, {
      type: 'UPDATE_LOGISTICS_ROUTE',
      empireId: 'player',
      routeId,
      amountPerTrip: 250,
      originReserve: 750,
      priority: 3,
    });
    expect(amountEdited.ok).toBe(true);
    if (!amountEdited.ok) return;
    expect(amountEdited.value.logisticsRoutes[0]?.nextDepartureAt).toBe(600);

    const intervalEdited = executeCommand(amountEdited.value, {
      type: 'UPDATE_LOGISTICS_ROUTE',
      empireId: 'player',
      routeId,
      intervalSeconds: 900,
    });
    expect(intervalEdited.ok).toBe(true);
    if (intervalEdited.ok) {
      expect(intervalEdited.value.logisticsRoutes[0]?.nextDepartureAt).toBe(1_000);
    }
  });

  it('processes same-time routes by priority then route id', () => {
    let state = createTwoColonyState('logistics-priority');
    const origin = state.planets[0]!;
    const firstTarget = state.planets[1]!;
    const secondTarget = {
      ...firstTarget,
      id: 'colony-logistics-second-target',
      galaxyPlanetId: 'planet-logistics-second-target',
      name: 'Вторая цель',
    };
    state = {
      ...state,
      planets: [
        {
          ...origin,
          economy: {
            ...origin.economy,
            resources: {
              ...origin.economy.resources,
              metal: { ...origin.economy.resources.metal, amount: 150 },
            },
          },
        },
        firstTarget,
        secondTarget,
      ],
    };
    const low = createRoute(state, {
      targetPlanetId: firstTarget.id,
      originReserve: 0,
      intervalSeconds: 300,
      priority: 1,
    });
    expect(low.ok).toBe(true);
    if (!low.ok) return;
    const high = createRoute(low.value, {
      targetPlanetId: secondTarget.id,
      originReserve: 0,
      intervalSeconds: 300,
      priority: 3,
    });
    expect(high.ok).toBe(true);
    if (!high.ok) return;
    const advanced = executeAdvanceTimeWithTelemetry(high.value, {
      type: 'ADVANCE_TIME',
      seconds: 300,
    });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) return;

    expect(advanced.value.logisticsReceipts.map((receipt) => receipt.routeId)).toEqual([
      high.value.logisticsRoutes[1]!.id,
      low.value.logisticsRoutes[0]!.id,
    ]);
    expect(
      advanced.value.state.planets.find((planet) => planet.id === secondTarget.id)
        ?.economy.resources.metal.amount,
    ).toBe(100);
    expect(
      advanced.value.state.planets.find((planet) => planet.id === firstTarget.id)
        ?.economy.resources.metal.amount,
    ).toBe(50);
  });

  it('pauses and deletes routes through normal commands', () => {
    const state = createTwoColonyState('logistics-control');
    const created = createRoute(state, {
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
