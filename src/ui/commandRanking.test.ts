import { describe, expect, it } from 'vitest';
import type { BattleWinner } from '../simulation/combat/types';
import { createInitialGameState } from '../simulation/createInitialGameState';
import type { SolarWarResult } from '../simulation/endgame/types';
import { PIRATE_EMPIRE_ID } from '../simulation/pve/neutralForces';
import type { ArenaResult } from '../simulation/pveMeta/reputation';
import type {
  ExecutedGameEvent,
  GameState,
  ScheduledGameEvent,
} from '../simulation/types';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../storage/saveFormat';
import { createEmpireRanking, createPlayerCommandProfile } from './commandRanking';

const SAVE_TIME = '2026-08-24T18:30:00.000Z';

function executedEvent(
  sequence: number,
  executedAt: number,
  payload: ScheduledGameEvent['payload'],
): ExecutedGameEvent {
  return {
    event: {
      id: `event-ranking-${sequence}`,
      executeAt: executedAt,
      sequence,
      payload,
    },
    executedAt,
  };
}

function successfulExpedition(sequence: number, executedAt: number): ExecutedGameEvent {
  return executedEvent(sequence, executedAt, {
    type: 'EXPEDITION_RESOLVE',
    report: {
      id: `ranking-expedition-${sequence}`,
      empireId: 'player',
      fleetId: 'ranking-expedition-fleet',
      originPlanetId: 'ranking-player-home',
      targetGalaxyPlanetId: 'ranking-expedition-target',
      startedAt: executedAt - 600,
      resolvesAt: executedAt,
      outcome: 'salvage',
      reward: { metal: 200, crystal: 100, gas: 40 },
      losses: {},
      narrative: 'Ranking regression expedition.',
    },
  });
}

function successfulSpaceObject(sequence: number, executedAt: number): ExecutedGameEvent {
  return executedEvent(sequence, executedAt, {
    type: 'SPACE_OBJECT_MISSION_RESOLVE',
    report: {
      id: `ranking-space-object-${sequence}`,
      empireId: 'player',
      fleetId: 'ranking-object-fleet',
      originPlanetId: 'ranking-player-home',
      objectId: 'ranking-space-object-target',
      startedAt: executedAt - 900,
      resolvesAt: executedAt,
      reward: { metal: 0, crystal: 0, gas: 0, exoticMatter: 2 },
      depletion: 2,
      losses: {},
      controllerUntil: executedAt + 3_600,
      narrative: 'Ranking regression object operation.',
    },
  });
}

function battleEvent(
  sequence: number,
  executedAt: number,
  options: {
    readonly attacker?: string;
    readonly defender?: string;
    readonly winner?: BattleWinner;
    readonly mode?: 'pve' | 'pvp';
    readonly reportId?: string;
  } = {},
): ExecutedGameEvent {
  const attacker = options.attacker ?? 'player';
  const defender = options.defender ?? 'aegis-bot';
  const winner = options.winner ?? 'attacker';
  return executedEvent(sequence, executedAt, {
    type: 'BATTLE_REPORT',
    report: {
      id: options.reportId ?? `ranking-battle-${sequence}`,
      seed: sequence,
      resolvedAt: executedAt,
      targetPlanetId: 'ranking-battle-target',
      attackerEmpireId: attacker,
      defenderEmpireId: defender,
      winner,
      rounds: [],
      attackerInitial: { 'ship.aegis.fighter': 5 },
      defenderInitial: { 'ship.aegis.fighter': 4 },
      attackerRemaining: winner === 'defender' ? {} : { 'ship.aegis.fighter': 3 },
      defenderRemaining: winner === 'attacker' ? {} : { 'ship.aegis.fighter': 2 },
      ...(options.mode === undefined ? {} : { mode: options.mode }),
    },
  });
}

function arenaResult(
  outcome: ArenaResult['outcome'],
  resolvedAt: number,
  id = `ranking-arena-${outcome}`,
): ArenaResult {
  return {
    id,
    entryId: `${id}-entry`,
    challengeId: `${id}-challenge`,
    empireId: 'player',
    fleetId: `${id}-fleet`,
    difficulty: 'assault',
    resolvedAt,
    outcome,
    attackerInitial: { 'ship.aegis.fighter': 10 },
    enemyInitial: { 'ship.synod.fighter': 8 },
    attackerRemaining: outcome === 'defeat' ? {} : { 'ship.aegis.fighter': 6 },
    enemyRemaining: outcome === 'victory' ? {} : { 'ship.synod.fighter': 3 },
    rewardGranted: outcome === 'victory'
      ? { metal: 4_000, crystal: 2_000, gas: 700 }
      : { metal: 0, crystal: 0, gas: 0 },
    reputationAward: outcome === 'victory' ? 20 : 0,
  };
}

