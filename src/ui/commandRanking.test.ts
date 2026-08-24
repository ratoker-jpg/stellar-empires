import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../simulation/createInitialGameState';
import type { ArenaResult } from '../simulation/pveMeta/reputation';
import type {
  ExecutedGameEvent,
  GameState,
  ScheduledGameEvent,
} from '../simulation/types';
import { createEmpireRanking, createPlayerCommandProfile } from './commandRanking';

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

function arenaVictory(resolvedAt: number): ArenaResult {
  return {
    id: 'ranking-arena-victory',
    entryId: 'ranking-arena-entry',
    challengeId: 'ranking-arena-challenge',
    empireId: 'player',
    fleetId: 'ranking-arena-fleet',
    difficulty: 'assault',
    resolvedAt,
    outcome: 'victory',
    attackerInitial: { 'ship.aegis.fighter': 10 },
    enemyInitial: { 'ship.synod.fighter': 8 },
    attackerRemaining: { 'ship.aegis.fighter': 6 },
    enemyRemaining: {},
    rewardGranted: { metal: 4_000, crystal: 2_000, gas: 700 },
    reputationAward: 20,
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
      ...base,
      eventLog: [
        successfulExpedition(1, 1_000),
        successfulSpaceObject(2, 2_000),
      ],
      pveMeta: {
        ...base.pveMeta!,
        arenaHistory: [arenaVictory(3_000)],
      },
    };

    expect(createPlayerCommandProfile(state).victories).toBe(1);
  });
});
