import { getResearchEffectsForEmpire } from '../factions/factionResearchEffects';
import {
  estimateFlightToGalaxyPlanet,
} from '../fleets/flightCalculations';
import type { FleetState } from '../fleets/types';
import type { PlanetState } from '../planet/types';
import type { SpaceCoordinate } from '../space/coordinates';
import type { GameState } from '../types';
import { hasShipRole } from '../units/shipCapabilities';
import type { ShipRole } from '../units/types';
import {
  calculatePirateThreatMultiplier,
  calculatePveRewardMultiplier,
  PIRATE_HUNT_REWARD_PERMILLE,
} from './pveBalance';
import {
  createPirateBaseBaselines,
  PIRATE_EMPIRE_ID,
} from './neutralForces';
import {
  estimateSpaceObjectMission,
  type SpaceObjectKind,
  type SpaceObjectState,
} from './spaceObjects';
import { PVE_TARGET_RECOVERY_SECONDS } from './targetRecovery';
import {
  getWorldEventHazardModifier,
  getWorldEventYieldPermille,
  WORLD_EVENT_CATALOG,
  type WorldEventInstance,
} from './worldEvents';
import { materializeGalaxy } from '../universe/model';

export type PveOpportunityKind =
  | 'expedition'
  | 'space-object'
  | 'pirate-base'
  | 'world-event';

export type PveOpportunityStatus =
  | 'event-active'
  | 'available'
  | 'active-operation'
  | 'recovering'
  | 'unavailable';

export type PveAvailabilityCode =
  | 'active-world-event'
  | 'available'
  | 'active-operation'
  | 'cooling-down'
  | 'recovering'
  | 'specialist-fleet-required'
  | 'scout-fleet-required'
  | 'combat-fleet-required'
  | 'target-occupied'
  | 'target-unavailable';

export interface PveOpportunityEntry {
  readonly id: string;
  readonly kind: PveOpportunityKind;
  readonly title: string;
  readonly coordinate: SpaceCoordinate;
  readonly status: PveOpportunityStatus;
  readonly availabilityCode: PveAvailabilityCode;
  readonly availabilityExplanation: string;
  readonly requiredShipRole?: ShipRole;
  readonly activeFleetId?: string;
  readonly flightDurationSeconds?: number;
  readonly fuelRequired?: number;
  readonly yieldRemaining?: number;
  readonly yieldInitial?: number;
  readonly hazardPermille?: number;
  readonly controllerEmpireId?: string | null;
  readonly controlExpiresAt?: number | null;
  readonly cooldownUntil?: number;
  readonly recoveryAt?: number;
  readonly eventDefinitionId?: WorldEventInstance['definitionId'];
  readonly eventEndsAt?: number;
  readonly rewardMultiplierPermille?: number;
  readonly threatMultiplierPermille?: number;
  readonly targetId: string;
}

const OBJECT_ROLE: Readonly<Record<SpaceObjectKind, ShipRole>> = {
  asteroid: 'recycler',
  'gas-cloud': 'transport',
  anomaly: 'scout',
};

const OBJECT_TITLE: Readonly<Record<SpaceObjectKind, string>> = {
  asteroid: 'Астероид',
  'gas-cloud': 'Газовое облако',
  anomaly: 'Аномалия',
};

function coordinateKey(coordinate: SpaceCoordinate): readonly number[] {
  return [coordinate.galaxy, coordinate.solarSystem, coordinate.position];
}

function compareCoordinates(left: SpaceCoordinate, right: SpaceCoordinate): number {
  const leftKey = coordinateKey(left);
  const rightKey = coordinateKey(right);
  return (leftKey[0] ?? 0) - (rightKey[0] ?? 0) ||
    (leftKey[1] ?? 0) - (rightKey[1] ?? 0) ||
    (leftKey[2] ?? 0) - (rightKey[2] ?? 0);
}

function statusRank(entry: PveOpportunityEntry): number {
  if (entry.status === 'event-active') return 0;
  if (entry.status === 'available') return 1;
  if (entry.status === 'active-operation') return 2;
  if (entry.status === 'recovering') return 3;
  return 4;
}

