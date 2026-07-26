import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = async (relativePath) => readFile(path.join(root, relativePath), 'utf8');
const write = async (relativePath, content) => {
  const target = path.join(root, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content);
};
const writeJson = async (relativePath, value) =>
  write(relativePath, `${JSON.stringify(value, null, 2)}\n`);

const factions = ['aegis', 'synod', 'veyra'];
const slugs = [
  'physics',
  'chemistry',
  'mathematics',
  'astronomy',
  'espionage',
  'computer-systems',
  'ship-armor',
  'fuel-cells',
  'jet-engines',
  'laser-science',
  'ion-science',
  'plasma-science',
  'ecology',
  'hyperspace',
  'parallel-universes',
  'improved-construction',
  'piercing-attack',
  'maneuver-defense',
  'critical-hit',
  'light-armor',
  'medium-armor',
  'heavy-armor',
];

const processingPlan = JSON.parse(await read('assets/manifests/runtime-processing-plan.json'));
const technologyEntries = slugs.map((slug) => ({
  semanticId: `technology.shared.${slug}`,
  family: 'technology',
  sourcePath: `assets/source/New assets/technologies/technology.shared.${slug}.png`,
  outputPath: `public/assets/generated/catalog/technologies/shared/${slug}.webp`,
  width: 256,
  height: 256,
  format: 'webp',
  quality: 88,
  trim: true,
  fit: 'contain',
  position: 'centre',
  withoutEnlargement: false,
}));
processingPlan.entries = [
  ...processingPlan.entries.filter((entry) => entry.family !== 'technology'),
  ...technologyEntries,
].sort((left, right) => left.outputPath.localeCompare(right.outputPath));
await writeJson('assets/manifests/runtime-processing-plan.json', processingPlan);

const bindingManifest = JSON.parse(await read('assets/manifests/mechanical-runtime-bindings.json'));
const technologyBindings = factions.flatMap((faction) =>
  slugs.map((slug) => ({
    mechanicalId: `technology.${faction}.${slug}`,
    category: 'technology',
    sourceSemanticId: `technology.shared.${slug}`,
    sourcePath: `assets/source/New assets/technologies/technology.shared.${slug}.png`,
    runtimeSemanticId: `technology.shared.${slug}`,
    outputPath: `public/assets/generated/catalog/technologies/shared/${slug}.webp`,
    width: 256,
    height: 256,
  })),
);
bindingManifest.entries = [
  ...bindingManifest.entries.filter((entry) => entry.category !== 'technology'),
  ...technologyBindings,
].sort((left, right) => left.mechanicalId.localeCompare(right.mechanicalId));
await writeJson('assets/manifests/mechanical-runtime-bindings.json', bindingManifest);

let manifest = await read('src/assets/completeMechanicalAssetManifest.ts');
manifest = manifest.replace(
  "import { COMPLETE_BUILDING_CATALOGS } from '../simulation/planet/completeBuildingCatalog';",
  "import { COMPLETE_BUILDING_CATALOGS } from '../simulation/planet/completeBuildingCatalog';\nimport { COMPLETE_RESEARCH_CATALOGS } from '../simulation/research/completeResearchCatalog';",
);
manifest = manifest.replace(
  'const COMPLETE_SHIP_BINDINGS: Readonly<Record<string, CompleteMechanicalAssetBinding>> =',
  `const COMPLETE_TECHNOLOGY_BINDINGS: Readonly<Record<string, CompleteMechanicalAssetBinding>> =
  Object.fromEntries(
    Object.values(COMPLETE_RESEARCH_CATALOGS)
      .flat()
      .map((definition) => {
        const parsed = parseMechanicalId(definition.id);
        if (parsed?.kind !== 'technology' || parsed.factionId === 'shared') {
          throw new Error(\`Invalid complete technology ID: \${definition.id}\`);
        }
        const runtimeSemanticId = \`technology.shared.\${parsed.slug}\`;
        return [
          definition.id,
          {
            mechanicalId: definition.id,
            category: 'technology' as const,
            runtimeSemanticId,
            sourcePath: \`\${SOURCE_ROOT}/technologies/\${runtimeSemanticId}.png\`,
          },
        ];
      }),
  );

const COMPLETE_SHIP_BINDINGS: Readonly<Record<string, CompleteMechanicalAssetBinding>> =`,
);
manifest = manifest.replace(
  '    ...COMPLETE_BUILDING_BINDINGS,\n    ...COMPLETE_SHIP_BINDINGS,',
  '    ...COMPLETE_BUILDING_BINDINGS,\n    ...COMPLETE_TECHNOLOGY_BINDINGS,\n    ...COMPLETE_SHIP_BINDINGS,',
);
await write('src/assets/completeMechanicalAssetManifest.ts', manifest);

