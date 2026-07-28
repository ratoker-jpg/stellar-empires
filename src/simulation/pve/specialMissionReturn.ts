import type { ScheduledGameEvent, GameState } from '../types';
import { applyExpeditionEvent } from './expeditions';
import { applySpaceObjectMissionEvent } from './spaceObjects';

// Historical origin remains immutable evidence. returnPlanetId is additive live routing metadata.
declare module './expeditions' {
  interface ExpeditionReport {
    readonly returnPlanetId?: string;
  }
}

declare module './spaceObjects' {
  interface SpaceObjectMissionReport {
    readonly returnPlanetId?: string;
  }
}

export function applyExpeditionEventWithReturn(
  state: GameState,
  event: ScheduledGameEvent,
): GameState {
  if (event.payload.type !== 'EXPEDITION_RESOLVE') return state;
  const returnPlanetId = event.payload.report.returnPlanetId;
  if (returnPlanetId === undefined) return applyExpeditionEvent(state, event);
  return applyExpeditionEvent(state, {
    ...event,
    payload: {
      type: 'EXPEDITION_RESOLVE',
      report: {
        ...event.payload.report,
        originPlanetId: returnPlanetId,
      },
    },
  });
}

export function applySpaceObjectMissionEventWithReturn(
  state: GameState,
  event: ScheduledGameEvent,
): GameState {
  if (event.payload.type !== 'SPACE_OBJECT_MISSION_RESOLVE') return state;
  const returnPlanetId = event.payload.report.returnPlanetId;
  if (returnPlanetId === undefined) {
    return applySpaceObjectMissionEvent(state, event);
  }
  return applySpaceObjectMissionEvent(state, {
    ...event,
    payload: {
      type: 'SPACE_OBJECT_MISSION_RESOLVE',
      report: {
        ...event.payload.report,
        originPlanetId: returnPlanetId,
      },
    },
  });
}
