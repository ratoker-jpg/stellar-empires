import { updateGalaxyPlanetOwner } from '../colonization/colonization';
import type { DebrisField } from '../combat/debris';
import type { FleetState } from '../fleets/types';
import '../pve/specialMissionReturn';
import type { GameState, ScheduledGameEvent } from '../types';
import type { PlanetState } from './types';

export interface DestroyedPlanetReconciliation {
  readonly state: GameState;
  readonly destroyedPlanet: PlanetState;
  readonly fallbackPlanetId: string;
  readonly removedFleetIds: readonly string[];
}

function comparePlanets(left: PlanetState, right: PlanetState): number {
  return left.coordinate.galaxy - right.coordinate.galaxy ||
    left.coordinate.solarSystem - right.coordinate.solarSystem ||
    left.coordinate.position - right.coordinate.position ||
    left.id.localeCompare(right.id);
}

function selectFallbackPlanet(
  planets: readonly PlanetState[],
  empireId: string,
  excludedPlanetId: string,
): PlanetState | undefined {
  return planets
    .filter(
      (planet) =>
        planet.ownerEmpireId === empireId && planet.id !== excludedPlanetId,
    )
    .sort(comparePlanets)[0];
}

function eventReferencesQueue(
  event: ScheduledGameEvent,
  researchQueueIds: ReadonlySet<string>,
  upgradeQueueIds: ReadonlySet<string>,
  targetPlanetId: string,
): boolean {
  const payload = event.payload;
  if (
    (payload.type === 'BUILDING_COMPLETE' ||
      payload.type === 'UNIT_PRODUCTION_COMPLETE' ||
      payload.type === 'DEFENSE_REPAIR_COMPLETE') &&
    payload.planetId === targetPlanetId
  ) {
    return true;
  }
  if (
    payload.type === 'RESEARCH_COMPLETE' &&
    researchQueueIds.has(payload.queueItemId)
  ) {
    return true;
  }
  return payload.type === 'SHIP_UPGRADE_COMPLETE' &&
    upgradeQueueIds.has(payload.queueItemId);
}

function mergeRekeyedDebris(
  fields: readonly DebrisField[],
  destroyedPlanet: PlanetState,
): readonly DebrisField[] {
  const byPlanetId = new Map<string, DebrisField>();
  for (const field of fields) {
    const planetId = field.planetId === destroyedPlanet.id
      ? destroyedPlanet.galaxyPlanetId
      : field.planetId;
    const existing = byPlanetId.get(planetId);
    if (existing === undefined) {
      byPlanetId.set(planetId, {
        ...field,
        id: `debris-${planetId}`,
        planetId,
        ...(field.coordinate === undefined && field.planetId === destroyedPlanet.id
          ? { coordinate: destroyedPlanet.coordinate }
          : {}),
      });
      continue;
    }
    byPlanetId.set(planetId, {
      ...existing,
      metal: existing.metal + field.metal,
      crystal: existing.crystal + field.crystal,
      createdAt: Math.max(existing.createdAt, field.createdAt),
      coordinate: existing.coordinate ?? field.coordinate ?? destroyedPlanet.coordinate,
    });
  }
  return [...byPlanetId.values()].sort(
    (left, right) => left.planetId.localeCompare(right.planetId),
  );
}

function isSpecialMission(fleet: FleetState): boolean {
  return fleet.mission?.kind === 'expedition' ||
    fleet.mission?.kind === 'space-object';
}

function createReturnEvent(
  sequence: number,
  fleetId: string,
  originPlanetId: string,
  executeAt: number,
): ScheduledGameEvent {
  return {
    id: `event-${sequence}`,
    executeAt,
    sequence,
    payload: { type: 'FLEET_RETURN', fleetId, originPlanetId },
  };
}

