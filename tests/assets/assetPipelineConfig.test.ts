import { describe, expect, it } from 'vitest';
import config from '../../assets/manifests/asset-pipeline.config.json';
import audit from '../../assets/manifests/source-asset-audit.json';
import processingPlan from '../../assets/manifests/runtime-processing-plan.json';
import atlasPlan from '../../assets/manifests/runtime-atlas-plan.json';

describe('asset processing foundation', () => {
  it('defines deterministic source and runtime boundaries', () => {
    expect(config.schemaVersion).toBe(1);
    expect(config.generatedRuntimeRoot).toBe('public/assets/generated');
    expect(config.auditRoots.map((root) => root.path)).toEqual([
      'assets/source',
      'public/assets',
    ]);
    expect(config.classificationOverrides).toContainEqual({
      prefix: 'public/assets/universe',
      classification: 'source-intake',
    });
  });

  it('records the complete committed intake', () => {
    const newAssets = audit.assets.filter((asset) =>
      asset.path.startsWith('assets/source/New assets/'),
    );
    const universe = audit.assets.filter(
      (asset) => asset.classification === 'source-intake',
    );
    expect(newAssets).toHaveLength(config.expectedIntake.newAssetsCount);
    expect(universe).toHaveLength(config.expectedIntake.universeCount);
    expect(audit.summary.totalFiles).toBe(audit.assets.length);
  });

  it('keeps audited paths, checksums and semantic ids deterministic', () => {
    const sorted = [...audit.assets].sort((left, right) => left.path.localeCompare(right.path));
    expect(audit.assets).toEqual(sorted);
    for (const asset of audit.assets) {
      expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(asset.bytes).toBeGreaterThan(0);
      expect(asset.width).toBeGreaterThan(0);
      expect(asset.height).toBeGreaterThan(0);
    }
    const universeIds = audit.assets
      .filter((asset) => asset.classification === 'source-intake')
      .map((asset) => asset.semanticId);
    expect(new Set(universeIds).size).toBe(universeIds.length);
  });

  it('starts future processing and atlas work from explicit empty plans', () => {
    expect(processingPlan).toEqual({ schemaVersion: 1, entries: [] });
    expect(atlasPlan).toEqual({ schemaVersion: 1, atlases: [] });
  });
});
