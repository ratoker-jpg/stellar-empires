import type { FactionId } from '../planet/types';
import type { CompleteCatalogRolloutStage } from './completeCatalogTargets';

export type FactionCatalogMode = 'native' | 'legacy-alias';

export interface FactionCatalogManifestEntry {
  readonly factionId: FactionId;
  readonly sourceFactionId: FactionId;
  readonly mode: FactionCatalogMode;
  readonly migrationPolicy: 'stable-existing-ids' | 'replace-legacy-aliases';
  /** Complete-catalog contract version, independent from save schema version. */
  readonly targetCatalogVersion: 1;
  /** Current content rollout stage for this faction. */
  readonly rolloutStage: CompleteCatalogRolloutStage;
}

export const FACTION_CATALOG_MANIFEST: Readonly<
  Record<FactionId, FactionCatalogManifestEntry>
> = {
  aegis: {
    factionId: 'aegis',
    sourceFactionId: 'aegis',
    mode: 'native',
    migrationPolicy: 'stable-existing-ids',
    targetCatalogVersion: 1,
    rolloutStage: 'complete',
  },
  synod: {
    factionId: 'synod',
    sourceFactionId: 'synod',
    mode: 'native',
    migrationPolicy: 'replace-legacy-aliases',
    targetCatalogVersion: 1,
    rolloutStage: 'complete',
  },
  veyra: {
    factionId: 'veyra',
    sourceFactionId: 'veyra',
    mode: 'native',
    migrationPolicy: 'replace-legacy-aliases',
    targetCatalogVersion: 1,
    rolloutStage: 'complete',
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
