import { describe, expect, it } from 'vitest';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeCommand } from '../../src/simulation/reducer';
import { replayCommands } from '../../src/simulation/replay';
import type { GameCommand, GameState } from '../../src/simulation/types';

function expectSuccess(result: ReturnType<typeof executeCommand>): GameState {
  if (!result.ok) {
    throw new Error(`${result.code}: ${result.message}`);
  }

  return result.value;
}

describe('simulation reducer', () => {
  it('keeps events ordered by time and insertion sequence', () => {
    let state = createInitialGameState('queue-order');

    state = expectSuccess(
      executeCommand(state, {
        type: 'SCHEDULE_EVENT',
        executeAt: 20,
        payload: { type: 'MARKER', marker: 'late' },
      }),
    );
    state = expectSuccess(
      executeCommand(state, {
        type: 'SCHEDULE_EVENT',
        executeAt: 10,
        payload: { type: 'MARKER', marker: 'first' },
      }),
    );
    state = expectSuccess(
      executeCommand(state, {
        type: 'SCHEDULE_EVENT',
        executeAt: 10,
        payload: { type: 'MARKER', marker: 'second' },
      }),
    );

    expect(state.pendingEvents.map((event) => event.payload)).toEqual([
      { type: 'MARKER', marker: 'first' },
      { type: 'MARKER', marker: 'second' },
      { type: 'MARKER', marker: 'late' },
    ]);
  });

  it('executes only events due before the target world time', () => {
    let state = createInitialGameState('advance-time');

    state = expectSuccess(
      executeCommand(state, {
        type: 'SCHEDULE_EVENT',
        executeAt: 5,
        payload: { type: 'NOOP', label: 'due' },
      }),
    );
    state = expectSuccess(
      executeCommand(state, {
        type: 'SCHEDULE_EVENT',
        executeAt: 15,
        payload: { type: 'NOOP', label: 'future' },
      }),
    );
    state = expectSuccess(executeCommand(state, { type: 'ADVANCE_TIME', seconds: 10 }));

    expect(state.clock.elapsedSeconds).toBe(10);
    expect(state.eventLog).toHaveLength(1);
    expect(state.eventLog[0]?.event.payload).toEqual({ type: 'NOOP', label: 'due' });
    expect(state.pendingEvents).toHaveLength(1);
  });

  it('rejects events scheduled in the past', () => {
    let state = createInitialGameState('past-event');
    state = expectSuccess(executeCommand(state, { type: 'ADVANCE_TIME', seconds: 10 }));

    const result = executeCommand(state, {
      type: 'SCHEDULE_EVENT',
      executeAt: 9,
      payload: { type: 'NOOP', label: 'invalid' },
    });

    expect(result).toMatchObject({ ok: false, code: 'EVENT_IN_THE_PAST' });
  });

  it('replays the same commands to the same checksum', () => {
    const commands: readonly GameCommand[] = [
      {
        type: 'SCHEDULE_EVENT',
        executeAt: 12,
        payload: { type: 'MARKER', marker: 'alpha' },
      },
      { type: 'ADVANCE_TIME', seconds: 20 },
    ];

    const first = replayCommands('replay-seed', commands);
    const second = replayCommands('replay-seed', commands);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);

    if (!first.ok || !second.ok) {
      return;
    }

    expect(createStateChecksum(first.value)).toBe(createStateChecksum(second.value));
    expect(second.value).toEqual(first.value);
  });
});
