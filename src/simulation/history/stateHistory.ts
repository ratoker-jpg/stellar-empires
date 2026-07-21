import type { GameCommand, GameState, CommandLogEntry, ExecutedGameEvent } from '../types';

export const STATE_HISTORY_LIMITS = {
  commands: 512,
  executedEvents: 512,
  marketTrades: 50,
  worldEvents: 128,
  intelligenceObservationsPerEmpire: 64,
  intelligenceAlertsPerEmpire: 128,
} as const;

export function retainNewest<T>(items: readonly T[], limit: number): readonly T[] {
  if (!Number.isInteger(limit) || limit < 0) {
    throw new Error('History retention limit must be a non-negative integer.');
  }
  return items.length <= limit ? items : items.slice(items.length - limit);
}

export function appendCommandHistory(
  log: readonly CommandLogEntry[],
  command: GameCommand,
): readonly CommandLogEntry[] {
  const index = (log[log.length - 1]?.index ?? -1) + 1;
  return retainNewest([...log, { index, command }], STATE_HISTORY_LIMITS.commands);
}

export function appendExecutedEventHistory(
  log: readonly ExecutedGameEvent[],
  entries: readonly ExecutedGameEvent[],
): readonly ExecutedGameEvent[] {
  return retainNewest([...log, ...entries], STATE_HISTORY_LIMITS.executedEvents);
}

export function compactGameStateHistory(state: GameState): GameState {
  return {
    ...state,
    commandLog: retainNewest(state.commandLog, STATE_HISTORY_LIMITS.commands),
    eventLog: retainNewest(state.eventLog, STATE_HISTORY_LIMITS.executedEvents),
    market: {
      ...state.market,
      trades: retainNewest(state.market.trades, STATE_HISTORY_LIMITS.marketTrades),
    },
    worldEvents: {
      ...state.worldEvents,
      history: retainNewest(state.worldEvents.history, STATE_HISTORY_LIMITS.worldEvents),
    },
    intelligence: state.intelligence.map((entry) => ({
      ...entry,
      observations: retainNewest(
        entry.observations,
        STATE_HISTORY_LIMITS.intelligenceObservationsPerEmpire,
      ),
      alerts: retainNewest(
        entry.alerts,
        STATE_HISTORY_LIMITS.intelligenceAlertsPerEmpire,
      ),
    })),
  };
}
