import { describe, expect, it } from 'vitest';
import { createStateChecksum } from '../../src/simulation/checksum';
import { stableFleetIdentityContribution } from '../../src/simulation/combat/combatIdentity';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import type { FleetState } from '../../src/simulation/fleets/types';
import { compactGameStateHistory } from '../../src/simulation/history/stateHistory';
import {
  ARENA_CYCLE_SECONDS,
  applyArenaResolutionEvent,
  getArenaChallenges,
} from '../../src/simulation/pveMeta/arena';
import {
  normalizePveMetaState,
  type ArenaEntry,
  type ArenaResult,
} from '../../src/simulation/pveMeta/reputation';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState, ScheduledGameEvent } from '../../src/simulation/types';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

const SAVE_TIME = '2026-08-02T15:00:00.000Z';

type ArenaResolutionEvent = ScheduledGameEvent & {
  readonly payload: {
    readonly type: 'ARENA_RESOLVE';
    readonly entryId: string;
  };
};

function mixArenaSeed(value: number): number {
  let mixed = value >>> 0;
  mixed ^= mixed >>> 16;
  mixed = Math.imul(mixed, 0x7feb352d);
  mixed ^= mixed >>> 15;
  mixed = Math.imul(mixed, 0x846ca68b);
  mixed ^= mixed >>> 16;
  return mixed >>> 0;
}

function createArenaState(
  seed: string,
  ships: Readonly<Record<string, number>>,
  fleetId = 'arena-player-fleet',
): { readonly state: GameState; readonly fleet: FleetState; readonly originId: string } {
  const initial = createInitialGameState(seed);
  const origin = initial.planets.find((planet) => planet.ownerEmpireId === 'player');
  if (origin === undefined) throw new Error('Player Arena origin is missing.');
  const fundedOrigin = {
    ...origin,
    economy: {
      ...origin.economy,
      resources: {
        metal: { ...origin.economy.resources.metal, amount: 40_000 },
        crystal: { ...origin.economy.resources.crystal, amount: 40_000 },
        gas: { ...origin.economy.resources.gas, amount: 40_000 },
      },
    },
  };
  const fleet: FleetState = {
    id: fleetId,
    empireId: 'player',
    originPlanetId: origin.id,
    location: { type: 'planet', planetId: origin.id },
    status: 'stationed',
    ships,
    cargo: { metal: 0, crystal: 0, gas: 0 },
    speed: 100,
    cargoCapacity: 10_000,
    mission: null,
  };
  return {
    state: {
      ...initial,
      planets: initial.planets.map((planet) =>
        planet.id === origin.id ? fundedOrigin : planet,
      ),
      fleets: [...initial.fleets, fleet],
    },
    fleet,
    originId: origin.id,
  };
}

function enter(
  state: GameState,
  fleetId: string,
  challengeId: string,
): GameState {
  const entered = executeCommand(state, {
    type: 'ENTER_ARENA_CHALLENGE',
    empireId: 'player',
    fleetId,
    challengeId,
  });
  expect(entered.ok).toBe(true);
  if (!entered.ok) throw new Error(entered.code);
  return entered.value;
}

function advance(state: GameState, seconds: number): GameState {
  const advanced = executeCommand(state, { type: 'ADVANCE_TIME', seconds });
  expect(advanced.ok).toBe(true);
  if (!advanced.ok) throw new Error(advanced.code);
  return advanced.value;
}

function findResolutionEvent(state: GameState): ArenaResolutionEvent {
  const event = state.pendingEvents.find(
    (candidate): candidate is ArenaResolutionEvent => candidate.payload.type === 'ARENA_RESOLVE',
  );
  if (event === undefined) throw new Error('Arena resolution event missing.');
  return event;
}

function activeArenaEntry(state: GameState): ArenaEntry {
  const entry = state.pveMeta?.activeArenaEntries[0];
  if (entry === undefined) throw new Error('Arena entry missing.');
  return entry;
}

function withoutResolutionSeed(entry: ArenaEntry): ArenaEntry {
  const { resolutionSeed: _resolutionSeed, ...legacyEntry } = entry;
  return legacyEntry;
}