function solarWarResult(
  outcome: SolarWarResult['outcome'],
  resolvedAt: number,
  cycleIndex: number,
): SolarWarResult {
  const winner: BattleWinner = outcome === 'victory'
    ? 'attacker'
    : outcome === 'defeat'
      ? 'defender'
      : 'draw';
  const cycleId = `solar-war-${cycleIndex}`;
  return {
    id: `ranking-solar-war-${cycleIndex}-${outcome}`,
    entryId: `ranking-solar-war-entry-${cycleIndex}`,
    cycleId,
    cycleIndex,
    empireId: 'player',
    fleetId: `ranking-solar-war-fleet-${cycleIndex}`,
    originPlanetId: 'ranking-player-home',
    participationKind: 'solo',
    participationId: 'player',
    allianceId: null,
    resolvedAt,
    outcome,
    score: outcome === 'victory' ? 1_000 : 0,
    attackerInitial: { 'ship.aegis.fighter': 10 },
    enemyInitial: { 'ship.synod.fighter': 8 },
    attackerRemaining: winner === 'defender' ? {} : { 'ship.aegis.fighter': 4 },
    enemyRemaining: winner === 'attacker' ? {} : { 'ship.synod.fighter': 2 },
    battleReport: {
      id: `ranking-solar-war-battle-${cycleIndex}`,
      seed: cycleIndex,
      resolvedAt,
      targetPlanetId: cycleId,
      attackerEmpireId: 'player',
      defenderEmpireId: 'solar-war-synod',
      winner,
      rounds: [],
      attackerInitial: { 'ship.aegis.fighter': 10 },
      defenderInitial: { 'ship.synod.fighter': 8 },
      attackerRemaining: winner === 'defender' ? {} : { 'ship.aegis.fighter': 4 },
      defenderRemaining: winner === 'attacker' ? {} : { 'ship.synod.fighter': 2 },
      mode: 'pve',
    },
  };
}

function withArenaHistory(
  base: GameState,
  arenaHistory: readonly ArenaResult[],
): GameState {
  return {
    ...base,
    pveMeta: {
      ...base.pveMeta!,
      arenaHistory,
    },
  };
}

function withSolarWarHistory(
  base: GameState,
  history: readonly SolarWarResult[],
): GameState {
  return {
    ...base,
    endgameParticipation: {
      ...base.endgameParticipation!,
      solarWar: {
        ...base.endgameParticipation!.solarWar,
        history,
      },
    },
  };
}

