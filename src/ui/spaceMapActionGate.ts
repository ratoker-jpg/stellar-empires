import {
  findFleetShipByRole,
  getColonizationLevel,
  getColonyLimit,
  getEmpireColonyCount,
} from '../simulation/colonization/colonization';
import type { FleetMissionKind, FleetState } from '../simulation/fleets/types';
import {
  createGalaxyIntelligenceView,
  type GalaxyIntelPlanet,
  type GalaxyIntelVisibility,
} from '../simulation/galaxy/intelligenceView';
import { planetIdForCoordinate, type SpaceCoordinate } from '../simulation/space/coordinates';
import type { GameState } from '../simulation/types';
import { getUnitDefinition } from '../simulation/units/catalog';
import { getRequiredSpaceObjectShipId } from '../simulation/pve/spaceObjects';
import type { SpaceMapSelectionDetail } from '../game/spaceMapPresentationEvents';

export type SpaceMapRelation = 'self' | 'hostile' | 'neutral' | 'unknown';
export type SpaceMapIntelQuality = 'exact' | 'fresh' | 'stale' | 'contact' | 'public' | 'unknown';
export type SpaceMapActionKind = 'mission' | 'space-object' | 'future';

export interface SpaceMapAction {
  readonly id: string;
  readonly kind: SpaceMapActionKind;
  readonly label: string;
  readonly enabled: boolean;
  readonly disabledReason: string | null;
  readonly mission?: FleetMissionKind;
  readonly targetId?: string;
  readonly objectId?: string;
}

export interface SpaceMapObjectDetails {
  readonly coordinate: SpaceCoordinate | null;
  readonly state: 'sun' | 'empty' | 'planet' | 'asteroid' | 'debris' | 'renegade';
  readonly label: string;
  readonly relation: SpaceMapRelation;
  readonly ownerEmpireId: string | null;
  readonly factionId: string | null;
  readonly allianceId: string | null;
  readonly intelQuality: SpaceMapIntelQuality;
  readonly intelAgeSeconds: number | null;
  readonly intelVisibility: GalaxyIntelVisibility | 'unknown';
  readonly actions: readonly SpaceMapAction[];
}

function disabledAction(
  id: string,
  kind: SpaceMapActionKind,
  label: string,
  reason: string,
  extra: Partial<Pick<SpaceMapAction, 'mission' | 'targetId' | 'objectId'>> = {},
): SpaceMapAction {
  return { id, kind, label, enabled: false, disabledReason: reason, ...extra };
}

function enabledAction(
  id: string,
  kind: SpaceMapActionKind,
  label: string,
  extra: Pick<SpaceMapAction, 'mission' | 'targetId'> | Pick<SpaceMapAction, 'objectId'>,
): SpaceMapAction {
  return { id, kind, label, enabled: true, disabledReason: null, ...extra };
}

function stationedPlayerFleets(state: GameState): readonly FleetState[] {
  return state.fleets.filter(
    (fleet) =>
      fleet.empireId === 'player' &&
      fleet.status === 'stationed' &&
      fleet.location.type === 'planet',
  );
}

function hasArmedFleet(fleets: readonly FleetState[]): boolean {
  return fleets.some((fleet) =>
    Object.entries(fleet.ships).some(
      ([unitId, quantity]) => quantity > 0 && (getUnitDefinition(unitId)?.stats.attack ?? 0) > 0,
    ),
  );
}

function missionAvailability(
  state: GameState,
  mission: FleetMissionKind,
  targetId: string,
): string | null {
  const fleets = stationedPlayerFleets(state);
  if (fleets.length === 0) return 'Нет готового флота на орбите игрока.';
  if (mission === 'scout' && !fleets.some((fleet) => findFleetShipByRole(fleet.ships, 'scout') !== undefined)) {
    return 'Требуется готовый флот с разведывательным кораблём.';
  }
  if (mission === 'attack' && !hasArmedFleet(fleets)) {
    return 'Требуется готовый флот хотя бы с одним вооружённым кораблём.';
  }
  if (mission === 'recycle' && !fleets.some((fleet) => findFleetShipByRole(fleet.ships, 'recycler') !== undefined)) {
    return 'Требуется готовый флот с переработчиком.';
  }
  if (mission === 'colonize') {
    if (!fleets.some((fleet) => findFleetShipByRole(fleet.ships, 'colonizer') !== undefined)) {
      return 'Требуется готовый флот с колонизатором.';
    }
    if (getColonizationLevel(state, 'player') <= 0) {
      return 'Требуется технология колонизации первого уровня.';
    }
    if (getEmpireColonyCount(state, 'player') >= getColonyLimit(state, 'player')) {
      return 'Достигнут текущий лимит колоний.';
    }
  }
  if (mission === 'transport' || mission === 'deploy') {
    const target = state.planets.find((planet) => planet.id === targetId);
    if (target === undefined || target.ownerEmpireId !== 'player') {
      return 'Транспорт и размещение доступны только между своими колониями.';
    }
    if (!fleets.some((fleet) => fleet.location.type === 'planet' && fleet.location.planetId !== targetId)) {
      return 'Нет готового флота на другой собственной колонии.';
    }
  }
  return null;
}

