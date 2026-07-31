import type { ResourceId } from '../economy/types';
import { appendCommandHistory } from '../history/stateHistory';
import type { PlanetState } from '../planet/types';
import type { CommandLogEntry, CommandResult, GameCommand, GameState } from '../types';
import type {
  LogisticsDepartureReceipt,
  LogisticsRoute,
  LogisticsRouteResultCode,
} from './types';

const RESOURCE_IDS: readonly ResourceId[] = ['metal', 'crystal', 'gas'];
const MIN_INTERVAL_SECONDS = 300;
const MAX_INTERVAL_SECONDS = 86_400;
const MAX_AMOUNT_PER_TRIP = 100_000;

export interface LogisticsDepartureProcessingResult {
  readonly state: GameState;
  readonly receipts: readonly LogisticsDepartureReceipt[];
}

function appendCommand(state: GameState, command: GameCommand): readonly CommandLogEntry[] {
  return appendCommandHistory(state.commandLog, command);
}

function isResourceId(value: unknown): value is ResourceId {
  return RESOURCE_IDS.includes(value as ResourceId);
}

function routeKey(route: Pick<
  LogisticsRoute,
  'empireId' | 'originPlanetId' | 'targetPlanetId' | 'resourceId'
>): string {
  return [route.empireId, route.originPlanetId, route.targetPlanetId, route.resourceId].join('\u0000');
}

function parseRouteSequence(routeId: string): number | null {
  const match = /^logistics-(\d+)$/.exec(routeId);
  if (match === null) return null;
  const sequence = Number(match[1]);
  return Number.isSafeInteger(sequence) ? sequence : null;
}

function compareLegacySurvivors(left: LogisticsRoute, right: LogisticsRoute): number {
  const leftSequence = parseRouteSequence(left.id);
  const rightSequence = parseRouteSequence(right.id);
  if (leftSequence !== null && rightSequence !== null && leftSequence !== rightSequence) {
    return leftSequence - rightSequence;
  }
  if (leftSequence !== null && rightSequence === null) return -1;
  if (leftSequence === null && rightSequence !== null) return 1;
  return left.id.localeCompare(right.id);
}

export function normalizeLogisticsRoutes(
  routes: readonly LogisticsRoute[],
): readonly LogisticsRoute[] {
  const survivorByKey = new Map<string, { readonly route: LogisticsRoute; readonly index: number }>();
  routes.forEach((route, index) => {
    const key = routeKey(route);
    const current = survivorByKey.get(key);
    if (current === undefined || compareLegacySurvivors(route, current.route) < 0) {
      survivorByKey.set(key, { route, index });
    }
  });
  return [...survivorByKey.values()]
    .sort((left, right) => left.index - right.index)
    .map((entry) => entry.route);
}

function replacePlanets(
  planets: readonly PlanetState[],
  replacements: readonly PlanetState[],
): readonly PlanetState[] {
  const byId = new Map(replacements.map((planet) => [planet.id, planet]));
  return planets.map((planet) => byId.get(planet.id) ?? planet);
}

function validateRouteNumbers(
  amountPerTrip: number,
  originReserve: number,
  intervalSeconds: number,
  priority: number,
): string | undefined {
  if (!Number.isInteger(amountPerTrip) || amountPerTrip <= 0 || amountPerTrip > MAX_AMOUNT_PER_TRIP) {
    return 'INVALID_LOGISTICS_AMOUNT';
  }
  if (!Number.isInteger(originReserve) || originReserve < 0) {
    return 'INVALID_LOGISTICS_RESERVE';
  }
  if (
    !Number.isInteger(intervalSeconds) ||
    intervalSeconds < MIN_INTERVAL_SECONDS ||
    intervalSeconds > MAX_INTERVAL_SECONDS
  ) {
    return 'INVALID_LOGISTICS_INTERVAL';
  }
  if (priority !== 1 && priority !== 2 && priority !== 3) {
    return 'INVALID_LOGISTICS_PRIORITY';
  }
  return undefined;
}

function findOwnedPlanet(
  state: GameState,
  empireId: string,
  planetId: string,
): PlanetState | undefined {
  return state.planets.find(
    (planet) => planet.id === planetId && planet.ownerEmpireId === empireId,
  );
}