let research = await read('src/ui/researchScreen.ts');
research = research.replace(
  "import { getFactionMechanicalAsset } from '../assets/factionMechanicalAssets';",
  "import { resolveCompleteMechanicalAsset } from '../assets/completeMechanicalAssetManifest';\nimport { applyMechanicalAssetArtwork } from '../assets/runtimeMechanicalAssets';",
);
research = research.replace(
`function setTechnologyArtwork(element: HTMLElement, assetId: string): void {
  const asset = getFactionMechanicalAsset(assetId);
  if (asset === undefined) return;
  const column = asset.frame.x / asset.frame.width;
  const row = asset.frame.y / asset.frame.height;
  element.style.backgroundImage = \`url("\${asset.atlasUrl}")\`;
  element.style.backgroundSize = '400% 300%';
  element.style.backgroundPosition = \`\${column === 0 ? 0 : (column / 3) * 100}% \${row === 0 ? 0 : (row / 2) * 100}%\`;
}`,
`function setTechnologyArtwork(element: HTMLElement, assetId: string): void {
  const asset = resolveCompleteMechanicalAsset(assetId).asset;
  if (asset === undefined) return;
  applyMechanicalAssetArtwork(element, asset);
}`,
);
research = research.replace(
  "      card.className = `research-card${available ? ' is-ready' : ' is-locked'}`;",
  "      card.className = `research-card${available ? ' is-ready' : ' is-locked'}`;\n      card.dataset.mechanicalId = definition.id;",
);
await write('src/ui/researchScreen.ts', research);

await write('scripts/assets/contact-sheet.mjs', `import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { loadConfig, loadJson, resolveRepositoryPath } from './lib.mjs';

const config = await loadConfig();
const bindings = await loadJson(config.mechanicalBindingsPath);
const backgrounds = [
  ['dark', '#061018'],
  ['light', '#e7edf2'],
];

async function renderSheet(entries, outputPrefix, columns, rows, cell) {
  const width = columns * cell;
  const height = rows * cell;
  for (const [theme, background] of backgrounds) {
    const composites = [];
    for (const [index, entry] of entries.entries()) {
      const input = await sharp(resolveRepositoryPath(entry.outputPath))
        .resize(cell - 36, cell - 36, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
      composites.push({
        input,
        left: (index % columns) * cell + 18,
        top: Math.floor(index / columns) * cell + 18,
      });
    }
    const output = \`\${outputPrefix}-\${theme}.png\`;
    await mkdir(path.dirname(resolveRepositoryPath(output)), { recursive: true });
    await sharp({ create: { width, height, channels: 4, background } })
      .composite(composites)
      .png({ compressionLevel: 9 })
      .toFile(resolveRepositoryPath(output));
  }
}

for (const faction of ['aegis', 'synod', 'veyra']) {
  const entries = bindings.entries
    .filter((entry) =>
      entry.category === 'building' && entry.mechanicalId.startsWith(\`building.\${faction}.\`),
    )
    .sort((left, right) => left.mechanicalId.localeCompare(right.mechanicalId));
  if (entries.length !== 24) {
    throw new Error(\`Expected 24 building entries for \${faction}, found \${entries.length}\`);
  }
  await renderSheet(entries, \`docs/assets/qa/buildings/\${faction}\`, 6, 4, 180);
}

const uniqueTechnologyEntries = [...new Map(
  bindings.entries
    .filter((entry) => entry.category === 'technology')
    .map((entry) => [entry.runtimeSemanticId, entry]),
).values()].sort((left, right) => left.runtimeSemanticId.localeCompare(right.runtimeSemanticId));
if (uniqueTechnologyEntries.length !== 22) {
  throw new Error(\`Expected 22 technology concepts, found \${uniqueTechnologyEntries.length}\`);
}
await renderSheet(
  uniqueTechnologyEntries,
  'docs/assets/qa/technologies/shared',
  6,
  4,
  160,
);
console.log('Generated building and technology contact sheets.');
`);

let check = await read('scripts/assets/check.mjs');
check = check.replace(
  "const generatedIds = new Set(runtimeManifest.assets.map((asset) => asset.semanticId));\nfor (const binding of buildingBindings) {",
  `const technologyBindings = bindings.entries.filter((entry) => entry.category === 'technology');
if (technologyBindings.length !== 66) {
  errors.push(\`Expected 66 technology runtime bindings, found \${technologyBindings.length}.\`);
}
const uniqueTechnologyRuntimeIds = new Set(
  technologyBindings.map((entry) => entry.runtimeSemanticId),
);
if (uniqueTechnologyRuntimeIds.size !== 22) {
  errors.push(\`Expected 22 technology runtime concepts, found \${uniqueTechnologyRuntimeIds.size}.\`);
}
const generatedIds = new Set(runtimeManifest.assets.map((asset) => asset.semanticId));
for (const binding of buildingBindings) {`,
);
check = check.replace(
  "}\ntry {\n  await readFile(resolveRepositoryPath(config.runtimeTypeScriptManifestPath), 'utf8');",
  `}
for (const binding of technologyBindings) {
  if (!generatedIds.has(binding.runtimeSemanticId)) {
    errors.push(\`Missing generated technology runtime asset: \${binding.mechanicalId}\`);
  }
}
if (generatedIds.has('technology.shared.qa-edges-dark-light')) {
  errors.push('Technology QA reference was registered as runtime art.');
}
try {
  await readFile(resolveRepositoryPath(config.runtimeTypeScriptManifestPath), 'utf8');`,
);
await write('scripts/assets/check.mjs', check);

