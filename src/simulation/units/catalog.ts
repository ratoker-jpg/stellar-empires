import {
  getRegisteredUnitDefinition,
  getRegisteredUnitsByKind,
} from '../factions/factionMechanicalCatalogRegistry';
import type { FactionId } from '../planet/types';
import type { UnitDefinition, UnitKind } from './types';

export { AEGIS_UNIT_CATALOG } from './aegisUnitCatalog';

export function getUnitDefinition(unitId: string): UnitDefinition | undefined {
  return getRegisteredUnitDefinition(unitId);
}

export function getUnitsByKind(
  kind: UnitKind,
  factionId?: FactionId,
): readonly UnitDefinition[] {
  return getRegisteredUnitsByKind(kind, factionId);
}
