import { describe, expect, it } from 'vitest';
import { calculateDebrisFromLosses } from '../../src/simulation/combat/debris';
import { resolveAttackMission } from '../../src/simulation/combat/resolveAttackMission';
import {
  calculateRecoveredDefenses,
  getDefenseGridCapacity,
  getDefenseGridUsed,
} from '../../src/simulation/defense/planetaryDefense';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import type { FleetState } from '../../src/simulation/fleets/types';
import type { PlanetState } from '../../src/simulation/planet/types';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState } from '../../src/simulation/types';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

const GUN_ID = 'defense.aegis.gun-battery';

function preparePlayerDefenseState(seed: string): GameState {
  const base = createInitialGameState(seed);
  const playerPlanet = base.planets.find((planet) => planet.ownerEmpireId === 'player')!;
  const buildings = [
    ...playerPlanet.buildings.filter((building) => building.buildingId !== 'building.aegis.sensor-array'),
    { buildingId: 'building.aegis.sensor-array', level: 1 },
  ];
  const prepared: PlanetState = {
    ...playerPlanet,
    buildings,
    economy: {
      ...playerPlanet.economy,
      resources: {
        metal: { ...playerPlanet.economy.resources.metal, amount: 100_000, capacity: 100_000 },
        crystal: { ...playerPlanet.economy.resources.crystal, amount: 100_000, capacity: 100_000 },
        gas: { ...playerPlanet.economy.resources.gas, amount: 100_000, capacity: 100_000 },
      },
      population: { ...playerPlanet.economy.population, capacity: 1_000 },
    },
  };
  return {
    ...base,
    planets: base.planets.map((planet) => planet.id === prepared.id ? prepared : planet),
    research: base.research.map((research) =>
      research.empireId === 'player'
        ? {
            ...research,
            levels: {
              ...research.levels,
              'technology.aegis.weapons': 2,
              'technology.aegis.energy': 2,
              'technology.aegis.armor': 1,
            },
          }
        : research,
    ),
  };
}

