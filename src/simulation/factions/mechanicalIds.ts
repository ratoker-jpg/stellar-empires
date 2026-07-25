import type { FactionId } from '../planet/types';

export type MechanicalDefinitionKind =
  | 'building'
  | 'technology'
  | 'ship'
  | 'defense'
  | 'commander';

export type MechanicalNamespaceId = FactionId | 'shared';

export interface ParsedMechanicalId {
  readonly kind: MechanicalDefinitionKind;
  /**
   * Kept as `factionId` for compatibility with the existing catalog code.
   * Shared definitions use the explicit `shared` namespace.
   */
  readonly factionId: MechanicalNamespaceId;
  readonly slug: string;
}

const NAMESPACE_IDS: readonly MechanicalNamespaceId[] = [
  'aegis',
  'synod',
  'veyra',
  'shared',
];
const KINDS: readonly MechanicalDefinitionKind[] = [
  'building',
  'technology',
  'ship',
  'defense',
  'commander',
];
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function createMechanicalId(
  kind: MechanicalDefinitionKind,
  factionId: MechanicalNamespaceId,
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
    !NAMESPACE_IDS.includes(factionId as MechanicalNamespaceId) ||
    !SLUG_PATTERN.test(slug)
  ) {
    return undefined;
  }
  return {
    kind: kind as MechanicalDefinitionKind,
    factionId: factionId as MechanicalNamespaceId,
    slug,
  };
}

export function isMechanicalIdForFaction(
  value: string,
  factionId: FactionId,
): boolean {
  return parseMechanicalId(value)?.factionId === factionId;
}

export function isSharedMechanicalId(value: string): boolean {
  return parseMechanicalId(value)?.factionId === 'shared';
}

export function replaceMechanicalIdFaction(
  value: string,
  factionId: FactionId,
): string | undefined {
  const parsed = parseMechanicalId(value);
  return parsed === undefined || parsed.factionId === 'shared'
    ? undefined
    : createMechanicalId(parsed.kind, factionId, parsed.slug);
}
