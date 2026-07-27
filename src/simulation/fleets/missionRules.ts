import { getCommanderFleetEffects } from '../command/commanderShips';
import {
  findGalaxyPlanet,
  getColonizationLevel,
  getColonyLimit,
  getEmpireColonyCount,
  isColonizableGalaxyPlanet,
} from '../colonization/colonization';
import {
  getFleetSlotCapacity,
  getResearchEffectsForEmpire,
} from '../factions/factionResearchEffects';
import {
  createGalaxyIntelligenceView,
  type GalaxyIntelPlanet,
  type GalaxyIntelVisibility,
} from '../galaxy/intelligenceView';
import { getEmpireIntelligence } from '../intelligence/intelligenceState';
import type { FactionId } from '../planet/types';
import type { SpaceCoordinate } from '../space/coordinates';
import type { GameCommand, GameState } from '../types';
import { getUnitDefinition } from '../units/catalog';
import { hasShipRole } from '../units/shipCapabilities';
import {
  estimateFlight,
  estimateFlightToGalaxyPlanet,
  type FlightEstimate,
} from './flightCalculations';
import type { FleetMissionKind, FleetState } from './types';

export const ORDINARY_MISSION_KINDS = [
  'transport',
  'deploy',
  'scout',
  'attack',
  'recycle',
  'colonize',
] as const;

export type OrdinaryMissionKind = (typeof ORDINARY_MISSION_KINDS)[number];

export type MissionAvailabilityCode =
  | 'FLEET_NOT_FOUND'
  | 'NOT_FLEET_OWNER'
  | 'FLEET_NOT_STATIONED'
  | 'FLIGHT_ORIGIN_NOT_FOUND'
  | 'FLIGHT_ORIGIN_NOT_OWNED'
  | 'FLIGHT_SLOT_LIMIT_REACHED'
  | 'FLEET_TARGET_IS_ORIGIN'
  | 'MISSION_KIND_UNSUPPORTED'
  | 'FLIGHT_PLANET_NOT_FOUND'
  | 'MISSION_TARGET_NOT_OWNED'
  | 'SCOUT_TARGET_OWNED'
  | 'ATTACK_TARGET_OWNED'
  | 'COLONIZATION_TARGET_NOT_FOUND'
  | 'COLONIZATION_TARGET_UNAVAILABLE'
  | 'COLONIZATION_TECH_REQUIRED'
  | 'COLONY_LIMIT_REACHED'
  | 'FLEET_CARGO_OVER_CAPACITY'
  | 'SCOUT_SHIP_REQUIRED'
  | 'ATTACK_SHIP_REQUIRED'
  | 'RECYCLER_SHIP_REQUIRED'
  | 'COLONY_SHIP_REQUIRED'
  | 'DEBRIS_FIELD_NOT_FOUND'
  | 'ATTACK_INTELLIGENCE_REQUIRED'
  | 'FLIGHT_ROUTE_UNAVAILABLE'
  | 'INSUFFICIENT_FLIGHT_FUEL'
  | 'MISSION_READY';

export interface RedactedMissionTarget {
  readonly id: string;
  readonly galaxyPlanetId: string;
  readonly coordinate: SpaceCoordinate;
  readonly systemId: string;
  readonly position: number;
  readonly label: string;
  readonly visibility: GalaxyIntelVisibility;
  readonly knownOwnerEmpireId: string | null;
  readonly knownFactionId: FactionId | null;
}

export interface MissionAvailability {
  readonly allowed: boolean;
  readonly code: MissionAvailabilityCode;
  readonly message: string;
  readonly estimate: FlightEstimate | null;
  readonly slotCapacity: number;
  readonly slotUsed: number;
  readonly target: RedactedMissionTarget | null;
  readonly fuelRequired: number;
  readonly originGas: number;
}

export interface FleetSlotSummary {
  readonly capacity: number;
  readonly used: number;
  readonly available: number;
}

function result(
  code: MissionAvailabilityCode,
  message: string,
  slots: FleetSlotSummary,
  target: RedactedMissionTarget | null = null,
  estimate: FlightEstimate | null = null,
  fuelRequired = 0,
  originGas = 0,
): MissionAvailability {
  return {
    allowed: code === 'MISSION_READY',
    code,
    message,
    estimate,
    slotCapacity: slots.capacity,
    slotUsed: slots.used,
    target,
    fuelRequired,
    originGas,
  };
}

