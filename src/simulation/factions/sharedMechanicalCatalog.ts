import type { FactionId } from '../planet/types';
import { getMechanicalCatalogSourceFactionId } from './factionCatalogManifest';

export function canUseMechanicalDefinition(
  definitionFactionId: FactionId,
  ownerFactionId: FactionId,
): boolean {
  return definitionFactionId === getMechanicalCatalogSourceFactionId(ownerFactionId);
}
