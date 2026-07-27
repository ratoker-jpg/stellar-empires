from __future__ import annotations

import json
from pathlib import Path

ROOT = Path.cwd()


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def replace(path: str, old: str, new: str) -> None:
    content = read(path)
    if old not in content:
        raise RuntimeError(f"Expected text not found in {path}: {old[:160]!r}")
    write(path, content.replace(old, new))


write(
    "src/ui/spaceMapActionGate.ts",
    r'''import {
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
''',
)

write(
    "src/ui/spaceObjectTargetEvents.ts",
    r'''export const SPACE_OBJECT_TARGET_EVENT = 'stellar:space-object-target';

export interface SpaceObjectTargetRequest {
  readonly objectId: string;
  readonly label: string;
}

export function dispatchSpaceObjectTarget(detail: SpaceObjectTargetRequest): void {
  window.dispatchEvent(
    new CustomEvent<SpaceObjectTargetRequest>(SPACE_OBJECT_TARGET_EVENT, { detail }),
  );
}
''',
)

write(
    "src/ui/spaceMapOverlayViewModel.ts",
    r'''import { parsePlanetCoordinate, type SpaceCoordinate } from '../simulation/space/coordinates';
import type { GameState } from '../simulation/types';
import { SOLAR_SLOT_COORDINATES } from './spaceMapViewModel';

export interface SpaceMapOverlayPoint {
  readonly x: number;
  readonly y: number;
}

export interface SpaceMapFleetMarker {
  readonly id: string;
  readonly semanticId: string;
  readonly point: SpaceMapOverlayPoint;
  readonly relation: 'self' | 'hostile' | 'neutral';
  readonly kind: 'fleet' | 'mission';
  readonly label: string;
}

export interface SpaceMapRouteOverlay {
  readonly id: string;
  readonly semanticId: string;
  readonly origin: SpaceMapOverlayPoint;
  readonly destination: SpaceMapOverlayPoint;
  readonly mission: string;
}

export interface SpaceMapOverlayViewModel {
  readonly markers: readonly SpaceMapFleetMarker[];
  readonly routes: readonly SpaceMapRouteOverlay[];
}

const STAGE_X = 155;
const SOLAR_STAGE_Y = 160;
const SUN_POINT = { x: STAGE_X + 493, y: SOLAR_STAGE_Y + 195 } as const;

function sanitize(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, '-');
}

function pointForPosition(position: number): SpaceMapOverlayPoint | undefined {
  const coordinates = SOLAR_SLOT_COORDINATES[position - 1];
  return coordinates === undefined
    ? undefined
    : { x: STAGE_X + coordinates[0] + 60, y: SOLAR_STAGE_Y + coordinates[1] + 60 };
}

function coordinateForReference(state: GameState, reference: string): SpaceCoordinate | undefined {
  const planet = state.planets.find(
    (candidate) => candidate.id === reference || candidate.galaxyPlanetId === reference,
  );
  return planet?.coordinate ?? parsePlanetCoordinate(reference);
}

function isCurrentSystem(
  coordinate: SpaceCoordinate | undefined,
  galaxy: number,
  solarSystem: number,
): coordinate is SpaceCoordinate {
  return coordinate?.galaxy === galaxy && coordinate.solarSystem === solarSystem;
}

function relationForEmpire(empireId: string): SpaceMapFleetMarker['relation'] {
  if (empireId === 'player') return 'self';
  if (empireId === 'pirate-neutral') return 'neutral';
  return 'hostile';
}

export function createSpaceMapOverlayViewModel(
  state: GameState,
  galaxy: number,
  solarSystem: number,
): SpaceMapOverlayViewModel {
  const markers: SpaceMapFleetMarker[] = [];
  const routes: SpaceMapRouteOverlay[] = [];
  for (const fleet of state.fleets) {
    const safeId = sanitize(fleet.id);
    if (fleet.location.type === 'planet') {
      const coordinate = coordinateForReference(state, fleet.location.planetId);
      if (!isCurrentSystem(coordinate, galaxy, solarSystem)) continue;
      const point = pointForPosition(coordinate.position);
      if (point === undefined) continue;
      markers.push({
        id: fleet.id,
        semanticId: `space-fleet-${safeId}`,
        point,
        relation: relationForEmpire(fleet.empireId),
        kind: 'fleet',
        label: `${fleet.id} · ${fleet.status}`,
      });
      continue;
    }
    const originCoordinate = coordinateForReference(state, fleet.location.fromPlanetId);
    const targetCoordinate = coordinateForReference(state, fleet.location.toPlanetId);
    const originHere = isCurrentSystem(originCoordinate, galaxy, solarSystem);
    const targetHere = isCurrentSystem(targetCoordinate, galaxy, solarSystem);
    if (!originHere && !targetHere) continue;
    const origin = originHere ? pointForPosition(originCoordinate.position) : SUN_POINT;
    const destination = targetHere ? pointForPosition(targetCoordinate.position) : SUN_POINT;
    if (origin === undefined || destination === undefined) continue;
    routes.push({
      id: fleet.id,
      semanticId: `space-route-${safeId}`,
      origin,
      destination,
      mission: fleet.mission?.kind ?? 'transit',
    });
    const markerPoint = targetHere ? destination : origin;
    markers.push({
      id: fleet.id,
      semanticId: `space-mission-${safeId}`,
      point: markerPoint,
      relation: relationForEmpire(fleet.empireId),
      kind: 'mission',
      label: `${fleet.id} · ${fleet.mission?.kind ?? fleet.status}`,
    });
  }
  return { markers, routes };
}
''',
)

