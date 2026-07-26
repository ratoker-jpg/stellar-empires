import { getUnitDefinition } from './catalog';
import type { ShipRole } from './types';

function matchesShipRole(unitId: string, role: ShipRole): boolean {
  const definition = getUnitDefinition(unitId);
  if (definition?.kind !== 'ship') return false;
  if (definition.role === role) return true;
  return role === 'scout' && definition.shipClass === 'light-fighter';
}

export function getShipCountByRole(
  ships: Readonly<Record<string, number>>,
  role: ShipRole,
): number {
  return Object.entries(ships).reduce(
    (total, [unitId, quantity]) =>
      matchesShipRole(unitId, role)
        ? total + Math.max(0, quantity)
        : total,
    0,
  );
}

export function hasShipRole(
  ships: Readonly<Record<string, number>>,
  role: ShipRole,
): boolean {
  return getShipCountByRole(ships, role) > 0;
}

export function findShipIdByRole(
  ships: Readonly<Record<string, number>>,
  role: ShipRole,
): string | undefined {
  return Object.keys(ships)
    .sort()
    .find((unitId) => (ships[unitId] ?? 0) > 0 && matchesShipRole(unitId, role));
}
