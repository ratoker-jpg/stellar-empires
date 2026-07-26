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

  it('binds Commander source assets while retaining processed runtime fallbacks', () => {
    const resolution = resolveCompleteMechanicalAsset('commander.shared.annihilator');
    expect(resolution.source).toBe('current-runtime-fallback');
    expect(resolution.asset?.id).toBe('commander.shared.annihilator');
    expect(resolution.provenancePath).toBe(
      'assets/source/New assets/comander_ship/commander-ship.annihilator.png',
    );
  });

  it('still reports unknown future mechanical IDs as missing', () => {
    const resolution = resolveCompleteMechanicalAsset('commander.shared.unknown-future');
    expect(resolution).toEqual({ asset: undefined, source: 'missing', provenancePath: undefined });
  });
});