write(
    "src/runtime/e2eScenario.ts",
    r'''import { createStateChecksum } from '../simulation/checksum';
import type { BattleReport } from '../simulation/combat/types';
import type { FleetState } from '../simulation/fleets/types';
import type { IntelObservation } from '../simulation/intelligence/types';
import type { GameState } from '../simulation/types';

export const E2E_RUNTIME_ENABLED = import.meta.env.VITE_E2E === '1';
export const E2E_FLEET_ID = 'fleet-e2e-player';
export const E2E_REPORT_ID = 'report-e2e-map-backlink';

function requireScenarioPlanets(state: GameState) {
  const origin = state.planets.find((planet) => planet.ownerEmpireId === 'player');
  const target = state.planets.find((planet) => planet.ownerEmpireId === 'pirate-neutral')
    ?? state.planets.find((planet) => planet.ownerEmpireId !== 'player');
  if (origin === undefined || target === undefined) {
    throw new Error('E2E scenario requires one player colony and one foreign colony.');
  }
  return { origin, target };
}

export function createE2eFixtureState(state: GameState): GameState {
  const { origin, target } = requireScenarioPlanets(state);
  const originWithFuel = {
    ...origin,
    economy: {
      ...origin.economy,
      resources: {
        ...origin.economy.resources,
        gas: {
          ...origin.economy.resources.gas,
          amount: Math.max(origin.economy.resources.gas.amount, 1_000_000),
          capacity: Math.max(origin.economy.resources.gas.capacity, 1_000_000),
        },
      },
    },
  };
  const fleet: FleetState = {
    id: E2E_FLEET_ID,
    empireId: 'player',
    originPlanetId: origin.id,
    location: { type: 'planet', planetId: origin.id },
    status: 'stationed',
    ships: {
      'ship.aegis.spy-probe': 1,
      'ship.aegis.fighter': 3,
    },
    cargo: { metal: 0, crystal: 0, gas: 0 },
    speed: 1_000,
    cargoCapacity: 100,
    mission: null,
  };
  const observation: IntelObservation = {
    id: 'intel-e2e-target',
    observerEmpireId: 'player',
    targetPlanetId: target.id,
    coordinate: target.coordinate,
    observedAt: state.clock.elapsedSeconds,
    expiresAt: state.clock.elapsedSeconds + 86_400,
    detected: false,
    snapshot: {
      planetId: target.id,
      coordinate: target.coordinate,
      name: target.name,
      ownerEmpireId: target.ownerEmpireId ?? 'unknown',
      factionId: target.factionId,
      level: 2,
      resources: {
        metal: target.economy.resources.metal.amount,
        crystal: target.economy.resources.crystal.amount,
        gas: target.economy.resources.gas.amount,
        energyProduced: target.economy.energy.produced,
        energyConsumed: target.economy.energy.consumed,
      },
      defenses: target.inventory.defenses,
      stationedFleets: [],
    },
  };
  const report: BattleReport = {
    id: E2E_REPORT_ID,
    seed: state.seed,
    resolvedAt: state.clock.elapsedSeconds,
    targetPlanetId: target.id,
    attackerEmpireId: 'player',
    defenderEmpireId: target.ownerEmpireId ?? 'pirate-neutral',
    winner: 'attacker',
    rounds: [],
    attackerInitial: { 'ship.aegis.fighter': 3 },
    defenderInitial: { 'ship.aegis.fighter': 1 },
    attackerRemaining: { 'ship.aegis.fighter': 3 },
    defenderRemaining: {},
    mode: 'pve',
    threatMultiplierPermille: 1_000,
    rewardMultiplierPermille: 1_000,
  };
  const playerIntel = state.intelligence.find((entry) => entry.empireId === 'player');
  return {
    ...state,
    planets: state.planets.map((planet) => planet.id === origin.id ? originWithFuel : planet),
    fleets: state.fleets.some((entry) => entry.id === E2E_FLEET_ID)
      ? state.fleets
      : [...state.fleets, fleet],
    intelligence: state.intelligence.map((entry) =>
      entry.empireId !== 'player' || entry.observations.some((item) => item.id === observation.id)
        ? entry
        : { ...entry, observations: [...entry.observations, observation] },
    ),
    eventLog: state.eventLog.some((entry) =>
      entry.event.payload.type === 'BATTLE_REPORT' && entry.event.payload.report.id === E2E_REPORT_ID)
      ? state.eventLog
      : [
          ...state.eventLog,
          {
            event: {
              id: 'event-e2e-report',
              executeAt: state.clock.elapsedSeconds,
              sequence: state.nextEventSequence + 10_000,
              payload: { type: 'BATTLE_REPORT', report },
            },
            executedAt: state.clock.elapsedSeconds,
          },
        ],
    ...(playerIntel === undefined ? {} : {}),
  };
}

export function prepareE2eState(state: GameState): GameState {
  return E2E_RUNTIME_ENABLED ? createE2eFixtureState(state) : state;
}

export function updateE2eRuntimeDiagnostics(state: GameState): void {
  if (!E2E_RUNTIME_ENABLED) return;
  const { target } = requireScenarioPlanets(state);
  document.documentElement.dataset.e2e = 'true';
  document.documentElement.dataset.e2eTargetId = target.id;
  document.documentElement.dataset.e2eTargetGalaxy = String(target.coordinate.galaxy);
  document.documentElement.dataset.e2eTargetSystem = String(target.coordinate.solarSystem);
  document.documentElement.dataset.e2eTargetPosition = String(target.coordinate.position);
  document.documentElement.dataset.stateChecksum = createStateChecksum(state);
  document.documentElement.dataset.sendFleetCommandCount = String(
    state.commandLog.filter((entry) => entry.command.type === 'SEND_FLEET').length,
  );
}
''',
)

# Export geometry for overlays.
replace(
    "src/ui/spaceMapViewModel.ts",
    "const SOLAR_SLOT_COORDINATES = [",
    "export const SOLAR_SLOT_COORDINATES = [",
)

