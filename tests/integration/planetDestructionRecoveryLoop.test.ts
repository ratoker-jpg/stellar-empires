import { describe, expect, it } from 'vitest';
import { resolveColonization } from '../../src/simulation/colonization/colonization';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import type { FleetState } from '../../src/simulation/fleets/types';
import { reconcileDestroyedPlanet } from '../../src/simulation/planet/reconcileDestroyedPlanet';
import { getRequiredSpaceObjectShipId } from '../../src/simulation/pve/spaceObjects';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState, ScheduledGameEvent } from '../../src/simulation/types';

function createRecoveryFixture(seed: string) {
  const initial = createInitialGameState(seed);
  const destroyed = initial.planets.find((planet) => planet.ownerEmpireId !== 'player');
  const fallback = initial.planets.find(
    (planet) => planet.id !== destroyed?.id && planet.ownerEmpireId !== 'player',
  );
  if (destroyed === undefined || fallback === undefined) {
    throw new Error('Recovery fixture planets are missing.');
  }
  const state: GameState = {
    ...initial,
    planets: initial.planets.map((planet) =>
      planet.id === fallback.id
        ? { ...planet, ownerEmpireId: destroyed.ownerEmpireId, factionId: destroyed.factionId }
        : planet,
    ),
    galaxy: {
      ...initial.galaxy,
      systems: initial.galaxy.systems.map((system) => ({
        ...system,
        planets: system.planets.map((planet) =>
          planet.id === fallback.galaxyPlanetId
            ? { ...planet, ownerEmpireId: destroyed.ownerEmpireId }
            : planet,
        ),
      })),
    },
  };
  return {
    state,
    destroyed,
    fallback: { ...fallback, ownerEmpireId: destroyed.ownerEmpireId, factionId: destroyed.factionId },
  };
}

