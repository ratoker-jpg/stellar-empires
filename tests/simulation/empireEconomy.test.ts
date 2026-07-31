import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { createEmpireEconomyPortfolio } from '../../src/simulation/economy/empireEconomy';
import type { LogisticsRoute } from '../../src/simulation/logistics/types';
import type { PlanetState } from '../../src/simulation/planet/types';

function clonePlayerPlanet(
  source: PlanetState,
  overrides: Pick<PlanetState, 'id' | 'galaxyPlanetId' | 'systemId' | 'position' | 'name'>,
): PlanetState {
  return {
    ...source,
    ...overrides,
    buildQueue: [],
    productionQueues: { shipyard: [], defense: [] },
  };
}

describe('empire economy portfolio', () => {
  it('derives deterministic colony order, route flow, aggregate totals and health reasons', () => {
    const initial = createInitialGameState('empire-economy-portfolio');
    const home = initial.planets.find((planet) => planet.ownerEmpireId === 'player');
    expect(home).toBeDefined();
    if (home === undefined) return;

    const industrial = clonePlayerPlanet(home, {
      id: 'colony-industrial',
      galaxyPlanetId: 'planet-industrial',
      systemId: 'system-b',
      position: 2,
      name: 'Industrial',
    });
    const resource = clonePlayerPlanet(home, {
      id: 'colony-resource',
      galaxyPlanetId: 'planet-resource',
      systemId: 'system-a',
      position: 4,
      name: 'Resource',
    });
    const resourceWithPressure: PlanetState = {
      ...resource,
      specializationId: 'resource',
      developmentTemplateId: 'resource-hub',
      economy: {
        resources: {
          metal: {
            ...resource.economy.resources.metal,
            amount: 950,
            capacity: 1_000,
            productionPerHour: 100,
          },
          crystal: {
            ...resource.economy.resources.crystal,
            amount: 100,
            capacity: 1_000,
            productionPerHour: 0,
          },
          gas: {
            ...resource.economy.resources.gas,
            amount: 0,
            capacity: 1_000,
            productionPerHour: 0,
          },
        },
        energy: { produced: 10, consumed: 20, efficiencyPermille: 500 },
        population: { used: 11, capacity: 10 },
        stability: { capacity: 5, demand: 10, efficiencyPermille: 500 },
      },
    };
    const industrialReceiver: PlanetState = {
      ...industrial,
      specializationId: 'industry',
      developmentTemplateId: 'industrial-hub',
      economy: {
        ...industrial.economy,
        resources: {
          metal: {
            ...industrial.economy.resources.metal,
            amount: 200,
            capacity: 1_000,
            productionPerHour: 25,
          },
          crystal: {
            ...industrial.economy.resources.crystal,
            amount: 400,
            capacity: 1_000,
            productionPerHour: 40,
          },
          gas: {
            ...industrial.economy.resources.gas,
            amount: 300,
            capacity: 1_000,
            productionPerHour: 30,
          },
        },
      },
    };
    const routes: readonly LogisticsRoute[] = [
      {
        id: 'logistics-10',
        empireId: 'player',
        originPlanetId: resourceWithPressure.id,
        targetPlanetId: industrialReceiver.id,
        resourceId: 'metal',
        amountPerTrip: 100,
        originReserve: 100,
        intervalSeconds: 1_800,
        priority: 3,
        status: 'active',
        nextDepartureAt: 1_800,
        consecutiveMisses: 1,
        lastResult: { executedAt: 0, code: 'origin-reserve', amount: 0 },
      },
      {
        id: 'logistics-11',
        empireId: 'player',
        originPlanetId: industrialReceiver.id,
        targetPlanetId: resourceWithPressure.id,
        resourceId: 'crystal',
        amountPerTrip: 60,
        originReserve: 100,
        intervalSeconds: 3_600,
        priority: 2,
        status: 'active',
        nextDepartureAt: 3_600,
        consecutiveMisses: 0,
        lastResult: null,
      },
      {
        id: 'logistics-paused',
        empireId: 'player',
        originPlanetId: resourceWithPressure.id,
        targetPlanetId: industrialReceiver.id,
        resourceId: 'gas',
        amountPerTrip: 999,
        originReserve: 0,
        intervalSeconds: 3_600,
        priority: 1,
        status: 'paused',
        nextDepartureAt: 3_600,
        consecutiveMisses: 0,
        lastResult: null,
      },
    ];
    const state = {
      ...initial,
      planets: [
        ...initial.planets.filter((planet) => planet.ownerEmpireId !== 'player'),
        industrialReceiver,
        resourceWithPressure,
      ],
      logisticsRoutes: routes,
      fleets: [],
    };
    const before = JSON.stringify(state);

    const portfolio = createEmpireEconomyPortfolio(state, 'player');

    expect(portfolio.colonies.map((colony) => colony.id)).toEqual([
      resourceWithPressure.id,
      industrialReceiver.id,
    ]);
    const donor = portfolio.colonies[0]!;
    const receiver = portfolio.colonies[1]!;
    expect(donor.resources.metal).toMatchObject({
      fillPermille: 950,
      scheduledInboundPerHour: 0,
      scheduledOutboundPerHour: 200,
      effectiveNetFlowPerHour: -100,
    });
    expect(receiver.resources.metal).toMatchObject({
      scheduledInboundPerHour: 200,
      scheduledOutboundPerHour: 0,
      effectiveNetFlowPerHour: 225,
    });
    expect(donor.resources.crystal.scheduledInboundPerHour).toBe(60);
    expect(receiver.resources.crystal.scheduledOutboundPerHour).toBe(60);
    expect(donor.resources.gas.scheduledOutboundPerHour).toBe(0);
    expect(portfolio.resources.metal).toMatchObject({
      amount: 1_150,
      capacity: 2_000,
      productionPerHour: 125,
      scheduledInboundPerHour: 200,
      scheduledOutboundPerHour: 200,
      effectiveNetFlowPerHour: 125,
    });
    expect(donor.healthReasons).toEqual([
      'energy-deficit',
      'population-deficit',
      'stability-deficit',
      'storage-pressure',
      'resource-deficit',
      'route-stalled',
    ]);
    expect(receiver.healthReasons).toContain('route-stalled');
    expect(portfolio.healthReasons).toEqual(donor.healthReasons);
    expect(JSON.stringify(state)).toBe(before);
  });

  it('does not include foreign colonies, routes or fleets', () => {
    const state = createInitialGameState('empire-economy-isolation');
    const portfolio = createEmpireEconomyPortfolio(state, 'player');

    expect(portfolio.colonyCount).toBe(1);
    expect(
      portfolio.colonies.every((colony) =>
        state.planets.some(
          (planet) => planet.id === colony.id && planet.ownerEmpireId === 'player',
        ),
      ),
    ).toBe(true);
    expect(portfolio.totalFleetCount).toBe(
      state.fleets.filter((fleet) => fleet.empireId === 'player').length,
    );
  });
});
