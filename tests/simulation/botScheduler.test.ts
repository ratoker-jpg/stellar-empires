import { describe, expect, it } from 'vitest';
import {
  MAX_BOT_DECISIONS_PER_RUN,
  runBotScheduler,
} from '../../src/simulation/bots/scheduler';
import type { BotProfile } from '../../src/simulation/bots/profiles';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeCommand } from '../../src/simulation/reducer';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';
import { handleBotSchedulerRequest } from '../../src/workers/botScheduler.worker';

function advance(state: ReturnType<typeof createInitialGameState>, seconds: number) {
  const result = executeCommand(state, { type: 'ADVANCE_TIME', seconds });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.message);
  return result.value;
}

describe('autonomous bot scheduler', () => {
  it('runs due profiles and records accepted normal commands', () => {
    const state = createInitialGameState('bot-scheduler-initial');
    const result = runBotScheduler(state);
    expect(result.audit.length).toBeGreaterThan(0);
    expect(result.audit.every((entry) => entry.accepted)).toBe(true);
    expect(result.state.commandLog.length).toBe(result.audit.length);
    expect(result.processedDecisions).toBe(3);
    expect(result.hasMoreDueDecisions).toBe(false);
    expect(new Set(result.audit.map((entry) => entry.empireId))).toEqual(
      new Set(['aegis-bot', 'synod-bot', 'veyra-bot']),
    );
    expect(new Set(result.audit.map((entry) => entry.decidedAt))).toEqual(new Set([0]));
  });

  it('does not run twice at the same game time', () => {
    const state = createInitialGameState('bot-scheduler-idempotent');
    const first = runBotScheduler(state);
    const second = runBotScheduler(first.state);
    expect(second.audit).toEqual([]);
    expect(second.processedDecisions).toBe(0);
    expect(second.state).toEqual(first.state);
  });

  it('catches up every due profile cadence in canonical game-time order', () => {
    const state = createInitialGameState('bot-scheduler-cadence');
    const first = runBotScheduler(state);
    const second = runBotScheduler(advance(first.state, 600));
    expect(second.processedDecisions).toBe(4);
    expect(second.audit.map((entry) => entry.decidedAt)).toEqual(
      [...second.audit.map((entry) => entry.decidedAt)].sort((left, right) => left - right),
    );
    expect(new Set(second.audit.map((entry) => entry.decidedAt))).toEqual(
      new Set([300, 450, 600]),
    );
    expect(second.state.botAutomation.nextDecisionAtByEmpire).toEqual({
      'aegis-bot': 1_200,
      'synod-bot': 900,
      'veyra-bot': 900,
    });
  });

  it('bounds large catch-up runs and resumes deterministically until drained', () => {
    const initial = runBotScheduler(createInitialGameState('bot-scheduler-budget')).state;
    const jumped = advance(initial, 86_400);

    function drain() {
      let state = jumped;
      const decidedAt: number[] = [];
      let runs = 0;
      while (runs < 1_000) {
        const result = runBotScheduler(state);
        expect(result.processedDecisions).toBeLessThanOrEqual(MAX_BOT_DECISIONS_PER_RUN);
        decidedAt.push(...result.audit.map((entry) => entry.decidedAt));
        state = result.state;
        runs += 1;
        if (!result.hasMoreDueDecisions) return { state, decidedAt, runs };
      }
      throw new Error('Bot catch-up did not drain within the safety limit.');
    }

    const first = drain();
    const second = drain();
    expect(first).toEqual(second);
    expect(first.runs).toBeGreaterThan(1);
    expect(first.decidedAt).toEqual([...first.decidedAt].sort((left, right) => left - right));
  });

  it('enforces difficulty limits and honest personality fallback', () => {
    const state = createInitialGameState('bot-scheduler-profile');
    const easyIndustrial: BotProfile = {
      id: 'test.easy-industrial',
      empireId: 'aegis-bot',
      personality: 'industrial',
      difficulty: 'easy',
      decisionIntervalSeconds: 900,
      maxCommandsPerDecision: 1,
    };
    const industrial = runBotScheduler(state, [easyIndustrial]);
    expect(industrial.audit).toHaveLength(1);
    expect(industrial.audit[0]).toMatchObject({
      personality: 'industrial',
      source: 'economy',
      decidedAt: 0,
    });

    const aggressive: BotProfile = {
      ...easyIndustrial,
      id: 'test.easy-aggressive',
      personality: 'aggressive',
    };
    const attackFirst = runBotScheduler(state, [aggressive]);
    expect(attackFirst.audit).toHaveLength(1);
    expect(attackFirst.audit[0]).toMatchObject({
      personality: 'aggressive',
      source: 'economy',
      decidedAt: 0,
    });
  });

  it('uses a serializable worker request and response without runtime-only cursor state', () => {
    const state = createInitialGameState('bot-scheduler-worker');
    const response = handleBotSchedulerRequest({
      type: 'RUN_BOT_SCHEDULER',
      requestId: 7,
      baseCommandCount: state.commandLog.length,
      state,
    });
    expect(response).toMatchObject({
      type: 'BOT_SCHEDULER_RESULT',
      requestId: 7,
      baseCommandCount: 0,
      processedDecisions: 3,
      hasMoreDueDecisions: false,
    });
    expect(JSON.parse(JSON.stringify(response))).toEqual(response);
  });

  it('preserves the next bot decisions across save and load', () => {
    const first = runBotScheduler(createInitialGameState('bot-scheduler-save')).state;
    const partiallyCaughtUp = runBotScheduler(advance(first, 3_600), undefined, 2).state;
    const save = createSaveEnvelope('bot-time', partiallyCaughtUp, '2026-07-21T16:00:00.000Z');
    const parsed = parseSaveJson(serializeSave(save));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.value.state.botAutomation).toEqual(partiallyCaughtUp.botAutomation);
    expect(runBotScheduler(parsed.value.state)).toEqual(runBotScheduler(partiallyCaughtUp));
  });

  it('does not change decisions when hidden player resources change', () => {
    const state = createInitialGameState('bot-scheduler-hidden');
    const before = runBotScheduler(state);
    const changed = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.ownerEmpireId === 'player'
          ? {
              ...planet,
              economy: {
                ...planet.economy,
                resources: {
                  ...planet.economy.resources,
                  gas: { ...planet.economy.resources.gas, amount: 9_999 },
                },
              },
            }
          : planet,
      ),
    };
    const after = runBotScheduler(changed);
    expect(after.audit).toEqual(before.audit);
    expect(after.state.botAutomation).toEqual(before.state.botAutomation);
  });
});