describe('planet destruction recovery loop', () => {
  it('preserves a pending space-object operation while returning its fleet and resources to a live colony', () => {
    const fixture = createRecoveryFixture('space-object-destroyed-origin');
    const object = fixture.state.spaceObjects[0];
    if (object === undefined) throw new Error('Space object missing.');
    const specialistId = getRequiredSpaceObjectShipId(object.kind, fixture.destroyed.factionId);
    const fleet: FleetState = {
      id: 'fleet-space-object-rehome',
      empireId: fixture.destroyed.ownerEmpireId,
      originPlanetId: fixture.destroyed.id,
      location: {
        type: 'transit',
        fromPlanetId: fixture.destroyed.id,
        toPlanetId: object.id,
        departedAt: 0,
        arrivesAt: 60,
      },
      status: 'outbound',
      ships: { [specialistId]: 2 },
      cargo: { metal: 0, crystal: 0, gas: 0 },
      speed: 1,
      cargoCapacity: 1_000,
      mission: { kind: 'space-object', targetPlanetId: object.id },
    };
    const report = {
      id: 'space-object-rehome-report',
      empireId: fixture.destroyed.ownerEmpireId,
      fleetId: fleet.id,
      originPlanetId: fixture.destroyed.id,
      objectId: object.id,
      startedAt: 0,
      resolvesAt: 60,
      reward: { metal: 40, crystal: 20, gas: 10, exoticMatter: 1 },
      depletion: 1,
      losses: {},
      controllerUntil: 3_660,
      narrative: 'rehome test',
    };
    const event: ScheduledGameEvent = {
      id: 'event-space-object-rehome',
      executeAt: 60,
      sequence: fixture.state.nextEventSequence,
      payload: { type: 'SPACE_OBJECT_MISSION_RESOLVE', report },
    };
    const prepared: GameState = {
      ...fixture.state,
      fleets: [...fixture.state.fleets, fleet],
      pendingEvents: [...fixture.state.pendingEvents, event].sort(
        (left, right) => left.executeAt - right.executeAt || left.sequence - right.sequence,
      ),
    };
    const reconciled = reconcileDestroyedPlanet(prepared, fixture.destroyed.id).state;
    const pending = reconciled.pendingEvents.find((candidate) => candidate.id === event.id);
    if (pending?.payload.type !== 'SPACE_OBJECT_MISSION_RESOLVE') {
      throw new Error('Space-object resolution event missing.');
    }
    expect(pending.payload.report.originPlanetId).toBe(fixture.destroyed.id);
    expect(pending.payload.report.returnPlanetId).toBe(fixture.fallback.id);

    const beforeFallback = reconciled.planets.find((planet) => planet.id === fixture.fallback.id);
    const beforeStrategic = reconciled.strategicResources.find(
      (entry) => entry.empireId === fixture.destroyed.ownerEmpireId,
    )?.exoticMatter ?? 0;
    const advanced = executeCommand(reconciled, { type: 'ADVANCE_TIME', seconds: 60 });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok || beforeFallback === undefined) return;
    const returned = advanced.value.fleets.find((candidate) => candidate.id === fleet.id);
    expect(returned?.location).toEqual({ type: 'planet', planetId: fixture.fallback.id });
    const afterFallback = advanced.value.planets.find((planet) => planet.id === fixture.fallback.id);
    expect(afterFallback?.economy.resources.metal.amount).toBeGreaterThanOrEqual(
      beforeFallback.economy.resources.metal.amount,
    );
    expect(
      advanced.value.strategicResources.find(
        (entry) => entry.empireId === fixture.destroyed.ownerEmpireId,
      )?.exoticMatter,
    ).toBe(beforeStrategic + 1);
    const updatedObject = advanced.value.spaceObjects.find((candidate) => candidate.id === object.id);
    expect(updatedObject?.remainingYield).toBe(object.remainingYield - 1);
    expect(updatedObject?.controllerEmpireId).toBe(fixture.destroyed.ownerEmpireId);
    expect(updatedObject?.cooldownUntil).toBe(360);
  });

  it('recolonizes a released position through the existing colonization resolver', () => {
    const fixture = createRecoveryFixture('destroyed-position-recolonization');
    let state = reconcileDestroyedPlanet(fixture.state, fixture.destroyed.id).state;
    const roles = getFactionMechanicalRoles(fixture.destroyed.factionId);
    state = {
      ...state,
      research: state.research.map((entry) =>
        entry.empireId === fixture.destroyed.ownerEmpireId
          ? {
              ...entry,
              levels: { ...entry.levels, [roles.research.colonization]: 1 },
            }
          : entry,
      ),
    };
    const colonizer: FleetState = {
      id: 'fleet-recolonize-destroyed-position',
      empireId: fixture.destroyed.ownerEmpireId,
      originPlanetId: fixture.fallback.id,
      location: { type: 'planet', planetId: fixture.fallback.id },
      status: 'stationed',
      ships: { [roles.ships.colonizer]: 1 },
      cargo: { metal: 100, crystal: 100, gas: 100 },
      speed: 1,
      cargoCapacity: 1_000,
      mission: { kind: 'colonize', targetPlanetId: fixture.destroyed.galaxyPlanetId },
    };
    state = { ...state, fleets: [...state.fleets, colonizer] };
    const colonization = resolveColonization(
      state,
      colonizer,
      fixture.destroyed.galaxyPlanetId,
    );
    expect(colonization).toBeDefined();
    expect(colonization?.colony.galaxyPlanetId).toBe(fixture.destroyed.galaxyPlanetId);
    expect(colonization?.colony.ownerEmpireId).toBe(fixture.destroyed.ownerEmpireId);
    expect(colonization?.colony.id).not.toBe(fixture.destroyed.id);
    expect(
      colonization?.state.planets.some(
        (planet) => planet.galaxyPlanetId === fixture.destroyed.galaxyPlanetId,
      ),
    ).toBe(true);
  });
});