function compareEntries(left: PveOpportunityEntry, right: PveOpportunityEntry): number {
  return statusRank(left) - statusRank(right) ||
    compareCoordinates(left.coordinate, right.coordinate) ||
    left.kind.localeCompare(right.kind) ||
    left.id.localeCompare(right.id);
}

function fleetSpeedBonus(state: GameState, empireId: string): number {
  return getResearchEffectsForEmpire(state, empireId).fleetSpeedPercent;
}

function playerFleets(state: GameState): readonly FleetState[] {
  return state.fleets
    .filter((fleet) => fleet.empireId === 'player')
    .sort((left, right) => left.id.localeCompare(right.id));
}

function stationedFleetWithRole(
  state: GameState,
  role: ShipRole,
): FleetState | undefined {
  return playerFleets(state).find((fleet) =>
    fleet.status === 'stationed' &&
    fleet.location.type === 'planet' &&
    hasShipRole(fleet.ships, role),
  );
}

function activeMissionFleet(
  state: GameState,
  kind: 'expedition' | 'space-object' | 'attack',
  targetId: string,
): FleetState | undefined {
  return playerFleets(state).find((fleet) =>
    fleet.mission?.kind === kind && fleet.mission.targetPlanetId === targetId,
  );
}

function expeditionEntries(state: GameState): readonly PveOpportunityEntry[] {
  const occupied = new Set(state.planets.map((planet) => planet.galaxyPlanetId));
  return state.galaxy.systems.flatMap((system) =>
    system.planets
      .filter((planet) => !occupied.has(planet.id))
      .map((planet): PveOpportunityEntry => {
        const coordinate: SpaceCoordinate = {
          galaxy: system.galaxy,
          solarSystem: system.solarSystem,
          position: planet.position,
        };
        const activeFleet = activeMissionFleet(state, 'expedition', planet.id);
        if (activeFleet !== undefined) {
          return {
            id: `expedition:${planet.id}`,
            kind: 'expedition',
            title: `Экспедиция · ${system.name}:${planet.position}`,
            coordinate,
            status: 'active-operation',
            availabilityCode: 'active-operation',
            availabilityExplanation: `Экспедицию выполняет ${activeFleet.id}.`,
            requiredShipRole: 'scout',
            activeFleetId: activeFleet.id,
            targetId: planet.id,
          };
        }
        const fleet = stationedFleetWithRole(state, 'scout');
        if (fleet === undefined || fleet.location.type !== 'planet') {
          return {
            id: `expedition:${planet.id}`,
            kind: 'expedition',
            title: `Экспедиция · ${system.name}:${planet.position}`,
            coordinate,
            status: 'unavailable',
            availabilityCode: 'scout-fleet-required',
            availabilityExplanation: 'Нужен станционированный флот с разведчиком.',
            requiredShipRole: 'scout',
            targetId: planet.id,
          };
        }
        const originPlanetId = fleet.location.planetId;
        try {
          const estimate = estimateFlightToGalaxyPlanet(
            state.galaxy,
            state.planets,
            fleet,
            planet.id,
            fleetSpeedBonus(state, fleet.empireId),
          );
          const origin = state.planets.find(
            (candidate) => candidate.id === originPlanetId,
          );
          const fuelRequired = estimate.fuelCost * 2;
          const enoughFuel = (origin?.economy.resources.gas.amount ?? 0) >= fuelRequired;
          return {
            id: `expedition:${planet.id}`,
            kind: 'expedition',
            title: `Экспедиция · ${system.name}:${planet.position}`,
            coordinate,
            status: enoughFuel ? 'available' : 'unavailable',
            availabilityCode: enoughFuel ? 'available' : 'target-unavailable',
            availabilityExplanation: enoughFuel
              ? `Доступно флоту ${fleet.id}.`
              : `Недостаточно газа для полного цикла флотом ${fleet.id}.`,
            requiredShipRole: 'scout',
            activeFleetId: fleet.id,
            flightDurationSeconds: estimate.durationSeconds * 2,
            fuelRequired,
            rewardMultiplierPermille: calculatePveRewardMultiplier(
              state,
              'player',
              'expedition',
              planet.id,
            ),
            targetId: planet.id,
          };
        } catch {
          return {
            id: `expedition:${planet.id}`,
            kind: 'expedition',
            title: `Экспедиция · ${system.name}:${planet.position}`,
            coordinate,
            status: 'unavailable',
            availabilityCode: 'target-unavailable',
            availabilityExplanation: 'Маршрут экспедиции недоступен.',
            requiredShipRole: 'scout',
            activeFleetId: fleet.id,
            targetId: planet.id,
          };
        }
      }),
  );
}