export function isOrdinaryMissionKind(
  mission: FleetMissionKind,
): mission is OrdinaryMissionKind {
  return ORDINARY_MISSION_KINDS.includes(mission as OrdinaryMissionKind);
}

export function getFleetSlotSummary(
  state: GameState,
  empireId: string,
): FleetSlotSummary {
  const capacity = getFleetSlotCapacity(state, empireId);
  const used = state.fleets.filter(
    (fleet) => fleet.empireId === empireId && fleet.status !== 'stationed',
  ).length;
  return {
    capacity,
    used,
    available: Math.max(0, capacity - used),
  };
}

function latestObservation(
  state: GameState,
  empireId: string,
  targetPlanetId: string,
) {
  const intelligence = getEmpireIntelligence(state.intelligence, empireId);
  return [...(intelligence?.observations ?? [])]
    .filter((observation) => observation.targetPlanetId === targetPlanetId)
    .sort(
      (left, right) =>
        right.observedAt - left.observedAt || left.id.localeCompare(right.id),
    )[0];
}

function isCurrentFullObservation(
  state: GameState,
  empireId: string,
  targetPlanetId: string,
): boolean {
  const observation = latestObservation(state, empireId, targetPlanetId);
  return observation !== undefined &&
    observation.expiresAt > state.clock.elapsedSeconds &&
    observation.snapshot.level === 3;
}

function findIntelligencePlanet(
  state: GameState,
  empireId: string,
  targetId: string,
): GalaxyIntelPlanet | undefined {
  return createGalaxyIntelligenceView(state, empireId).find(
    (planet) =>
      planet.galaxyPlanetId === targetId || planet.colonyId === targetId,
  );
}

function toRedactedTarget(
  state: GameState,
  planet: GalaxyIntelPlanet,
): RedactedMissionTarget | null {
  const spatial = findGalaxyPlanet(state.galaxy, planet.galaxyPlanetId);
  if (spatial === undefined) return null;
  const known = planet.visibility === 'owned' ||
    planet.visibility === 'current' ||
    planet.visibility === 'stale';
  return {
    id: planet.colonyId ?? planet.galaxyPlanetId,
    galaxyPlanetId: planet.galaxyPlanetId,
    coordinate: spatial.planet.coordinate,
    systemId: planet.systemId,
    position: planet.position,
    label: planet.displayName,
    visibility: planet.visibility,
    knownOwnerEmpireId: known ? planet.ownerEmpireId : null,
    knownFactionId: known ? planet.factionId : null,
  };
}

function redactedTarget(
  state: GameState,
  empireId: string,
  targetId: string,
): RedactedMissionTarget | null {
  const planet = findIntelligencePlanet(state, empireId, targetId);
  return planet === undefined ? null : toRedactedTarget(state, planet);
}

function sortTargets(
  targets: readonly RedactedMissionTarget[],
): readonly RedactedMissionTarget[] {
  return [...targets].sort(
    (left, right) =>
      left.coordinate.galaxy - right.coordinate.galaxy ||
      left.coordinate.solarSystem - right.coordinate.solarSystem ||
      left.coordinate.position - right.coordinate.position ||
      left.id.localeCompare(right.id),
  );
}

export function listMissionTargets(
  state: GameState,
  empireId: string,
  fleet: FleetState,
  mission: OrdinaryMissionKind,
): readonly RedactedMissionTarget[] {
  if (fleet.status !== 'stationed' || fleet.location.type !== 'planet') return [];
  const originPlanetId = fleet.location.planetId;
  const intelligence = createGalaxyIntelligenceView(state, empireId);
  const candidates: Array<RedactedMissionTarget | null> = [];

  if (mission === 'transport' || mission === 'deploy') {
    for (const planet of intelligence) {
      if (planet.visibility === 'owned' && planet.colonyId !== originPlanetId) {
        candidates.push(toRedactedTarget(state, planet));
      }
    }
  } else if (mission === 'scout') {
    for (const planet of intelligence) {
      if (
        planet.colonyId !== null &&
        planet.colonyId !== originPlanetId &&
        (planet.visibility === 'contact' ||
          planet.visibility === 'current' ||
          planet.visibility === 'stale')
      ) {
        candidates.push(toRedactedTarget(state, planet));
      }
    }
  } else if (mission === 'attack') {
    for (const planet of intelligence) {
      if (
        planet.colonyId !== null &&
        planet.visibility === 'current' &&
        isCurrentFullObservation(state, empireId, planet.colonyId)
      ) {
        candidates.push(toRedactedTarget(state, planet));
      }
    }
  } else if (mission === 'recycle') {
    for (const field of state.debrisFields) {
      if (field.metal <= 0 && field.crystal <= 0) continue;
      if (field.planetId === originPlanetId) continue;
      candidates.push(redactedTarget(state, empireId, field.planetId));
    }
  } else {
    for (const planet of intelligence) {
      if (planet.visibility === 'unclaimed' && planet.biome !== 'gas') {
        candidates.push(toRedactedTarget(state, planet));
      }
    }
  }

  return sortTargets(
    candidates.filter(
      (candidate): candidate is RedactedMissionTarget => candidate !== null,
    ),
  );
}

