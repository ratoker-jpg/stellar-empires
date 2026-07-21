import { appendCommandHistory } from '../history/stateHistory';
import type { ResourceId } from '../economy/types';
import type { PlanetState } from '../planet/types';
import type { CommandLogEntry, CommandResult, GameCommand, GameState } from '../types';
import type { LogisticsRoute, LogisticsRouteResultCode } from './types';

const RESOURCE_IDS: readonly ResourceId[] = ['metal', 'crystal', 'gas'];
const MIN_INTERVAL_SECONDS = 300;
const MAX_INTERVAL_SECONDS = 86_400;
const MAX_AMOUNT_PER_TRIP = 100_000;

function appendCommand(state: GameState, command: GameCommand): readonly CommandLogEntry[] {
  return appendCommandHistory(state.commandLog, command);
}

function isResourceId(value: unknown): value is ResourceId {
  return RESOURCE_IDS.includes(value as ResourceId);
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
  const numberError = validateRouteNumbers(
    amountPerTrip,
    originReserve,
    intervalSeconds,
    priority,
  );
  if (numberError !== undefined) {
    return { ok: false, code: numberError, message: 'Route parameters are invalid.' };
  }
  const updated: LogisticsRoute = {
    ...route,
    amountPerTrip,
    originReserve,
    intervalSeconds,
    priority,
    status: command.status ?? route.status,
    nextDepartureAt:
      command.intervalSeconds === undefined
        ? route.nextDepartureAt
        : state.clock.elapsedSeconds + intervalSeconds,
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
): { readonly planets: readonly PlanetState[]; readonly route: LogisticsRoute } {
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

export function processLogisticsDeparturesAt(
  state: GameState,
  departureAt: number,
): GameState {
  const due = state.logisticsRoutes
    .filter((route) => route.status === 'active' && route.nextDepartureAt === departureAt)
    .sort((left, right) => right.priority - left.priority || left.id.localeCompare(right.id));
  let working = state;
  for (const dueRoute of due) {
    const route = working.logisticsRoutes.find((candidate) => candidate.id === dueRoute.id);
    if (route === undefined) continue;
    const resolved = resolveRoute(working, route, departureAt);
    working = {
      ...working,
      planets: resolved.planets,
      logisticsRoutes: working.logisticsRoutes.map((candidate) =>
        candidate.id === route.id ? resolved.route : candidate,
      ),
    };
  }
  return working;
}
