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
    const strictIntake = audit.assets.filter(
      (asset) =>
        asset.path.startsWith('assets/source/New assets/') ||
        asset.classification === 'source-intake',
    );
    for (const asset of strictIntake) {
      expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(asset.bytes).toBeGreaterThan(0);
      expect(asset.width).toBeGreaterThan(0);
      expect(asset.height).toBeGreaterThan(0);
      expect(asset.inspectionError).toBeNull();
    }
    const universeIds = audit.assets
      .filter((asset) => asset.classification === 'source-intake')
      .map((asset) => asset.semanticId);
    expect(new Set(universeIds).size).toBe(universeIds.length);
  });

  it('records deterministic building, technology and ship processing while keeping atlases empty', () => {
    expect(processingPlan.schemaVersion).toBe(1);
    expect(processingPlan.entries).toHaveLength(133);
    expect(processingPlan.entries.filter((entry) => entry.family === 'building')).toHaveLength(72);
    expect(processingPlan.entries.filter((entry) => entry.family === 'technology')).toHaveLength(22);
    expect(processingPlan.entries.filter((entry) => entry.family === 'ship')).toHaveLength(39);
    expect(new Set(processingPlan.entries.map((entry) => entry.semanticId)).size).toBe(133);
    expect(atlasPlan).toEqual({ schemaVersion: 1, atlases: [] });
  });
});
