import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { createEmpireOverviewViewModel } from '../../src/ui/empireOverviewViewModel';

describe('empire overview view model', () => {
  it('aggregates resources, queues and fleets across owned colonies', () => {
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
    expect(
      view.colonies.find((candidate) => candidate.id === colony.id),
    ).toMatchObject({
      buildingQueueCount: 1,
      activeMissionCount: 1,
      stationedFleetCount: 0,
    });
    expect(
      view.colonies.find((candidate) => candidate.id === home.id),
    ).toMatchObject({
      activeMissionCount: 0,
      stationedFleetCount: 1,
    });
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
