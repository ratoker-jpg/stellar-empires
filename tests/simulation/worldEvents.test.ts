import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  WORLD_EVENT_CATALOG,
  WORLD_EVENT_EVALUATION_INTERVAL_SECONDS,
  getWorldEventHazardModifier,
  getWorldEventYieldPermille,
  startWorldEventAt,
} from '../../src/simulation/pve/worldEvents';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState } from '../../src/simulation/types';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

function advance(state: GameState, seconds: number): GameState {
  const result = executeCommand(state, { type: 'ADVANCE_TIME', seconds });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.message);
  return result.value;
}

describe('world event framework', () => {
  it('evaluates eligible definitions deterministically in game time', () => {
    const first = createInitialGameState('world-event-determinism');
    const second = createInitialGameState('world-event-determinism');
    expect(first.worldEvents).toEqual({
      active: [],
      history: [],
      cooldowns: {},
      nextEvaluationAt: WORLD_EVENT_EVALUATION_INTERVAL_SECONDS,
    });

    const firstAdvanced = advance(first, WORLD_EVENT_EVALUATION_INTERVAL_SECONDS);
    const secondAdvanced = advance(second, WORLD_EVENT_EVALUATION_INTERVAL_SECONDS);
    expect(firstAdvanced.worldEvents).toEqual(secondAdvanced.worldEvents);
    expect(firstAdvanced.pendingEvents).toEqual(secondAdvanced.pendingEvents);
    expect(firstAdvanced.worldEvents.active).toHaveLength(1);
    const active = firstAdvanced.worldEvents.active[0];
    expect(active).toBeDefined();
    expect(
      firstAdvanced.pendingEvents.some(
        (event) =>
          event.payload.type === 'WORLD_EVENT_END' &&
          event.payload.instanceId === active?.id,
      ),
    ).toBe(true);
  });

  it('completes an event, records history and applies its cooldown', () => {
    const state = createInitialGameState('world-event-completion');
    const object = state.spaceObjects.find((candidate) => candidate.kind === 'asteroid')!;
    const started = startWorldEventAt(
      state,
      'mineral-bloom',
      'space-object',
      object.id,
      0,
      state.clock.elapsedSeconds,
    );
    const active = started.worldEvents.active[0]!;
    const completed = advance(started, active.endsAt - started.clock.elapsedSeconds);
    expect(
      completed.worldEvents.active.some((event) => event.id === active.id),
    ).toBe(false);
    expect(completed.worldEvents.history).toContainEqual(
      expect.objectContaining({
        id: active.id,
        definitionId: 'mineral-bloom',
        completion: 'completed',
        completedAt: active.endsAt,
      }),
    );
    expect(completed.worldEvents.cooldowns['mineral-bloom']).toBe(
      active.endsAt + WORLD_EVENT_CATALOG['mineral-bloom'].cooldownSeconds,
    );
  });

  it('starts a bounded chain after a solar storm', () => {
    const state = createInitialGameState('world-event-chain');
    const systemId = state.galaxy.systems[0]!.id;
    const started = startWorldEventAt(
      state,
      'solar-storm',
      'system',
      systemId,
      0,
      state.clock.elapsedSeconds,
    );
    const storm = started.worldEvents.active[0]!;
    const afterStorm = advance(started, storm.endsAt - started.clock.elapsedSeconds);
    expect(
      afterStorm.pendingEvents.some(
        (event) =>
          event.payload.type === 'WORLD_EVENT_START' &&
          event.payload.definitionId === 'anomaly-aftershock' &&
          event.payload.chainDepth === 1,
      ),
    ).toBe(true);

    const afterChainStart = advance(afterStorm, 300);
    expect(afterChainStart.worldEvents.active).toContainEqual(
      expect.objectContaining({
        definitionId: 'anomaly-aftershock',
        targetId: systemId,
        chainDepth: 1,
      }),
    );
    const aftershock = afterChainStart.worldEvents.active.find(
      (event) => event.definitionId === 'anomaly-aftershock',
    )!;
    const finished = advance(
      afterChainStart,
      aftershock.endsAt - afterChainStart.clock.elapsedSeconds,
    );
    expect(
      finished.pendingEvents.some(
        (event) =>
          event.payload.type === 'WORLD_EVENT_START' &&
          event.payload.chainDepth > 1,
      ),
    ).toBe(false);
  });

  it('exposes temporary risk and yield modifiers to mission domains', () => {
    const state = createInitialGameState('world-event-modifiers');
    const object = state.spaceObjects.find((candidate) => candidate.kind === 'asteroid')!;
    const withStorm = startWorldEventAt(
      state,
      'solar-storm',
      'system',
      object.systemId,
      0,
      0,
    );
    const withBloom = startWorldEventAt(
      withStorm,
      'mineral-bloom',
      'space-object',
      object.id,
      0,
      0,
    );
    expect(getWorldEventHazardModifier(withBloom, object.systemId)).toBe(200);
    expect(getWorldEventYieldPermille(withBloom, object.id)).toBe(1_300);
    expect(getWorldEventYieldPermille(withBloom, 'other-object')).toBe(1_000);
  });

  it('restores a missing end event while loading an active event', () => {
    const base = createInitialGameState('world-event-recovery');
    const systemId = base.galaxy.systems[0]!.id;
    const started = startWorldEventAt(base, 'solar-storm', 'system', systemId, 0, 0);
    const damaged: GameState = {
      ...started,
      pendingEvents: started.pendingEvents.filter(
        (event) => event.payload.type !== 'WORLD_EVENT_END',
      ),
    };
    const parsed = parseSaveJson(
      serializeSave(createSaveEnvelope('world-event-recovery', damaged, '2026-07-20T11:00:00.000Z')),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const active = parsed.value.state.worldEvents.active[0]!;
    expect(
      parsed.value.state.pendingEvents.some(
        (event) =>
          event.payload.type === 'WORLD_EVENT_END' &&
          event.payload.instanceId === active.id &&
          event.executeAt === active.endsAt,
      ),
    ).toBe(true);
  });

  it('recovers expired active events without replaying their effects', () => {
    const base = createInitialGameState('world-event-expired-recovery');
    const object = base.spaceObjects.find((candidate) => candidate.kind === 'asteroid')!;
    const started = startWorldEventAt(base, 'mineral-bloom', 'space-object', object.id, 0, 0);
    const expired: GameState = {
      ...started,
      clock: { ...started.clock, elapsedSeconds: 10_000 },
      pendingEvents: [],
    };
    const parsed = parseSaveJson(
      serializeSave(createSaveEnvelope('world-event-expired', expired, '2026-07-20T11:05:00.000Z')),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.state.worldEvents.active).toEqual([]);
    expect(parsed.value.state.worldEvents.history).toContainEqual(
      expect.objectContaining({
        definitionId: 'mineral-bloom',
        completion: 'recovered',
        completedAt: 10_000,
      }),
    );
    expect(
      parsed.value.state.pendingEvents.some(
        (event) => event.payload.type === 'WORLD_EVENT_END',
      ),
    ).toBe(false);
  });

  it('additively migrates schema-v12 saves without world event state', () => {
    const state = createInitialGameState('world-event-additive-migration');
    const { worldEvents: _worldEvents, ...legacy } = state;
    const parsed = parseSaveJson(
      serializeSave(
        createSaveEnvelope(
          'legacy-world-events',
          legacy as GameState,
          '2026-07-20T11:10:00.000Z',
        ),
      ),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.state.worldEvents).toEqual({
      active: [],
      history: [],
      cooldowns: {},
      nextEvaluationAt: WORLD_EVENT_EVALUATION_INTERVAL_SECONDS,
    });
  });
});
