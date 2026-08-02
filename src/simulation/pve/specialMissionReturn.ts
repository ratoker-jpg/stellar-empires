import {
  awardPveReputation,
  calculateExpeditionReputationAward,
  calculateSpaceObjectReputationAward,
  createInitialPveMetaState,
} from '../pveMeta/reputation';
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

function awardResolvedReputation(
  before: GameState,
  after: GameState,
  empireId: string,
  amount: number,
): GameState {
  if (after === before || amount === 0) return after;
  return {
    ...after,
    pveMeta: awardPveReputation(
      after.pveMeta ?? createInitialPveMetaState(after.empires),
      empireId,
      amount,
    ),
  };
}

export function applyExpeditionEventWithReturn(
  state: GameState,
  event: ScheduledGameEvent,
): GameState {
  if (event.payload.type !== 'EXPEDITION_RESOLVE') return state;
  const report = event.payload.report;
  const returnPlanetId = report.returnPlanetId;
  const routedEvent: ScheduledGameEvent = returnPlanetId === undefined
    ? event
    : {
        ...event,
        payload: {
          type: 'EXPEDITION_RESOLVE',
          report: {
            ...report,
            originPlanetId: returnPlanetId,
          },
        },
      };
  return awardResolvedReputation(
    state,
    applyExpeditionEvent(state, routedEvent),
    report.empireId,
    calculateExpeditionReputationAward(report.outcome, report.reward),
  );
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
  const report = event.payload.report;
  const objectId = report.objectId;
  const returnPlanetId = report.returnPlanetId;
  const routedEvent: ScheduledGameEvent = returnPlanetId === undefined
    ? event
    : {
        ...event,
        payload: {
          type: 'SPACE_OBJECT_MISSION_RESOLVE',
          report: {
            ...report,
            originPlanetId: returnPlanetId,
          },
        },
      };
  const resolved = applyResolvedObjectCooldown(
    state,
    objectId,
    applySpaceObjectMissionEvent(state, routedEvent),
  );
  return awardResolvedReputation(
    state,
    resolved,
    report.empireId,
    calculateSpaceObjectReputationAward(report.depletion, report.reward),
  );
}