function objectEntry(state: GameState, object: SpaceObjectState): PveOpportunityEntry {
  const coordinate = object.coordinate ?? {
    galaxy: state.galaxy.galaxy,
    solarSystem: state.galaxy.systems.find((system) => system.id === object.systemId)?.solarSystem ?? 0,
    position: object.position,
  };
  const role = OBJECT_ROLE[object.kind];
  const activeFleet = activeMissionFleet(state, 'space-object', object.id);
  const eventYield = getWorldEventYieldPermille(state, object.id);
  const hazardPermille = Math.max(
    0,
    Math.min(950, object.hazardPermille + getWorldEventHazardModifier(state, object.systemId)),
  );
  const base = {
    id: `space-object:${object.id}`,
    kind: 'space-object' as const,
    title: `${OBJECT_TITLE[object.kind]} · ${object.systemId}`,
    coordinate,
    requiredShipRole: role,
    yieldRemaining: object.remainingYield,
    yieldInitial: object.initialYield,
    hazardPermille,
    controllerEmpireId: object.controllerEmpireId,
    controlExpiresAt: object.controlExpiresAt,
    cooldownUntil: object.cooldownUntil,
    rewardMultiplierPermille: eventYield,
    targetId: object.id,
  };
  if (activeFleet !== undefined) {
    return {
      ...base,
      status: 'active-operation',
      availabilityCode: 'active-operation',
      availabilityExplanation: `Операцию выполняет ${activeFleet.id}.`,
      activeFleetId: activeFleet.id,
    };
  }
  if (object.remainingYield <= 0) {
    return {
      ...base,
      status: 'recovering',
      availabilityCode: 'recovering',
      availabilityExplanation: `Объект истощён и восстановится не раньше ${object.cooldownUntil}.`,
      recoveryAt: object.cooldownUntil,
    };
  }
  if (object.cooldownUntil > state.clock.elapsedSeconds) {
    return {
      ...base,
      status: 'recovering',
      availabilityCode: 'cooling-down',
      availabilityExplanation: `Объект нестабилен до ${object.cooldownUntil}.`,
      recoveryAt: object.cooldownUntil,
    };
  }
  const fleet = stationedFleetWithRole(state, role);
  if (fleet === undefined) {
    return {
      ...base,
      status: 'unavailable',
      availabilityCode: 'specialist-fleet-required',
      availabilityExplanation: `Нужен станционированный флот с ролью ${role}.`,
    };
  }
  try {
    const estimate = estimateSpaceObjectMission(state, fleet, object);
    const originId = fleet.location.type === 'planet' ? fleet.location.planetId : undefined;
    const origin = state.planets.find((planet) => planet.id === originId);
    const enoughFuel = (origin?.economy.resources.gas.amount ?? 0) >= estimate.totalFuelCost;
    return {
      ...base,
      status: enoughFuel ? 'available' : 'unavailable',
      availabilityCode: enoughFuel ? 'available' : 'target-unavailable',
      availabilityExplanation: enoughFuel
        ? `Доступно флоту ${fleet.id}.`
        : `Недостаточно газа для полного цикла флотом ${fleet.id}.`,
      activeFleetId: fleet.id,
      flightDurationSeconds: estimate.totalDurationSeconds,
      fuelRequired: estimate.totalFuelCost,
    };
  } catch {
    return {
      ...base,
      status: 'unavailable',
      availabilityCode: 'target-unavailable',
      availabilityExplanation: 'Маршрут к объекту недоступен.',
      activeFleetId: fleet.id,
    };
  }
}

