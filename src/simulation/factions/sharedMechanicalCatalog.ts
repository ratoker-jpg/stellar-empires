import type { FactionId } from '../planet/types';

export function canUseMechanicalDefinition(
  definitionFactionId: FactionId,
  ownerFactionId: FactionId,
): boolean {
  return definitionFactionId === ownerFactionId || definitionFactionId === 'aegis';
}
