import { describe, expect, it } from 'vitest';
import { resolveAttackMission } from '../../src/simulation/combat/resolveAttackMission';
import { resolvePlanetDestruction } from '../../src/simulation/combat/planetDestruction';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeCommand } from '../../src/simulation/reducer';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import type { FleetState } from '../../src/simulation/fleets/types';
import { getMissionAvailability } from '../../src/simulation/fleets/missionRules';
import { reconcileDestroyedPlanet } from '../../src/simulation/planet/reconcileDestroyedPlanet';
import type { GameState, ScheduledGameEvent } from '../../src/simulation/types';
import { createSaveEnvelope, parseSaveJson, serializeSave } from '../../src/storage/saveFormat';

function setWeaponLevel(
  state: GameState,
  empireId: string,
  unitId: string,
  weapons: number,
): GameState {
  return {
    ...state,
    shipUpgrades: state.shipUpgrades.map((entry) =>
      entry.empireId === empireId
        ? {
            ...entry,
            levels: {
              ...entry.levels,
              [unitId]: { weapons, armor: 0, cargo: 0 },
            },
          }
        : entry,
    ),
  };
}

function destructionFixture(seed = 'planet-destruction-fixture') {
  let state = createInitialGameState(seed);
  const attackerPlanet = state.planets.find(
    (planet) => planet.ownerEmpireId === 'player',
  );
  const target = state.planets.find(
    (planet) => planet.ownerEmpireId !== 'player',
  );
  const fallback = state.planets.find(
    (planet) =>
      planet.id !== target?.id && planet.ownerEmpireId !== 'player',
  );
  if (attackerPlanet === undefined || target === undefined || fallback === undefined) {
    throw new Error('Initial destruction fixture planets are missing.');
  }
  state = {
    ...state,
    planets: state.planets.map((planet) =>
      planet.id === fallback.id
        ? { ...planet, ownerEmpireId: target.ownerEmpireId }
        : planet,
    ),
    galaxy: {
      ...state.galaxy,
      systems: state.galaxy.systems.map((system) => ({
        ...system,
        planets: system.planets.map((planet) =>
          planet.id === fallback.galaxyPlanetId
            ? { ...planet, ownerEmpireId: target.ownerEmpireId }
            : planet,
        ),
      })),
    },
  };
  return {
    state,
    attackerPlanet,
    target,
    fallback: { ...fallback, ownerEmpireId: target.ownerEmpireId },
  };
}

describe('planet destruction chance', () => {
  it('applies the 30% cap and is deterministic', () => {
    const fixture = destructionFixture('planet-destruction-cap');
    const destroyerId = getFactionMechanicalRoles('aegis').ships.complete.planetDestroyer;
    const state = setWeaponLevel(fixture.state, 'player', destroyerId, 10);
    const input = {
      state,
      attackerEmpireId: 'player',
      attackerFleetId: 'fleet-destroyer',
      attackerRemaining: { [destroyerId]: 20 },
      defenderEmpireId: fixture.target.ownerEmpireId,
      defenderRemaining: {},
      activeDefenses: {},
      targetPlanetId: fixture.target.id,
      targetGalaxyPlanetId: fixture.target.galaxyPlanetId,
      winner: 'attacker' as const,
      eventSequence: 77,
      poliasReductionBasisPoints: 0,
    };
    const first = resolvePlanetDestruction(input);
    expect(first.rawChanceBasisPoints).toBe(6_000);
    expect(first.finalChanceBasisPoints).toBe(3_000);
    expect(first).toEqual(resolvePlanetDestruction(input));
  });

  it('combines defence, defender destroyers and Polias reductions', () => {
    const fixture = destructionFixture('planet-destruction-reductions');
    const attackerId = getFactionMechanicalRoles('aegis').ships.complete.planetDestroyer;
    const defenderId = getFactionMechanicalRoles(fixture.target.factionId).ships.complete.planetDestroyer;
    let state = setWeaponLevel(fixture.state, 'player', attackerId, 10);
    state = setWeaponLevel(
      state,
      fixture.target.ownerEmpireId,
      defenderId,
      10,
    );
    const report = resolvePlanetDestruction({
      state,
      attackerEmpireId: 'player',
      attackerFleetId: 'fleet-reductions',
      attackerRemaining: { [attackerId]: 10 },
      defenderEmpireId: fixture.target.ownerEmpireId,
      defenderRemaining: { [defenderId]: 2 },
      activeDefenses: {},
      targetPlanetId: fixture.target.id,
      targetGalaxyPlanetId: fixture.target.galaxyPlanetId,
      winner: 'attacker',
      eventSequence: 78,
      poliasReductionBasisPoints: 500,
    });
    expect(report.rawChanceBasisPoints).toBe(3_000);
    expect(report.defenderPlanetDestroyerReductionBasisPoints).toBeGreaterThan(0);
    expect(report.poliasReductionBasisPoints).toBe(500);
    expect(report.finalChanceBasisPoints).toBeLessThan(3_000);
  });

  it('protects the last colony after calculating risk', () => {
    let state = createInitialGameState('planet-last-colony');
    const target = state.planets.find((planet) => planet.ownerEmpireId !== 'player');
    if (target === undefined) throw new Error('Target missing.');
    const destroyerId = getFactionMechanicalRoles('aegis').ships.complete.planetDestroyer;
    state = setWeaponLevel(state, 'player', destroyerId, 10);
    const report = resolvePlanetDestruction({
      state,
      attackerEmpireId: 'player',
      attackerFleetId: 'fleet-last-colony',
      attackerRemaining: { [destroyerId]: 20 },
      defenderEmpireId: target.ownerEmpireId,
      defenderRemaining: {},
      activeDefenses: {},
      targetPlanetId: target.id,
      targetGalaxyPlanetId: target.galaxyPlanetId,
      winner: 'attacker',
      eventSequence: 79,
      poliasReductionBasisPoints: 0,
    });
    expect(report.finalChanceBasisPoints).toBe(3_000);
    expect(report.blockedReason).toBe('LAST_COLONY_PROTECTED');
    expect(report.planetDestroyed).toBe(false);
  });
});

