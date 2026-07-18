import type { ScheduledGameEvent } from './types';

function compareEvents(left: ScheduledGameEvent, right: ScheduledGameEvent): number {
  if (left.executeAt !== right.executeAt) {
    return left.executeAt - right.executeAt;
  }

  return left.sequence - right.sequence;
}

export function enqueueEvent(
  events: readonly ScheduledGameEvent[],
  event: ScheduledGameEvent,
): readonly ScheduledGameEvent[] {
  return [...events, event].sort(compareEvents);
}

export function partitionDueEvents(
  events: readonly ScheduledGameEvent[],
  targetTime: number,
): {
  readonly due: readonly ScheduledGameEvent[];
  readonly pending: readonly ScheduledGameEvent[];
} {
  const due: ScheduledGameEvent[] = [];
  const pending: ScheduledGameEvent[] = [];

  for (const event of events) {
    if (event.executeAt <= targetTime) {
      due.push(event);
    } else {
      pending.push(event);
    }
  }

  return { due, pending };
}
