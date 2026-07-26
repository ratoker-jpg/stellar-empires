import type { FactionId } from '../planet/types';
import type { UnitFactionId } from '../units/types';
import { getMechanicalCatalogSourceFactionId } from './factionCatalogManifest';

export function canUseMechanicalDefinition(
  definitionFactionId: UnitFactionId,
  ownerFactionId: FactionId,
): boolean {
  return definitionFactionId === 'shared' ||
    definitionFactionId === getMechanicalCatalogSourceFactionId(ownerFactionId);
}