# Replace the navigation UI with action details, overlay and refresh support.
write(
    "src/ui/spaceMapNavigation.ts",
    r'''import {
  GALAXY_SYSTEMS_PER_PAGE,
  routeForDirectCoordinate,
  routeForGalaxyPage,
  type SpaceMapNavigationController,
  type SpaceMapNavigationSnapshot,
  type SpaceMapRoute,
} from '../navigation/spaceMapRoute';
import type { GameState } from '../simulation/types';
import { createSolarSystemViewModel } from './spaceMapViewModel';
import {
  SPACE_MAP_SELECTION_EVENT,
  type SpaceMapSelectionDetail,
} from '../game/spaceMapPresentationEvents';
import { createSpaceMapObjectDetails, type SpaceMapAction } from './spaceMapActionGate';
import { dispatchFleetMissionTarget } from './fleetMissionEvents';
import { dispatchSpaceObjectTarget } from './spaceObjectTargetEvents';
import { createSpaceMapOverlayViewModel } from './spaceMapOverlayViewModel';

export interface SpaceMapNavigationMount {
  refresh(): void;
  dispose(): void;
}

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`Required Space Map element not found: ${selector}`);
  return element;
}

function showGalaxyView(): void {
  requireElement<HTMLElement>('#galaxy-view').hidden = false;
  requireElement<HTMLElement>('#planet-view').hidden = true;
  requireElement<HTMLButtonElement>('#nav-galaxy').classList.add('is-active');
  requireElement<HTMLButtonElement>('#nav-planet').classList.remove('is-active');
  requireElement<HTMLElement>('.game-layout').classList.remove('is-planet-view');
}

function breadcrumbButton(
  label: string,
  route: SpaceMapRoute,
  navigation: SpaceMapNavigationController,
  current: boolean,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.disabled = current;
  button.setAttribute('aria-current', current ? 'page' : 'false');
  button.addEventListener('click', () => navigation.navigate(route));
  return button;
}

function renderBreadcrumbs(route: SpaceMapRoute, navigation: SpaceMapNavigationController): void {
  const container = requireElement<HTMLElement>('#space-map-breadcrumbs');
  const items: HTMLButtonElement[] = [
    breadcrumbButton('Universe', { level: 'universe' }, navigation, route.level === 'universe'),
  ];
  if (route.level !== 'universe') {
    items.push(breadcrumbButton(
      `Galaxy ${route.galaxy}`,
      {
        level: 'galaxy',
        galaxy: route.galaxy,
        page: route.level === 'galaxy'
          ? route.page
          : Math.floor((route.solarSystem - 1) / GALAXY_SYSTEMS_PER_PAGE) + 1,
      },
      navigation,
      route.level === 'galaxy',
    ));
  }
  if (route.level === 'solar-system') {
    items.push(breadcrumbButton(`Solar system ${route.solarSystem}`, route, navigation, true));
  }
  container.replaceChildren();
  items.forEach((item, index) => {
    if (index > 0) {
      const separator = document.createElement('span');
      separator.textContent = '›';
      separator.setAttribute('aria-hidden', 'true');
      container.append(separator);
    }
    container.append(item);
  });
}

function routeCoordinate(route: SpaceMapRoute): string {
  if (route.level === 'universe') return 'U';
  if (route.level === 'galaxy') return `G${route.galaxy} · PAGE ${route.page}`;
  return `G${route.galaxy} · S${route.solarSystem} · P${route.position}`;
}

function selectionForRoute(state: GameState, route: SpaceMapRoute): SpaceMapSelectionDetail | null {
  if (route.level !== 'solar-system') return null;
  const view = createSolarSystemViewModel(state, route);
  const slot = view.slots[route.position - 1];
  return slot === undefined
    ? null
    : {
        kind: 'position',
        galaxy: slot.galaxy,
        solarSystem: slot.solarSystem,
        position: slot.position,
        label: slot.label,
        objectKind: slot.kind,
      };
}

function renderActionButton(action: SpaceMapAction): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'space-map-action-row';
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = action.label;
  button.disabled = !action.enabled;
  button.dataset.semanticId = `space-action-${action.id}`;
  button.dataset.actionId = action.id;
  if (action.disabledReason !== null) button.title = action.disabledReason;
  if (action.enabled && action.kind === 'mission' && action.mission !== undefined && action.targetId !== undefined) {
    button.addEventListener('click', () => dispatchFleetMissionTarget({
      targetId: action.targetId ?? '',
      label: action.label,
      mission: action.mission ?? 'scout',
      source: 'space-map',
    }));
  }
  if (action.enabled && action.kind === 'space-object' && action.objectId !== undefined) {
    button.addEventListener('click', () => dispatchSpaceObjectTarget({
      objectId: action.objectId ?? '',
      label: action.label,
    }));
  }
  wrapper.append(button);
  if (action.disabledReason !== null) {
    const reason = document.createElement('small');
    reason.textContent = action.disabledReason;
    wrapper.append(reason);
  }
  return wrapper;
}

function renderDetails(state: GameState, selection: SpaceMapSelectionDetail | null): void {
  const container = requireElement<HTMLElement>('#space-map-selection-details');
  if (selection === null) {
    container.textContent = 'Выбери объект на карте.';
    return;
  }
  const details = createSpaceMapObjectDetails(state, selection);
  container.replaceChildren();
  container.dataset.objectState = details.state;
  container.dataset.relation = details.relation;
  container.dataset.intelQuality = details.intelQuality;
  const header = document.createElement('header');
  const title = document.createElement('strong');
  title.textContent = details.label;
  const coordinate = document.createElement('span');
  coordinate.textContent = details.coordinate === null
    ? `G${selection.galaxy} · S${selection.solarSystem} · SUN`
    : `G${details.coordinate.galaxy} · S${details.coordinate.solarSystem} · P${details.coordinate.position}`;
  header.append(title, coordinate);
  const meta = document.createElement('div');
  meta.className = 'space-map-detail-meta';
  const values = [
    ['Состояние', details.state],
    ['Отношение', details.relation],
    ['Разведка', details.intelQuality],
    ...(details.intelAgeSeconds === null ? [] : [['Возраст данных', `${details.intelAgeSeconds} сек.`]]),
    ...(details.ownerEmpireId === null ? [] : [['Владелец', details.ownerEmpireId]]),
    ...(details.factionId === null ? [] : [['Фракция', details.factionId]]),
    ...(details.allianceId === null ? [] : [['Альянс', details.allianceId]]),
  ];
  for (const [label, value] of values) {
    const item = document.createElement('span');
    item.innerHTML = `<small>${label}</small><b>${value}</b>`;
    meta.append(item);
  }
  const actions = document.createElement('div');
  actions.className = 'space-map-detail-actions';
  actions.replaceChildren(...details.actions.map(renderActionButton));
  container.append(header, meta, actions);
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
): SVGElementTagNameMap[K] {
  return document.createElementNS('http://www.w3.org/2000/svg', tag);
}

function renderOverlay(state: GameState, route: SpaceMapRoute): void {
  const overlay = requireElement<SVGSVGElement>('#space-map-overlay');
  overlay.replaceChildren();
  overlay.hidden = route.level !== 'solar-system';
  if (route.level !== 'solar-system') return;
  const model = createSpaceMapOverlayViewModel(state, route.galaxy, route.solarSystem);
  for (const item of model.routes) {
    const group = createSvgElement('g');
    group.id = item.semanticId;
    group.dataset.semanticId = item.semanticId;
    group.dataset.mission = item.mission;
    const line = createSvgElement('line');
    line.setAttribute('x1', String(item.origin.x));
    line.setAttribute('y1', String(item.origin.y));
    line.setAttribute('x2', String(item.destination.x));
    line.setAttribute('y2', String(item.destination.y));
    line.setAttribute('marker-end', 'url(#space-map-arrow)');
    group.append(line);
    overlay.append(group);
  }
  for (const marker of model.markers) {
    const group = createSvgElement('g');
    group.id = marker.semanticId;
    group.dataset.semanticId = marker.semanticId;
    group.dataset.relation = marker.relation;
    group.dataset.markerKind = marker.kind;
    const circle = createSvgElement('circle');
    circle.setAttribute('cx', String(marker.point.x));
    circle.setAttribute('cy', String(marker.point.y));
    circle.setAttribute('r', marker.kind === 'mission' ? '9' : '7');
    const title = createSvgElement('title');
    title.textContent = marker.label;
    group.append(circle, title);
    overlay.append(group);
  }
}

function parseInput(input: HTMLInputElement): number {
  const value = Number(input.value);
  return Number.isInteger(value) ? value : Number.NaN;
}

export function mountSpaceMapNavigation(
  navigation: SpaceMapNavigationController,
  getState: () => GameState,
): SpaceMapNavigationMount {
  let latestSelection: SpaceMapSelectionDetail | null = null;
  const renderSnapshot = (snapshot: SpaceMapNavigationSnapshot): void => {
    const { route } = snapshot;
    const state = getState();
    showGalaxyView();
    renderBreadcrumbs(route, navigation);
    const error = requireElement<HTMLElement>('#space-map-route-error');
    error.textContent = snapshot.error ?? '';
    error.hidden = snapshot.error === null;
    const pageControls = requireElement<HTMLElement>('#space-map-page-controls');
    pageControls.hidden = route.level !== 'galaxy';
    if (route.level === 'galaxy') {
      const descriptor = state.universe.galaxies.find((galaxy) => galaxy.slot === route.galaxy);
      const pageCount = descriptor === undefined ? 1 : Math.ceil(descriptor.systemCount / GALAXY_SYSTEMS_PER_PAGE);
      requireElement<HTMLButtonElement>('#space-map-page-previous').disabled = route.page <= 1;
      requireElement<HTMLButtonElement>('#space-map-page-next').disabled = route.page >= pageCount;
      requireElement<HTMLElement>('#space-map-page-label').textContent = `${route.page} / ${pageCount}`;
    }
    const galaxyInput = requireElement<HTMLInputElement>('#space-map-galaxy-input');
    const systemInput = requireElement<HTMLInputElement>('#space-map-system-input');
    const positionInput = requireElement<HTMLInputElement>('#space-map-position-input');
    if (route.level !== 'universe') galaxyInput.value = String(route.galaxy);
    if (route.level === 'solar-system') {
      systemInput.value = String(route.solarSystem);
      positionInput.value = String(route.position);
    }
    requireElement<HTMLElement>('#space-map-footer-level').textContent = route.level;
    requireElement<HTMLElement>('#space-map-footer-coordinate').textContent = routeCoordinate(route);
    const selection = route.level === 'solar-system' &&
      latestSelection !== null &&
      latestSelection.galaxy === route.galaxy &&
      latestSelection.solarSystem === route.solarSystem
      ? latestSelection
      : selectionForRoute(state, route);
    renderDetails(state, selection);
    renderOverlay(state, route);
  };
  const unsub = navigation.subscribe(renderSnapshot);
  const navGalaxy = requireElement<HTMLButtonElement>('#nav-galaxy');
  const onGalaxy = (): void => { latestSelection = null; navigation.navigate({ level: 'universe' }); };
  navGalaxy.addEventListener('click', onGalaxy);
  const previous = requireElement<HTMLButtonElement>('#space-map-page-previous');
  const next = requireElement<HTMLButtonElement>('#space-map-page-next');
  const onPrevious = (): void => navigation.navigate(routeForGalaxyPage(navigation.snapshot.route, getState().universe, -1));
  const onNext = (): void => navigation.navigate(routeForGalaxyPage(navigation.snapshot.route, getState().universe, 1));
  previous.addEventListener('click', onPrevious);
  next.addEventListener('click', onNext);
  const form = requireElement<HTMLFormElement>('#space-map-coordinate-form');
  const onSubmit = (event: SubmitEvent): void => {
    event.preventDefault();
    latestSelection = null;
    navigation.navigate(routeForDirectCoordinate(
      parseInput(requireElement<HTMLInputElement>('#space-map-galaxy-input')),
      parseInput(requireElement<HTMLInputElement>('#space-map-system-input')),
      parseInput(requireElement<HTMLInputElement>('#space-map-position-input')),
    ));
  };
  form.addEventListener('submit', onSubmit);
  const onSelection = (event: Event): void => {
    if (!(event instanceof CustomEvent)) return;
    latestSelection = event.detail as SpaceMapSelectionDetail;
    renderSnapshot(navigation.snapshot);
  };
  window.addEventListener(SPACE_MAP_SELECTION_EVENT, onSelection);
  return {
    refresh: () => renderSnapshot(navigation.snapshot),
    dispose: () => {
      unsub();
      navGalaxy.removeEventListener('click', onGalaxy);
      previous.removeEventListener('click', onPrevious);
      next.removeEventListener('click', onNext);
      form.removeEventListener('submit', onSubmit);
      window.removeEventListener(SPACE_MAP_SELECTION_EVENT, onSelection);
    },
  };
}
''',
)