export function createLogisticsRoute(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'CREATE_LOGISTICS_ROUTE' }>,
): CommandResult<GameState> {
  if (!isResourceId(command.resourceId)) {
    return { ok: false, code: 'INVALID_LOGISTICS_RESOURCE', message: 'Route resource is invalid.' };
  }
  const numberError = validateRouteNumbers(
    command.amountPerTrip,
    command.originReserve,
    command.intervalSeconds,
    command.priority,
  );
  if (numberError !== undefined) {
    return { ok: false, code: numberError, message: 'Route parameters are invalid.' };
  }
  if (command.originPlanetId === command.targetPlanetId) {
    return { ok: false, code: 'LOGISTICS_SAME_PLANET', message: 'Route endpoints must be different.' };
  }
  const origin = findOwnedPlanet(state, command.empireId, command.originPlanetId);
  const target = findOwnedPlanet(state, command.empireId, command.targetPlanetId);
  if (origin === undefined || target === undefined) {
    return {
      ok: false,
      code: 'LOGISTICS_PLANET_UNAVAILABLE',
      message: 'Both route endpoints must be owned by the empire.',
    };
  }
  const key = routeKey({
    empireId: command.empireId,
    originPlanetId: origin.id,
    targetPlanetId: target.id,
    resourceId: command.resourceId,
  });
  if (state.logisticsRoutes.some((route) => routeKey(route) === key)) {
    return {
      ok: false,
      code: 'LOGISTICS_ROUTE_DUPLICATE',
      message: 'A route for this empire, endpoint pair and resource already exists.',
    };
  }
  const route: LogisticsRoute = {
    id: `logistics-${state.nextEventSequence}`,
    empireId: command.empireId,
    originPlanetId: origin.id,
    targetPlanetId: target.id,
    resourceId: command.resourceId,
    amountPerTrip: command.amountPerTrip,
    originReserve: command.originReserve,
    intervalSeconds: command.intervalSeconds,
    priority: command.priority,
    status: 'active',
    nextDepartureAt: state.clock.elapsedSeconds + command.intervalSeconds,
    consecutiveMisses: 0,
    lastResult: null,
  };
  return {
    ok: true,
    value: {
      ...state,
      logisticsRoutes: [...state.logisticsRoutes, route],
      nextEventSequence: state.nextEventSequence + 1,
      commandLog: appendCommand(state, command),
    },
  };
}

export function updateLogisticsRoute(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'UPDATE_LOGISTICS_ROUTE' }>,
): CommandResult<GameState> {
  const route = state.logisticsRoutes.find(
    (candidate) => candidate.id === command.routeId && candidate.empireId === command.empireId,
  );
  if (route === undefined) {
    return { ok: false, code: 'LOGISTICS_ROUTE_NOT_FOUND', message: 'Route was not found.' };
  }
  const amountPerTrip = command.amountPerTrip ?? route.amountPerTrip;
  const originReserve = command.originReserve ?? route.originReserve;
  const intervalSeconds = command.intervalSeconds ?? route.intervalSeconds;
  const priority = command.priority ?? route.priority;
  const status = command.status ?? route.status;
  const numberError = validateRouteNumbers(
    amountPerTrip,
    originReserve,
    intervalSeconds,
    priority,
  );
  if (numberError !== undefined) {
    return { ok: false, code: numberError, message: 'Route parameters are invalid.' };
  }
  const resumed = route.status === 'paused' && status === 'active';
  const activeIntervalChanged =
    route.status === 'active' && status === 'active' && command.intervalSeconds !== undefined;
  const updated: LogisticsRoute = {
    ...route,
    amountPerTrip,
    originReserve,
    intervalSeconds,
    priority,
    status,
    nextDepartureAt:
      resumed || activeIntervalChanged
        ? state.clock.elapsedSeconds + intervalSeconds
        : route.nextDepartureAt,
  };
  return {
    ok: true,
    value: {
      ...state,
      logisticsRoutes: state.logisticsRoutes.map((candidate) =>
        candidate.id === updated.id ? updated : candidate,
      ),
      commandLog: appendCommand(state, command),
    },
  };
}