export function getMissionTargetLabel(
  state: GameState,
  empireId: string,
  targetId: string,
): string {
  return redactedTarget(state, empireId, targetId)?.label ?? targetId;
}

function hasArmedShip(fleet: FleetState): boolean {
  return Object.entries(fleet.ships).some(
    ([unitId, count]) =>
      count > 0 && (getUnitDefinition(unitId)?.stats.attack ?? 0) > 0,
  );
}

function cargoAmount(fleet: FleetState): number {
  return fleet.cargo.metal + fleet.cargo.crystal + fleet.cargo.gas;
}

function getFleetSpeedBonus(state: GameState, fleet: FleetState): number {
  return getResearchEffectsForEmpire(state, fleet.empireId).fleetSpeedPercent +
    getCommanderFleetEffects(state, fleet).speedBonusPercent;
}

export function getMissionAvailability(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'SEND_FLEET' }>,
): MissionAvailability {
  const slots = getFleetSlotSummary(state, command.empireId);
  const fleet = state.fleets.find((candidate) => candidate.id === command.fleetId);
  if (fleet === undefined) {
    return result('FLEET_NOT_FOUND', 'Флот не найден.', slots);
  }
  if (fleet.empireId !== command.empireId) {
    return result('NOT_FLEET_OWNER', 'Империя не владеет этим флотом.', slots);
  }
  if (fleet.status !== 'stationed' || fleet.location.type !== 'planet') {
    return result('FLEET_NOT_STATIONED', 'Флот не готов к отправке.', slots);
  }

  const origin = state.planets.find(
    (planet) => planet.id === fleet.location.planetId,
  );
  if (origin === undefined) {
    return result('FLIGHT_ORIGIN_NOT_FOUND', 'Точка отправления не найдена.', slots);
  }
  if (origin.ownerEmpireId !== command.empireId) {
    return result('FLIGHT_ORIGIN_NOT_OWNED', 'Флот должен отправляться с собственной колонии.', slots);
  }
  if (slots.used >= slots.capacity) {
    return result('FLIGHT_SLOT_LIMIT_REACHED', 'Все доступные слоты полётов заняты.', slots);
  }
  if (!isOrdinaryMissionKind(command.mission)) {
    return result('MISSION_KIND_UNSUPPORTED', 'Для этой операции используется отдельная команда.', slots);
  }
  if (command.mission !== 'colonize' && origin.id === command.targetPlanetId) {
    return result('FLEET_TARGET_IS_ORIGIN', 'Цель должна отличаться от точки отправления.', slots);
  }

  const targetView = redactedTarget(
    state,
    command.empireId,
    command.targetPlanetId,
  );

  if (command.mission === 'colonize') {
    const target = findGalaxyPlanet(state.galaxy, command.targetPlanetId);
    if (target === undefined) {
      return result('COLONIZATION_TARGET_NOT_FOUND', 'Позиция колонизации не найдена.', slots);
    }
    if (
      !isColonizableGalaxyPlanet(target.planet) ||
      state.planets.some((planet) => planet.galaxyPlanetId === command.targetPlanetId)
    ) {
      return result('COLONIZATION_TARGET_UNAVAILABLE', 'Выбранная позиция недоступна для колонизации.', slots, targetView);
    }
    if (getColonizationLevel(state, command.empireId) <= 0) {
      return result('COLONIZATION_TECH_REQUIRED', 'Требуется технология колонизации первого уровня.', slots, targetView);
    }
    if (
      getEmpireColonyCount(state, command.empireId) >=
      getColonyLimit(state, command.empireId)
    ) {
      return result('COLONY_LIMIT_REACHED', 'Достигнут предел колоний империи.', slots, targetView);
    }
    if (!hasShipRole(fleet.ships, 'colonizer')) {
      return result('COLONY_SHIP_REQUIRED', 'Для колонизации требуется колонизатор.', slots, targetView);
    }
  } else {
    const target = state.planets.find(
      (planet) => planet.id === command.targetPlanetId,
    );
    if (target === undefined) {
      return result('FLIGHT_PLANET_NOT_FOUND', 'Целевая планета не найдена.', slots, targetView);
    }
    if (
      (command.mission === 'transport' || command.mission === 'deploy') &&
      target.ownerEmpireId !== command.empireId
    ) {
      return result('MISSION_TARGET_NOT_OWNED', 'Транспорт и размещение доступны только между собственными колониями.', slots, targetView);
    }
    if (command.mission === 'scout' && target.ownerEmpireId === command.empireId) {
      return result('SCOUT_TARGET_OWNED', 'Собственную колонию не требуется разведывать.', slots, targetView);
    }
    if (command.mission === 'attack' && target.ownerEmpireId === command.empireId) {
      return result('ATTACK_TARGET_OWNED', 'Нельзя атаковать собственную колонию.', slots, targetView);
    }
    if (
      command.mission === 'recycle' &&
      !state.debrisFields.some(
        (field) =>
          field.planetId === target.id &&
          (field.metal > 0 || field.crystal > 0),
      )
    ) {
      return result('DEBRIS_FIELD_NOT_FOUND', 'У цели нет доступного поля обломков.', slots, targetView);
    }
  }

  if (cargoAmount(fleet) > fleet.cargoCapacity) {
    return result('FLEET_CARGO_OVER_CAPACITY', 'Груз превышает вместимость флота.', slots, targetView);
  }
  if (command.mission === 'scout' && !hasShipRole(fleet.ships, 'scout')) {
    return result('SCOUT_SHIP_REQUIRED', 'Для разведки требуется разведывательный корабль.', slots, targetView);
  }
  if (command.mission === 'attack' && !hasArmedShip(fleet)) {
    return result('ATTACK_SHIP_REQUIRED', 'Для атаки нужен хотя бы один вооружённый корабль.', slots, targetView);
  }
  if (command.mission === 'recycle' && !hasShipRole(fleet.ships, 'recycler')) {
    return result('RECYCLER_SHIP_REQUIRED', 'Для переработки требуется переработчик.', slots, targetView);
  }
  if (
    command.mission === 'attack' &&
    !isCurrentFullObservation(state, command.empireId, command.targetPlanetId)
  ) {
    return result('ATTACK_INTELLIGENCE_REQUIRED', 'Для атаки требуется актуальная разведка третьего уровня.', slots, targetView);
  }

  let estimate: FlightEstimate;
  try {
    const speedBonus = getFleetSpeedBonus(state, fleet);
    estimate = command.mission === 'colonize'
      ? estimateFlightToGalaxyPlanet(
          state.galaxy,
          state.planets,
          fleet,
          command.targetPlanetId,
          speedBonus,
        )
      : estimateFlight(
          state.galaxy,
          state.planets,
          fleet,
          command.targetPlanetId,
          speedBonus,
        );
  } catch {
    return result('FLIGHT_ROUTE_UNAVAILABLE', 'Маршрут до выбранной цели недоступен.', slots, targetView);
  }

  const fuelRequired = command.mission === 'colonize'
    ? estimate.fuelCost
    : estimate.fuelCost * 2;
  const originGas = origin.economy.resources.gas.amount;
  if (originGas < fuelRequired) {
    return result(
      'INSUFFICIENT_FLIGHT_FUEL',
      'На планете отправления недостаточно газа.',
      slots,
      targetView,
      estimate,
      fuelRequired,
      originGas,
    );
  }

  return result(
    'MISSION_READY',
    'Миссия готова к отправке.',
    slots,
    targetView,
    estimate,
    fuelRequired,
    originGas,
  );
}
