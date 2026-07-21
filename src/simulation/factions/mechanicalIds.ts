import type { FactionId } from '../planet/types';

export type MechanicalDefinitionKind = 'building' | 'technology' | 'ship' | 'defense';

export interface ParsedMechanicalId {
  readonly kind: MechanicalDefinitionKind;
  readonly factionId: FactionId;
  readonly slug: string;
}

const FACTION_IDS: readonly FactionId[] = ['aegis', 'synod', 'veyra'];
const KINDS: readonly MechanicalDefinitionKind[] = [
  'building',
  'technology',
  'ship',
  'defense',
];
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function createMechanicalId(
  kind: MechanicalDefinitionKind,
  factionId: FactionId,
  slug: string,
): string {
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(`Mechanical id slug is invalid: ${slug}`);
  }
  return `${kind}.${factionId}.${slug}`;
}

export function parseMechanicalId(value: string): ParsedMechanicalId | undefined {
  const [kind, factionId, ...slugParts] = value.split('.');
  const slug = slugParts.join('.');
  if (
    !KINDS.includes(kind as MechanicalDefinitionKind) ||
    !FACTION_IDS.includes(factionId as FactionId) ||
    !SLUG_PATTERN.test(slug)
  ) {
    return undefined;
  }
  return {
    kind: kind as MechanicalDefinitionKind,
    factionId: factionId as FactionId,
    slug,
  };
}

export function isMechanicalIdForFaction(
  value: string,
  factionId: FactionId,
): boolean {
  return parseMechanicalId(value)?.factionId === factionId;
}

export function replaceMechanicalIdFaction(
  value: string,
  factionId: FactionId,
): string | undefined {
  const parsed = parseMechanicalId(value);
  return parsed === undefined
    ? undefined
    : createMechanicalId(parsed.kind, factionId, parsed.slug);
}