let pipelineTest = await read('tests/assets/assetPipelineConfig.test.ts');
pipelineTest = pipelineTest.replace(
  "  it('records deterministic building processing while keeping atlases empty', () => {\n    expect(processingPlan.schemaVersion).toBe(1);\n    expect(processingPlan.entries).toHaveLength(72);\n    expect(processingPlan.entries.every((entry) => entry.family === 'building')).toBe(true);\n    expect(new Set(processingPlan.entries.map((entry) => entry.semanticId)).size).toBe(72);\n    expect(atlasPlan).toEqual({ schemaVersion: 1, atlases: [] });\n  });",
  "  it('records deterministic building and technology processing while keeping atlases empty', () => {\n    expect(processingPlan.schemaVersion).toBe(1);\n    expect(processingPlan.entries).toHaveLength(94);\n    expect(processingPlan.entries.filter((entry) => entry.family === 'building')).toHaveLength(72);\n    expect(processingPlan.entries.filter((entry) => entry.family === 'technology')).toHaveLength(22);\n    expect(new Set(processingPlan.entries.map((entry) => entry.semanticId)).size).toBe(94);\n    expect(atlasPlan).toEqual({ schemaVersion: 1, atlases: [] });\n  });",
);
await write('tests/assets/assetPipelineConfig.test.ts', pipelineTest);

let runtimeTest = await read('tests/assets/runtimeMechanicalAssets.test.ts');
runtimeTest = runtimeTest.replace(
  "import { COMPLETE_BUILDING_CATALOGS } from '../../src/simulation/planet/completeBuildingCatalog';",
  "import { COMPLETE_BUILDING_CATALOGS } from '../../src/simulation/planet/completeBuildingCatalog';\nimport { COMPLETE_RESEARCH_CATALOGS } from '../../src/simulation/research/completeResearchCatalog';",
);
runtimeTest = runtimeTest.replace(
  "  it('keeps ordinary ships on compatibility art until their dedicated PR', () => {",
  `  it('resolves 66 faction technologies through 22 shared generated concepts', () => {
    const definitions = Object.values(COMPLETE_RESEARCH_CATALOGS).flat();
    expect(definitions).toHaveLength(66);
    const urls = new Set<string>();
    for (const definition of definitions) {
      const resolution = resolveCompleteMechanicalAsset(definition.id);
      expect(resolution.source, definition.id).toBe('complete-manifest');
      expect(resolution.asset?.layout, definition.id).toBe('image');
      expect(resolution.asset?.atlasUrl, definition.id).toContain(
        '/assets/generated/catalog/technologies/shared/',
      );
      urls.add(resolution.asset?.atlasUrl ?? '');
    }
    expect(urls).toHaveLength(22);
  });

  it('keeps ordinary ships on compatibility art until their dedicated PR', () => {`,
);
await write('tests/assets/runtimeMechanicalAssets.test.ts', runtimeTest);

const status = JSON.parse(await read('docs/project-status.json'));
status.lastMergedPr = 102;
status.lastMergeSha = '43471d9ab2a6527e3337f1e73e507d85e2d8e094';
status.activePr = 103;
status.nextPrAfterActive = 104;
status.nextPrKind = 'implementation';
status.currentBatch.status = 'implementing-technologies';
status.currentBatch.implementationPrs = [102, 103];
status.sourceAssetIntake.catalogArt.status = 'buildings-and-technologies-runtime-integrated';
await writeJson('docs/project-status.json', status);

let execution = await read('docs/audits/current-execution-state.md');
execution = execution.replace('Active implementation PR | #102 — ASSET-BUILDINGS', 'Active implementation PR | #103 — ASSET-TECHNOLOGIES');
execution = execution.replace('Active work item | ASSET-BUILDINGS', 'Active work item | ASSET-TECHNOLOGIES');
execution = execution.replace('validate and merge PR #102, then start PR #103 from fresh main', 'validate and merge PR #103, then start PR #104 from fresh main');
await write('docs/audits/current-execution-state.md', execution);

await write('docs/changes/pr103-technology-runtime-assets.md', `# PR #103 — technology runtime assets

- generated 22 approved shared technology WebPs at 256×256;
- bound 66 faction-specific technology IDs to the shared concepts;
- routed research cards through the complete mechanical resolver;
- removed the legacy research atlas path from the research screen;
- added dark/light QA sheets and exact 66-to-22 coverage gates;
- no progression, balance, bot or save-schema changes.
`);

await rm(path.join(root, 'scripts/automation/implement-pr103.mjs'), { force: true });
