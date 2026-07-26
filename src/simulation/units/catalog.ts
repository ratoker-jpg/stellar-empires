import {
  getRegisteredUnitDefinition,
  getRegisteredUnitsByKind,
} from '../factions/factionMechanicalCatalogRegistry';
import type { FactionId } from '../planet/types';
import type { UnitDefinition, UnitKind } from './types';

export { AEGIS_UNIT_CATALOG } from './aegisUnitCatalog';
export {
  COMPLETE_DEFENSE_CATALOGS,
  getCompleteDefenseClass,
  getCompleteDefenseId,
  getCompleteDefenseIds,
} from './completeDefenseCatalog';
export {
  COMPLETE_SHIP_CATALOGS,
  getCompleteShipClass,
  getCompleteShipId,
  getCompleteShipIds,
} from './completeShipCatalog';
export { LEGACY_UNIT_ALIASES, resolveCanonicalUnitId } from './unitAliases';

export function getUnitDefinition(unitId: string): UnitDefinition | undefined {
  return getRegisteredUnitDefinition(unitId);
}

export function getUnitsByKind(
  kind: UnitKind,
  factionId?: FactionId,
): readonly UnitDefinition[] {
  return getRegisteredUnitsByKind(kind, factionId);
}
