import { getUnitDefinition } from './catalog';
import type { ShipRole } from './types';

export function getShipCountByRole(
  ships: Readonly<Record<string, number>>,
  role: ShipRole,
): number {
  return Object.entries(ships).reduce((total, [unitId, quantity]) => {
    const definition = getUnitDefinition(unitId);
    return definition?.kind === 'ship' && definition.role === role
      ? total + Math.max(0, quantity)
      : total;
  }, 0);
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
    .find((unitId) => {
      const definition = getUnitDefinition(unitId);
      return (
        (ships[unitId] ?? 0) > 0 &&
        definition?.kind === 'ship' &&
        definition.role === role
      );
    });
}
