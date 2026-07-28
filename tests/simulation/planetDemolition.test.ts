import { describe, expect, it } from 'vitest';
import {
  getPlanetDemolitionThreshold,
  resolvePlanetDemolition,
} from '../../src/simulation/combat/planetDemolition';
import {
  getPlanetDestroyerSiegeContributions,
  scaleSiegeValue,
} from '../../src/simulation/combat/planetSiegeConfig';
import { resolveAttackMission } from '../../src/simulation/combat/resolveAttackMission';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import { createPlanetZones } from '../../src/simulation/planet/zones';
import type { PlanetState } from '../../src/simulation/planet/types';
import type { FleetState } from '../../src/simulation/fleets/types';
import type { GameState, ScheduledGameEvent } from '../../src/simulation/types';

function withWeaponLevel(
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

function demolitionFixture(): {
  readonly state: GameState;
  readonly target: PlanetState;
  readonly destroyerId: string;
  readonly regularBuildingId: string;
  readonly lockedBuildingId: string;
  readonly completionEvent: ScheduledGameEvent;
} {
  let state = createInitialGameState('planet-demolition-fixture');
  const target = state.planets.find((planet) => planet.ownerEmpireId !== 'player');
  if (target === undefined) throw new Error('Target planet missing.');
  const roles = getFactionMechanicalRoles('aegis');
  const destroyerId = roles.ships.complete.planetDestroyer;
  const regularBuildingId = roles.buildings.complete.metalPrimary;
  const lockedBuildingId = roles.buildings.complete.galacticObelisk;
  state = withWeaponLevel(state, 'player', destroyerId, 10);
  const queueItem = {
    id: 'build-demolition-target',
    buildingId: regularBuildingId,
    targetLevel: 2,
    startedAt: 0,
    completesAt: 600,
    cost: { metal: 100, crystal: 50, gas: 10 },
  } as const;
  const preparedTarget: PlanetState = {
    ...target,
    factionId: 'aegis',
    buildings: [
      { buildingId: regularBuildingId, level: 1 },
      { buildingId: lockedBuildingId, level: 1 },
    ],
    buildQueue: [queueItem],
    zones: createPlanetZones([
      { buildingId: regularBuildingId, level: 1 },
      { buildingId: lockedBuildingId, level: 1 },
    ]),
  };
  const completionEvent: ScheduledGameEvent = {
    id: 'event-demolition-target',
    executeAt: 600,
    sequence: 999,
    payload: {
      type: 'BUILDING_COMPLETE',
      planetId: preparedTarget.id,
      queueItemId: queueItem.id,
      buildingId: regularBuildingId,
      targetLevel: 2,
    },
  };
  return {
    state: {
      ...state,
      planets: state.planets.map((planet) =>
        planet.id === preparedTarget.id ? preparedTarget : planet,
      ),
      pendingEvents: [...state.pendingEvents, completionEvent],
    },
    target: preparedTarget,
    destroyerId,
    regularBuildingId,
    lockedBuildingId,
    completionEvent,
  };
}

describe('planet siege profiles', () => {
  it('scales level-10 values linearly across weapon levels', () => {
    expect(scaleSiegeValue(100, 0)).toBe(0);
    expect(scaleSiegeValue(100, 1)).toBe(10);
    expect(scaleSiegeValue(100, 5)).toBe(50);
    expect(scaleSiegeValue(100, 10)).toBe(100);
    expect(scaleSiegeValue(90, 5)).toBe(45);
    expect(scaleSiegeValue(55, 5)).toBe(27);
    expect(scaleSiegeValue(100, 99)).toBe(100);
  });

  it('uses the audited faction matrix for surviving planet destroyers', () => {
    let state = createInitialGameState('planet-siege-matrix');
    const ids = {
      aegis: getFactionMechanicalRoles('aegis').ships.complete.planetDestroyer,
      synod: getFactionMechanicalRoles('synod').ships.complete.planetDestroyer,
      veyra: getFactionMechanicalRoles('veyra').ships.complete.planetDestroyer,
    } as const;
    for (const unitId of Object.values(ids)) {
      state = withWeaponLevel(state, 'player', unitId, 10);
    }
    const contributions = getPlanetDestroyerSiegeContributions(
      state.shipUpgrades,
      'player',
      {
        [ids.aegis]: 2,
        [ids.synod]: 2,
        [ids.veyra]: 2,
      },
    );
    expect(
      Object.fromEntries(
        contributions.map((entry) => [entry.factionId, entry.demolitionPointsPerShip]),
      ),
    ).toEqual({ aegis: 100, synod: 90, veyra: 55 });
    expect(
      Object.fromEntries(
        contributions.map((entry) => [
          entry.factionId,
          entry.destructionChanceBasisPointsPerShip,
        ]),
      ),
    ).toEqual({ aegis: 300, synod: 250, veyra: 150 });
  });
});

describe('planet demolition thresholds', () => {
  it.each([
    [0, 0, 0, false],
    [19, 0, 0, false],
    [20, 2_000, 1, false],
    [100, 2_000, 1, false],
    [101, 4_000, 1, false],
    [200, 4_000, 1, false],
    [201, 6_000, 1, false],
    [400, 6_000, 1, false],
    [401, 5_000, 2, false],
    [550, 5_000, 2, false],
    [551, 7_000, 2, false],
    [700, 7_000, 2, false],
    [701, 5_000, 3, false],
    [850, 5_000, 3, false],
    [851, 6_000, 5, false],
    [1_000, 6_000, 5, false],
    [1_001, 3_300, Number.MAX_SAFE_INTEGER, true],
  ])(
    'maps %i points to the audited threshold',
    (points, chance, maximum, selectAll) => {
      expect(getPlanetDemolitionThreshold(points)).toEqual({
        baseChanceBasisPoints: chance,
        maximumSelectedBuildings: maximum,
        selectAllEligible: selectAll,
      });
    },
  );
});

describe('planet demolition resolution', () => {
  it('removes one level, excludes endgame buildings and cancels the matching queue without refund', () => {
    const fixture = demolitionFixture();
    const result = resolvePlanetDemolition({
      state: fixture.state,
      attackerEmpireId: 'player',
      attackerFleetId: 'fleet-demolition',
      attackerRemaining: { [fixture.destroyerId]: 1 },
      target: fixture.target,
      activeDefenses: {},
      winner: 'attacker',
      eventSequence: 77,
      commanderBonusBasisPoints: 10_000,
    });

    expect(result.report?.outcome).toBe('applied');
    expect(result.report?.selectedBuildingIds).toEqual([
      fixture.regularBuildingId,
    ]);
    expect(result.report?.rolls).toEqual([
      expect.objectContaining({
        buildingId: fixture.regularBuildingId,
        levelBefore: 1,
        levelAfter: 0,
        chanceBasisPoints: 10_000,
        demolished: true,
      }),
    ]);
    expect(
      result.planet.buildings.some(
        (building) => building.buildingId === fixture.regularBuildingId,
      ),
    ).toBe(false);
    expect(
      result.planet.buildings.some(
        (building) => building.buildingId === fixture.lockedBuildingId,
      ),
    ).toBe(true);
    expect(result.planet.buildQueue).toEqual([]);
    expect(result.report?.cancelledQueueItemIds).toEqual([
      'build-demolition-target',
    ]);
    expect(result.pendingEvents).not.toContainEqual(fixture.completionEvent);
    expect(result.planet.zones.resource.usedFields).toBe(0);
    expect(result.planet.economy.resources.metal.amount).toBe(
      Math.min(
        fixture.target.economy.resources.metal.amount,
        result.planet.economy.resources.metal.capacity,
      ),
    );
  });

  it('is deterministic and never demolishes after a defender victory', () => {
    const fixture = demolitionFixture();
    const input = {
      state: fixture.state,
      attackerEmpireId: 'player',
      attackerFleetId: 'fleet-deterministic',
      attackerRemaining: { [fixture.destroyerId]: 1 },
      target: fixture.target,
      activeDefenses: {},
      winner: 'attacker' as const,
      eventSequence: 91,
      commanderBonusBasisPoints: 0,
    };
    expect(resolvePlanetDemolition(input)).toEqual(resolvePlanetDemolition(input));

    const blocked = resolvePlanetDemolition({
      ...input,
      winner: 'defender',
      commanderBonusBasisPoints: 10_000,
    });
    expect(blocked.report?.outcome).toBe('battle-result-ineligible');
    expect(blocked.planet).toEqual(fixture.target);
    expect(blocked.pendingEvents).toEqual(fixture.state.pendingEvents);
  });

  it('writes demolition evidence into an ordinary attack report', () => {
    let state = createInitialGameState('planet-demolition-attack-report');
    const origin = state.planets.find((planet) => planet.ownerEmpireId === 'player');
    const target = state.planets.find((planet) => planet.ownerEmpireId !== 'player');
    if (origin === undefined || target === undefined) throw new Error('Planets missing.');
    const destroyerId = getFactionMechanicalRoles('aegis').ships.complete.planetDestroyer;
    state = withWeaponLevel(state, 'player', destroyerId, 10);
    const attacker: FleetState = {
      id: 'fleet-planet-demolition-report',
      empireId: 'player',
      originPlanetId: origin.id,
      location: { type: 'planet', planetId: origin.id },
      status: 'stationed',
      ships: { [destroyerId]: 12 },
      cargo: { metal: 0, crystal: 0, gas: 0 },
      speed: 2,
      cargoCapacity: 60_000,
      mission: null,
    };
    const preparedTarget: PlanetState = {
      ...target,
      inventory: { ...target.inventory, defenses: {} },
    };
    state = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.id === target.id ? preparedTarget : planet,
      ),
      fleets: [...state.fleets, attacker],
    };

    const resolution = resolveAttackMission(state, attacker, preparedTarget, 123);
    expect(resolution.report.winner).toBe('attacker');
    expect(resolution.report.demolition).toBeDefined();
    expect(resolution.report.demolition?.rawPoints).toBe(1_200);
    expect(resolution.report.demolition?.allEligibleBuildingsSelected).toBe(true);
    expect(resolution.report.demolition?.contributions).toEqual([
      expect.objectContaining({
        unitId: destroyerId,
        count: 12,
        weaponLevel: 10,
        pointsPerShip: 100,
        totalPoints: 1_200,
      }),
    ]);
  });
});