export function deleteLogisticsRoute(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'DELETE_LOGISTICS_ROUTE' }>,
): CommandResult<GameState> {
  const route = state.logisticsRoutes.find(
    (candidate) => candidate.id === command.routeId && candidate.empireId === command.empireId,
  );
  if (route === undefined) {
    return { ok: false, code: 'LOGISTICS_ROUTE_NOT_FOUND', message: 'Route was not found.' };
  }
  return {
    ok: true,
    value: {
      ...state,
      logisticsRoutes: state.logisticsRoutes.filter((candidate) => candidate.id !== route.id),
      commandLog: appendCommand(state, command),
    },
  };
}

function resolveRoute(
  state: GameState,
  route: LogisticsRoute,
  executedAt: number,
): {
  readonly planets: readonly PlanetState[];
  readonly route: LogisticsRoute;
  readonly receipt: LogisticsDepartureReceipt;
} {
  const origin = findOwnedPlanet(state, route.empireId, route.originPlanetId);
  const target = findOwnedPlanet(state, route.empireId, route.targetPlanetId);
  let code: LogisticsRouteResultCode;
  let amount = 0;
  let planets = state.planets;

  if (origin === undefined) {
    code = 'origin-missing';
  } else if (target === undefined) {
    code = 'target-missing';
  } else {
    const originStock = origin.economy.resources[route.resourceId];
    const targetStock = target.economy.resources[route.resourceId];
    const available = Math.max(0, originStock.amount - route.originReserve);
    const targetSpace = Math.max(0, targetStock.capacity - targetStock.amount);
    amount = Math.min(route.amountPerTrip, available, targetSpace);
    if (amount <= 0) {
      code = available <= 0 ? 'origin-reserve' : 'target-full';
    } else {
      code = 'transferred';
      const updatedOrigin: PlanetState = {
        ...origin,
        economy: {
          ...origin.economy,
          resources: {
            ...origin.economy.resources,
            [route.resourceId]: { ...originStock, amount: originStock.amount - amount },
          },
        },
      };
      const updatedTarget: PlanetState = {
        ...target,
        economy: {
          ...target.economy,
          resources: {
            ...target.economy.resources,
            [route.resourceId]: { ...targetStock, amount: targetStock.amount + amount },
          },
        },
      };
      planets = replacePlanets(state.planets, [updatedOrigin, updatedTarget]);
    }
  }

  return {
    planets,
    route: {
      ...route,
      nextDepartureAt: route.nextDepartureAt + route.intervalSeconds,
      consecutiveMisses: code === 'transferred' ? 0 : route.consecutiveMisses + 1,
      lastResult: { executedAt, code, amount },
    },
    receipt: {
      routeId: route.id,
      empireId: route.empireId,
      executedAt,
      resultCode: code,
      amount,
    },
  };
}

export function getNextLogisticsDepartureAt(
  state: GameState,
  targetTime: number,
): number | undefined {
  return state.logisticsRoutes
    .filter((route) => route.status === 'active' && route.nextDepartureAt <= targetTime)
    .reduce<number | undefined>(
      (earliest, route) =>
        earliest === undefined || route.nextDepartureAt < earliest
          ? route.nextDepartureAt
          : earliest,
      undefined,
    );
}

export function processLogisticsDeparturesAtWithReceipts(
  state: GameState,
  departureAt: number,
): LogisticsDepartureProcessingResult {
  const due = state.logisticsRoutes
    .filter((route) => route.status === 'active' && route.nextDepartureAt === departureAt)
    .sort((left, right) => right.priority - left.priority || left.id.localeCompare(right.id));
  let working = state;
  const receipts: LogisticsDepartureReceipt[] = [];
  for (const dueRoute of due) {
    const route = working.logisticsRoutes.find((candidate) => candidate.id === dueRoute.id);
    if (route === undefined) continue;
    const resolved = resolveRoute(working, route, departureAt);
    receipts.push(resolved.receipt);
    working = {
      ...working,
      planets: resolved.planets,
      logisticsRoutes: working.logisticsRoutes.map((candidate) =>
        candidate.id === route.id ? resolved.route : candidate,
      ),
    };
  }
  return { state: working, receipts };
}

export function processLogisticsDeparturesAt(
  state: GameState,
  departureAt: number,
): GameState {
  return processLogisticsDeparturesAtWithReceipts(state, departureAt).state;
}