function latestPirateBattleAt(state: GameState, baseline: PlanetState): number | undefined {
  return state.eventLog
    .filter((entry) => {
      const payload = entry.event.payload;
      return payload.type === 'BATTLE_REPORT' &&
        payload.report.defenderEmpireId === PIRATE_EMPIRE_ID &&
        (payload.report.targetPlanetId === baseline.id ||
          payload.report.targetGalaxyPlanetId === baseline.galaxyPlanetId);
    })
    .map((entry) => entry.executedAt)
    .sort((left, right) => right - left)[0];
}

function recordsEqual(
  left: Readonly<Record<string, number>>,
  right: Readonly<Record<string, number>>,
): boolean {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].every((key) => (left[key] ?? 0) === (right[key] ?? 0));
}

function pirateNeedsRecovery(current: PlanetState, baseline: PlanetState): boolean {
  return current.economy.resources.metal.amount !== baseline.economy.resources.metal.amount ||
    current.economy.resources.crystal.amount !== baseline.economy.resources.crystal.amount ||
    current.economy.resources.gas.amount !== baseline.economy.resources.gas.amount ||
    !recordsEqual(current.inventory.defenses, baseline.inventory.defenses) ||
    !recordsEqual(current.defense.damaged, baseline.defense.damaged) ||
    current.defense.repairQueue.length > 0;
}

function withRecoveryAt(
  entry: PveOpportunityEntry,
  recoveryAt: number | undefined,
): PveOpportunityEntry {
  return recoveryAt === undefined ? entry : { ...entry, recoveryAt };
}

function pirateEntries(state: GameState): readonly PveOpportunityEntry[] {
  const originalGalaxy = materializeGalaxy(state.universe, state.galaxy.galaxy);
  return createPirateBaseBaselines(originalGalaxy, state.seed).map((baseline): PveOpportunityEntry => {
    const occupant = state.planets.find(
      (planet) => planet.galaxyPlanetId === baseline.galaxyPlanetId,
    );
    const activeFleet = activeMissionFleet(state, 'attack', baseline.id);
    const latestBattleAt = latestPirateBattleAt(state, baseline);
    const recoveryAt = latestBattleAt === undefined
      ? undefined
      : latestBattleAt + PVE_TARGET_RECOVERY_SECONDS;
    const base = {
      id: `pirate-base:${baseline.id}`,
      kind: 'pirate-base' as const,
      title: `Пиратский оплот · ${baseline.name}`,
      coordinate: baseline.coordinate,
      rewardMultiplierPermille: calculatePveRewardMultiplier(
        state,
        'player',
        'pirate-raid',
        baseline.id,
      ),
      threatMultiplierPermille: calculatePirateThreatMultiplier(state, 'player'),
      targetId: baseline.id,
    };
    if (activeFleet !== undefined) {
      return {
        ...base,
        status: 'active-operation',
        availabilityCode: 'active-operation',
        availabilityExplanation: `Атаку выполняет ${activeFleet.id}.`,
        activeFleetId: activeFleet.id,
      };
    }
    if (occupant === undefined) {
      return withRecoveryAt({
        ...base,
        status: 'recovering',
        availabilityCode: 'recovering',
        availabilityExplanation: recoveryAt === undefined
          ? 'Пиратская база отсутствует.'
          : `Пиратская база может вернуться не раньше ${recoveryAt}.`,
      }, recoveryAt);
    }
    if (occupant.id !== baseline.id || occupant.ownerEmpireId !== PIRATE_EMPIRE_ID) {
      return withRecoveryAt({
        ...base,
        status: 'unavailable',
        availabilityCode: 'target-occupied',
        availabilityExplanation: 'Исходная позиция пиратской базы занята.',
      }, recoveryAt);
    }
    if (pirateNeedsRecovery(occupant, baseline) && recoveryAt !== undefined && recoveryAt > state.clock.elapsedSeconds) {
      return {
        ...base,
        status: 'recovering',
        availabilityCode: 'recovering',
        availabilityExplanation: `База восстанавливается до ${recoveryAt}.`,
        recoveryAt,
      };
    }
    const combatFleet = playerFleets(state).find((fleet) =>
      fleet.status === 'stationed' && fleet.location.type === 'planet' &&
      Object.values(fleet.ships).some((quantity) => quantity > 0),
    );
    return {
      ...base,
      status: combatFleet === undefined ? 'unavailable' : 'available',
      availabilityCode: combatFleet === undefined
        ? 'combat-fleet-required'
        : 'available',
      availabilityExplanation: combatFleet === undefined
        ? 'Нужен станционированный боевой флот.'
        : `Доступно для атаки флотом ${combatFleet.id}.`,
      ...(combatFleet === undefined ? {} : { activeFleetId: combatFleet.id }),
    };
  });
}

