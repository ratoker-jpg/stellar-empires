import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import type { FleetState } from '../../src/simulation/fleets/types';
import { reconcileDestroyedPlanet } from '../../src/simulation/planet/reconcileDestroyedPlanet';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState, ScheduledGameEvent } from '../../src/simulation/types';

describe('repeated special mission return rehome', () => {
  it('replaces an existing live return destination while preserving history', () => {
    const initial = createInitialGameState('special-mission-rehome-twice');
    const destroyed = initial.planets.find(
      (planet) => planet.ownerEmpireId !== 'player',
    );
    const fallback = initial.planets.find(
      (planet) =>
        planet.id !== destroyed?.id && planet.ownerEmpireId !== 'player',
    );
    const expeditionTarget = initial.planets.find(
      (planet) => planet.ownerEmpireId === 'player',
    );
    const object = initial.spaceObjects[0];
    if (
      destroyed === undefined ||
      fallback === undefined ||
      expeditionTarget === undefined ||
      object === undefined
    ) {
      throw new Error('Repeated special mission fixture is incomplete.');
    }

    const empireId = destroyed.ownerEmpireId;
    const roles = getFactionMechanicalRoles(destroyed.factionId);
    const expeditionFleet: FleetState = {
      id: 'fleet-expedition-rehomed-once',
      empireId,
      originPlanetId: destroyed.id,
      location: {
        type: 'transit',
        fromPlanetId: destroyed.id,
        toPlanetId: expeditionTarget.galaxyPlanetId,
        departedAt: 0,
        arrivesAt: 60,
      },
      status: 'outbound',
      ships: { [roles.ships.scout]: 1 },
      cargo: { metal: 0, crystal: 0, gas: 0 },
      speed: 1,
      cargoCapacity: 100,
      mission: {
        kind: 'expedition',
        targetPlanetId: expeditionTarget.galaxyPlanetId,
      },
    };
    const objectFleet: FleetState = {
      id: 'fleet-object-rehomed-once',
      empireId,
      originPlanetId: destroyed.id,
      location: {
        type: 'transit',
        fromPlanetId: destroyed.id,
        toPlanetId: object.id,
        departedAt: 0,
        arrivesAt: 60,
      },
      status: 'outbound',
      ships: { [roles.ships.recycler]: 1 },
      cargo: { metal: 0, crystal: 0, gas: 0 },
      speed: 1,
      cargoCapacity: 100,
      mission: { kind: 'space-object', targetPlanetId: object.id },
    };
    const historicalOriginId = 'colony-destroyed-before-current-return';
    const expeditionEvent: ScheduledGameEvent = {
      id: 'event-expedition-rehome-twice',
      executeAt: 60,
      sequence: initial.nextEventSequence,
      payload: {
        type: 'EXPEDITION_RESOLVE',
        report: {
          id: 'expedition-rehome-twice',
          empireId,
          fleetId: expeditionFleet.id,
          originPlanetId: historicalOriginId,
          returnPlanetId: destroyed.id,
          targetGalaxyPlanetId: expeditionTarget.galaxyPlanetId,
          startedAt: 0,
          resolvesAt: 60,
          outcome: 'salvage',
          reward: { metal: 100, crystal: 50, gas: 10 },
          losses: {},
          narrative: 'test',
        },
      },
    };
    const objectEvent: ScheduledGameEvent = {
      id: 'event-object-rehome-twice',
      executeAt: 60,
      sequence: initial.nextEventSequence + 1,
      payload: {
        type: 'SPACE_OBJECT_MISSION_RESOLVE',
        report: {
          id: 'object-rehome-twice',
          empireId,
          fleetId: objectFleet.id,
          originPlanetId: historicalOriginId,
          returnPlanetId: destroyed.id,
          objectId: object.id,
          startedAt: 0,
          resolvesAt: 60,
          reward: { metal: 20, crystal: 30, gas: 40, exoticMatter: 5 },
          depletion: 10,
          losses: {},
          controllerUntil: 600,
          narrative: 'test',
        },
      },
    };
    const state: GameState = {
      ...initial,
      planets: initial.planets.map((planet) =>
        planet.id === fallback.id
          ? {
              ...planet,
              ownerEmpireId: empireId,
              factionId: destroyed.factionId,
            }
          : planet,
      ),
      galaxy: {
        ...initial.galaxy,
        systems: initial.galaxy.systems.map((system) => ({
          ...system,
          planets: system.planets.map((planet) =>
            planet.id === fallback.galaxyPlanetId
              ? { ...planet, ownerEmpireId: empireId }
              : planet,
          ),
        })),
      },
      fleets: [...initial.fleets, expeditionFleet, objectFleet],
      nextEventSequence: initial.nextEventSequence + 2,
      pendingEvents: [
        ...initial.pendingEvents,
        expeditionEvent,
        objectEvent,
      ].sort(
        (left, right) =>
          left.executeAt - right.executeAt || left.sequence - right.sequence,
      ),
    };

    const reconciled = reconcileDestroyedPlanet(state, destroyed.id).state;
    for (const event of reconciled.pendingEvents) {
      if (
        event.payload.type !== 'EXPEDITION_RESOLVE' &&
        event.payload.type !== 'SPACE_OBJECT_MISSION_RESOLVE'
      ) {
        continue;
      }
      if (
        event.payload.report.id !== 'expedition-rehome-twice' &&
        event.payload.report.id !== 'object-rehome-twice'
      ) {
        continue;
      }
      expect(event.payload.report.originPlanetId).toBe(historicalOriginId);
      expect(event.payload.report.returnPlanetId).toBe(fallback.id);
    }
    expect(
      reconciled.fleets.find((fleet) => fleet.id === expeditionFleet.id)
        ?.originPlanetId,
    ).toBe(fallback.id);
    expect(
      reconciled.fleets.find((fleet) => fleet.id === objectFleet.id)
        ?.originPlanetId,
    ).toBe(fallback.id);

    const advanced = executeCommand(reconciled, {
      type: 'ADVANCE_TIME',
      seconds: 60,
    });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) return;
    for (const fleetId of [expeditionFleet.id, objectFleet.id]) {
      expect(
        advanced.value.fleets.find((fleet) => fleet.id === fleetId),
      ).toMatchObject({
        status: 'stationed',
        mission: null,
        location: { type: 'planet', planetId: fallback.id },
      });
    }
  });
});