function resolveArenaWithoutEconomyAccrual(
  state: GameState,
  event: ArenaResolutionEvent,
): GameState {
  return applyArenaResolutionEvent(
    {
      ...state,
      clock: { ...state.clock, elapsedSeconds: event.executeAt },
      pendingEvents: state.pendingEvents.filter((candidate) => candidate.id !== event.id),
    },
    event,
  );
}

function latestArenaCombat(state: GameState) {
  const result = state.pveMeta?.arenaHistory.at(-1);
  if (result === undefined) throw new Error('Arena result missing.');
  return {
    outcome: result.outcome,
    attackerInitial: result.attackerInitial,
    enemyInitial: result.enemyInitial,
    attackerRemaining: result.attackerRemaining,
    enemyRemaining: result.enemyRemaining,
    rewardGranted: result.rewardGranted,
    reputationAward: result.reputationAward,
  };
}

function resourcesAt(state: GameState, planetId: string) {
  const planet = state.planets.find((candidate) => candidate.id === planetId);
  if (planet === undefined) throw new Error('Arena origin disappeared.');
  return {
    metal: planet.economy.resources.metal.amount,
    crystal: planet.economy.resources.crystal.amount,
    gas: planet.economy.resources.gas.amount,
  };
}

describe('local deterministic Arena challenges', () => {
  it('derives exactly three public challenges per six-hour cycle', () => {
    const initial = createInitialGameState('arena-public-challenges');
    const first = getArenaChallenges(initial);
    const repeated = getArenaChallenges(structuredClone(initial));
    expect(first).toEqual(repeated);
    expect(first).toHaveLength(3);
    expect(first.map((challenge) => challenge.difficulty)).toEqual([
      'patrol',
      'assault',
      'elite',
    ]);
    expect(new Set(first.map((challenge) => challenge.id)).size).toBe(3);

    const hiddenChanged = {
      ...initial,
      planets: initial.planets.map((planet) => ({
        ...planet,
        economy: {
          ...planet.economy,
          resources: {
            ...planet.economy.resources,
            metal: { ...planet.economy.resources.metal, amount: 999_999 },
          },
        },
      })),
    };
    expect(getArenaChallenges(hiddenChanged)).toEqual(first);

    const nextCycle = {
      ...initial,
      clock: { ...initial.clock, elapsedSeconds: ARENA_CYCLE_SECONDS },
    };
    expect(getArenaChallenges(nextCycle).map((challenge) => challenge.id)).not.toEqual(
      first.map((challenge) => challenge.id),
    );
  });

  it('distinguishes equal-length fleet IDs in the exact stored Arena resolution seed', () => {
    const roles = getFactionMechanicalRoles('aegis').ships;
    const ships = { [roles.cruiser]: 20 };
    const left = createArenaState('arena-full-identity', ships, 'arena-fleet-aa');
    const right = createArenaState('arena-full-identity', ships, 'arena-fleet-bb');
    expect(left.fleet.id).toHaveLength(right.fleet.id.length);

    const leftChallenge = getArenaChallenges(left.state)[1]!;
    const rightChallenge = getArenaChallenges(right.state)[1]!;
    expect(rightChallenge).toEqual(leftChallenge);
    const sequence = left.state.nextEventSequence;
    expect(right.state.nextEventSequence).toBe(sequence);

    const leftEntered = enter(left.state, left.fleet.id, leftChallenge.id);
    const rightEntered = enter(right.state, right.fleet.id, rightChallenge.id);
    const leftEntry = activeArenaEntry(leftEntered);
    const rightEntry = activeArenaEntry(rightEntered);
    const leftExpected = mixArenaSeed(
      leftChallenge.combatSeed ^ sequence ^ stableFleetIdentityContribution(left.fleet.id),
    );
    const rightExpected = mixArenaSeed(
      rightChallenge.combatSeed ^ sequence ^ stableFleetIdentityContribution(right.fleet.id),
    );

    expect(leftEntry.resolutionSeed).toBe(leftExpected);
    expect(rightEntry.resolutionSeed).toBe(rightExpected);
    expect(leftEntry.resolutionSeed).not.toBe(rightEntry.resolutionSeed);
  });

  it('derives the same resolution seed for the same fleet identity and entry inputs', () => {
    const roles = getFactionMechanicalRoles('aegis').ships;
    const ships = { [roles.cruiser]: 20 };
    const first = createArenaState('arena-same-identity', ships, 'arena-fleet-same');
    const repeated = createArenaState('arena-same-identity', ships, 'arena-fleet-same');
    const challenge = getArenaChallenges(first.state)[0]!;
    expect(getArenaChallenges(repeated.state)[0]).toEqual(challenge);

    const firstEntered = enter(first.state, first.fleet.id, challenge.id);
    const repeatedEntered = enter(repeated.state, repeated.fleet.id, challenge.id);
    const expected = mixArenaSeed(
      challenge.combatSeed ^ first.state.nextEventSequence ^
      stableFleetIdentityContribution(first.fleet.id),
    );

    expect(activeArenaEntry(firstEntered).resolutionSeed).toBe(expected);
    expect(activeArenaEntry(repeatedEntered).resolutionSeed).toBe(expected);
  });

  it('consumes the persisted resolution seed instead of recomputing mutable fleet identity', () => {
    const roles = getFactionMechanicalRoles('aegis').ships;
    const fixture = createArenaState('arena-snapshot-consumption', {
      [roles.cruiser]: 28,
      [roles.frigate]: 40,
    }, 'arena-fleet-aa');
    const challenge = getArenaChallenges(fixture.state)[1]!;
    const entered = enter(fixture.state, fixture.fleet.id, challenge.id);
    const event = findResolutionEvent(entered);
    const entry = activeArenaEntry(entered);
    if (entry.resolutionSeed === undefined) throw new Error('New Arena seed snapshot missing.');

    const renamedFleetId = 'arena-fleet-bb';
    expect(renamedFleetId).toHaveLength(fixture.fleet.id.length);
    const recomputedFromRenamedIdentity = mixArenaSeed(
      challenge.combatSeed ^ event.sequence ^ stableFleetIdentityContribution(renamedFleetId),
    );
    expect(recomputedFromRenamedIdentity).not.toBe(entry.resolutionSeed);

    const renamedState: GameState = {
      ...entered,
      fleets: entered.fleets.map((fleet) =>
        fleet.id === entry.fleetId ? { ...fleet, id: renamedFleetId } : fleet,
      ),
      pveMeta: {
        ...entered.pveMeta!,
        activeArenaEntries: [{ ...entry, fleetId: renamedFleetId }],
      },
    };
    const originalResolved = resolveArenaWithoutEconomyAccrual(entered, event);
    const renamedResolved = resolveArenaWithoutEconomyAccrual(renamedState, event);

    expect(latestArenaCombat(renamedResolved)).toEqual(latestArenaCombat(originalResolved));
    expect(renamedResolved.fleets.find((fleet) => fleet.id === renamedFleetId)?.ships)
      .toEqual(originalResolved.fleets.find((fleet) => fleet.id === fixture.fleet.id)?.ships);
  });

  it('accepts legacy entries without a seed and validates present seed values', () => {
    const roles = getFactionMechanicalRoles('aegis').ships;
    const fixture = createArenaState('arena-seed-normalization', { [roles.frigate]: 20 });
    const challenge = getArenaChallenges(fixture.state)[0]!;
    const entered = enter(fixture.state, fixture.fleet.id, challenge.id);
    const entry = activeArenaEntry(entered);
    const legacyEntry = withoutResolutionSeed(entry);
    const legacyMeta = {
      ...entered.pveMeta!,
      activeArenaEntries: [legacyEntry],
    };
    const normalizedLegacy = normalizePveMetaState(legacyMeta, entered.empires);
    expect(normalizedLegacy).toBeDefined();
    expect('resolutionSeed' in normalizedLegacy!.activeArenaEntries[0]!).toBe(false);

    expect(normalizePveMetaState({
      ...legacyMeta,
      activeArenaEntries: [{ ...legacyEntry, resolutionSeed: -1 }],
    }, entered.empires)).toBeUndefined();
    expect(normalizePveMetaState({
      ...legacyMeta,
      activeArenaEntries: [{ ...legacyEntry, resolutionSeed: Number.MAX_SAFE_INTEGER + 1 }],
    }, entered.empires)).toBeUndefined();
    expect(normalizePveMetaState(entered.pveMeta, entered.empires)?.activeArenaEntries[0]?.resolutionSeed)
      .toBe(entry.resolutionSeed);
  });

  it('uses the exact old length-based seed for legacy entries and ignores full identity', () => {
    const roles = getFactionMechanicalRoles('aegis').ships;
    const fixture = createArenaState('arena-legacy-fallback', {
      [roles.cruiser]: 28,
      [roles.frigate]: 40,
    }, 'arena-fleet-aa');
    const challenge = getArenaChallenges(fixture.state)[1]!;
    const entered = enter(fixture.state, fixture.fleet.id, challenge.id);
    const event = findResolutionEvent(entered);
    const entry = activeArenaEntry(entered);
    const legacyEntry = withoutResolutionSeed(entry);
    const legacySeed = mixArenaSeed(
      challenge.combatSeed ^ event.sequence ^ fixture.fleet.id.length,
    );
    const fullIdentitySeed = mixArenaSeed(
      challenge.combatSeed ^ event.sequence ^ stableFleetIdentityContribution(fixture.fleet.id),
    );
    expect(fullIdentitySeed).toBe(entry.resolutionSeed);
    expect(legacySeed).not.toBe(fullIdentitySeed);

    const legacyState: GameState = {
      ...entered,
      pveMeta: {
        ...entered.pveMeta!,
        activeArenaEntries: [legacyEntry],
      },
    };
    const explicitOldSeedState: GameState = {
      ...legacyState,
      pveMeta: {
        ...legacyState.pveMeta!,
        activeArenaEntries: [{ ...legacyEntry, resolutionSeed: legacySeed }],
      },
    };
    const legacyResolved = resolveArenaWithoutEconomyAccrual(legacyState, event);
    const explicitOldSeedResolved = resolveArenaWithoutEconomyAccrual(explicitOldSeedState, event);

    expect(latestArenaCombat(legacyResolved)).toEqual(latestArenaCombat(explicitOldSeedResolved));
    expect(legacyResolved.fleets).toEqual(explicitOldSeedResolved.fleets);
    expect(legacyResolved.planets).toEqual(explicitOldSeedResolved.planets);
  });

  it('preserves legacy seed absence and exact outcome through schema19/save6 load', () => {
    const roles = getFactionMechanicalRoles('aegis').ships;
    const fixture = createArenaState('arena-legacy-save-load', {
      [roles.dreadnought]: 40,
      [roles.cruiser]: 80,
    });
    const challenge = getArenaChallenges(fixture.state)[1]!;
    const entered = enter(fixture.state, fixture.fleet.id, challenge.id);
    const legacyEntry = withoutResolutionSeed(activeArenaEntry(entered));
    const legacyState: GameState = {
      ...entered,
      pveMeta: {
        ...entered.pveMeta!,
        activeArenaEntries: [legacyEntry],
      },
    };
    const parsed = parseSaveJson(serializeSave(createSaveEnvelope(
      'arena-legacy-active',
      legacyState,
      SAVE_TIME,
    )));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.value.formatVersion).toBe(6);
    expect(parsed.value.state.schemaVersion).toBe(19);
    const loadedEntry = activeArenaEntry(parsed.value.state);
    expect('resolutionSeed' in loadedEntry).toBe(false);

    const direct = advance(legacyState, challenge.durationSeconds);
    const loaded = advance(parsed.value.state, challenge.durationSeconds);
    expect(createStateChecksum(loaded)).toBe(createStateChecksum(direct));
    expect(loaded.pveMeta).toEqual(direct.pveMeta);
    expect(loaded.fleets).toEqual(direct.fleets);
  });

  it('charges the canonical cost, holds the fleet and enforces one active entry', () => {
    const roles = getFactionMechanicalRoles('aegis').ships;
    const fixture = createArenaState('arena-entry', { [roles.cruiser]: 20 });
    const challenge = getArenaChallenges(fixture.state)[0]!;
    const before = resourcesAt(fixture.state, fixture.originId);
    const entered = enter(fixture.state, fixture.fleet.id, challenge.id);

    expect(resourcesAt(entered, fixture.originId)).toEqual({
      metal: before.metal - challenge.entryCost.metal,
      crystal: before.crystal - challenge.entryCost.crystal,
      gas: before.gas - challenge.entryCost.gas,
    });
    expect(entered.fleets.find((fleet) => fleet.id === fixture.fleet.id)?.status).toBe('holding');
    expect(entered.pveMeta?.activeArenaEntries).toHaveLength(1);
    expect(entered.pendingEvents.some(
      (event) => event.payload.type === 'ARENA_RESOLVE',
    )).toBe(true);

    expect(executeCommand(entered, {
      type: 'ENTER_ARENA_CHALLENGE',
      empireId: 'player',
      fleetId: fixture.fleet.id,
      challengeId: challenge.id,
    })).toMatchObject({ ok: false, code: 'ARENA_ENTRY_ACTIVE' });

    expect(executeCommand(fixture.state, {
      type: 'SCHEDULE_EVENT',
      executeAt: 10,
      payload: { type: 'ARENA_RESOLVE', entryId: 'forged' },
    })).toMatchObject({ ok: false, code: 'RESERVED_EVENT_TYPE' });
  });

  it('withdraws without refund or reward and restores the fleet', () => {
    const roles = getFactionMechanicalRoles('aegis').ships;
    const fixture = createArenaState('arena-withdraw', { [roles.frigate]: 10 });
    const challenge = getArenaChallenges(fixture.state)[1]!;
    const entered = enter(fixture.state, fixture.fleet.id, challenge.id);
    const afterCost = resourcesAt(entered, fixture.originId);
    const entry = activeArenaEntry(entered);

    const withdrawn = executeCommand(entered, {
      type: 'WITHDRAW_ARENA_ENTRY',
      empireId: 'player',
      entryId: entry.id,
    });
    expect(withdrawn.ok).toBe(true);
    if (!withdrawn.ok) return;
    expect(resourcesAt(withdrawn.value, fixture.originId)).toEqual(afterCost);
    expect(withdrawn.value.pveMeta?.activeArenaEntries).toEqual([]);
    expect(withdrawn.value.pveMeta?.arenaHistory.at(-1)).toMatchObject({
      outcome: 'withdrawn',
      rewardGranted: { metal: 0, crystal: 0, gas: 0 },
      reputationAward: 0,
    });
    expect(withdrawn.value.pveMeta?.reputations.find(
      (candidate) => candidate.empireId === 'player',
    )?.reputation).toBe(0);
    expect(withdrawn.value.fleets.find((fleet) => fleet.id === fixture.fleet.id)?.status)
      .toBe('stationed');
    expect(withdrawn.value.pendingEvents.some(
      (event) => event.payload.type === 'ARENA_RESOLVE',
    )).toBe(false);
  });

  it('resolves a strong patrol victory atomically and idempotently', () => {
    const roles = getFactionMechanicalRoles('aegis').ships;
    const fixture = createArenaState('arena-victory', {
      [roles.dreadnought]: 100,
      [roles.cruiser]: 200,
    });
    const challenge = getArenaChallenges(fixture.state)[0]!;
    const entered = enter(fixture.state, fixture.fleet.id, challenge.id);
    const resolutionEvent = findResolutionEvent(entered);
    const beforeResolution = resourcesAt(entered, fixture.originId);
    const resolved = resolveArenaWithoutEconomyAccrual(entered, resolutionEvent);
    const result = resolved.pveMeta?.arenaHistory.at(-1);

    expect(resolved.pveMeta?.activeArenaEntries).toEqual([]);
    expect(result).toMatchObject({
      outcome: 'victory',
      difficulty: 'patrol',
      rewardGranted: challenge.reward,
      reputationAward: 10,
    });
    expect(resourcesAt(resolved, fixture.originId)).toEqual({
      metal: beforeResolution.metal + challenge.reward.metal,
      crystal: beforeResolution.crystal + challenge.reward.crystal,
      gas: beforeResolution.gas + challenge.reward.gas,
    });
    expect(resolved.pveMeta?.reputations.find(
      (candidate) => candidate.empireId === 'player',
    )?.reputation).toBe(10);
    expect(resolved.fleets.find((fleet) => fleet.id === fixture.fleet.id)?.status).toBe('stationed');

    const duplicate = applyArenaResolutionEvent(resolved, resolutionEvent);
    expect(duplicate).toBe(resolved);
  });

  it('grants no reward or reputation to a losing elite entry', () => {
    const roles = getFactionMechanicalRoles('aegis').ships;
    const fixture = createArenaState('arena-defeat', { [roles.scout]: 1 });
    const challenge = getArenaChallenges(fixture.state)[2]!;
    const entered = enter(fixture.state, fixture.fleet.id, challenge.id);
    const resolutionEvent = findResolutionEvent(entered);
    const beforeResolution = resourcesAt(entered, fixture.originId);
    const resolved = resolveArenaWithoutEconomyAccrual(entered, resolutionEvent);
    const result = resolved.pveMeta?.arenaHistory.at(-1);

    expect(result?.outcome).not.toBe('victory');
    expect(result).toMatchObject({
      rewardGranted: { metal: 0, crystal: 0, gas: 0 },
      reputationAward: 0,
    });
    expect(resourcesAt(resolved, fixture.originId)).toEqual(beforeResolution);
    expect(resolved.pveMeta?.reputations.find(
      (candidate) => candidate.empireId === 'player',
    )?.reputation).toBe(0);
  });

  it('preserves a new entry seed through save/load and resolves identically', () => {
    const roles = getFactionMechanicalRoles('aegis').ships;
    const fixture = createArenaState('arena-save-partition', {
      [roles.dreadnought]: 50,
      [roles.cruiser]: 100,
    });
    const challenge = getArenaChallenges(fixture.state)[1]!;
    const entered = enter(fixture.state, fixture.fleet.id, challenge.id);
    const enteredSeed = activeArenaEntry(entered).resolutionSeed;
    expect(enteredSeed).toBeTypeOf('number');
    const envelope = createSaveEnvelope('arena-active', entered, SAVE_TIME);
    const parsed = parseSaveJson(serializeSave(envelope));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(activeArenaEntry(parsed.value.state).resolutionSeed).toBe(enteredSeed);
    const direct = advance(entered, challenge.durationSeconds);
    const loaded = advance(parsed.value.state, challenge.durationSeconds);
    expect(createStateChecksum(loaded)).toBe(createStateChecksum(direct));
    expect(loaded.pveMeta).toEqual(direct.pveMeta);
    expect(loaded.fleets).toEqual(direct.fleets);
  });

  it('repeats the same snapshotted Arena resolution deterministically', () => {
    const roles = getFactionMechanicalRoles('aegis').ships;
    const fixture = createArenaState('arena-repeat-resolution', {
      [roles.cruiser]: 32,
      [roles.frigate]: 48,
    });
    const challenge = getArenaChallenges(fixture.state)[1]!;
    const entered = enter(fixture.state, fixture.fleet.id, challenge.id);
    const event = findResolutionEvent(entered);
    const first = resolveArenaWithoutEconomyAccrual(structuredClone(entered), event);
    const second = resolveArenaWithoutEconomyAccrual(structuredClone(entered), event);

    expect(createStateChecksum(second)).toBe(createStateChecksum(first));
    expect(latestArenaCombat(second)).toEqual(latestArenaCombat(first));
  });

  it('retains only the newest 64 Arena results', () => {
    const initial = createInitialGameState('arena-history-bound');
    const template: ArenaResult = {
      id: 'arena-result-template',
      entryId: 'arena-entry-template',
      challengeId: 'arena-0-0',
      empireId: 'player',
      fleetId: 'arena-fleet',
      difficulty: 'patrol',
      resolvedAt: 0,
      outcome: 'withdrawn',
      attackerInitial: { 'ship.aegis.scout': 1 },
      enemyInitial: { 'ship.aegis.fighter': 1 },
      attackerRemaining: { 'ship.aegis.scout': 1 },
      enemyRemaining: { 'ship.aegis.fighter': 1 },
      rewardGranted: { metal: 0, crystal: 0, gas: 0 },
      reputationAward: 0,
    };
    const withHistory: GameState = {
      ...initial,
      pveMeta: {
        ...initial.pveMeta!,
        arenaHistory: Array.from({ length: 70 }, (_, index) => ({
          ...template,
          id: `arena-result-${index}`,
          entryId: `arena-entry-${index}`,
          resolvedAt: index,
        })),
      },
    };
    const compacted = compactGameStateHistory(withHistory);
    expect(compacted.pveMeta?.arenaHistory).toHaveLength(64);
    expect(compacted.pveMeta?.arenaHistory[0]?.id).toBe('arena-result-6');
    expect(compacted.pveMeta?.arenaHistory.at(-1)?.id).toBe('arena-result-69');
  });
});
