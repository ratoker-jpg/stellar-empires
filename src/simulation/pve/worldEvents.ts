import { enqueueEvent } from '../eventQueue';
import type { GameState, ScheduledGameEvent } from '../types';
import { PIRATE_EMPIRE_ID } from './neutralForces';

export type WorldEventDefinitionId =
  | 'solar-storm'
  | 'mineral-bloom'
  | 'pirate-hunt'
  | 'anomaly-aftershock';
export type WorldEventTargetType = 'system' | 'space-object' | 'planet';

export interface WorldEventDefinition {
  readonly id: WorldEventDefinitionId;
  readonly name: string;
  readonly description: string;
  readonly durationSeconds: number;
  readonly cooldownSeconds: number;
  readonly targetType: WorldEventTargetType;
  readonly evaluationEligible: boolean;
  readonly chainTo: WorldEventDefinitionId | null;
}

export interface WorldEventInstance {
  readonly id: string;
  readonly definitionId: WorldEventDefinitionId;
  readonly targetType: WorldEventTargetType;
  readonly targetId: string;
  readonly startedAt: number;
  readonly endsAt: number;
  readonly chainDepth: number;
}

export interface WorldEventHistoryEntry extends WorldEventInstance {
  readonly completedAt: number;
  readonly completion: 'completed' | 'recovered';
}

export interface WorldEventState {
  readonly active: readonly WorldEventInstance[];
  readonly history: readonly WorldEventHistoryEntry[];
  readonly cooldowns: Readonly<Partial<Record<WorldEventDefinitionId, number>>>;
  readonly nextEvaluationAt: number;
}

export const WORLD_EVENT_EVALUATION_INTERVAL_SECONDS = 1_800;
export const MAX_WORLD_EVENT_CHAIN_DEPTH = 3;

export const WORLD_EVENT_CATALOG: Readonly<Record<WorldEventDefinitionId, WorldEventDefinition>> = {
  'solar-storm': {
    id: 'solar-storm',
    name: 'Солнечный шторм',
    description: 'Повышает риск операций во всей системе и может вызвать аномальный отголосок.',
    durationSeconds: 1_800,
    cooldownSeconds: 7_200,
    targetType: 'system',
    evaluationEligible: true,
    chainTo: 'anomaly-aftershock',
  },
  'mineral-bloom': {
    id: 'mineral-bloom',
    name: 'Минеральный выброс',
    description: 'Временно повышает эффективность добычи на астероиде или в газовом облаке.',
    durationSeconds: 2_400,
    cooldownSeconds: 9_000,
    targetType: 'space-object',
    evaluationEligible: true,
    chainTo: null,
  },
  'pirate-hunt': {
    id: 'pirate-hunt',
    name: 'Охота на пиратский оплот',
    description: 'Создаёт временную PvE-цель вокруг существующей пиратской базы.',
    durationSeconds: 3_600,
    cooldownSeconds: 10_800,
    targetType: 'planet',
    evaluationEligible: true,
    chainTo: null,
  },
  'anomaly-aftershock': {
    id: 'anomaly-aftershock',
    name: 'Аномальный отголосок',
    description: 'Короткая опасная фаза после солнечного шторма.',
    durationSeconds: 1_200,
    cooldownSeconds: 0,
    targetType: 'system',
    evaluationEligible: false,
    chainTo: null,
  },
};

