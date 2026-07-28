import { describe, expect, it } from 'vitest';
import {
  findGalaxyPlanet,
  resolveColonization,
  updateGalaxyPlanetOwner,
} from '../../src/simulation/colonization/colonization';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import type { FleetState } from '../../src/simulation/fleets/types';
import {
  getMissionAvailability,
  listMissionTargets,
} from '../../src/simulation/fleets/missionRules';
import type { GameState } from '../../src/simulation/types';

describe('recolonized debris targeting', () => {
  it('rekeys released debris to the fresh colony identity', () => {
    const initial = createInitialGameState('recolonized-debris-targeting');
    const origin = initial.planets.find(
      (planet) => planet.ownerEmpireId === 'player',
    );
    const released = initial.planets.find((planet) => {
      if (planet.ownerEmpireId === 'player') return false;
      return findGalaxyPlanet(initial.galaxy, planet.galaxyPlanetId)?.planet.biome !== 'gas';
    });
    if (origin === undefined || released === undefined) {
      throw new Error('Recolonized debris fixture planets are missing.');
    }

    const roles = getFactionMechanicalRoles(origin.factionId);
    const colonizer: FleetState = {
      id: 'fleet-recolonize-debris',
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
      fleets: [...initial.fleets, colonizer],
      debrisFields: [
        {
          id: `debris-${released.galaxyPlanetId}`,
          planetId: released.galaxyPlanetId,
          coordinate: released.coordinate,
          metal: 500,
          crystal: 250,
          createdAt: initial.clock.elapsedSeconds,
        },
      ],
    };

    const colonized = resolveColonization(
      state,
      colonizer,
      released.galaxyPlanetId,
    );
    expect(colonized).toBeDefined();
    if (colonized === undefined) return;
    expect(colonized.colony.id).not.toBe(released.id);
    expect(colonized.state.debrisFields).toContainEqual(
      expect.objectContaining({
        id: `debris-${colonized.colony.id}`,
        planetId: colonized.colony.id,
        metal: 500,
        crystal: 250,
      }),
    );

    const recycler: FleetState = {
      id: 'fleet-recycle-recolonized-debris',
      empireId: 'player',
      originPlanetId: origin.id,
      location: { type: 'planet', planetId: origin.id },
      status: 'stationed',
      ships: { [roles.ships.recycler]: 1 },
      cargo: { metal: 0, crystal: 0, gas: 0 },
      speed: 1,
      cargoCapacity: 10_000,
      mission: null,
    };
    const withRecycler: GameState = {
      ...colonized.state,
      fleets: [...colonized.state.fleets, recycler],
    };
    expect(
      listMissionTargets(withRecycler, 'player', recycler, 'recycle').some(
        (target) => target.id === colonized.colony.id,
      ),
    ).toBe(true);
    expect(
      getMissionAvailability(withRecycler, {
        type: 'SEND_FLEET',
        empireId: 'player',
        fleetId: recycler.id,
        targetPlanetId: colonized.colony.id,
        mission: 'recycle',
      }),
    ).toMatchObject({ allowed: true, code: 'MISSION_READY' });
  });
});