# Extend fleet mission request metadata and add stable selectors.
replace(
    "src/ui/fleetMissionEvents.ts",
    "  readonly mission: FleetMissionKind;\n}",
    "  readonly mission: FleetMissionKind;\n  readonly source?: 'space-map' | 'galaxy-intel';\n}",
)
replace(
    "src/ui/missionScreen.ts",
    "  dialog.className = 'mission-screen-dialog';",
    "  dialog.className = 'mission-screen-dialog';\n  dialog.dataset.testid = 'mission-composer';",
)
replace(
    "src/ui/missionScreen.ts",
    "      targetNotice.className = 'mission-target-notice';",
    "      targetNotice.className = 'mission-target-notice';\n      targetNotice.dataset.testid = 'mission-target-notice';",
)
replace(
    "src/ui/missionScreen.ts",
    "        const mission = document.createElement('select');",
    "        const mission = document.createElement('select');\n        mission.dataset.testid = `mission-kind-${fleet.id}`;",
)
replace(
    "src/ui/missionScreen.ts",
    "        const target = document.createElement('select');",
    "        const target = document.createElement('select');\n        target.dataset.testid = `mission-target-${fleet.id}`;",
)
replace(
    "src/ui/missionScreen.ts",
    "        send.className = 'mission-primary-action';\n        send.textContent = 'Отправить';",
    "        send.className = 'mission-primary-action';\n        send.dataset.testid = `mission-send-${fleet.id}`;\n        send.textContent = 'Отправить';",
)

# Add prefill event support to strategic-object panel.
replace(
    "src/ui/spaceObjectsPanel.ts",
    "import { formatGameDuration } from './planetViewModel';",
    "import { formatGameDuration } from './planetViewModel';\nimport {\n  SPACE_OBJECT_TARGET_EVENT,\n  type SpaceObjectTargetRequest,\n} from './spaceObjectTargetEvents';",
)
replace(
    "src/ui/spaceObjectsPanel.ts",
    "  if (launch === null || active === null || grid === null || reports === null) {",
    "  if (launch === null || active === null || grid === null || reports === null) {",
)
replace(
    "src/ui/spaceObjectsPanel.ts",
    "  const render = (): void => {",
    "  let pendingObjectId: string | null = null;\n\n  const render = (): void => {",
)
replace(
    "src/ui/spaceObjectsPanel.ts",
    "    const fleetSelect = document.createElement('select');",
    "    if (pendingObjectId !== null && [...objectSelect.options].some((option) => option.value === pendingObjectId)) {\n      objectSelect.value = pendingObjectId;\n    }\n    objectSelect.dataset.testid = 'space-object-target';\n    const fleetSelect = document.createElement('select');",
)
replace(
    "src/ui/spaceObjectsPanel.ts",
    "  button.addEventListener('click', () => {\n    render();\n    dialog.showModal();\n  });\n}",
    "  const open = (): void => {\n    render();\n    if (!dialog.open) dialog.showModal();\n  };\n  button.addEventListener('click', open);\n  window.addEventListener(\n    SPACE_OBJECT_TARGET_EVENT,\n    ((event: Event) => {\n      pendingObjectId = (event as CustomEvent<SpaceObjectTargetRequest>).detail.objectId;\n      open();\n    }) as EventListener,\n  );\n}",
)

