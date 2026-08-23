import { describe, expect, it } from 'vitest';
import {
  deriveRecentBotBattleOutcomeSignal,
  RECENT_BOT_BATTLE_WINDOW,
} from '../../src/simulation/bots/outcomeSignals';
import type { BattleMode, BattleReport, BattleWinner } from '../../src/simulation/combat/types';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { PIRATE_EMPIRE_ID } from '../../src/simulation/pve/neutralForces';
import type { ExecutedGameEvent, GameState } from '../../src/simulation/types';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

const EMPIRE = 'aegis-bot';
const OPPONENT = 'player';

interface BattleEventOptions {
  readonly id: string;
  readonly executeAt: number;
  readonly sequence: number;
  readonly attackerEmpireId?: string;
  readonly defenderEmpireId?: string;
  readonly winner: BattleWinner;
  readonly mode?: BattleMode;
  readonly legacyModeOmitted?: boolean;
}

function battleEvent(options: BattleEventOptions): ExecutedGameEvent {
  const report: BattleReport = {
    id: options.id,
    seed: options.sequence,
    resolvedAt: options.executeAt,
    targetPlanetId: `target-${options.id}`,
    attackerEmpireId: options.attackerEmpireId ?? EMPIRE,
    defenderEmpireId: options.defenderEmpireId ?? OPPONENT,
    winner: options.winner,
    rounds: [],
    attackerInitial: {},
    defenderInitial: {},
    attackerRemaining: {},
    defenderRemaining: {},
    ...(options.legacyModeOmitted ? {} : { mode: options.mode ?? 'pvp' }),
  };
  return {
    event: {
      id: `event-${options.id}`,
      executeAt: options.executeAt,
      sequence: options.sequence,
      payload: { type: 'BATTLE_REPORT', report },
    },
    executedAt: options.executeAt,
  };
}

function withEvents(events: readonly ExecutedGameEvent[]): GameState {
  return {
    ...createInitialGameState('bot-outcome-signals'),
    eventLog: events,
  };
}

function signal(events: readonly ExecutedGameEvent[]) {
  return deriveRecentBotBattleOutcomeSignal(withEvents(events), EMPIRE);
}

