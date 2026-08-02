import { describe, expect, it } from 'vitest';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import type { FleetState } from '../../src/simulation/fleets/types';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import { compactGameStateHistory } from '../../src/simulation/history/stateHistory';
import {
  ARENA_CYCLE_SECONDS,
  applyArenaResolutionEvent,
  getArenaChallenges,
} from '../../src/simulation/pveMeta/arena';
import type { ArenaResult } from '../../src/simulation/pveMeta/reputation';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState, ScheduledGameEvent } from '../../src/simulation/types';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

const SAVE_TIME = '2026-08-02T15:00:00.000Z';

function createArenaState(
  seed: string,
  ships: Readonly<Record<string, number>>,
): { readonly state: GameState; readonly fleet: FleetState; readonly originId: string } {
  const initial = createInitialGameState(seed);
  const origin = initial.planets.find((planet) => planet.ownerEmpireId === 'player');
  if (origin === undefined) throw new Error('Player Arena origin is missing.');
  const fundedOrigin = {
    ...origin,
    economy: {
      ...origin.economy,
      resources: {
        metal: {
          ...origin.economy.resources.metal,
          amount: 40_000,
          productionPerHour: 0,
          productionRemainder: 0,
        },
        crystal: {
          ...origin.economy.resources.crystal,
          amount: 40_000,
          productionPerHour: 0,
          productionRemainder: 0,
        },
        gas: {
          ...origin.economy.resources.gas,
          amount: 40_000,
          productionPerHour: 0,
          productionRemainder: 0,
        },
      },
    },
  };
  const fleet: FleetState = {
    id: 'arena-player-fleet',
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
    const entry = entered.pveMeta?.activeArenaEntries[0];
    if (entry === undefined) throw new Error('Arena entry missing.');

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
      (entry) => entry.empireId === 'player',
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
    const resolutionEvent = entered.pendingEvents.find(
      (event): event is ScheduledGameEvent & { readonly payload: { readonly type: 'ARENA_RESOLVE'; readonly entryId: string } } =>
        event.payload.type === 'ARENA_RESOLVE',
    );
    if (resolutionEvent === undefined) throw new Error('Arena resolution event missing.');
    const beforeResolution = resourcesAt(entered, fixture.originId);
    const resolved = advance(entered, challenge.durationSeconds);
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
      (entry) => entry.empireId === 'player',
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
    const beforeResolution = resourcesAt(entered, fixture.originId);
    const resolved = advance(entered, challenge.durationSeconds);
    const result = resolved.pveMeta?.arenaHistory.at(-1);

    expect(result?.outcome).not.toBe('victory');
    expect(result).toMatchObject({
      rewardGranted: { metal: 0, crystal: 0, gas: 0 },
      reputationAward: 0,
    });
    expect(resourcesAt(resolved, fixture.originId)).toEqual(beforeResolution);
    expect(resolved.pveMeta?.reputations.find(
      (entry) => entry.empireId === 'player',
    )?.reputation).toBe(0);
  });

  it('preserves an active entry through save/load and resolves identically', () => {
    const roles = getFactionMechanicalRoles('aegis').ships;
    const fixture = createArenaState('arena-save-partition', {
      [roles.dreadnought]: 50,
      [roles.cruiser]: 100,
    });
    const challenge = getArenaChallenges(fixture.state)[1]!;
    const entered = enter(fixture.state, fixture.fleet.id, challenge.id);
    const envelope = createSaveEnvelope('arena-active', entered, SAVE_TIME);
    const parsed = parseSaveJson(serializeSave(envelope));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const direct = advance(entered, challenge.durationSeconds);
    const loaded = advance(parsed.value.state, challenge.durationSeconds);
    expect(createStateChecksum(loaded)).toBe(createStateChecksum(direct));
    expect(loaded.pveMeta).toEqual(direct.pveMeta);
    expect(loaded.fleets).toEqual(direct.fleets);
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