describe('destroyed planet reconciliation', () => {
  it('atomically removes live references and preserves special mission history', () => {
    const fixture = destructionFixture('planet-reconcile');
    const expeditionFleet: FleetState = {
      id: 'fleet-expedition-rehome',
      empireId: fixture.target.ownerEmpireId,
      originPlanetId: fixture.target.id,
      location: {
        type: 'transit',
        fromPlanetId: fixture.target.id,
        toPlanetId: fixture.attackerPlanet.galaxyPlanetId,
        departedAt: 0,
        arrivesAt: 60,
      },
      status: 'outbound',
      ships: { [getFactionMechanicalRoles(fixture.target.factionId).ships.scout]: 1 },
      cargo: { metal: 0, crystal: 0, gas: 0 },
      speed: 1,
      cargoCapacity: 100,
      mission: {
        kind: 'expedition',
        targetPlanetId: fixture.attackerPlanet.galaxyPlanetId,
      },
    };
    const report = {
      id: 'expedition-rehome-report',
      empireId: fixture.target.ownerEmpireId,
      fleetId: expeditionFleet.id,
      originPlanetId: fixture.target.id,
      targetGalaxyPlanetId: fixture.attackerPlanet.galaxyPlanetId,
      startedAt: 0,
      resolvesAt: 60,
      outcome: 'salvage' as const,
      reward: { metal: 100, crystal: 50, gas: 10 },
      losses: {},
      narrative: 'test',
    };
    const expeditionEvent: ScheduledGameEvent = {
      id: 'event-expedition-rehome',
      executeAt: 60,
      sequence: fixture.state.nextEventSequence,
      payload: { type: 'EXPEDITION_RESOLVE', report },
    };
    const stationedFleet: FleetState = {
      ...expeditionFleet,
      id: 'fleet-stationed-destroyed',
      status: 'stationed',
      mission: null,
      location: { type: 'planet', planetId: fixture.target.id },
    };
    const state: GameState = {
      ...fixture.state,
      fleets: [...fixture.state.fleets, expeditionFleet, stationedFleet],
      debrisFields: [
        ...fixture.state.debrisFields,
        {
          id: `debris-${fixture.target.id}`,
          planetId: fixture.target.id,
          coordinate: fixture.target.coordinate,
          metal: 500,
          crystal: 250,
          createdAt: 0,
        },
      ],
      logisticsRoutes: [
        ...fixture.state.logisticsRoutes,
        {
          id: 'route-destroyed',
          empireId: fixture.target.ownerEmpireId,
          originPlanetId: fixture.target.id,
          targetPlanetId: fixture.fallback.id,
          resourceId: 'metal',
          amountPerTrip: 10,
          originReserve: 0,
          intervalSeconds: 300,
          priority: 1,
          status: 'active',
          nextDepartureAt: 300,
          consecutiveMisses: 0,
          lastResult: null,
        },
      ],
      pendingEvents: [...fixture.state.pendingEvents, expeditionEvent].sort(
        (left, right) => left.executeAt - right.executeAt || left.sequence - right.sequence,
      ),
    };

    const reconciled = reconcileDestroyedPlanet(state, fixture.target.id).state;
    expect(reconciled.planets.some((planet) => planet.id === fixture.target.id)).toBe(false);
    expect(reconciled.fleets.some((fleet) => fleet.id === stationedFleet.id)).toBe(false);
    expect(reconciled.logisticsRoutes.some((route) => route.id === 'route-destroyed')).toBe(false);
    expect(
      reconciled.debrisFields.some(
        (field) => field.planetId === fixture.target.galaxyPlanetId,
      ),
    ).toBe(true);
    const liveExpedition = reconciled.fleets.find(
      (fleet) => fleet.id === expeditionFleet.id,
    );
    expect(liveExpedition?.originPlanetId).toBe(fixture.fallback.id);
    const liveEvent = reconciled.pendingEvents.find(
      (event) => event.id === expeditionEvent.id,
    );
    if (liveEvent?.payload.type !== 'EXPEDITION_RESOLVE') {
      throw new Error('Rehomed expedition event missing.');
    }
    expect(liveEvent.payload.report.originPlanetId).toBe(fixture.target.id);
    expect(liveEvent.payload.report.returnPlanetId).toBe(fixture.fallback.id);

    const advanced = executeCommand(reconciled, {
      type: 'ADVANCE_TIME',
      seconds: 60,
    });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) return;
    const returned = advanced.value.fleets.find(
      (fleet) => fleet.id === expeditionFleet.id,
    );
    expect(returned?.location).toEqual({
      type: 'planet',
      planetId: fixture.fallback.id,
    });
    const saved = createSaveEnvelope(
      'planet-destruction-reconcile',
      advanced.value,
      '2026-07-28T00:00:00.000Z',
    );
    expect(parseSaveJson(serializeSave(saved)).ok).toBe(true);
  });

  it('allows recycling debris at the released galaxy coordinate', () => {
    const fixture = destructionFixture('planet-recycle-released');
    const reconciled = reconcileDestroyedPlanet({
      ...fixture.state,
      debrisFields: [
        {
          id: `debris-${fixture.target.id}`,
          planetId: fixture.target.id,
          coordinate: fixture.target.coordinate,
          metal: 500,
          crystal: 250,
          createdAt: 0,
        },
      ],
    }, fixture.target.id).state;
    const recyclerId = getFactionMechanicalRoles('aegis').ships.recycler;
    const fleet: FleetState = {
      id: 'fleet-recycle-released',
      empireId: 'player',
      originPlanetId: fixture.attackerPlanet.id,
      location: { type: 'planet', planetId: fixture.attackerPlanet.id },
      status: 'stationed',
      ships: { [recyclerId]: 2 },
      cargo: { metal: 0, crystal: 0, gas: 0 },
      speed: 1,
      cargoCapacity: 10_000,
      mission: null,
    };
    const state = { ...reconciled, fleets: [...reconciled.fleets, fleet] };
    const availability = getMissionAvailability(state, {
      type: 'SEND_FLEET',
      empireId: 'player',
      fleetId: fleet.id,
      mission: 'recycle',
      targetPlanetId: fixture.target.galaxyPlanetId,
    });
    expect(availability.allowed).toBe(true);
  });
});