# Add report coordinate resolution and backlink buttons.
replace(
    "src/simulation/reports/missionReports.ts",
    "import type { GameState } from '../types';",
    "import { parsePlanetCoordinate, type SpaceCoordinate } from '../space/coordinates';\nimport type { GameState } from '../types';",
)
insert_after = "export interface EmpirePvePvpComparison {\n  readonly empireId: string;\n  readonly pveOperations: number;\n  readonly pveSuccesses: number;\n  readonly pvpBattles: number;\n  readonly pvpWins: number;\n  readonly reward: MissionReportReward;\n  readonly losses: number;\n}\n"
replace(
    "src/simulation/reports/missionReports.ts",
    insert_after,
    insert_after + r'''

export function resolveMissionReportCoordinate(
  state: GameState,
  report: Pick<UnifiedMissionReport, 'targetId'>,
): SpaceCoordinate | undefined {
  const planet = state.planets.find(
    (candidate) => candidate.id === report.targetId || candidate.galaxyPlanetId === report.targetId,
  );
  if (planet !== undefined) return planet.coordinate;
  const object = state.spaceObjects.find((candidate) => candidate.id === report.targetId);
  if (object?.coordinate !== undefined) return object.coordinate;
  const debris = state.debrisFields.find((candidate) => candidate.id === report.targetId);
  if (debris?.coordinate !== undefined) return debris.coordinate;
  return parsePlanetCoordinate(report.targetId);
}
''',
)
replace(
    "src/ui/missionReportsPanel.ts",
    "  type UnifiedMissionReport,\n} from '../simulation/reports/missionReports';",
    "  type UnifiedMissionReport,\n  resolveMissionReportCoordinate,\n} from '../simulation/reports/missionReports';\nimport type { SpaceCoordinate } from '../simulation/space/coordinates';",
)
replace(
    "src/ui/missionReportsPanel.ts",
    "export interface MissionReportsPanelOptions {\n  readonly getState: () => GameState;\n}",
    "export interface MissionReportsPanelOptions {\n  readonly getState: () => GameState;\n  readonly navigateToCoordinate?: (coordinate: SpaceCoordinate) => void;\n}",
)
replace(
    "src/ui/missionReportsPanel.ts",
    "function createReportCard(report: UnifiedMissionReport): HTMLElement {",
    "function createReportCard(\n  state: GameState,\n  report: UnifiedMissionReport,\n  navigateToCoordinate: MissionReportsPanelOptions['navigateToCoordinate'],\n  closeDialog: () => void,\n): HTMLElement {",
)
replace(
    "src/ui/missionReportsPanel.ts",
    "  card.append(header, summary, target, rewards, losses, balance);",
    "  card.append(header, summary, target, rewards, losses, balance);\n  const coordinate = resolveMissionReportCoordinate(state, report);\n  const mapLink = document.createElement('button');\n  mapLink.type = 'button';\n  mapLink.textContent = 'На карту';\n  mapLink.dataset.reportMapLink = report.id;\n  mapLink.disabled = coordinate === undefined || navigateToCoordinate === undefined;\n  mapLink.title = mapLink.disabled ? 'Координаты отчёта недоступны.' : 'Открыть цель отчёта на карте.';\n  if (coordinate !== undefined && navigateToCoordinate !== undefined) {\n    mapLink.addEventListener('click', () => {\n      closeDialog();\n      navigateToCoordinate(coordinate);\n    });\n  }\n  card.append(mapLink);",
)
replace(
    "src/ui/missionReportsPanel.ts",
    "    list.replaceChildren(...filtered.map(createReportCard));",
    "    list.replaceChildren(...filtered.map((report) =>\n      createReportCard(state, report, options.navigateToCoordinate, () => dialog.close()),\n    ));",
)

# Add SVG overlay and richer details container.
replace(
    "index.html",
    '<div id="phaser-game"></div>\n            <p id="space-map-selection-details" class="space-map-selection-details">Выбери объект на карте.</p>',
    '<div id="phaser-game"></div>\n            <svg id="space-map-overlay" class="space-map-overlay" viewBox="0 0 1280 720" aria-label="Маршруты и маркеры флотов" hidden>\n              <defs><marker id="space-map-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z"></path></marker></defs>\n            </svg>\n            <section id="space-map-selection-details" class="space-map-selection-details">Выбери объект на карте.</section>',
)

# Add texture/transition runtime gates to Phaser scene.
replace(
    "src/game/scenes/SpaceMapScene.ts",
    "    if (transition.stale || epoch !== this.#renderEpoch) return;\n    this.renderRoute(route);",
    "    if (transition.stale || epoch !== this.#renderEpoch) return;\n    document.documentElement.dataset.spaceMapTextureCount = String(transition.assets.length);\n    document.documentElement.dataset.spaceMapTextureBytes = String(\n      transition.assets.reduce((sum, asset) => sum + asset.bytes, 0),\n    );\n    document.documentElement.dataset.spaceMapDecodedBytes = String(\n      transition.assets.reduce((sum, asset) => sum + asset.decodedBytes, 0),\n    );\n    this.renderRoute(route);",
)
replace(
    "src/game/scenes/SpaceMapScene.ts",
    "    if (duration > 0) {",
    "    document.documentElement.dataset.spaceMapLevel = route.level;\n    document.documentElement.dataset.spaceMapTransitionMs = String(duration);\n    if (duration > 0) {",
)

# Main runtime: E2E fixture, refreshable map, report backlinks and diagnostics.
replace(
    "src/main.ts",
    "import { BotAutomationController } from './runtime/BotAutomationController';",
    "import { BotAutomationController } from './runtime/BotAutomationController';\nimport {\n  E2E_RUNTIME_ENABLED,\n  prepareE2eState,\n  updateE2eRuntimeDiagnostics,\n} from './runtime/e2eScenario';",
)
replace(
    "src/main.ts",
    "  const faction = await selectNewGameFaction();\n  const state = createInitialGameState('stellar-empires-m1', faction);",
    "  const faction = E2E_RUNTIME_ENABLED ? 'aegis' : await selectNewGameFaction();\n  const state = prepareE2eState(createInitialGameState('stellar-empires-m1', faction));",
)
replace(
    "src/main.ts",
    "      initialState = restored.state;\n      runtimeState = restored.state;",
    "      initialState = prepareE2eState(restored.state);\n      runtimeState = initialState;",
)
replace(
    "src/main.ts",
    "  const game = createGame('phaser-game', initialState, spaceMapNavigation);\n  renderAssetShowcases();\n  mountPlanetScreen(initialState, setStatus, (state) => {",
    "  const game = createGame('phaser-game', initialState, spaceMapNavigation);\n  const spaceMapUi = mountSpaceMapNavigation(spaceMapNavigation, () => runtimeState);\n  updateE2eRuntimeDiagnostics(runtimeState);\n  renderAssetShowcases();\n  mountPlanetScreen(initialState, setStatus, (state) => {",
)
replace(
    "src/main.ts",
    "    updateGamePresentation(game, state);\n    autosave?.request(state);",
    "    updateGamePresentation(game, state);\n    spaceMapUi.refresh();\n    updateE2eRuntimeDiagnostics(state);\n    autosave?.request(state);",
)
replace(
    "src/main.ts",
    "  const unmountSpaceMapNavigation = mountSpaceMapNavigation(\n    spaceMapNavigation,\n    () => runtimeState,\n  );\n  mountGalaxyIntelPanel",
    "  mountGalaxyIntelPanel",
)
replace(
    "src/main.ts",
    "  mountMissionReportsPanel({ getState: () => runtimeState });",
    "  mountMissionReportsPanel({\n    getState: () => runtimeState,\n    navigateToCoordinate: (coordinate) => {\n      spaceMapNavigation.navigate({ level: 'solar-system', ...coordinate });\n      spaceMapUi.refresh();\n    },\n  });",
)
replace(
    "src/main.ts",
    "    unmountSpaceMapNavigation();\n    spaceMapNavigation.dispose();",
    "    spaceMapUi.dispose();\n    spaceMapNavigation.dispose();",
)