function targetCoordinate(state: GameState, event: WorldEventInstance): SpaceCoordinate | undefined {
  if (event.targetType === 'space-object') {
    return state.spaceObjects.find((object) => object.id === event.targetId)?.coordinate;
  }
  if (event.targetType === 'planet') {
    return state.planets.find((planet) => planet.id === event.targetId)?.coordinate;
  }
  const system = state.galaxy.systems.find((candidate) => candidate.id === event.targetId);
  return system === undefined
    ? undefined
    : { galaxy: system.galaxy, solarSystem: system.solarSystem, position: 0 };
}

export function describeWorldEventEffect(event: WorldEventInstance): string {
  if (event.definitionId === 'solar-storm') return 'Риск операций в целевой системе повышен на 20%.';
  if (event.definitionId === 'anomaly-aftershock') return 'Риск операций в целевой системе повышен на 30%.';
  if (event.definitionId === 'mineral-bloom') return 'Добыча на целевом объекте повышена на 30%.';
  return `Награда за победу над целевой пиратской базой повышена до ${PIRATE_HUNT_REWARD_PERMILLE / 10}%.`;
}

function worldEventEntries(state: GameState): readonly PveOpportunityEntry[] {
  return state.worldEvents.active.flatMap((event) => {
    const coordinate = targetCoordinate(state, event);
    if (coordinate === undefined) return [];
    const definition = WORLD_EVENT_CATALOG[event.definitionId];
    const rewardMultiplierPermille = event.definitionId === 'mineral-bloom'
      ? 1_300
      : event.definitionId === 'pirate-hunt'
        ? calculatePveRewardMultiplier(state, 'player', 'pirate-raid', event.targetId)
        : 1_000;
    const threatMultiplierPermille = event.definitionId === 'solar-storm'
      ? 1_200
      : event.definitionId === 'anomaly-aftershock'
        ? 1_300
        : event.definitionId === 'pirate-hunt'
          ? calculatePirateThreatMultiplier(state, 'player')
          : 1_000;
    return [{
      id: `world-event:${event.id}`,
      kind: 'world-event' as const,
      title: definition.name,
      coordinate,
      status: 'event-active' as const,
      availabilityCode: 'active-world-event' as const,
      availabilityExplanation: `${definition.description} ${describeWorldEventEffect(event)}`,
      eventDefinitionId: event.definitionId,
      eventEndsAt: event.endsAt,
      rewardMultiplierPermille,
      threatMultiplierPermille,
      targetId: event.targetId,
    }];
  });
}

function objectEntries(state: GameState): readonly PveOpportunityEntry[] {
  return state.spaceObjects.map((object) => objectEntry(state, object));
}

export function createPveOperationsView(
  state: GameState,
): readonly PveOpportunityEntry[] {
  return [
    ...worldEventEntries(state),
    ...objectEntries(state),
    ...pirateEntries(state),
    ...expeditionEntries(state),
  ].sort(compareEntries);
}

export function filterPveOperationsView(
  entries: readonly PveOpportunityEntry[],
  kinds: readonly PveOpportunityKind[],
): readonly PveOpportunityEntry[] {
  const accepted = new Set(kinds);
  return entries.filter((entry) => accepted.has(entry.kind));
}
