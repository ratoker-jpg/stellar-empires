import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import type { FleetState } from '../../src/simulation/fleets/types';
import { reconcileDestroyedPlanet } from '../../src/simulation/planet/reconcileDestroyedPlanet';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState, ScheduledGameEvent } from '../../src/simulation/types';

describe('origin-only fleet rehome', () => {
  it('preserves a live-target arrival and completes the round trip', () => {
    const initial = createInitialGameState('origin-only-rehome');
    const destroyed = initial.planets.find(
      (planet) => planet.ownerEmpireId !== 'player',
    );
    const otherPlanets = initial.planets.filter(
      (planet) => planet.id !== destroyed?.id,
    );
    const firstSurvivor = otherPlanets[0];
    const destination = otherPlanets[1];
    if (
      destroyed === undefined ||
      firstSurvivor === undefined ||
      destination === undefined
    ) {
      throw new Error('Origin-only rehome fixture planets are missing.');
    }

    const empireId = destroyed.ownerEmpireId;
    const planets = initial.planets.map((planet) =>
      planet.id === firstSurvivor.id || planet.id === destination.id
        ? { ...planet, ownerEmpireId: empireId, factionId: destroyed.factionId }
        : planet,
    );
    const galaxy = {
      ...initial.galaxy,
      systems: initial.galaxy.systems.map((system) => ({
        ...system,
        planets: system.planets.map((planet) =>
          planet.id === firstSurvivor.galaxyPlanetId ||
          planet.id === destination.galaxyPlanetId
            ? { ...planet, ownerEmpireId: empireId }
            : planet,
        ),
      })),
    };
    const fleet: FleetState = {
      id: 'fleet-origin-only-rehome',
      empireId,
      originPlanetId: destroyed.id,
      location: {
        type: 'transit',
        fromPlanetId: destroyed.id,
        toPlanetId: destination.id,
        departedAt: initial.clock.elapsedSeconds,
        arrivesAt: initial.clock.elapsedSeconds + 60,
      },
      status: 'outbound',
      ships: {
        [getFactionMechanicalRoles(destroyed.factionId).ships.transport]: 1,
      },
      cargo: { metal: 25, crystal: 10, gas: 0 },
      speed: 1,
      cargoCapacity: 100,
      mission: { kind: 'transport', targetPlanetId: destination.id },
    };
    const arrival: ScheduledGameEvent = {
      id: 'event-origin-only-rehome-arrival',
      executeAt: fleet.location.type === 'transit'
        ? fleet.location.arrivesAt
        : 60,
      sequence: initial.nextEventSequence,
      payload: {
        type: 'FLEET_ARRIVE',
        fleetId: fleet.id,
        targetPlanetId: destination.id,
      },
    };
    const state: GameState = {
      ...initial,
      galaxy,
      planets,
      fleets: [...initial.fleets, fleet],
      nextEventSequence: initial.nextEventSequence + 1,
      pendingEvents: [...initial.pendingEvents, arrival].sort(
        (left, right) =>
          left.executeAt - right.executeAt || left.sequence - right.sequence,
      ),
    };

    const reconciliation = reconcileDestroyedPlanet(state, destroyed.id);
    const rehomed = reconciliation.state.fleets.find(
      (candidate) => candidate.id === fleet.id,
    );
    expect(rehomed?.originPlanetId).toBe(reconciliation.fallbackPlanetId);
    expect(rehomed?.status).toBe('outbound');
    expect(
      reconciliation.state.pendingEvents.some(
        (event) => event.id === arrival.id,
      ),
    ).toBe(true);

    const arrived = executeCommand(reconciliation.state, {
      type: 'ADVANCE_TIME',
      seconds: 60,
    });
    expect(arrived.ok).toBe(true);
    if (!arrived.ok) return;
    const returning = arrived.value.fleets.find(
      (candidate) => candidate.id === fleet.id,
    );
    expect(returning?.status).toBe('returning');
    expect(returning?.originPlanetId).toBe(reconciliation.fallbackPlanetId);
    expect(
      arrived.value.pendingEvents.some(
        (event) =>
          event.payload.type === 'FLEET_RETURN' &&
          event.payload.fleetId === fleet.id,
      ),
    ).toBe(true);

    const completed = executeCommand(arrived.value, {
      type: 'ADVANCE_TIME',
      seconds: 60,
    });
    expect(completed.ok).toBe(true);
    if (!completed.ok) return;
    expect(
      completed.value.fleets.find((candidate) => candidate.id === fleet.id),
    ).toMatchObject({
      status: 'stationed',
      mission: null,
      location: {
        type: 'planet',
        planetId: reconciliation.fallbackPlanetId,
      },
    });
  });
});
