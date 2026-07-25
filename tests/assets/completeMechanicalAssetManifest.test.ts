import { describe, expect, it } from 'vitest';
import {
  COMPLETE_MECHANICAL_ASSET_MANIFEST,
  resolveCompleteMechanicalAsset,
  validateCompleteMechanicalAssetManifest,
} from '../../src/assets/completeMechanicalAssetManifest';

describe('complete mechanical asset manifest', () => {
  it('keeps source intake separate from runtime bindings', () => {
    expect(COMPLETE_MECHANICAL_ASSET_MANIFEST.sourceRoot).toBe('assets/source/New assets');
    expect(validateCompleteMechanicalAssetManifest()).toEqual([]);
  });

  it('uses current runtime assets as deterministic compatibility fallbacks', () => {
    const resolution = resolveCompleteMechanicalAsset('ship.aegis.scout');
    expect(resolution.source).toBe('current-runtime-fallback');
    expect(resolution.asset?.id).toBe('ship.aegis.scout');
  });

  it('reports missing future assets without inventing a binding', () => {
    const resolution = resolveCompleteMechanicalAsset('commander.shared.annihilator');
    expect(resolution).toEqual({ asset: undefined, source: 'missing', provenancePath: undefined });
  });
});