function actionForMission(
  state: GameState,
  mission: FleetMissionKind,
  targetId: string,
  label: string,
): SpaceMapAction {
  const reason = missionAvailability(state, mission, targetId);
  return reason === null
    ? enabledAction(`mission-${mission}`, 'mission', label, { mission, targetId })
    : disabledAction(`mission-${mission}`, 'mission', label, reason, { mission, targetId });
}

function intelForCoordinate(
  state: GameState,
  coordinate: SpaceCoordinate,
): GalaxyIntelPlanet | undefined {
  if (state.galaxy.galaxy !== coordinate.galaxy) return undefined;
  const galaxyPlanetId = planetIdForCoordinate(coordinate);
  return createGalaxyIntelligenceView(state, 'player').find(
    (planet) => planet.galaxyPlanetId === galaxyPlanetId,
  );
}

function qualityForIntel(
  visibility: GalaxyIntelVisibility | undefined,
): SpaceMapIntelQuality {
  switch (visibility) {
    case 'owned': return 'exact';
    case 'current': return 'fresh';
    case 'stale': return 'stale';
    case 'contact': return 'contact';
    case 'unclaimed': return 'public';
    default: return 'unknown';
  }
}

function relationForIntel(intel: GalaxyIntelPlanet | undefined): SpaceMapRelation {
  if (intel === undefined || intel.visibility === 'contact') return 'unknown';
  if (intel.ownerEmpireId === 'player') return 'self';
  if (intel.ownerEmpireId === null) return 'neutral';
  return 'hostile';
}

function ageForIntel(state: GameState, intel: GalaxyIntelPlanet | undefined): number | null {
  return intel?.observedAt === null || intel?.observedAt === undefined
    ? null
    : Math.max(0, state.clock.elapsedSeconds - intel.observedAt);
}

function planetActions(
  state: GameState,
  coordinate: SpaceCoordinate,
  intel: GalaxyIntelPlanet | undefined,
): readonly SpaceMapAction[] {
  const galaxyPlanetId = planetIdForCoordinate(coordinate);
  const colony = state.planets.find((planet) => planet.galaxyPlanetId === galaxyPlanetId);
  const actions: SpaceMapAction[] = [];
  if (colony === undefined) {
    actions.push(actionForMission(state, 'colonize', galaxyPlanetId, 'Колонизировать'));
  } else if (colony.ownerEmpireId === 'player') {
    actions.push(actionForMission(state, 'transport', colony.id, 'Доставить ресурсы'));
    actions.push(actionForMission(state, 'deploy', colony.id, 'Разместить флот'));
  } else {
    actions.push(actionForMission(state, 'scout', colony.id, 'Отправить разведку'));
    if (intel?.visibility === 'current' || intel?.visibility === 'stale') {
      actions.push(actionForMission(state, 'attack', colony.id, 'Подготовить атаку'));
    } else {
      actions.push(disabledAction(
        'mission-attack',
        'mission',
        'Подготовить атаку',
        'Сначала нужны разведданные с известным владельцем цели.',
        { mission: 'attack', targetId: colony.id },
      ));
    }
  }
  const debris = state.debrisFields.find((field) =>
    field.coordinate?.galaxy === coordinate.galaxy &&
    field.coordinate.solarSystem === coordinate.solarSystem &&
    field.coordinate.position === coordinate.position &&
    (field.metal > 0 || field.crystal > 0),
  );
  if (debris !== undefined && colony !== undefined) {
    actions.push(actionForMission(state, 'recycle', colony.id, 'Собрать обломки'));
  }
  return actions;
}