# CSS overlays and details.
with (ROOT / "src/styles/spaceMap.css").open("a", encoding="utf-8") as file:
    file.write(r'''

.space-map-overlay {
  position: absolute;
  z-index: 6;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
}

.space-map-overlay line {
  stroke: rgb(164 235 255 / 72%);
  stroke-width: 2;
  stroke-dasharray: 7 6;
}

.space-map-overlay marker path {
  fill: #a4ebff;
}

.space-map-overlay g[data-relation="self"] circle { fill: #3dd4d0; }
.space-map-overlay g[data-relation="hostile"] circle { fill: #ff6f61; }
.space-map-overlay g[data-relation="neutral"] circle { fill: #e7a847; }
.space-map-overlay g[data-marker-kind="mission"] circle {
  stroke: #eaf7ff;
  stroke-width: 2;
}

.space-map-selection-details {
  display: grid;
  grid-template-columns: minmax(180px, 0.75fr) minmax(260px, 1.25fr) minmax(280px, 1.4fr);
  gap: 12px;
  align-items: center;
  pointer-events: auto;
}

.space-map-selection-details header {
  display: grid;
  gap: 3px;
}

.space-map-selection-details header span,
.space-map-detail-meta small,
.space-map-action-row small {
  color: #6f8b9c;
  font-size: 0.62rem;
}

.space-map-detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.space-map-detail-meta > span {
  display: grid;
  gap: 2px;
  min-width: 78px;
  padding: 5px 7px;
  border: 1px solid rgb(71 199 241 / 12%);
  border-radius: 4px;
  background: rgb(6 20 30 / 68%);
}

.space-map-detail-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(120px, 1fr));
  gap: 6px;
}

.space-map-action-row {
  display: grid;
  gap: 3px;
}

.space-map-action-row button {
  min-height: 30px;
  border: 1px solid rgb(71 199 241 / 24%);
  border-radius: 5px;
  background: rgb(14 47 65 / 82%);
  color: #dff7ff;
}

.space-map-action-row button:disabled {
  border-color: rgb(111 139 156 / 12%);
  background: rgb(20 30 38 / 62%);
  color: #647682;
}

@media (max-width: 1100px) {
  .space-map-selection-details {
    grid-template-columns: 1fr 1fr;
  }
  .space-map-detail-actions { grid-column: 1 / -1; }
}
''')

# Unit tests.
write(
    "tests/ui/spaceMapActionGate.test.ts",
    r'''import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { createE2eFixtureState } from '../../src/runtime/e2eScenario';
import { createSpaceMapObjectDetails } from '../../src/ui/spaceMapActionGate';

describe('Space Map action gate', () => {
  const state = createE2eFixtureState(createInitialGameState('action-gate-fixture'));
  const target = state.planets.find((planet) => planet.ownerEmpireId === 'pirate-neutral')!;

  it('reveals owner and faction only with permitted current intelligence', () => {
    const details = createSpaceMapObjectDetails(state, {
      kind: 'position',
      ...target.coordinate,
      label: target.name,
      objectKind: 'planet',
    });
    expect(details.intelQuality).toBe('fresh');
    expect(details.ownerEmpireId).toBe('pirate-neutral');
    expect(details.factionId).toBe(target.factionId);
    expect(details.relation).toBe('hostile');
    expect(details.actions.find((action) => action.id === 'mission-scout')).toMatchObject({
      enabled: true,
      targetId: target.id,
      mission: 'scout',
    });
  });

  it('hides identity for an unknown contact and explains disabled attack', () => {
    const withoutIntel = {
      ...state,
      intelligence: state.intelligence.map((entry) =>
        entry.empireId === 'player' ? { ...entry, observations: [] } : entry,
      ),
    };
    const details = createSpaceMapObjectDetails(withoutIntel, {
      kind: 'position',
      ...target.coordinate,
      label: 'Unknown contact',
      objectKind: 'planet',
    });
    expect(details.ownerEmpireId).toBeNull();
    expect(details.factionId).toBeNull();
    expect(details.actions.find((action) => action.id === 'mission-attack')).toMatchObject({
      enabled: false,
      disabledReason: 'Сначала нужны разведданные с известным владельцем цели.',
    });
  });

  it('keeps Sun Attack and Sun Support visibly disabled until solar-war', () => {
    const details = createSpaceMapObjectDetails(state, {
      kind: 'sun', galaxy: 1, solarSystem: 1, label: 'Sun',
    });
    expect(details.actions.map((action) => action.id)).toEqual(['sun-attack', 'sun-support']);
    expect(details.actions.every((action) => !action.enabled && action.disabledReason?.includes('solar-war'))).toBe(true);
  });
});
''',
)

write(
    "tests/ui/spaceMapOverlayViewModel.test.ts",
    r'''import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { createE2eFixtureState, E2E_FLEET_ID } from '../../src/runtime/e2eScenario';
import { createSpaceMapOverlayViewModel } from '../../src/ui/spaceMapOverlayViewModel';

describe('Space Map semantic overlays', () => {
  it('creates stable fleet, route and mission marker IDs', () => {
    const base = createE2eFixtureState(createInitialGameState('overlay-fixture'));
    const target = base.planets.find((planet) => planet.ownerEmpireId === 'pirate-neutral')!;
    const fleet = base.fleets.find((candidate) => candidate.id === E2E_FLEET_ID)!;
    const state = {
      ...base,
      fleets: base.fleets.map((candidate) => candidate.id !== fleet.id ? candidate : {
        ...candidate,
        status: 'outbound' as const,
        mission: { kind: 'scout' as const, targetPlanetId: target.id },
        location: {
          type: 'transit' as const,
          fromPlanetId: fleet.originPlanetId,
          toPlanetId: target.id,
          departedAt: 0,
          arrivesAt: 100,
        },
      }),
    };
    const overlay = createSpaceMapOverlayViewModel(
      state,
      target.coordinate.galaxy,
      target.coordinate.solarSystem,
    );
    expect(overlay.routes).toContainEqual(expect.objectContaining({
      semanticId: `space-route-${E2E_FLEET_ID}`,
      mission: 'scout',
    }));
    expect(overlay.markers).toContainEqual(expect.objectContaining({
      semanticId: `space-mission-${E2E_FLEET_ID}`,
      relation: 'self',
      kind: 'mission',
    }));
  });
});
''',
)

