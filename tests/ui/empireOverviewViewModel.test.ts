import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { createEmpireOverviewViewModel } from '../../src/ui/empireOverviewViewModel';

describe('empire overview view model', () => {
  it('aggregates resources, roles, route flow, queues and fleets across owned colonies', () => {
    const initial = createInitialGameState('empire-overview');
    const home = initial.planets.find(
      (planet) => planet.ownerEmpireId === 'player',
    );
    expect(home).toBeDefined();
    if (home === undefined) return;

    const colony = {
      ...home,
      id: 'colony-second',
      galaxyPlanetId: 'planet-second',
      systemId: 'system-second',
      position: 4,
      name: 'Second Foundry',
      specializationId: 'industry' as const,
      developmentTemplateId: 'industrial-hub' as const,
      economy: {
        ...home.economy,
        resources: {
          metal: {
            ...home.economy.resources.metal,
            amount: 400,
            capacity: 2_000,
            productionPerHour: 50,
          },
          crystal: {
            ...home.economy.resources.crystal,
            amount: 300,
            capacity: 2_000,
            productionPerHour: 30,
          },
          gas: {
            ...home.economy.resources.gas,
            amount: 200,
            capacity: 2_000,
            productionPerHour: 20,
          },
        },
      },
      buildQueue: [
        {
          id: 'build-second',
          buildingId: 'building.aegis.command',
          targetLevel: 2,
          startedAt: 0,
          completesAt: 60,
          cost: { metal: 1, crystal: 1, gas: 1 },
        },
      ],
    };
    const state = {
      ...initial,
      planets: [...initial.planets, colony],
      logisticsRoutes: [
        {
          id: 'logistics-view-model',
          empireId: 'player',
          originPlanetId: home.id,
          targetPlanetId: colony.id,
          resourceId: 'metal' as const,
          amountPerTrip: 100,
          originReserve: 500,
          intervalSeconds: 1_800,
          priority: 2 as const,
          status: 'active' as const,
          nextDepartureAt: 1_800,
          consecutiveMisses: 0,
          lastResult: null,
        },
      ],
      fleets: [
        {
          id: 'fleet-home',
          empireId: 'player',
          originPlanetId: home.id,
          location: { type: 'planet' as const, planetId: home.id },
          status: 'stationed' as const,
          ships: { 'ship.aegis.scout': 1 },
          cargo: { metal: 0, crystal: 0, gas: 0 },
          speed: 14,
          cargoCapacity: 20,
          mission: null,
        },
        {
          id: 'fleet-second-flight',
          empireId: 'player',
          originPlanetId: colony.id,
          location: {
            type: 'transit' as const,
            fromPlanetId: colony.id,
            toPlanetId: home.id,
            departedAt: 0,
            arrivesAt: 100,
          },
          status: 'outbound' as const,
          ships: { 'ship.aegis.scout': 1 },
          cargo: { metal: 0, crystal: 0, gas: 0 },
          speed: 14,
          cargoCapacity: 20,
          mission: { kind: 'scout' as const, targetPlanetId: home.id },
        },
      ],
      research: initial.research.map((research) =>
        research.empireId === 'player'
          ? {
              ...research,
              levels: {
                ...research.levels,
                'technology.aegis.colonization': 2,
              },
            }
          : research,
      ),
    };
    const before = JSON.stringify(state);

    const view = createEmpireOverviewViewModel(state, 'player');
    expect(view).toMatchObject({
      colonyCount: 2,
      colonyLimit: 3,
      totalFleetCount: 2,
      activeFleetCount: 1,
    });
    expect(view.resources.metal.amount).toBe(
      home.economy.resources.metal.amount + 400,
    );
    expect(view.resources.metal.productionPerHour).toBe(
      home.economy.resources.metal.productionPerHour + 50,
    );
    expect(view.resources.metal.scheduledInboundPerHour).toBe(200);
    expect(view.resources.metal.scheduledOutboundPerHour).toBe(200);
    expect(
      view.colonies.find((candidate) => candidate.id === colony.id),
    ).toMatchObject({
      specializationId: 'industry',
      developmentTemplateId: 'industrial-hub',
      buildingQueueCount: 1,
      activeMissionCount: 1,
      stationedFleetCount: 0,
    });
    expect(
      view.colonies.find((candidate) => candidate.id === colony.id)?.resources.metal,
    ).toMatchObject({
      scheduledInboundPerHour: 200,
      scheduledOutboundPerHour: 0,
      effectiveNetFlowPerHour: 250,
    });
    expect(
      view.colonies.find((candidate) => candidate.id === home.id),
    ).toMatchObject({
      activeMissionCount: 0,
      stationedFleetCount: 1,
    });
    expect(JSON.stringify(state)).toBe(before);
  });

  it('does not include colonies or fleets owned by another empire', () => {
    const state = createInitialGameState('empire-isolation');
    const view = createEmpireOverviewViewModel(state, 'player');
    expect(view.colonyCount).toBe(1);
    expect(
      view.colonies.every((colony) =>
        state.planets.some(
          (planet) =>
            planet.id === colony.id && planet.ownerEmpireId === 'player',
        ),
      ),
    ).toBe(true);
  });
});