describe('recent bot battle outcome signal', () => {
  it('uses an exact latest-three battle window and returns none for an empty event log', () => {
    expect(RECENT_BOT_BATTLE_WINDOW).toBe(3);
    expect(signal([])).toEqual({
      consideredBattles: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      recoveryBias: 'none',
    });
  });

  it('classifies attacker and defender results from the target empire perspective', () => {
    expect(signal([battleEvent({ id: 'attacker-win', executeAt: 1, sequence: 1, winner: 'attacker' })]))
      .toMatchObject({ wins: 1, losses: 0, draws: 0, recoveryBias: 'none' });
    expect(signal([battleEvent({ id: 'attacker-loss', executeAt: 1, sequence: 1, winner: 'defender' })]))
      .toMatchObject({ wins: 0, losses: 1, draws: 0, recoveryBias: 'loss-dominant' });
    expect(signal([battleEvent({
      id: 'defender-win',
      executeAt: 1,
      sequence: 1,
      attackerEmpireId: OPPONENT,
      defenderEmpireId: EMPIRE,
      winner: 'defender',
    })])).toMatchObject({ wins: 1, losses: 0, draws: 0, recoveryBias: 'none' });
    expect(signal([battleEvent({
      id: 'defender-loss',
      executeAt: 1,
      sequence: 1,
      attackerEmpireId: OPPONENT,
      defenderEmpireId: EMPIRE,
      winner: 'attacker',
    })])).toMatchObject({ wins: 0, losses: 1, draws: 0, recoveryBias: 'loss-dominant' });
    expect(signal([battleEvent({ id: 'draw', executeAt: 1, sequence: 1, winner: 'draw' })]))
      .toMatchObject({ wins: 0, losses: 0, draws: 1, recoveryBias: 'none' });
  });

  it('considers an explicit PvP report', () => {
    expect(signal([
      battleEvent({
        id: 'explicit-pvp-loss',
        executeAt: 5,
        sequence: 1,
        winner: 'defender',
        mode: 'pvp',
      }),
    ])).toEqual({
      consideredBattles: 1,
      wins: 0,
      losses: 1,
      draws: 0,
      recoveryBias: 'loss-dominant',
    });
  });

  it('ignores an explicit PvE report', () => {
    expect(signal([
      battleEvent({
        id: 'explicit-pve-loss',
        executeAt: 5,
        sequence: 1,
        winner: 'defender',
        mode: 'pve',
      }),
    ])).toEqual({
      consideredBattles: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      recoveryBias: 'none',
    });
  });

  it('treats legacy mode-less non-pirate battles as PvP', () => {
    expect(signal([
      battleEvent({
        id: 'legacy-pvp-loss',
        executeAt: 6,
        sequence: 1,
        winner: 'defender',
        legacyModeOmitted: true,
      }),
    ])).toEqual({
      consideredBattles: 1,
      wins: 0,
      losses: 1,
      draws: 0,
      recoveryBias: 'loss-dominant',
    });
  });

  it('treats legacy mode-less pirate battles as PvE for either pirate side', () => {
    const events = [
      battleEvent({
        id: 'legacy-pirate-attacker',
        executeAt: 7,
        sequence: 1,
        attackerEmpireId: PIRATE_EMPIRE_ID,
        defenderEmpireId: EMPIRE,
        winner: 'attacker',
        legacyModeOmitted: true,
      }),
      battleEvent({
        id: 'legacy-pirate-defender',
        executeAt: 8,
        sequence: 2,
        attackerEmpireId: EMPIRE,
        defenderEmpireId: PIRATE_EMPIRE_ID,
        winner: 'defender',
        legacyModeOmitted: true,
      }),
    ];
    expect(signal(events)).toEqual({
      consideredBattles: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      recoveryBias: 'none',
    });
  });

  it('ignores PvE reports and battles unrelated to the target empire', () => {
    const events = [
      battleEvent({ id: 'pve-loss', executeAt: 10, sequence: 1, winner: 'defender', mode: 'pve' }),
      battleEvent({
        id: 'unrelated-loss',
        executeAt: 20,
        sequence: 2,
        attackerEmpireId: 'synod-bot',
        defenderEmpireId: 'veyra-bot',
        winner: 'defender',
      }),
    ];
    expect(signal(events)).toEqual({
      consideredBattles: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      recoveryBias: 'none',
    });
  });

  it('considers only the latest three relevant resolved PvP reports', () => {
    const events = [
      battleEvent({ id: 'old-loss', executeAt: 10, sequence: 1, winner: 'defender' }),
      battleEvent({ id: 'recent-win-1', executeAt: 20, sequence: 2, winner: 'attacker' }),
      battleEvent({ id: 'recent-loss', executeAt: 30, sequence: 3, winner: 'defender' }),
      battleEvent({ id: 'recent-loss-2', executeAt: 40, sequence: 4, winner: 'defender' }),
    ];
    expect(signal(events)).toEqual({
      consideredBattles: 3,
      wins: 1,
      losses: 2,
      draws: 0,
      recoveryBias: 'loss-dominant',
    });
  });

  it('is invariant to eventLog array permutation', () => {
    const events = [
      battleEvent({ id: 'one', executeAt: 10, sequence: 1, winner: 'attacker' }),
      battleEvent({ id: 'two', executeAt: 20, sequence: 2, winner: 'defender' }),
      battleEvent({ id: 'three', executeAt: 30, sequence: 3, winner: 'defender' }),
      battleEvent({ id: 'four', executeAt: 40, sequence: 4, winner: 'draw' }),
    ];
    const expected = signal(events);
    expect(signal([events[2]!, events[0]!, events[3]!, events[1]!])).toEqual(expected);
    expect(signal([...events].reverse())).toEqual(expected);
  });

  it('orders canonically by executeAt, then sequence, then report id before taking the window', () => {
    const events = [
      battleEvent({ id: 'd', executeAt: 200, sequence: 2, winner: 'defender' }),
      battleEvent({ id: 'a', executeAt: 100, sequence: 9, winner: 'defender' }),
      battleEvent({ id: 'c', executeAt: 200, sequence: 2, winner: 'defender' }),
      battleEvent({ id: 'b', executeAt: 200, sequence: 1, winner: 'attacker' }),
    ];
    // Canonical order is a (100/9), b (200/1), c (200/2), d (200/2),
    // therefore latest-three is b/c/d => one win and two losses.
    expect(signal(events)).toEqual({
      consideredBattles: 3,
      wins: 1,
      losses: 2,
      draws: 0,
      recoveryBias: 'loss-dominant',
    });
  });

  it('ages an old loss out automatically when it leaves the latest-three window', () => {
    const lossDominant = [
      battleEvent({ id: 'loss-1', executeAt: 10, sequence: 1, winner: 'defender' }),
      battleEvent({ id: 'loss-2', executeAt: 20, sequence: 2, winner: 'defender' }),
      battleEvent({ id: 'win-1', executeAt: 30, sequence: 3, winner: 'attacker' }),
    ];
    expect(signal(lossDominant).recoveryBias).toBe('loss-dominant');

    const aged = [
      ...lossDominant,
      battleEvent({ id: 'win-2', executeAt: 40, sequence: 4, winner: 'attacker' }),
    ];
    expect(signal(aged)).toEqual({
      consideredBattles: 3,
      wins: 2,
      losses: 1,
      draws: 0,
      recoveryBias: 'none',
    });
  });

  it('does not turn wins into an aggression signal', () => {
    expect(signal([
      battleEvent({ id: 'win-1', executeAt: 10, sequence: 1, winner: 'attacker' }),
      battleEvent({ id: 'win-2', executeAt: 20, sequence: 2, winner: 'attacker' }),
      battleEvent({ id: 'win-3', executeAt: 30, sequence: 3, winner: 'attacker' }),
    ])).toEqual({
      consideredBattles: 3,
      wins: 3,
      losses: 0,
      draws: 0,
      recoveryBias: 'none',
    });
  });

  it('is deterministic and pure for the same state', () => {
    const state = withEvents([
      battleEvent({ id: 'pure-loss', executeAt: 10, sequence: 1, winner: 'defender' }),
      battleEvent({ id: 'pure-draw', executeAt: 20, sequence: 2, winner: 'draw' }),
    ]);
    const before = JSON.stringify(state.eventLog);
    const first = deriveRecentBotBattleOutcomeSignal(state, EMPIRE);
    const second = deriveRecentBotBattleOutcomeSignal(state, EMPIRE);
    expect(second).toEqual(first);
    expect(JSON.stringify(state.eventLog)).toBe(before);
  });

  it('derives the same signal after save and load without new persisted bot state', () => {
    const state = withEvents([
      battleEvent({ id: 'save-loss-1', executeAt: 10, sequence: 1, winner: 'defender' }),
      battleEvent({ id: 'save-win', executeAt: 20, sequence: 2, winner: 'attacker' }),
      battleEvent({ id: 'save-loss-2', executeAt: 30, sequence: 3, winner: 'defender' }),
    ]);
    const expected = deriveRecentBotBattleOutcomeSignal(state, EMPIRE);
    const envelope = createSaveEnvelope('outcome-signal', state, '2026-08-23T12:00:00.000Z');
    const parsed = parseSaveJson(serializeSave(envelope));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(deriveRecentBotBattleOutcomeSignal(parsed.value.state, EMPIRE)).toEqual(expected);
  });

  it('preserves a legacy mode-less PvP signal through save and load', () => {
    const state = withEvents([
      battleEvent({
        id: 'legacy-save-loss',
        executeAt: 10,
        sequence: 1,
        winner: 'defender',
        legacyModeOmitted: true,
      }),
      battleEvent({
        id: 'legacy-save-win',
        executeAt: 20,
        sequence: 2,
        winner: 'attacker',
        legacyModeOmitted: true,
      }),
      battleEvent({
        id: 'legacy-save-loss-2',
        executeAt: 30,
        sequence: 3,
        winner: 'defender',
        legacyModeOmitted: true,
      }),
    ]);
    const expected = deriveRecentBotBattleOutcomeSignal(state, EMPIRE);
    expect(expected).toEqual({
      consideredBattles: 3,
      wins: 1,
      losses: 2,
      draws: 0,
      recoveryBias: 'loss-dominant',
    });
    const envelope = createSaveEnvelope('legacy-outcome-signal', state, '2026-08-23T12:00:00.000Z');
    const parsed = parseSaveJson(serializeSave(envelope));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(deriveRecentBotBattleOutcomeSignal(parsed.value.state, EMPIRE)).toEqual(expected);
  });
});
