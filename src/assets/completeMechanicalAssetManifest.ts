import type { AegisVerticalSliceAsset } from './aegisVerticalSliceAssets';
import { getFactionMechanicalAsset } from './factionMechanicalAssets';

export type CompleteMechanicalAssetCategory =
  | 'building'
  | 'technology'
  | 'ship'
  | 'defense'
  | 'commander';

export interface CompleteMechanicalAssetBinding {
  readonly mechanicalId: string;
  readonly category: CompleteMechanicalAssetCategory;
  readonly runtimeAsset?: AegisVerticalSliceAsset;
  /**
   * Provenance-only repository path. Source files are never imported directly by
   * gameplay components and must be processed before becoming runtime assets.
   */
  readonly sourcePath?: string;
}

export interface CompleteMechanicalAssetManifest {
  readonly version: 1;
  readonly sourceRoot: 'assets/source/New assets';
  readonly bindings: Readonly<Record<string, CompleteMechanicalAssetBinding>>;
}

export const COMPLETE_MECHANICAL_ASSET_MANIFEST: CompleteMechanicalAssetManifest = {
  version: 1,
  sourceRoot: 'assets/source/New assets',
  bindings: {},
};

export interface MechanicalAssetResolution {
  readonly asset: AegisVerticalSliceAsset | undefined;
  readonly source: 'complete-manifest' | 'current-runtime-fallback' | 'missing';
  readonly provenancePath: string | undefined;
}

export function resolveCompleteMechanicalAsset(
  mechanicalId: string,
  manifest: CompleteMechanicalAssetManifest = COMPLETE_MECHANICAL_ASSET_MANIFEST,
): MechanicalAssetResolution {
  const binding = manifest.bindings[mechanicalId];
  if (binding?.runtimeAsset !== undefined) {
    return {
      asset: binding.runtimeAsset,
      source: 'complete-manifest',
      provenancePath: binding.sourcePath,
    };
  }

  const fallback = getFactionMechanicalAsset(mechanicalId);
  if (fallback !== undefined) {
    return {
      asset: fallback,
      source: 'current-runtime-fallback',
      provenancePath: binding?.sourcePath,
    };
  }

  return {
    asset: undefined,
    source: 'missing',
    provenancePath: binding?.sourcePath,
  };
}

export function validateCompleteMechanicalAssetManifest(
  manifest: CompleteMechanicalAssetManifest = COMPLETE_MECHANICAL_ASSET_MANIFEST,
): readonly string[] {
  const errors: string[] = [];
  for (const [mechanicalId, binding] of Object.entries(manifest.bindings)) {
    if (binding.mechanicalId !== mechanicalId) {
      errors.push(`Mechanical asset manifest key mismatch: ${mechanicalId}`);
    }
    if (binding.runtimeAsset !== undefined && binding.runtimeAsset.id !== mechanicalId) {
      errors.push(`Mechanical runtime asset id mismatch: ${mechanicalId}`);
    }
    if (binding.sourcePath?.startsWith(`${manifest.sourceRoot}/`) === false) {
      errors.push(`Mechanical source asset is outside source root: ${binding.sourcePath}`);
    }
  }
  return errors;
}