describe('attack destruction integration', () => {
  it('removes a secondary colony and survives save/load', () => {
    const fixture = destructionFixture('planet-destruction-attack');
    const destroyerId = getFactionMechanicalRoles('aegis').ships.complete.planetDestroyer;
    let state = setWeaponLevel(fixture.state, 'player', destroyerId, 10);
    const attacker: FleetState = {
      id: 'fleet-destruction-attack',
      empireId: 'player',
      originPlanetId: fixture.attackerPlanet.id,
      location: { type: 'planet', planetId: fixture.attackerPlanet.id },
      status: 'stationed',
      ships: { [destroyerId]: 20 },
      cargo: { metal: 0, crystal: 0, gas: 0 },
      speed: 2,
      cargoCapacity: 100_000,
      mission: null,
    };
    const target = {
      ...fixture.target,
      inventory: { ...fixture.target.inventory, defenses: {} },
    };
    state = {
      ...state,
      planets: state.planets.map((planet) => planet.id === target.id ? target : planet),
      fleets: [...state.fleets, attacker],
    };
    let sequence = 1;
    while (sequence < 10_000) {
      const chance = resolvePlanetDestruction({
        state,
        attackerEmpireId: 'player',
        attackerFleetId: attacker.id,
        attackerRemaining: attacker.ships,
        defenderEmpireId: target.ownerEmpireId,
        defenderRemaining: {},
        activeDefenses: {},
        targetPlanetId: target.id,
        targetGalaxyPlanetId: target.galaxyPlanetId,
        winner: 'attacker',
        eventSequence: sequence,
        poliasReductionBasisPoints: 0,
      });
      if (chance.rollBasisPoints < 3_000) break;
      sequence += 1;
    }
    const resolution = resolveAttackMission(state, attacker, target, sequence);
    expect(resolution.report.winner).toBe('attacker');
    expect(resolution.report.destruction?.planetDestroyed).toBe(true);
    expect(resolution.state.planets.some((planet) => planet.id === target.id)).toBe(false);
    expect(resolution.report.targetGalaxyPlanetId).toBe(target.galaxyPlanetId);
    expect(resolution.report.targetCoordinate).toEqual(target.coordinate);
    const saved = createSaveEnvelope(
      'planet-destruction-attack',
      resolution.state,
      '2026-07-28T00:00:00.000Z',
    );
    expect(parseSaveJson(serializeSave(saved)).ok).toBe(true);
  });
});