describe('command ranking', () => {
  it('contains every empire exactly once and is deterministically sorted', () => {
    const state = createInitialGameState('ranking-deterministic');
    const first = createEmpireRanking(state);
    const second = createEmpireRanking(state);
    expect(first).toEqual(second);
    expect(first.map((entry) => entry.empireId).sort()).toEqual([...state.empires].sort());
    expect(first.map((entry) => entry.rank)).toEqual([1, 2, 3, 4]);
    for (let index = 1; index < first.length; index += 1) {
      expect(first[index - 1]?.score).toBeGreaterThanOrEqual(first[index]?.score ?? 0);
    }
  });

  it('raises the player rank when its economy is substantially increased', () => {
    const state = createInitialGameState('ranking-player');
    const boosted = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.ownerEmpireId !== 'player'
          ? planet
          : {
              ...planet,
              economy: {
                ...planet.economy,
                resources: Object.fromEntries(
                  Object.entries(planet.economy.resources).map(([resourceId, stock]) => [
                    resourceId,
                    { ...stock, amount: stock.amount + 10_000_000 },
                  ]),
                ) as typeof planet.economy.resources,
              },
            },
      ),
    };
    expect(createPlayerCommandProfile(boosted).rank).toBe(1);
  });

  it('counts only combat victories when successful operations and Arena history are mixed', () => {
    const base = createInitialGameState('ranking-combat-victory-truth');
    const state: GameState = {
      ...withArenaHistory(base, [arenaResult('victory', 3_000)]),
      eventLog: [
        successfulExpedition(1, 1_000),
        successfulSpaceObject(2, 2_000),
      ],
    };

    expect(createPlayerCommandProfile(state).victories).toBe(1);
  });

  it('counts a PvP attacker victory only for the attacker', () => {
    const base = createInitialGameState('ranking-pvp-attacker');
    const state = { ...base, eventLog: [battleEvent(1, 1_000, { mode: 'pvp' })] };

    const ranking = createEmpireRanking(state);
    expect(ranking.find((entry) => entry.empireId === 'player')?.victories).toBe(1);
    expect(ranking.find((entry) => entry.empireId === 'aegis-bot')?.victories).toBe(0);
  });

  it('counts a PvP defender victory only for the defender', () => {
    const base = createInitialGameState('ranking-pvp-defender');
    const state = {
      ...base,
      eventLog: [battleEvent(1, 1_000, {
        attacker: 'aegis-bot',
        defender: 'player',
        winner: 'defender',
        mode: 'pvp',
      })],
    };

    const ranking = createEmpireRanking(state);
    expect(ranking.find((entry) => entry.empireId === 'aegis-bot')?.victories).toBe(0);
    expect(ranking.find((entry) => entry.empireId === 'player')?.victories).toBe(1);
  });

  it('counts pirate combat victory and preserves legacy mode inference', () => {
    const base = createInitialGameState('ranking-pirate-combat');
    const state = {
      ...base,
      eventLog: [battleEvent(1, 1_000, {
        defender: PIRATE_EMPIRE_ID,
        winner: 'attacker',
      })],
    };

    expect(createPlayerCommandProfile(state).victories).toBe(1);
  });

  it('counts Arena victory but excludes draw, defeat and withdrawal', () => {
    const base = createInitialGameState('ranking-arena-outcomes');
    const state = withArenaHistory(base, [
      arenaResult('victory', 4_000),
      arenaResult('draw', 3_000),
      arenaResult('defeat', 2_000),
      arenaResult('withdrawn', 1_000),
    ]);

    expect(createPlayerCommandProfile(state).victories).toBe(1);
  });

  it('counts Solar War victory but excludes draw and defeat', () => {
    const base = createInitialGameState('ranking-solar-war-outcomes');
    const state = withSolarWarHistory(base, [
      solarWarResult('victory', 1_000, 1),
      solarWarResult('draw', 2_000, 2),
      solarWarResult('defeat', 3_000, 3),
    ]);

    expect(createPlayerCommandProfile(state).victories).toBe(1);
  });

  it('adds exactly the existing 500-point component for one combat victory', () => {
    const base = createInitialGameState('ranking-victory-score-weight');
    const before = createPlayerCommandProfile(base);
    const after = createPlayerCommandProfile({
      ...base,
      eventLog: [battleEvent(1, 1_000, { mode: 'pvp' })],
    });

    expect(after.victories).toBe(before.victories + 1);
    expect(after.score).toBe(before.score + 500);
  });

  it('counts a canonical report id at most once', () => {
    const base = createInitialGameState('ranking-no-double-count');
    const duplicate = arenaResult('victory', 1_000, 'ranking-arena-duplicate');
    const state = withArenaHistory(base, [duplicate, duplicate]);

    expect(createPlayerCommandProfile(state).victories).toBe(1);
  });

  it('keeps victories and score invariant when event history order changes', () => {
    const base = createInitialGameState('ranking-order-invariant');
    const events = [
      battleEvent(1, 1_000, { mode: 'pvp' }),
      successfulExpedition(2, 2_000),
      battleEvent(3, 3_000, {
        attacker: 'aegis-bot',
        defender: 'player',
        winner: 'defender',
        mode: 'pvp',
      }),
    ];
    const forward = createPlayerCommandProfile({ ...base, eventLog: events });
    const reversed = createPlayerCommandProfile({ ...base, eventLog: [...events].reverse() });

    expect(reversed.victories).toBe(forward.victories);
    expect(reversed.score).toBe(forward.score);
  });

  it('derives the same ranking after a real schema-v19 save/load round trip', () => {
    const base = createInitialGameState('ranking-save-load');
    const state = withArenaHistory(base, [arenaResult('victory', 1_000)]);
    const before = createPlayerCommandProfile(state);
    const parsed = parseSaveJson(serializeSave(createSaveEnvelope('ranking-save', state, SAVE_TIME)));

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.formatVersion).toBe(6);
    expect(parsed.value.state.schemaVersion).toBe(20);
    const after = createPlayerCommandProfile(parsed.value.state);
    expect(after.victories).toBe(before.victories);
    expect(after.score).toBe(before.score);
  });
});
