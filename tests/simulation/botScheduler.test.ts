import { describe, expect, it } from 'vitest';
import {
  createBotSchedulerCursor,
  runBotScheduler,
} from '../../src/simulation/bots/scheduler';
import type { BotProfile } from '../../src/simulation/bots/profiles';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeCommand } from '../../src/simulation/reducer';
import { handleBotSchedulerRequest } from '../../src/workers/botScheduler.worker';

describe('autonomous bot scheduler', () => {
  it('runs due profiles and records accepted normal commands', () => {
    const state = createInitialGameState('bot-scheduler-initial');
    const result = runBotScheduler(state, createBotSchedulerCursor(state));
    expect(result.audit.length).toBeGreaterThan(0);
    expect(result.audit.every((entry) => entry.accepted)).toBe(true);
    expect(result.state.commandLog.length).toBe(result.audit.length);
    expect(new Set(result.audit.map((entry) => entry.empireId))).toEqual(
      new Set(['aegis-bot', 'synod-bot', 'veyra-bot']),
    );
  });

  it('does not run twice at the same game time', () => {
    const state = createInitialGameState('bot-scheduler-idempotent');
    const first = runBotScheduler(state, createBotSchedulerCursor(state));
    const second = runBotScheduler(first.state, first.cursor);
    expect(second.audit).toEqual([]);
    expect(second.state).toEqual(first.state);
  });

  it('runs again after each profile cadence passes in game time', () => {
    const state = createInitialGameState('bot-scheduler-cadence');
    const first = runBotScheduler(state, createBotSchedulerCursor(state));
    const advanced = executeCommand(first.state, { type: 'ADVANCE_TIME', seconds: 600 });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) return;
    const second = runBotScheduler(advanced.value, first.cursor);
    expect(new Set(second.audit.map((entry) => entry.empireId))).toEqual(
      new Set(['aegis-bot', 'synod-bot', 'veyra-bot']),
    );
    expect(second.audit.every((entry) => entry.decidedAt === 600)).toBe(true);
  });

  it('enforces difficulty command limits and personality order', () => {
    const state = createInitialGameState('bot-scheduler-profile');
    const easyIndustrial: BotProfile = {
      id: 'test.easy-industrial',
      empireId: 'aegis-bot',
      personality: 'industrial',
      difficulty: 'easy',
      decisionIntervalSeconds: 900,
      maxCommandsPerDecision: 1,
    };
    const industrial = runBotScheduler(
      state,
      createBotSchedulerCursor(state, [easyIndustrial]),
      [easyIndustrial],
    );
    expect(industrial.audit).toHaveLength(1);
    expect(industrial.audit[0]?.source).toBe('economy');

    const aggressive: BotProfile = {
      ...easyIndustrial,
      id: 'test.easy-aggressive',
      personality: 'aggressive',
    };
    const attackFirst = runBotScheduler(
      state,
      createBotSchedulerCursor(state, [aggressive]),
      [aggressive],
    );
    expect(attackFirst.audit).toHaveLength(1);
    expect(attackFirst.audit[0]?.source).toBe('threat');
  });

  it('uses a serializable worker request and response', () => {
    const state = createInitialGameState('bot-scheduler-worker');
    const response = handleBotSchedulerRequest({
      type: 'RUN_BOT_SCHEDULER',
      requestId: 7,
      baseCommandCount: state.commandLog.length,
      state,
      cursor: createBotSchedulerCursor(state),
    });
    expect(response).toMatchObject({
      type: 'BOT_SCHEDULER_RESULT',
      requestId: 7,
      baseCommandCount: 0,
    });
    expect(JSON.parse(JSON.stringify(response))).toEqual(response);
  });

  it('does not change decisions when hidden player resources change', () => {
    const state = createInitialGameState('bot-scheduler-hidden');
    const cursor = createBotSchedulerCursor(state);
    const before = runBotScheduler(state, cursor);
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
    const after = runBotScheduler(changed, cursor);
    expect(after.audit).toEqual(before.audit);
    expect(after.cursor).toEqual(before.cursor);
  });
});
