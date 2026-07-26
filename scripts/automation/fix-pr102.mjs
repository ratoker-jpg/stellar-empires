import { readFile, writeFile, rm } from 'node:fs/promises';

const runtimePath = 'src/assets/runtimeMechanicalAssets.ts';
let runtime = await readFile(runtimePath, 'utf8');
runtime = runtime.replace(
  '  const generated = RUNTIME_ASSET_MANIFEST[runtimeSemanticId];',
  "  const manifest = RUNTIME_ASSET_MANIFEST as Readonly<Record<string, { readonly outputPath: string; readonly width: number; readonly height: number }>>;\n  const generated = manifest[runtimeSemanticId];",
);
await writeFile(runtimePath, runtime);

const atlasPath = 'src/assets/factionAtlasSelection.ts';
let atlas = await readFile(atlasPath, 'utf8');
atlas = atlas.replace(
  "    case 'ship':\n      return assets.shipsAtlasUrl;",
  "    case 'ship':\n    case 'commander':\n      return assets.shipsAtlasUrl;",
);
await writeFile(atlasPath, atlas);

const pipelineTestPath = 'tests/assets/assetPipelineConfig.test.ts';
let pipelineTest = await readFile(pipelineTestPath, 'utf8');
pipelineTest = pipelineTest.replace(
  "  it('starts future processing and atlas work from explicit empty plans', () => {\n    expect(processingPlan).toEqual({ schemaVersion: 1, entries: [] });\n    expect(atlasPlan).toEqual({ schemaVersion: 1, atlases: [] });\n  });",
  "  it('records deterministic building processing while keeping atlases empty', () => {\n    expect(processingPlan.schemaVersion).toBe(1);\n    expect(processingPlan.entries).toHaveLength(72);\n    expect(processingPlan.entries.every((entry) => entry.family === 'building')).toBe(true);\n    expect(new Set(processingPlan.entries.map((entry) => entry.semanticId)).size).toBe(72);\n    expect(atlasPlan).toEqual({ schemaVersion: 1, atlases: [] });\n  });",
);
await writeFile(pipelineTestPath, pipelineTest);
await rm('scripts/automation/fix-pr102.mjs', { force: true });
