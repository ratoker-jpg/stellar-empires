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

const presentationTestPath = 'src/assets/planetIndustryRuntimeAssets.test.ts';
let presentationTest = await readFile(presentationTestPath, 'utf8');
presentationTest = presentationTest.replace(
  "  it('maps shared mechanical ids to faction-specific source art', () => {\n    expect(getBuildingSheetUrl('synod', 'building.aegis.shipyard')).toContain('synod_shipyard_sheet.png');\n    expect(getBuildingSheetUrl('veyra', 'building.aegis.research-lab')).toContain('veyra_research_lab_sheet.png');",
  "  it('maps complete building ids to generated faction-specific art', () => {\n    expect(getBuildingSheetUrl('synod', 'building.synod.shipyard')).toContain('/assets/generated/catalog/buildings/synod/shipyard.webp');\n    expect(getBuildingSheetUrl('veyra', 'building.veyra.experimental-center')).toContain('/assets/generated/catalog/buildings/veyra/experimental-center.webp');",
);
presentationTest = presentationTest.replace(
  "    expect(getBuildingSheetFrame(20, 20)).toBe(3);",
  "    expect(getBuildingSheetFrame(20, 20)).toBe(0);",
);
await writeFile(presentationTestPath, presentationTest);

await rm('scripts/automation/fix-pr102.mjs', { force: true });