write(
    "tests/simulation/missionReportMapBacklink.test.ts",
    r'''import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { createE2eFixtureState, E2E_REPORT_ID } from '../../src/runtime/e2eScenario';
import {
  createUnifiedMissionReports,
  resolveMissionReportCoordinate,
} from '../../src/simulation/reports/missionReports';

describe('mission report map backlink', () => {
  it('resolves report targets to stable SpaceCoordinates', () => {
    const state = createE2eFixtureState(createInitialGameState('report-backlink'));
    const report = createUnifiedMissionReports(state).find((entry) => entry.id === E2E_REPORT_ID);
    expect(report).toBeDefined();
    expect(report && resolveMissionReportCoordinate(state, report)).toEqual(
      state.planets.find((planet) => planet.ownerEmpireId === 'pirate-neutral')?.coordinate,
    );
  });
});
''',
)

# Playwright config and browser E2E.
write(
    "playwright.config.ts",
    r'''import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'VITE_E2E=1 npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
''',
)

write(
    "tests/e2e/universeNavigation.spec.ts",
    r'''import { expect, test, type Page } from '@playwright/test';

const SOLAR_COORDINATES = [
  [23, 5], [160, -33], [296, -58], [433, -58], [554, -58], [690, -33],
  [827, 5], [316, 72], [534, 72], [-44, 139], [76, 139], [196, 139],
  [654, 139], [774, 139], [894, 139], [316, 208], [534, 208], [23, 275],
  [160, 313], [296, 338], [433, 338], [554, 338], [690, 313], [827, 275],
] as const;

async function waitForLevel(page: Page, level: string): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-space-map-level', level);
}

async function logicalCanvasClick(page: Page, x: number, y: number): Promise<void> {
  const canvas = page.locator('#phaser-game canvas');
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  if (box === null) throw new Error('Phaser canvas has no bounding box.');
  await page.mouse.click(box.x + (x / 1280) * box.width, box.y + (y / 720) * box.height);
}

async function targetCoordinate(page: Page): Promise<{ galaxy: number; system: number; position: number }> {
  return page.locator('html').evaluate((element) => ({
    galaxy: Number(element.dataset.e2eTargetGalaxy),
    system: Number(element.dataset.e2eTargetSystem),
    position: Number(element.dataset.e2eTargetPosition),
  }));
}

test('new game → map target → composer → report backlink → reload/history', async ({ page }) => {
  await page.goto('/?e2e=1#/space/universe');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await waitForLevel(page, 'universe');
  await logicalCanvasClick(page, 718, 321);
  await expect(page).toHaveURL(/#\/space\/galaxy\/1\/page\/1$/);
  await waitForLevel(page, 'galaxy');

  const target = await targetCoordinate(page);
  await page.locator('#space-map-galaxy-input').fill(String(target.galaxy));
  await page.locator('#space-map-system-input').fill(String(target.system));
  await page.locator('#space-map-position-input').fill(String(target.position));
  await page.locator('#space-map-coordinate-form button[type="submit"]').click();
  await expect(page).toHaveURL(new RegExp(`#\\/space\\/solar\\/${target.galaxy}\\/${target.system}\\/${target.position}$`));
  await waitForLevel(page, 'solar-system');

  const [slotX, slotY] = SOLAR_COORDINATES[target.position - 1]!;
  await logicalCanvasClick(page, 155 + slotX + 60, 160 + slotY + 60);
  const details = page.locator('#space-map-selection-details');
  await expect(details).toHaveAttribute('data-intel-quality', 'fresh');
  await expect(details).toHaveAttribute('data-relation', 'hostile');
  await expect(page.locator('html')).toHaveAttribute('data-send-fleet-command-count', '0');

  await page.locator('[data-action-id="mission-scout"]').click();
  const dialog = page.locator('#mission-screen-dialog');
  await expect(dialog).toHaveAttribute('open', '');
  await expect(page.locator('[data-testid="mission-target-notice"]')).toBeVisible();
  const targetId = await page.locator('html').getAttribute('data-e2e-target-id');
  await expect(page.locator('[data-testid="mission-target-fleet-e2e-player"]')).toHaveValue(targetId ?? '');
  await expect(page.locator('html')).toHaveAttribute('data-send-fleet-command-count', '0');
  await page.locator('[data-testid="mission-send-fleet-e2e-player"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-send-fleet-command-count', '1');
  await expect(page.locator('[data-semantic-id="space-mission-fleet-e2e-player"]')).toHaveCount(1);
  await dialog.locator('.dialog-close').click();
  await expect(page.locator('#app-status')).toContainText(/Сохранено|Флот отправлен/);

  await page.locator('#space-map-breadcrumbs button').first().click();
  await expect(page).toHaveURL(/#\/space\/universe$/);
  await page.locator('#nav-reports').click();
  await page.locator('[data-report-map-link="report-e2e-map-backlink"]').click();
  await expect(page).toHaveURL(new RegExp(`#\\/space\\/solar\\/${target.galaxy}\\/${target.system}\\/${target.position}$`));
  await page.goBack();
  await expect(page).toHaveURL(/#\/space\/universe$/);
  await page.goForward();
  await expect(page).toHaveURL(new RegExp(`#\\/space\\/solar\\/${target.galaxy}\\/${target.system}\\/${target.position}$`));

  await page.waitForTimeout(1_000);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-send-fleet-command-count', '1');
  await expect(page).toHaveURL(new RegExp(`#\\/space\\/solar\\/${target.galaxy}\\/${target.system}\\/${target.position}$`));

  const network = await page.evaluate(() => {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const universe = entries.filter((entry) => entry.name.includes('/assets/generated/universe/'));
    return {
      count: universe.length,
      unique: new Set(universe.map((entry) => entry.name)).size,
      transfer: universe.reduce((sum, entry) => sum + (entry.transferSize || entry.encodedBodySize), 0),
      decoded: Number(document.documentElement.dataset.spaceMapDecodedBytes ?? 0),
    };
  });
  expect(network.count).toBe(network.unique);
  expect(network.transfer).toBeLessThanOrEqual(16 * 1024 * 1024);
  expect(network.decoded).toBeLessThanOrEqual(20 * 1024 * 1024);

  for (const viewport of [{ width: 1366, height: 768 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    const layout = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      canvas: document.querySelector('#phaser-game canvas')?.getBoundingClientRect().toJSON(),
    }));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
    expect(layout.canvas?.width ?? 0).toBeGreaterThan(0);
    expect(layout.canvas?.height ?? 0).toBeGreaterThan(0);
  }
});

test('keyboard path and reduced motion remain equivalent', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?e2e=1#/space/universe');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await waitForLevel(page, 'universe');
  await logicalCanvasClick(page, 640, 360);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/space\/galaxy\/1\/page\/1$/);
  await waitForLevel(page, 'galaxy');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/space\/solar\/1\/1\/1$/);
  await waitForLevel(page, 'solar-system');
  await expect(page.locator('html')).toHaveAttribute('data-space-map-transition-ms', '0');
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/#\/space\/galaxy\/1\/page\/1$/);
});
''',
)