function strategicObjectAction(
  state: GameState,
  coordinate: SpaceCoordinate,
): SpaceMapAction {
  const object = state.spaceObjects.find((candidate) =>
    candidate.coordinate?.galaxy === coordinate.galaxy &&
    candidate.coordinate.solarSystem === coordinate.solarSystem &&
    candidate.coordinate.position === coordinate.position,
  );
  if (object === undefined) {
    return disabledAction(
      'space-object-operation',
      'space-object',
      'Открыть стратегическую операцию',
      'Объект не связан с текущим simulation descriptor.',
    );
  }
  if (object.remainingYield <= 0) {
    return disabledAction(
      'space-object-operation',
      'space-object',
      'Открыть стратегическую операцию',
      'Объект уже истощён.',
      { objectId: object.id },
    );
  }
  if (object.cooldownUntil > state.clock.elapsedSeconds) {
    return disabledAction(
      'space-object-operation',
      'space-object',
      'Открыть стратегическую операцию',
      `Объект нестабилен ещё ${object.cooldownUntil - state.clock.elapsedSeconds} сек.`,
      { objectId: object.id },
    );
  }
  const requiredShipId = getRequiredSpaceObjectShipId(object.kind);
  const compatible = stationedPlayerFleets(state).some((fleet) => (fleet.ships[requiredShipId] ?? 0) > 0);
  return compatible
    ? enabledAction('space-object-operation', 'space-object', 'Открыть стратегическую операцию', {
        objectId: object.id,
      })
    : disabledAction(
        'space-object-operation',
        'space-object',
        'Открыть стратегическую операцию',
        `Требуется готовый флот с кораблём ${requiredShipId}.`,
        { objectId: object.id },
      );
}

export function createSpaceMapObjectDetails(
  state: GameState,
  selection: SpaceMapSelectionDetail,
): SpaceMapObjectDetails {
  if (selection.kind === 'sun') {
    return {
      coordinate: null,
      state: 'sun',
      label: selection.label,
      relation: 'neutral',
      ownerEmpireId: null,
      factionId: null,
      allianceId: null,
      intelQuality: 'public',
      intelAgeSeconds: null,
      intelVisibility: 'unclaimed',
      actions: [
        disabledAction(
          'sun-attack',
          'future',
          'Sun Attack',
          'Недоступно до отдельного solar-war batch: механика атаки солнца ещё не реализована.',
        ),
        disabledAction(
          'sun-support',
          'future',
          'Sun Support',
          'Недоступно до отдельного solar-war batch: поддержка и восстановление солнца ещё не реализованы.',
        ),
      ],
    };
  }
  const coordinate: SpaceCoordinate = {
    galaxy: selection.galaxy,
    solarSystem: selection.solarSystem,
    position: selection.position,
  };
  if (selection.objectKind === 'empty') {
    return {
      coordinate,
      state: 'empty',
      label: selection.label,
      relation: 'neutral',
      ownerEmpireId: null,
      factionId: null,
      allianceId: null,
      intelQuality: 'public',
      intelAgeSeconds: null,
      intelVisibility: 'unclaimed',
      actions: [disabledAction(
        'empty-position',
        'future',
        'Выбрать целью',
        'В этой позиции нет объекта, который принимает существующие миссии.',
      )],
    };
  }
  if (selection.objectKind !== 'planet') {
    return {
      coordinate,
      state: selection.objectKind,
      label: selection.label,
      relation: 'neutral',
      ownerEmpireId: null,
      factionId: null,
      allianceId: null,
      intelQuality: 'public',
      intelAgeSeconds: null,
      intelVisibility: 'unclaimed',
      actions: [strategicObjectAction(state, coordinate)],
    };
  }
  const intel = intelForCoordinate(state, coordinate);
  const canExposeIdentity = intel?.visibility === 'owned' ||
    intel?.visibility === 'current' ||
    intel?.visibility === 'stale';
  return {
    coordinate,
    state: 'planet',
    label: intel?.displayName ?? selection.label,
    relation: relationForIntel(intel),
    ownerEmpireId: canExposeIdentity ? intel?.ownerEmpireId ?? null : null,
    factionId: canExposeIdentity ? intel?.factionId ?? null : null,
    allianceId: null,
    intelQuality: qualityForIntel(intel?.visibility),
    intelAgeSeconds: ageForIntel(state, intel),
    intelVisibility: intel?.visibility ?? 'unknown',
    actions: planetActions(state, coordinate, intel),
  };
}
