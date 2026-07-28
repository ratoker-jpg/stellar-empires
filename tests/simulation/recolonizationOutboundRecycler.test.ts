import { describe, expect, it } from 'vitest';
import {
  findGalaxyPlanet,
  resolveColonization,
  updateGalaxyPlanetOwner,
} from '../../src/simulation/colonization/colonization';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import type { FleetState } from '../../src/simulation/fleets/types';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState, ScheduledGameEvent } from '../../src/simulation/types';

describe('outbound recycler during recolonization', () => {
  it('retargets the fleet and arrival event to the fresh colony identity', () => {
    const initial = createInitialGameState('recolonization-outbound-recycler');
    const origin = initial.planets.find(
      (planet) => planet.ownerEmpireId === 'player',
    );
    const released = initial.planets.find((planet) => {
      if (planet.ownerEmpireId === 'player') return false;
      return findGalaxyPlanet(initial.galaxy, planet.galaxyPlanetId)?.planet.biome !== 'gas';
    });
    if (origin === undefined || released === undefined) {
      throw new Error('Outbound recycler recolonization fixture is incomplete.');
    }

    const roles = getFactionMechanicalRoles(origin.factionId);
    const colonizer: FleetState = {
      id: 'fleet-colonize-before-recycler-arrival',
      empireId: 'player',
      originPlanetId: origin.id,
      location: { type: 'planet', planetId: origin.id },
      status: 'stationed',
      ships: { [roles.ships.colonizer]: 1 },
      cargo: { metal: 0, crystal: 0, gas: 0 },
      speed: 1,
      cargoCapacity: 100,
      mission: null,
    };
    const recycler: FleetState = {
      id: 'fleet-recycler-already-outbound',
      empireId: 'player',
      originPlanetId: origin.id,
      location: {
        type: 'transit',
        fromPlanetId: origin.id,
        toPlanetId: released.galaxyPlanetId,
        departedAt: 0,
        arrivesAt: 60,
      },
      status: 'outbound',
      ships: { [roles.ships.recycler]: 1 },
      cargo: { metal: 0, crystal: 0, gas: 0 },
      speed: 1,
      cargoCapacity: 10_000,
      mission: {
        kind: 'recycle',
        targetPlanetId: released.galaxyPlanetId,
      },
    };
    const arrival: ScheduledGameEvent = {
      id: 'event-recycler-before-recolonization',
      executeAt: 60,
      sequence: initial.nextEventSequence,
      payload: {
        type: 'FLEET_ARRIVE',
        fleetId: recycler.id,
        targetPlanetId: released.galaxyPlanetId,
      },
    };
    const state: GameState = {
      ...initial,
      galaxy: updateGalaxyPlanetOwner(
        initial.galaxy,
        released.galaxyPlanetId,
        null,
      ),
      planets: initial.planets
        .filter((planet) => planet.id !== released.id)
        .map((planet) =>
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
      research: initial.research.map((entry) =>
        entry.empireId === 'player'
          ? {
              ...entry,
              levels: {
                ...entry.levels,
                [roles.research.colonization]: 1,
              },
            }
          : entry,
      ),
      fleets: [...initial.fleets, colonizer, recycler],
      debrisFields: [
        {
          id: `debris-${released.galaxyPlanetId}`,
          planetId: released.galaxyPlanetId,
          coordinate: released.coordinate,
          metal: 500,
          crystal: 250,
          createdAt: 0,
        },
      ],
      nextEventSequence: initial.nextEventSequence + 1,
      pendingEvents: [...initial.pendingEvents, arrival].sort(
        (left, right) =>
          left.executeAt - right.executeAt || left.sequence - right.sequence,
      ),
    };

    const colonized = resolveColonization(
      state,
      colonizer,
      released.galaxyPlanetId,
    );
    expect(colonized).toBeDefined();
    if (colonized === undefined) return;
    const freshColonyId = colonized.colony.id;
    expect(
      colonized.state.fleets.find((fleet) => fleet.id === recycler.id),
    ).toMatchObject({
      status: 'outbound',
      mission: { kind: 'recycle', targetPlanetId: freshColonyId },
      location: { type: 'transit', toPlanetId: freshColonyId },
    });
    expect(
      colonized.state.pendingEvents.find((event) => event.id === arrival.id),
    ).toMatchObject({
      payload: {
        type: 'FLEET_ARRIVE',
        fleetId: recycler.id,
        targetPlanetId: freshColonyId,
      },
    });
    expect(colonized.state.debrisFields).toContainEqual(
      expect.objectContaining({
        id: `debris-${freshColonyId}`,
        planetId: freshColonyId,
      }),
    );

    const advanced = executeCommand(colonized.state, {
      type: 'ADVANCE_TIME',
      seconds: 60,
    });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) return;
    const returning = advanced.value.fleets.find(
      (fleet) => fleet.id === recycler.id,
    );
    expect(returning?.status).toBe('returning');
    expect(returning?.cargo.metal).toBeGreaterThan(0);
    expect(returning?.cargo.crystal).toBeGreaterThan(0);
  });
});
