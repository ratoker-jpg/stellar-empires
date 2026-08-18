import { describe, expect, it } from 'vitest';
import { advanceCampaignTime } from '../../src/simulation/campaign/time';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import type { GameState, ScheduledGameEvent } from '../../src/simulation/types';

function createTerminalStateWithDueSystems(): GameState {
  const initial = createInitialGameState('terminal-freeze-due-systems');
  const playerPlanets = initial.planets.filter((planet) => planet.ownerEmpireId === 'player');
  if (playerPlanets.length < 2) {
    throw new Error('Terminal freeze fixture requires two player planets.');
  }
  const terminalAt = initial.clock.elapsedSeconds;
  const pendingEvent: ScheduledGameEvent = {
    id: `event-${initial.nextEventSequence}`,
    executeAt: terminalAt,
    sequence: initial.nextEventSequence,
    payload: { type: 'MARKER', marker: 'terminal-evidence' },
  };
  return {
    ...initial,
    campaignResult: {
      status: 'terminal',
      winningParticipationKind: 'solo',
      winningParticipationId: 'player',
      winningEmpireIds: ['player'],
      ownerEmpireId: 'player',
      hostPlanetId: playerPlanets[0]!.id,
      terminalAt,
      reason: 'final-gate-stabilized',
    },
    pendingEvents: [pendingEvent, ...initial.pendingEvents],
    nextEventSequence: initial.nextEventSequence + 1,
    logisticsRoutes: [{
      id: 'route-terminal-due',
      empireId: 'player',
      originPlanetId: playerPlanets[0]!.id,
      targetPlanetId: playerPlanets[1]!.id,
      resourceId: 'metal',
      amountPerTrip: 1,
      originReserve: 0,
      intervalSeconds: 60,
      priority: 1,
      status: 'active',
      nextDepartureAt: terminalAt,
      consecutiveMisses: 0,
      lastResult: null,
    }],
    worldEvents: {
      ...initial.worldEvents,
      nextEvaluationAt: terminalAt,
    },
    botAutomation: {
      ...initial.botAutomation,
      nextDecisionAtByEmpire: Object.fromEntries(
        initial.empires
          .filter((empireId) => empireId !== 'player' && empireId !== 'pirate-neutral')
          .map((empireId) => [empireId, terminalAt]),
      ),
    },
  };
}

describe('terminal freeze across due systems', () => {
  it('leaves already-due events, logistics, world events and bot decisions inert forever', () => {
    const state = createTerminalStateWithDueSystems();
    const pendingEvents = state.pendingEvents;
    const logisticsRoutes = state.logisticsRoutes;
    const worldEvents = state.worldEvents;
    const botAutomation = state.botAutomation;
    const fleets = state.fleets;
    const eventLog = state.eventLog;

    const result = advanceCampaignTime(state, 86_400, { operationBudget: 50_000 });

    expect(result.complete).toBe(true);
    expect(result.processedGameSeconds).toBe(0);
    expect(result.operationsProcessed).toBe(0);
    expect(result.state).toBe(state);
    expect(result.state.clock.elapsedSeconds).toBe(state.campaignResult?.status === 'terminal'
      ? state.campaignResult.terminalAt
      : -1);
    expect(result.state.pendingEvents).toBe(pendingEvents);
    expect(result.state.logisticsRoutes).toBe(logisticsRoutes);
    expect(result.state.worldEvents).toBe(worldEvents);
    expect(result.state.botAutomation).toBe(botAutomation);
    expect(result.state.fleets).toBe(fleets);
    expect(result.state.eventLog).toBe(eventLog);
    expect(result.state.logisticsRoutes[0]?.nextDepartureAt).toBe(state.clock.elapsedSeconds);
    expect(result.state.worldEvents.nextEvaluationAt).toBe(state.clock.elapsedSeconds);
    expect(Object.values(result.state.botAutomation.nextDecisionAtByEmpire)).toContain(
      state.clock.elapsedSeconds,
    );
  });
});