function hashText(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

export function createInitialWorldEventState(
  elapsedSeconds = 0,
): WorldEventState {
  return {
    active: [],
    history: [],
    cooldowns: {},
    nextEvaluationAt: elapsedSeconds + WORLD_EVENT_EVALUATION_INTERVAL_SECONDS,
  };
}

function targetCandidates(
  state: GameState,
  definition: WorldEventDefinition,
): readonly string[] {
  if (definition.targetType === 'system') {
    return state.galaxy.systems.map((system) => system.id).sort();
  }
  if (definition.targetType === 'space-object') {
    return state.spaceObjects
      .filter(
        (object) =>
          object.remainingYield > 0 &&
          (object.kind === 'asteroid' || object.kind === 'gas-cloud'),
      )
      .map((object) => object.id)
      .sort();
  }
  return state.planets
    .filter((planet) => planet.ownerEmpireId === PIRATE_EMPIRE_ID)
    .map((planet) => planet.id)
    .sort();
}

function isDefinitionEligible(
  state: GameState,
  definition: WorldEventDefinition,
  at: number,
): boolean {
  return (
    definition.evaluationEligible &&
    (state.worldEvents.cooldowns[definition.id] ?? 0) <= at &&
    !state.worldEvents.active.some((event) => event.definitionId === definition.id) &&
    targetCandidates(state, definition).length > 0
  );
}

export function startWorldEventAt(
  state: GameState,
  definitionId: WorldEventDefinitionId,
  targetType: WorldEventTargetType,
  targetId: string,
  chainDepth: number,
  at: number,
): GameState {
  const definition = WORLD_EVENT_CATALOG[definitionId];
  if (
    definition.targetType !== targetType ||
    chainDepth > MAX_WORLD_EVENT_CHAIN_DEPTH ||
    !targetCandidates(state, definition).includes(targetId)
  ) {
    return state;
  }
  if (
    state.worldEvents.active.some(
      (event) => event.definitionId === definitionId && event.targetId === targetId,
    )
  ) {
    return state;
  }
  const instance: WorldEventInstance = {
    id: `world-event-${state.nextEventSequence}`,
    definitionId,
    targetType,
    targetId,
    startedAt: at,
    endsAt: at + definition.durationSeconds,
    chainDepth,
  };
  const endEvent: ScheduledGameEvent = {
    id: `event-${state.nextEventSequence}`,
    executeAt: instance.endsAt,
    sequence: state.nextEventSequence,
    payload: { type: 'WORLD_EVENT_END', instanceId: instance.id },
  };
  return {
    ...state,
    worldEvents: {
      ...state.worldEvents,
      active: [...state.worldEvents.active, instance],
    },
    nextEventSequence: state.nextEventSequence + 1,
    pendingEvents: enqueueEvent(state.pendingEvents, endEvent),
  };
}

export function getNextWorldEventEvaluationAt(
  state: GameState,
  targetTime: number,
): number | undefined {
  return state.worldEvents.nextEvaluationAt <= targetTime
    ? state.worldEvents.nextEvaluationAt
    : undefined;
}

export function processWorldEventEvaluationAt(
  state: GameState,
  at: number,
): GameState {
  const eligible = Object.values(WORLD_EVENT_CATALOG)
    .filter((definition) => isDefinitionEligible(state, definition, at))
    .sort((left, right) => left.id.localeCompare(right.id));
  const nextEvaluationAt = at + WORLD_EVENT_EVALUATION_INTERVAL_SECONDS;
  if (eligible.length === 0) {
    return {
      ...state,
      worldEvents: { ...state.worldEvents, nextEvaluationAt },
    };
  }
  const roll = hashText(`${state.seed}:${at}:${state.worldEvents.history.length}:world-event`);
  const definition = eligible[roll % eligible.length] ?? eligible[0];
  if (definition === undefined) return state;
  const candidates = targetCandidates(state, definition);
  const targetId = candidates[Math.floor(roll / 17) % candidates.length] ?? candidates[0];
  if (targetId === undefined) {
    return {
      ...state,
      worldEvents: { ...state.worldEvents, nextEvaluationAt },
    };
  }
  const prepared: GameState = {
    ...state,
    worldEvents: { ...state.worldEvents, nextEvaluationAt },
  };
  return startWorldEventAt(prepared, definition.id, definition.targetType, targetId, 0, at);
}

function completeWorldEvent(
  state: GameState,
  instance: WorldEventInstance,
  completedAt: number,
): GameState {
  const definition = WORLD_EVENT_CATALOG[instance.definitionId];
  let working: GameState = {
    ...state,
    worldEvents: {
      ...state.worldEvents,
      active: state.worldEvents.active.filter((event) => event.id !== instance.id),
      history: [
        ...state.worldEvents.history,
        { ...instance, completedAt, completion: 'completed' },
      ],
      cooldowns: {
        ...state.worldEvents.cooldowns,
        [instance.definitionId]: completedAt + definition.cooldownSeconds,
      },
    },
  };
  if (definition.chainTo !== null && instance.chainDepth < MAX_WORLD_EVENT_CHAIN_DEPTH) {
    const chain = WORLD_EVENT_CATALOG[definition.chainTo];
    const sequence = working.nextEventSequence;
    const chainEvent: ScheduledGameEvent = {
      id: `event-${sequence}`,
      executeAt: completedAt + 300,
      sequence,
      payload: {
        type: 'WORLD_EVENT_START',
        definitionId: chain.id,
        targetType: chain.targetType,
        targetId: instance.targetId,
        chainDepth: instance.chainDepth + 1,
      },
    };
    working = {
      ...working,
      nextEventSequence: sequence + 1,
      pendingEvents: enqueueEvent(working.pendingEvents, chainEvent),
    };
  }
  return working;
}

export function applyWorldEventEvent(
  state: GameState,
  event: ScheduledGameEvent,
): GameState {
  const payload = event.payload;
  if (payload.type === 'WORLD_EVENT_START') {
    return startWorldEventAt(
      state,
      payload.definitionId,
      payload.targetType,
      payload.targetId,
      payload.chainDepth,
      state.clock.elapsedSeconds,
    );
  }
  if (payload.type !== 'WORLD_EVENT_END') return state;
  const instanceId = payload.instanceId;
  const instance = state.worldEvents.active.find(
    (candidate) => candidate.id === instanceId,
  );
  return instance === undefined
    ? state
    : completeWorldEvent(state, instance, state.clock.elapsedSeconds);
}

export function getWorldEventHazardModifier(
  state: GameState,
  systemId: string,
): number {
  return state.worldEvents.active.reduce((total, event) => {
    if (event.targetType !== 'system' || event.targetId !== systemId) return total;
    if (event.definitionId === 'solar-storm') return total + 200;
    if (event.definitionId === 'anomaly-aftershock') return total + 300;
    return total;
  }, 0);
}

export function getWorldEventYieldPermille(
  state: GameState,
  objectId: string,
): number {
  return state.worldEvents.active.some(
    (event) => event.definitionId === 'mineral-bloom' && event.targetId === objectId,
  )
    ? 1_300
    : 1_000;
}

export function reconcileWorldEventSchedule(state: GameState): GameState {
  const expired = state.worldEvents.active.filter(
    (event) => event.endsAt <= state.clock.elapsedSeconds,
  );
  const active = state.worldEvents.active.filter(
    (event) => event.endsAt > state.clock.elapsedSeconds,
  );
  const activeIds = new Set(active.map((event) => event.id));
  let pendingEvents = state.pendingEvents.filter(
    (pending) =>
      pending.payload.type !== 'WORLD_EVENT_END' ||
      activeIds.has(pending.payload.instanceId),
  );
  let nextEventSequence = state.nextEventSequence;
  for (const event of active) {
    const hasEnd = pendingEvents.some((pending) => {
      const payload = pending.payload;
      return payload.type === 'WORLD_EVENT_END' && payload.instanceId === event.id;
    });
    if (hasEnd) continue;
    pendingEvents = [
      ...pendingEvents,
      {
        id: `event-${nextEventSequence}`,
        executeAt: event.endsAt,
        sequence: nextEventSequence,
        payload: { type: 'WORLD_EVENT_END' as const, instanceId: event.id },
      },
    ];
    nextEventSequence += 1;
  }
  pendingEvents.sort(
    (left, right) => left.executeAt - right.executeAt || left.sequence - right.sequence,
  );
  const history: WorldEventHistoryEntry[] = [
    ...state.worldEvents.history,
    ...expired.map((event) => ({
      ...event,
      completedAt: state.clock.elapsedSeconds,
      completion: 'recovered' as const,
    })),
  ];
  const cooldowns: Partial<Record<WorldEventDefinitionId, number>> = {
    ...state.worldEvents.cooldowns,
  };
  for (const event of expired) {
    const cooldownUntil = event.endsAt + WORLD_EVENT_CATALOG[event.definitionId].cooldownSeconds;
    cooldowns[event.definitionId] = Math.max(
      cooldowns[event.definitionId] ?? 0,
      cooldownUntil,
    );
  }
  return {
    ...state,
    nextEventSequence,
    pendingEvents,
    worldEvents: {
      ...state.worldEvents,
      active,
      history,
      cooldowns,
      nextEvaluationAt:
        state.worldEvents.nextEvaluationAt > state.clock.elapsedSeconds
          ? state.worldEvents.nextEvaluationAt
          : state.clock.elapsedSeconds + WORLD_EVENT_EVALUATION_INTERVAL_SECONDS,
    },
  };
}
