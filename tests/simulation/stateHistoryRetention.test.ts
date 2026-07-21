import { describe, expect, it } from 'vitest';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  appendCommandHistory,
  appendExecutedEventHistory,
  compactGameStateHistory,
  STATE_HISTORY_LIMITS,
} from '../../src/simulation/history/stateHistory';
import { executeCommand } from '../../src/simulation/reducer';
import type { CommandLogEntry, ExecutedGameEvent, GameState } from '../../src/simulation/types';
import { createSaveEnvelope, parseSaveJson, serializeSave } from '../../src/storage/saveFormat';

function advanceRepeatedly(seed: string): GameState {
  let state = createInitialGameState(seed);
  for (let index = 0; index < STATE_HISTORY_LIMITS.commands + 64; index += 1) {
    const result = executeCommand(state, { type: 'ADVANCE_TIME', seconds: 300 });
    if (!result.ok) throw new Error(result.message);
    state = result.value;
  }
  return state;
}

function eventEntry(index: number): ExecutedGameEvent {
  return {
    event: {
      id: `history-event-${index}`,
      executeAt: index,
      sequence: index,
      payload: { type: 'NOOP', label: `event-${index}` },
    },
    executedAt: index,
  };
}

describe('long-session history retention', () => {
  it('keeps a monotonic command index while retaining only the newest window', () => {
    let log: readonly CommandLogEntry[] = [];
    for (let index = 0; index < STATE_HISTORY_LIMITS.commands + 25; index += 1) {
      log = appendCommandHistory(log, { type: 'ADVANCE_TIME', seconds: index });
    }
    expect(log).toHaveLength(STATE_HISTORY_LIMITS.commands);
    expect(log[0]?.index).toBe(25);
    expect(log.at(-1)?.index).toBe(STATE_HISTORY_LIMITS.commands + 24);
  });

  it('retains only the newest executed events', () => {
    const entries = Array.from(
      { length: STATE_HISTORY_LIMITS.executedEvents + 10 },
      (_, index) => eventEntry(index),
    );
    const retained = appendExecutedEventHistory([], entries);
    expect(retained).toHaveLength(STATE_HISTORY_LIMITS.executedEvents);
    expect(retained[0]?.event.id).toBe('history-event-10');
  });

  it('bounds repeated multi-day simulation deterministically', () => {
    const first = advanceRepeatedly('history-multiday');
    const second = advanceRepeatedly('history-multiday');
    expect(first.clock.elapsedSeconds).toBe((STATE_HISTORY_LIMITS.commands + 64) * 300);
    expect(first.commandLog).toHaveLength(STATE_HISTORY_LIMITS.commands);
    expect(first.eventLog.length).toBeLessThanOrEqual(STATE_HISTORY_LIMITS.executedEvents);
    expect(createStateChecksum(first)).toBe(createStateChecksum(second));
    expect(first).toEqual(second);
  });

  it('compacts every documented historical collection without touching pending state', () => {
    const current = createInitialGameState('history-compaction');
    const oversized = {
      ...current,
      commandLog: Array.from(
        { length: STATE_HISTORY_LIMITS.commands + 3 },
        (_, index) => ({ index, command: { type: 'ADVANCE_TIME' as const, seconds: 0 } }),
      ),
      eventLog: Array.from(
        { length: STATE_HISTORY_LIMITS.executedEvents + 3 },
        (_, index) => eventEntry(index),
      ),
      worldEvents: {
        ...current.worldEvents,
        history: Array.from(
          { length: STATE_HISTORY_LIMITS.worldEvents + 3 },
          (_, index) => ({
            id: `world-history-${index}`,
            definitionId: 'solar-storm' as const,
            targetType: 'system' as const,
            targetId: current.galaxy.systems[0]!.id,
            startedAt: index,
            endsAt: index + 1,
            chainDepth: 0,
            completedAt: index + 1,
            completion: 'completed' as const,
          }),
        ),
      },
      intelligence: current.intelligence.map((entry) => ({
        ...entry,
        observations: Array.from(
          { length: STATE_HISTORY_LIMITS.intelligenceObservationsPerEmpire + 3 },
          (_, index) => ({
            id: `observation-${entry.empireId}-${index}`,
            observerEmpireId: entry.empireId,
            targetPlanetId: current.planets[0]!.id,
            observedAt: index,
            expiresAt: index + 1,
            detected: false,
            snapshot: {
              level: 1 as const,
              planetId: current.planets[0]!.id,
              name: current.planets[0]!.name,
              ownerEmpireId: current.planets[0]!.ownerEmpireId ?? 'neutral',
              factionId: current.planets[0]!.factionId,
            },
          }),
        ),
        alerts: Array.from(
          { length: STATE_HISTORY_LIMITS.intelligenceAlertsPerEmpire + 3 },
          (_, index) => ({
            id: `alert-${entry.empireId}-${index}`,
            empireId: entry.empireId,
            sourceEmpireId: null,
            targetPlanetId: current.planets[0]!.id,
            detectedAt: index,
            confidence: 'low' as const,
          }),
        ),
      })),
    } satisfies GameState;
    const compacted = compactGameStateHistory(oversized);
    expect(compacted.commandLog).toHaveLength(STATE_HISTORY_LIMITS.commands);
    expect(compacted.eventLog).toHaveLength(STATE_HISTORY_LIMITS.executedEvents);
    expect(compacted.worldEvents.history).toHaveLength(STATE_HISTORY_LIMITS.worldEvents);
    expect(compacted.intelligence.every(
      (entry) => entry.observations.length === STATE_HISTORY_LIMITS.intelligenceObservationsPerEmpire,
    )).toBe(true);
    expect(compacted.intelligence.every(
      (entry) => entry.alerts.length === STATE_HISTORY_LIMITS.intelligenceAlertsPerEmpire,
    )).toBe(true);
    expect(compacted.pendingEvents).toBe(current.pendingEvents);
  });

  it('migrates oversized schema-v13 retained history to the current limits', () => {
    const current = createInitialGameState('history-save-migration');
    const oversized = {
      ...current,
      commandLog: Array.from(
        { length: STATE_HISTORY_LIMITS.commands + 5 },
        (_, index) => ({ index, command: { type: 'ADVANCE_TIME' as const, seconds: 0 } }),
      ),
      eventLog: Array.from(
        { length: STATE_HISTORY_LIMITS.executedEvents + 5 },
        (_, index) => eventEntry(index),
      ),
    };
    const envelope = createSaveEnvelope('history-oversized', oversized, '2026-07-21T18:00:00.000Z');
    const parsed = parseSaveJson(serializeSave(envelope));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.state.commandLog).toHaveLength(STATE_HISTORY_LIMITS.commands);
    expect(parsed.value.state.commandLog[0]?.index).toBe(5);
    expect(parsed.value.state.eventLog).toHaveLength(STATE_HISTORY_LIMITS.executedEvents);
    expect(parsed.value.state.eventLog[0]?.event.id).toBe('history-event-5');
  });
});
