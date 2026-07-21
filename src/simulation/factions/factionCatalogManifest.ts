import type { FactionId } from '../planet/types';

export type FactionCatalogMode = 'native' | 'legacy-alias';

export interface FactionCatalogManifestEntry {
  readonly factionId: FactionId;
  readonly sourceFactionId: FactionId;
  readonly mode: FactionCatalogMode;
  readonly migrationPolicy: 'stable-existing-ids' | 'replace-legacy-aliases';
}

export const FACTION_CATALOG_MANIFEST: Readonly<
  Record<FactionId, FactionCatalogManifestEntry>
> = {
  aegis: {
    factionId: 'aegis',
    sourceFactionId: 'aegis',
    mode: 'native',
    migrationPolicy: 'stable-existing-ids',
  },
  synod: {
    factionId: 'synod',
    sourceFactionId: 'synod',
    mode: 'native',
    migrationPolicy: 'replace-legacy-aliases',
  },
  veyra: {
    factionId: 'veyra',
    sourceFactionId: 'veyra',
    mode: 'native',
    migrationPolicy: 'replace-legacy-aliases',
  },
};

export function getFactionCatalogManifest(
  factionId: FactionId,
): FactionCatalogManifestEntry {
  return FACTION_CATALOG_MANIFEST[factionId];
}

export function getMechanicalCatalogSourceFactionId(
  factionId: FactionId,
): FactionId {
  return getFactionCatalogManifest(factionId).sourceFactionId;
}

export function hasNativeMechanicalCatalog(factionId: FactionId): boolean {
  return getFactionCatalogManifest(factionId).mode === 'native';
}
