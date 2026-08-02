import type { ScheduledGameEvent, GameState } from '../types';
import { applyExpeditionEvent } from './expeditions';
import { applySpaceObjectMissionEvent } from './spaceObjects';
import {
  PVE_TARGET_RECOVERY_SECONDS,
  SPACE_OBJECT_ACTIVE_COOLDOWN_SECONDS,
} from './targetRecovery';

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

function applyResolvedObjectCooldown(
  state: GameState,
  objectId: string,
  resolved: GameState,
): GameState {
  if (resolved === state) return resolved;
  const object = resolved.spaceObjects.find((candidate) => candidate.id === objectId);
  if (object === undefined) return resolved;
  const cooldownSeconds = object.remainingYield === 0
    ? PVE_TARGET_RECOVERY_SECONDS
    : SPACE_OBJECT_ACTIVE_COOLDOWN_SECONDS;
  const cooldownUntil = state.clock.elapsedSeconds + cooldownSeconds;
  if (object.cooldownUntil === cooldownUntil) return resolved;
  return {
    ...resolved,
    spaceObjects: resolved.spaceObjects.map((candidate) =>
      candidate.id === object.id ? { ...candidate, cooldownUntil } : candidate,
    ),
  };
}

export function applySpaceObjectMissionEventWithReturn(
  state: GameState,
  event: ScheduledGameEvent,
): GameState {
  if (event.payload.type !== 'SPACE_OBJECT_MISSION_RESOLVE') return state;
  const objectId = event.payload.report.objectId;
  const returnPlanetId = event.payload.report.returnPlanetId;
  const routedEvent: ScheduledGameEvent = returnPlanetId === undefined
    ? event
    : {
        ...event,
        payload: {
          type: 'SPACE_OBJECT_MISSION_RESOLVE',
          report: {
            ...event.payload.report,
            originPlanetId: returnPlanetId,
          },
        },
      };
  return applyResolvedObjectCooldown(
    state,
    objectId,
    applySpaceObjectMissionEvent(state, routedEvent),
  );
}
