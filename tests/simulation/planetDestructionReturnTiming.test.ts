import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import type { FleetState } from '../../src/simulation/fleets/types';
import { reconcileDestroyedPlanet } from '../../src/simulation/planet/reconcileDestroyedPlanet';
import type { GameState, ScheduledGameEvent } from '../../src/simulation/types';

describe('destroyed-target return timing', () => {
  it('uses elapsed outbound travel and preserves remaining return travel', () => {
    const initial = createInitialGameState('destroyed-target-return-timing');
    const playerOrigin = initial.planets.find(
      (planet) => planet.ownerEmpireId === 'player',
    );
    const destroyed = initial.planets.find(
      (planet) => planet.ownerEmpireId !== 'player',
    );
    const fallback = initial.planets.find(
      (planet) =>
        planet.id !== destroyed?.id &&
        planet.id !== playerOrigin?.id,
    );
    if (
      playerOrigin === undefined ||
      destroyed === undefined ||
      fallback === undefined
    ) {
      throw new Error('Return timing fixture planets are missing.');
    }

    const defenderEmpireId = destroyed.ownerEmpireId;
    const elapsedSeconds = 100;
    const attacker: FleetState = {
      id: 'fleet-destroyed-target-outbound',
      empireId: 'player',
      originPlanetId: playerOrigin.id,
      location: {
        type: 'transit',
        fromPlanetId: playerOrigin.id,
        toPlanetId: destroyed.id,
        departedAt: 40,
        arrivesAt: elapsedSeconds,
      },
      status: 'outbound',
      ships: {
        [getFactionMechanicalRoles(playerOrigin.factionId).ships.dreadnought]: 1,
      },
      cargo: { metal: 0, crystal: 0, gas: 0 },
      speed: 1,
      cargoCapacity: 100,
      mission: { kind: 'attack', targetPlanetId: destroyed.id },
    };
    const alreadyReturning: FleetState = {
      id: 'fleet-destroyed-origin-returning',
      empireId: defenderEmpireId,
      originPlanetId: destroyed.id,
      location: {
        type: 'transit',
        fromPlanetId: playerOrigin.id,
        toPlanetId: destroyed.id,
        departedAt: 70,
        arrivesAt: 130,
      },
      status: 'returning',
      ships: {
        [getFactionMechanicalRoles(destroyed.factionId).ships.transport]: 1,
      },
      cargo: { metal: 0, crystal: 0, gas: 0 },
      speed: 1,
      cargoCapacity: 100,
      mission: null,
    };
    const oldReturn: ScheduledGameEvent = {
      id: 'event-old-destroyed-origin-return',
      executeAt: 130,
      sequence: initial.nextEventSequence,
      payload: {
        type: 'FLEET_RETURN',
        fleetId: alreadyReturning.id,
        originPlanetId: destroyed.id,
      },
    };
    const state: GameState = {
      ...initial,
      clock: { ...initial.clock, elapsedSeconds },
      planets: initial.planets.map((planet) =>
        planet.id === fallback.id
          ? {
              ...planet,
              ownerEmpireId: defenderEmpireId,
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
              ? { ...planet, ownerEmpireId: defenderEmpireId }
              : planet,
          ),
        })),
      },
      fleets: [...initial.fleets, attacker, alreadyReturning],
      nextEventSequence: initial.nextEventSequence + 1,
      pendingEvents: [...initial.pendingEvents, oldReturn].sort(
        (left, right) =>
          left.executeAt - right.executeAt || left.sequence - right.sequence,
      ),
    };

    const reconciled = reconcileDestroyedPlanet(state, destroyed.id).state;
    const attackerReturn = reconciled.fleets.find(
      (fleet) => fleet.id === attacker.id,
    );
    const preservedReturn = reconciled.fleets.find(
      (fleet) => fleet.id === alreadyReturning.id,
    );
    expect(attackerReturn).toMatchObject({
      status: 'returning',
      originPlanetId: playerOrigin.id,
      location: {
        type: 'transit',
        departedAt: elapsedSeconds,
        arrivesAt: 160,
      },
    });
    expect(preservedReturn).toMatchObject({
      status: 'returning',
      originPlanetId: fallback.id,
      location: {
        type: 'transit',
        departedAt: elapsedSeconds,
        arrivesAt: 130,
      },
    });
    expect(
      reconciled.pendingEvents.find(
        (event) =>
          event.payload.type === 'FLEET_RETURN' &&
          event.payload.fleetId === attacker.id,
      )?.executeAt,
    ).toBe(160);
    expect(
      reconciled.pendingEvents.find(
        (event) =>
          event.payload.type === 'FLEET_RETURN' &&
          event.payload.fleetId === alreadyReturning.id,
      )?.executeAt,
    ).toBe(130);
    expect(
      reconciled.pendingEvents.some((event) => event.id === oldReturn.id),
    ).toBe(false);
  });
});
