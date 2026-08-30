export const UNIVERSE_SLOT_COUNT = 20 as const;
export const SOLAR_SYSTEM_POSITION_COUNT = 24 as const;

export interface SpaceCoordinate {
  readonly galaxy: number;
  readonly solarSystem: number;
  readonly position: number;
}

export interface SpaceSystemCoordinate {
  readonly galaxy: number;
  readonly solarSystem: number;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

export function isSpaceCoordinate(value: unknown): value is SpaceCoordinate {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const coordinate = value as Record<string, unknown>;
  return isPositiveInteger(coordinate.galaxy) &&
    coordinate.galaxy <= UNIVERSE_SLOT_COUNT &&
    isPositiveInteger(coordinate.solarSystem) &&
    isPositiveInteger(coordinate.position) &&
    coordinate.position <= SOLAR_SYSTEM_POSITION_COUNT;
}

export function assertSpaceCoordinate(coordinate: SpaceCoordinate): void {
  if (!isSpaceCoordinate(coordinate)) {
    throw new Error(`Invalid SpaceCoordinate: ${JSON.stringify(coordinate)}`);
  }
}

export function spaceCoordinateKey(coordinate: SpaceCoordinate): string {
  assertSpaceCoordinate(coordinate);
  return `${coordinate.galaxy}:${coordinate.solarSystem}:${coordinate.position}`;
}

export function sameSpaceCoordinate(left: SpaceCoordinate, right: SpaceCoordinate): boolean {
  return left.galaxy === right.galaxy &&
    left.solarSystem === right.solarSystem &&
    left.position === right.position;
}

export function compareSpaceCoordinates(
  left: SpaceCoordinate,
  right: SpaceCoordinate,
): number {
  return left.galaxy - right.galaxy ||
    left.solarSystem - right.solarSystem ||
    left.position - right.position;
}

export function systemIdForCoordinate(
  coordinate: SpaceSystemCoordinate,
): string {
  if (!isPositiveInteger(coordinate.galaxy) || !isPositiveInteger(coordinate.solarSystem)) {
    throw new Error(`Invalid system coordinate: ${JSON.stringify(coordinate)}`);
  }
  return coordinate.galaxy === 1
    ? `system-${coordinate.solarSystem}`
    : `galaxy-${coordinate.galaxy}-system-${coordinate.solarSystem}`;
}

export function planetIdForCoordinate(coordinate: SpaceCoordinate): string {
  assertSpaceCoordinate(coordinate);
  return `${systemIdForCoordinate(coordinate)}-planet-${coordinate.position}`;
}

export function parseSystemCoordinate(reference: string): SpaceSystemCoordinate | undefined {
  const legacy = /^system-(\d+)$/.exec(reference);
  if (legacy !== null) {
    const solarSystem = Number(legacy[1]);
    return isPositiveInteger(solarSystem) ? { galaxy: 1, solarSystem } : undefined;
  }
  const current = /^galaxy-(\d+)-system-(\d+)$/.exec(reference);
  if (current === null) return undefined;
  const galaxy = Number(current[1]);
  const solarSystem = Number(current[2]);
  return isPositiveInteger(galaxy) && galaxy <= UNIVERSE_SLOT_COUNT &&
    isPositiveInteger(solarSystem)
    ? { galaxy, solarSystem }
    : undefined;
}

function stripStatePrefix(reference: string): string {
  for (const prefix of ['colony-', 'pirate-base-', 'debris-']) {
    if (reference.startsWith(prefix)) return reference.slice(prefix.length);
  }
  return reference;
}

export function parsePlanetCoordinate(reference: string): SpaceCoordinate | undefined {
  const normalized = stripStatePrefix(reference);
  const match = /^(system-\d+|galaxy-\d+-system-\d+)-planet-(\d+)$/.exec(normalized);
  if (match === null) return undefined;
  const system = parseSystemCoordinate(match[1] ?? '');
  const position = Number(match[2]);
  if (system === undefined || !isPositiveInteger(position) || position > SOLAR_SYSTEM_POSITION_COUNT) {
    return undefined;
  }
  return { ...system, position };
}

export function coordinateFromLegacyReference(
  systemId: string,
  position: number,
): SpaceCoordinate | undefined {
  const system = parseSystemCoordinate(systemId);
  if (system === undefined) return undefined;
  const coordinate = { ...system, position };
  return isSpaceCoordinate(coordinate) ? coordinate : undefined;
}

export function calculateCoordinateDistance(
  origin: SpaceCoordinate,
  target: SpaceCoordinate,
): number {
  assertSpaceCoordinate(origin);
  assertSpaceCoordinate(target);
  if (spaceCoordinateKey(origin) === spaceCoordinateKey(target)) return 0;
  const galaxyDistance = Math.abs(target.galaxy - origin.galaxy) * 250_000;
  const systemDistance = Math.abs(target.solarSystem - origin.solarSystem) * 10_000;
  const positionDistance = Math.abs(target.position - origin.position) * 12;
  return Math.max(1, galaxyDistance + systemDistance + positionDistance);
}
