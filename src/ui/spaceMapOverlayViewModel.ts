import { parsePlanetCoordinate, type SpaceCoordinate } from '../simulation/space/coordinates';
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