write(
    ".github/workflows/e2e.yml",
    r'''name: Browser E2E

on:
  pull_request:
  push:
    branches:
      - main

permissions:
  contents: read

concurrency:
  group: e2e-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  playwright:
    runs-on: ubuntu-latest
    timeout-minutes: 35
    steps:
      - name: Checkout
        uses: actions/checkout@v6
      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: '22.12.0'
      - name: Install dependencies
        run: npm install --no-audit --no-fund
      - name: Install Chromium
        run: npx playwright install --with-deps chromium
      - name: Run browser E2E
        run: npm run e2e
      - name: Upload Playwright report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report
          retention-days: 7
''',
)

# Change note and closure docs.
write(
    "docs/changes/pr110-universe-actions-gate.md",
    r'''# PR #110 — UNIVERSE-ACTIONS-GATE

**Audit:** PR #106  
**Work item:** `UNIVERSE-ACTIONS-GATE`

## Delivered

- intelligence-aware object details with coordinates, relation, quality and age;
- owner/faction identity only when the current intelligence view permits it;
- complete action lists with an explicit reason for every disabled action;
- map target handoff into the existing mission composer and strategic-object panel;
- first selection remains non-destructive; fleet composition, speed and confirmation stay in the existing command UI;
- report → map backlinks;
- stable SVG semantic IDs for route arrows, origins, destinations, fleet relation markers and mission markers;
- Sun Attack and Sun Support remain visibly disabled until the future solar-war batch;
- Playwright coverage for new game, three-level navigation, target prefill, report backlink, reload, history, keyboard, reduced motion, supported viewports, duplicate-mission prevention and runtime budgets;
- final package gate and audit archive.
''',
)

# Archive audit and close batch state.
audit_path = ROOT / "docs/audits/current-batch-audit.md"
audit_content = audit_path.read_text(encoding="utf-8")
write(
    "docs/audits/completed/universe-navigation-01.md",
    "# Completed batch — UNIVERSE-NAVIGATION-01\n\n"
    "**Audit PR:** #106  \n**Implementation PRs:** #107, #108, #109, #110  \n"
    "**Completed:** 2026-07-27\n\n"
    "## Accepted result\n\n"
    "The audited Universe navigation package was delivered sequentially: assets, schema-v14 spatial model, three-level views, then action/E2E gate. The next repository action must be a new Audit PR.\n\n"
    "---\n\n" + audit_content,
)
write(
    "docs/audits/current-batch-audit.md",
    "# Current batch audit\n\nNo implementation batch is active. `UNIVERSE-NAVIGATION-01` is archived in `docs/audits/completed/universe-navigation-01.md`.\n\nThe only allowed next delivery step is a new Audit PR following `docs/28-audit-first-autonomous-delivery-protocol.md`.\n",
)

history_candidates = list((ROOT / "docs").rglob("batch-history.md"))
if not history_candidates:
    raise RuntimeError("batch-history.md not found")
history_path = history_candidates[0]
history = history_path.read_text(encoding="utf-8")
if "UNIVERSE-NAVIGATION-01" not in history or "#110" not in history:
    history += "\n\n## 2026-07-27 — UNIVERSE-NAVIGATION-01\n\n- Audit PR: #106\n- Complexity: medium\n- Implementation: #107 asset pipeline, #108 spatial model, #109 navigation views, #110 actions/E2E gate\n- Result: completed; next action restricted to a new Audit PR\n"
history_path.write_text(history, encoding="utf-8")

backlog_candidates = list((ROOT / "docs").rglob("master-runtime-asset-backlog.md"))
if not backlog_candidates:
    raise RuntimeError("master-runtime-asset-backlog.md not found")
backlog_path = backlog_candidates[0]
backlog = backlog_path.read_text(encoding="utf-8")
backlog += "\n\n## Universe navigation package — completed in #107–#110\n\n- 102 Universe runtime textures are bound and budget-gated.\n- Universe, Galaxy and Solar-system views use lazy texture groups.\n- Route/fleet/mission overlays use CSS/SVG and stable semantic IDs; no extra raster assets are required.\n- Supplied Sun Attack and Sun Support markers are registered, but both actions remain disabled until the future solar-war batch.\n"
backlog_path.write_text(backlog, encoding="utf-8")

write(
    "docs/audits/current-execution-state.md",
    r'''# Current execution state

**Updated:** 2026-07-27  
**Safe to continue:** yes

| Field | Current value |
|---|---|
| Protocol PR | #100 — audit-first autonomous delivery protocol — merged |
| Completed batch | `UNIVERSE-NAVIGATION-01` |
| Audit PR | #106 — archived |
| Implementation PRs | #107 → #108 → #109 → #110 |
| Active implementation PR | none after #110 merge |
| Last completed atomic action | completed the intelligence/action/report/E2E gate and archived the batch |
| Last successful validation | pending final clean-head CI, browser E2E and Graphify for #110 |
| Exact next action | create a new Audit PR; no implementation work is authorized |
| Blockers | none |
| Divergence | none |

## Closed checkpoints

| Checkpoint | State |
|---|---|
| #107 Universe asset pipeline | merged |
| #108 spatial model and schema v14 | merged |
| #109 three-level navigation views | merged |
| #110 actions, E2E and batch closure | ready for final gate |

## Recovery rule

After #110 merges, stop. Do not begin solar-war, alliances, Obelisks, Gates or any other roadmap implementation until a new Audit PR is accepted.
''',
)

status_path = ROOT / "docs/project-status.json"
status = json.loads(status_path.read_text(encoding="utf-8"))
status["statusVersion"] = max(int(status.get("statusVersion", 0)) + 1, 12)
status["updatedAt"] = "2026-07-27"
status["lastMergedPr"] = 110
status["lastMergeSha"] = "assigned-by-pr-110-merge"
status["verifiedMainBaseline"] = "PR #110 final gate"
status["activePr"] = None
status["nextPrAfterActive"] = None
status["nextPrKind"] = "audit"
status["currentBatch"]["status"] = "completed"
status["currentBatch"]["nextWorkItem"] = None
status["activeDelivery"] = []
status["nextAction"] = "Create a new Audit PR only."
status_path.write_text(json.dumps(status, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

continuation = read("docs/17-continuation-guide.md")
continuation = continuation.replace(
    "**Status:** Implementation active — PR #109",
    "**Status:** Universe navigation batch completed by PR #110",
)
continuation = continuation.replace(
    "**Verified baseline:** `main` SHA `430eb8d51f49c1846caad37d33668fad6c685201`",
    "**Verified baseline:** PR #110 final gate; merge SHA is recorded by GitHub",
)
continuation += "\n\n## Post-#110 continuation rule\n\n`UNIVERSE-NAVIGATION-01` is complete and archived. The next action is only a new Audit PR. Do not start another implementation PR from this guide.\n"
write("docs/17-continuation-guide.md", continuation)

print("Applied PR110 Universe actions gate and batch closure.")