function advanceTo(state: GameState, targetTime: number): GameState {
  const result = executeCommand(state, {
    type: 'ADVANCE_TIME',
    seconds: targetTime - state.clock.elapsedSeconds,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.message);
  return result.value;
}

describe('planetary defense lifecycle', () => {
  it('counts active, damaged and queued installations against one grid limit', () => {
    const state = preparePlayerDefenseState('defense-grid-limit');
    const planet = state.planets.find((candidate) => candidate.ownerEmpireId === 'player')!;
    const withUsage: PlanetState = {
      ...planet,
      inventory: { ...planet.inventory, defenses: { [GUN_ID]: 4 } },
      defense: { ...planet.defense, damaged: { [GUN_ID]: 3 } },
    };
    expect(getDefenseGridCapacity(withUsage)).toBe(12);
    expect(getDefenseGridUsed(withUsage)).toBe(7);

    const limited: GameState = {
      ...state,
      planets: state.planets.map((candidate) => candidate.id === withUsage.id ? withUsage : candidate),
    };
    const result = executeCommand(limited, {
      type: 'QUEUE_UNIT_BATCH',
      empireId: 'player',
      planetId: withUsage.id,
      unitId: GUN_ID,
      quantity: 6,
    });
    expect(result).toMatchObject({ ok: false, code: 'INSUFFICIENT_DEFENSE_GRID' });
  });

  it('recovers a deterministic bounded share of destroyed installations', () => {
    const initial = { [GUN_ID]: 10 };
    const remaining = { [GUN_ID]: 2 };
    const first = calculateRecoveredDefenses(initial, remaining, 47);
    const second = calculateRecoveredDefenses(initial, remaining, 47);
    expect(first).toEqual(second);
    expect(first[GUN_ID]).toBeGreaterThan(0);
    expect(first[GUN_ID]).toBeLessThanOrEqual(8);

    const withoutRecovery = calculateDebrisFromLosses({}, {}, initial, remaining);
    const withRecovery = calculateDebrisFromLosses(
      {},
      {},
      initial,
      { [GUN_ID]: (remaining[GUN_ID] ?? 0) + (first[GUN_ID] ?? 0) },
    );
    expect(withRecovery.metal).toBeLessThan(withoutRecovery.metal);
    expect(withRecovery.crystal).toBeLessThanOrEqual(withoutRecovery.crystal);
  });

  it('queues repairs, spends resources and restores installations on game time', () => {
    const base = preparePlayerDefenseState('defense-repair-cycle');
    const planet = base.planets.find((candidate) => candidate.ownerEmpireId === 'player')!;
    const damaged: PlanetState = {
      ...planet,
      defense: { ...planet.defense, damaged: { [GUN_ID]: 2 } },
    };
    const state: GameState = {
      ...base,
      planets: base.planets.map((candidate) => candidate.id === damaged.id ? damaged : candidate),
    };
    const beforeMetal = damaged.economy.resources.metal.amount;
    const queued = executeCommand(state, {
      type: 'QUEUE_DEFENSE_REPAIR',
      empireId: 'player',
      planetId: damaged.id,
      unitId: GUN_ID,
      quantity: 2,
    });
    expect(queued.ok).toBe(true);
    if (!queued.ok) return;
    const queuedPlanet = queued.value.planets.find((candidate) => candidate.id === damaged.id)!;
    const item = queuedPlanet.defense.repairQueue[0]!;
    expect(queuedPlanet.economy.resources.metal.amount).toBeLessThan(beforeMetal);
    expect(
      queued.value.pendingEvents.some(
        (event) => event.payload.type === 'DEFENSE_REPAIR_COMPLETE' && event.payload.queueItemId === item.id,
      ),
    ).toBe(true);

    const completed = advanceTo(queued.value, item.completesAt);
    const completedPlanet = completed.planets.find((candidate) => candidate.id === damaged.id)!;
    expect(completedPlanet.inventory.defenses[GUN_ID]).toBe(2);
    expect(completedPlanet.defense.damaged[GUN_ID]).toBeUndefined();
    expect(completedPlanet.defense.repairQueue).toEqual([]);
  });

  it('moves battle losses into the damaged pool and records them in the report', () => {
    const base = createInitialGameState('defense-battle-recovery');
    const origin = base.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    const target = base.planets.find((planet) => planet.ownerEmpireId === 'aegis-bot')!;
    const fortified: PlanetState = {
      ...target,
      inventory: { ...target.inventory, defenses: { [GUN_ID]: 20 } },
    };
    const attacker: FleetState = {
      id: 'defense-test-attacker',
      empireId: 'player',
      originPlanetId: origin.id,
      location: { type: 'planet', planetId: fortified.id },
      status: 'stationed',
      ships: { 'ship.aegis.frigate': 50 },
      cargo: { metal: 0, crystal: 0, gas: 0 },
      speed: 9,
      cargoCapacity: 6_000,
      mission: { kind: 'attack', targetPlanetId: fortified.id },
    };
    const state: GameState = {
      ...base,
      planets: base.planets.map((planet) => planet.id === fortified.id ? fortified : planet),
      fleets: [attacker],
    };
    const result = resolveAttackMission(state, attacker, fortified, 17);
    const updated = result.state.planets.find((planet) => planet.id === fortified.id)!;
    expect(result.report.defensesRecovered).toEqual(updated.defense.damaged);
    expect(Object.values(updated.defense.damaged).reduce((sum, count) => sum + count, 0)).toBeGreaterThan(0);
    expect(updated.inventory.defenses[GUN_ID] ?? 0).toBeLessThan(20);
  });

  it('additively migrates schema-v12 planets without defense state', () => {
    const state = createInitialGameState('defense-additive-migration');
    const legacyPlanets = state.planets.map((planet) => {
      const { defense: _defense, ...legacy } = planet;
      return legacy;
    });
    const legacy = { ...state, planets: legacyPlanets } as unknown as GameState;
    const parsed = parseSaveJson(
      serializeSave(createSaveEnvelope('legacy-defense', legacy, '2026-07-20T12:00:00.000Z')),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.state.planets.every(
      (planet) => Object.keys(planet.defense.damaged).length === 0 && planet.defense.repairQueue.length === 0,
    )).toBe(true);
  });
});