export function reconcileDestroyedPlanet(
  state: GameState,
  targetPlanetId: string,
): DestroyedPlanetReconciliation {
  const destroyedPlanet = state.planets.find(
    (planet) => planet.id === targetPlanetId,
  );
  if (destroyedPlanet === undefined) {
    throw new Error(`Destroyed planet ${targetPlanetId} was not found.`);
  }
  const ownerFallback = selectFallbackPlanet(
    state.planets,
    destroyedPlanet.ownerEmpireId,
    destroyedPlanet.id,
  );
  if (ownerFallback === undefined) {
    throw new Error('Planet destruction requires a surviving owner colony.');
  }

  const researchQueueIds = new Set(
    state.research.flatMap((entry) =>
      entry.queue
        .filter((item) => item.planetId === destroyedPlanet.id)
        .map((item) => item.id),
    ),
  );
  const upgradeQueueIds = new Set(
    state.shipUpgrades.flatMap((entry) =>
      entry.queue
        .filter((item) => item.planetId === destroyedPlanet.id)
        .map((item) => item.id),
    ),
  );
  const cancelledWorldEventIds = new Set(
    state.worldEvents.active
      .filter(
        (event) =>
          event.targetType === 'planet' &&
          (event.targetId === destroyedPlanet.id ||
            event.targetId === destroyedPlanet.galaxyPlanetId),
      )
      .map((event) => event.id),
  );

  const removedFleetIds = new Set<string>();
  const transformedFleetIds = new Set<string>();
  const returnEvents: ScheduledGameEvent[] = [];
  let nextEventSequence = state.nextEventSequence;
  const fleets: FleetState[] = [];

  for (const fleet of state.fleets) {
    if (
      fleet.location.type === 'planet' &&
      fleet.location.planetId === destroyedPlanet.id
    ) {
      removedFleetIds.add(fleet.id);
      continue;
    }

    const fallback = fleet.originPlanetId === destroyedPlanet.id
      ? selectFallbackPlanet(state.planets, fleet.empireId, destroyedPlanet.id)
      : state.planets.find((planet) => planet.id === fleet.originPlanetId);
    const originPlanetId = fallback?.id ?? fleet.originPlanetId;
    const baseFleet: FleetState = {
      ...fleet,
      originPlanetId,
      location: fleet.location.type === 'transit'
        ? {
            ...fleet.location,
            fromPlanetId: fleet.location.fromPlanetId === destroyedPlanet.id
              ? originPlanetId
              : fleet.location.fromPlanetId,
            toPlanetId: fleet.location.toPlanetId === destroyedPlanet.id &&
                isSpecialMission(fleet)
              ? originPlanetId
              : fleet.location.toPlanetId,
          }
        : fleet.location,
    };

    if (isSpecialMission(baseFleet)) {
      fleets.push(baseFleet);
      if (baseFleet.originPlanetId !== fleet.originPlanetId) {
        transformedFleetIds.add(fleet.id);
      }
      continue;
    }

    const targetsDestroyedPlanet =
      baseFleet.mission?.targetPlanetId === destroyedPlanet.id ||
      (baseFleet.location.type === 'transit' &&
        baseFleet.location.toPlanetId === destroyedPlanet.id);
    const returningToDestroyedPlanet =
      baseFleet.status === 'returning' &&
      (fleet.originPlanetId === destroyedPlanet.id ||
        (fleet.location.type === 'transit' &&
          fleet.location.toPlanetId === destroyedPlanet.id));

    if (targetsDestroyedPlanet || returningToDestroyedPlanet) {
      const liveOrigin = state.planets.find(
        (planet) => planet.id === originPlanetId,
      ) ?? selectFallbackPlanet(state.planets, fleet.empireId, destroyedPlanet.id);
      if (liveOrigin === undefined) {
        throw new Error(`Fleet ${fleet.id} has no live return colony.`);
      }
      const remainingSeconds = fleet.location.type === 'transit'
        ? Math.max(1, fleet.location.arrivesAt - state.clock.elapsedSeconds)
        : 1;
      const arrivesAt = state.clock.elapsedSeconds + remainingSeconds;
      fleets.push({
        ...baseFleet,
        originPlanetId: liveOrigin.id,
        status: 'returning',
        mission: null,
        location: {
          type: 'transit',
          fromPlanetId: liveOrigin.id,
          toPlanetId: liveOrigin.id,
          departedAt: state.clock.elapsedSeconds,
          arrivesAt,
        },
      });
      returnEvents.push(
        createReturnEvent(
          nextEventSequence,
          fleet.id,
          liveOrigin.id,
          arrivesAt,
        ),
      );
      nextEventSequence += 1;
      transformedFleetIds.add(fleet.id);
      continue;
    }

    fleets.push(baseFleet);
    if (baseFleet.originPlanetId !== fleet.originPlanetId) {
      transformedFleetIds.add(fleet.id);
    }
  }

  let pendingEvents = state.pendingEvents.filter((event) => {
    if (
      eventReferencesQueue(
        event,
        researchQueueIds,
        upgradeQueueIds,
        destroyedPlanet.id,
      )
    ) {
      return false;
    }
    const payload = event.payload;
    if (
      payload.type === 'WORLD_EVENT_END' &&
      cancelledWorldEventIds.has(payload.instanceId)
    ) {
      return false;
    }
    if (
      (payload.type === 'FLEET_ARRIVE' || payload.type === 'FLEET_RETURN') &&
      (removedFleetIds.has(payload.fleetId) ||
        transformedFleetIds.has(payload.fleetId) ||
        (payload.type === 'FLEET_ARRIVE' &&
          payload.targetPlanetId === destroyedPlanet.id) ||
        (payload.type === 'FLEET_RETURN' &&
          payload.originPlanetId === destroyedPlanet.id))
    ) {
      return false;
    }
    return true;
  });

  pendingEvents = pendingEvents.map((event) => {
    const payload = event.payload;
    if (payload.type === 'EXPEDITION_RESOLVE') {
      if (payload.report.originPlanetId !== destroyedPlanet.id) return event;
      return {
        ...event,
        payload: {
          type: 'EXPEDITION_RESOLVE' as const,
          report: { ...payload.report, returnPlanetId: ownerFallback.id },
        },
      };
    }
    if (payload.type === 'SPACE_OBJECT_MISSION_RESOLVE') {
      if (payload.report.originPlanetId !== destroyedPlanet.id) return event;
      return {
        ...event,
        payload: {
          type: 'SPACE_OBJECT_MISSION_RESOLVE' as const,
          report: { ...payload.report, returnPlanetId: ownerFallback.id },
        },
      };
    }
    return event;
  });
  pendingEvents = [...pendingEvents, ...returnEvents].sort(
    (left, right) =>
      left.executeAt - right.executeAt || left.sequence - right.sequence,
  );

  const survivingFleetIds = new Set(fleets.map((fleet) => fleet.id));
  const nextState: GameState = {
    ...state,
    galaxy: updateGalaxyPlanetOwner(
      state.galaxy,
      destroyedPlanet.galaxyPlanetId,
      null,
    ),
    planets: state.planets.filter((planet) => planet.id !== destroyedPlanet.id),
    research: state.research.map((entry) => ({
      ...entry,
      queue: entry.queue.filter((item) => item.planetId !== destroyedPlanet.id),
    })),
    shipUpgrades: state.shipUpgrades.map((entry) => ({
      ...entry,
      queue: entry.queue.filter((item) => item.planetId !== destroyedPlanet.id),
    })),
    fleets,
    commanders: state.commanders.map((entry) => ({
      ...entry,
      flagshipFleetId:
        entry.flagshipFleetId !== null &&
        !survivingFleetIds.has(entry.flagshipFleetId)
          ? null
          : entry.flagshipFleetId,
    })),
    debrisFields: mergeRekeyedDebris(state.debrisFields, destroyedPlanet),
    logisticsRoutes: state.logisticsRoutes.filter(
      (route) =>
        route.originPlanetId !== destroyedPlanet.id &&
        route.targetPlanetId !== destroyedPlanet.id,
    ),
    worldEvents: {
      ...state.worldEvents,
      active: state.worldEvents.active.filter(
        (event) => !cancelledWorldEventIds.has(event.id),
      ),
    },
    nextEventSequence,
    pendingEvents,
  };

  return {
    state: nextState,
    destroyedPlanet,
    fallbackPlanetId: ownerFallback.id,
    removedFleetIds: [...removedFleetIds].sort(),
  };
}
