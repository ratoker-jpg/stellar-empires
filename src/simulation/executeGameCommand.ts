import { createFleet, disbandFleet } from './fleets/fleetCommands';
import {
  applyFleetEvent,
  recallFleet,
  sendFleet,
} from './fleets/flightCommands';
import { executeCommand as executeCoreCommand } from './reducer';
import type {
  CommandResult,
  GameCommand,
  GameEventPayload,
  GameState,
  ScheduledGameEvent,
} from './types';

function isFlightEvent(
  event: ScheduledGameEvent,
): event is ScheduledGameEvent & {
  readonly payload: Extract<
    GameEventPayload,
    { readonly type: 'FLEET_ARRIVE' | 'FLEET_RETURN' }
  >;
} {
  return (
    event.payload.type === 'FLEET_ARRIVE' ||
    event.payload.type === 'FLEET_RETURN'
  );
}

function advanceWithFlightEvents(
  state: GameState,
  seconds: number,
): CommandResult<GameState> {
  if (!Number.isInteger(seconds) || seconds < 0) {
    return executeCoreCommand(state, { type: 'ADVANCE_TIME', seconds });
  }

  const targetTime = state.clock.elapsedSeconds + seconds;
  const flightEvents = state.pendingEvents.filter(
    (event) => isFlightEvent(event) && event.executeAt <= targetTime,
  );
  let working = state;

  for (const event of flightEvents) {
    const delta = Math.max(0, event.executeAt - working.clock.elapsedSeconds);
    const advanced = executeCoreCommand(working, {
      type: 'ADVANCE_TIME',
      seconds: delta,
    });
    if (!advanced.ok) return advanced;
    working = {
      ...advanced.value,
      fleets: applyFleetEvent(advanced.value.fleets, event.payload),
    };
  }

  return executeCoreCommand(working, {
    type: 'ADVANCE_TIME',
    seconds: Math.max(0, targetTime - working.clock.elapsedSeconds),
  });
}

export function executeGameCommand(
  state: GameState,
  command: GameCommand,
): CommandResult<GameState> {
  switch (command.type) {
    case 'CREATE_FLEET':
      return createFleet(state, command);
    case 'DISBAND_FLEET':
      return disbandFleet(state, command);
    case 'SEND_FLEET':
      return sendFleet(state, command);
    case 'RECALL_FLEET':
      return recallFleet(state, command);
    case 'ADVANCE_TIME':
      return advanceWithFlightEvents(state, command.seconds);
    case 'SCHEDULE_EVENT':
      if (
        command.payload.type === 'FLEET_ARRIVE' ||
        command.payload.type === 'FLEET_RETURN'
      ) {
        return {
          ok: false,
          code: 'RESERVED_EVENT_TYPE',
          message: 'Fleet flight events can only be created by fleet commands.',
        };
      }
      return executeCoreCommand(state, command);
    default:
      return executeCoreCommand(state, command);
  }
}
