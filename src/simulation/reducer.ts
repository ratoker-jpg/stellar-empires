import { accrueAllPlanetEconomies } from './economy/planetEconomy';
import { enqueueEvent, partitionDueEvents } from './eventQueue';
import type {
  CommandLogEntry,
  CommandResult,
  ExecutedGameEvent,
  GameCommand,
  GameState,
  ScheduledGameEvent,
} from './types';

function appendCommand(state: GameState, command: GameCommand): readonly CommandLogEntry[] {
  return [
    ...state.commandLog,
    {
      index: state.commandLog.length,
      command,
    },
  ];
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function scheduleEvent(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'SCHEDULE_EVENT' }>,
): CommandResult<GameState> {
  if (!isNonNegativeInteger(command.executeAt)) {
    return {
      ok: false,
      code: 'INVALID_EVENT_TIME',
      message: 'Event time must be a non-negative integer.',
      details: { executeAt: command.executeAt },
    };
  }

  if (command.executeAt < state.clock.elapsedSeconds) {
    return {
      ok: false,
      code: 'EVENT_IN_THE_PAST',
      message: 'An event cannot be scheduled before the current world time.',
      details: {
        executeAt: command.executeAt,
        elapsedSeconds: state.clock.elapsedSeconds,
      },
    };
  }

  const event: ScheduledGameEvent = {
    id: `event-${state.nextEventSequence}`,
    executeAt: command.executeAt,
    sequence: state.nextEventSequence,
    payload: command.payload,
  };

  return {
    ok: true,
    value: {
      ...state,
      nextEventSequence: state.nextEventSequence + 1,
      pendingEvents: enqueueEvent(state.pendingEvents, event),
      commandLog: appendCommand(state, command),
    },
  };
}

function advanceTime(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'ADVANCE_TIME' }>,
): CommandResult<GameState> {
  if (!isNonNegativeInteger(command.seconds)) {
    return {
      ok: false,
      code: 'INVALID_TIME_DELTA',
      message: 'Time delta must be a non-negative integer.',
      details: { seconds: command.seconds },
    };
  }

  const targetTime = state.clock.elapsedSeconds + command.seconds;
  const { due, pending } = partitionDueEvents(state.pendingEvents, targetTime);
  const executedEvents: readonly ExecutedGameEvent[] = due.map((event) => ({
    event,
    executedAt: event.executeAt,
  }));

  return {
    ok: true,
    value: {
      ...state,
      clock: {
        ...state.clock,
        elapsedSeconds: targetTime,
      },
      planets: accrueAllPlanetEconomies(state.planets, command.seconds),
      pendingEvents: pending,
      commandLog: appendCommand(state, command),
      eventLog: [...state.eventLog, ...executedEvents],
    },
  };
}

export function executeCommand(state: GameState, command: GameCommand): CommandResult<GameState> {
  switch (command.type) {
    case 'SCHEDULE_EVENT':
      return scheduleEvent(state, command);
    case 'ADVANCE_TIME':
      return advanceTime(state, command);
  }
}
