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

const shipSlugs = {
  aegis: [
    'transporter', 'mega-transporter', 'scout', 'cruiser', 'defender',
    'battleship', 'destroyer', 'bomber', 'death-star', 'colonizer',
    'recycler', 'spy-probe', 'solar-satellite',
  ],
  synod: [
    'cargo-bot', 'large-cargo-bot', 'fighter', 'interceptor', 'shield-bot',
    'star-armada', 'goliath', 'bomberbot', 'titan', 'colonizer-bot',
    'recycler', 'spy-bot', 'solar-satellite',
  ],
  veyra: [
    'transporter', 'mega-transporter', 'nox-dart', 'nemesis', 'absorber',
    'ghost', 'hornet', 'bomber', 'nox-queen', 'settler',
    'recycler-drone', 'nox-mind', 'organic-satellite',
  ],
};

const shipIds = Object.entries(shipSlugs).flatMap(([faction, slugs]) =>
  slugs.map((slug) => `ship.${faction}.${slug}`),
);

const processingPlan = JSON.parse(await read('assets/manifests/runtime-processing-plan.json'));
const shipEntries = shipIds.map((mechanicalId) => {
  const [, faction, slug] = mechanicalId.split('.');
  return {
    semanticId: mechanicalId,
    family: 'ship',
    sourcePath: `assets/source/New assets/ship/${faction}/${mechanicalId}.png`,
    outputPath: `public/assets/generated/catalog/ships/${faction}/${slug}.webp`,
    width: 512,
    height: 512,
    format: 'webp',
    quality: 90,
    trim: true,
    fit: 'contain',
    position: 'centre',
    withoutEnlargement: false,
  };
});
processingPlan.entries = [
  ...processingPlan.entries.filter((entry) => entry.family !== 'ship'),
  ...shipEntries,
].sort((left, right) => left.outputPath.localeCompare(right.outputPath));
await writeJson('assets/manifests/runtime-processing-plan.json', processingPlan);

const bindingManifest = JSON.parse(await read('assets/manifests/mechanical-runtime-bindings.json'));
const shipBindings = shipEntries.map((entry) => ({
  mechanicalId: entry.semanticId,
  category: 'ship',
  sourceSemanticId: entry.semanticId,
  sourcePath: entry.sourcePath,
  runtimeSemanticId: entry.semanticId,
  outputPath: entry.outputPath,
  width: entry.width,
  height: entry.height,
}));
bindingManifest.entries = [
  ...bindingManifest.entries.filter((entry) => entry.category !== 'ship'),
  ...shipBindings,
].sort((left, right) => left.mechanicalId.localeCompare(right.mechanicalId));
await writeJson('assets/manifests/mechanical-runtime-bindings.json', bindingManifest);

let manifest = await read('src/assets/completeMechanicalAssetManifest.ts');
manifest = manifest.replace(
  "          category: 'ship' as const,\n          sourcePath:",
  "          category: 'ship' as const,\n          runtimeSemanticId: definition.id,\n          sourcePath:",
);
await write('src/assets/completeMechanicalAssetManifest.ts', manifest);

let galaxyAssets = await read('src/assets/galaxyFleetRuntimeAssets.ts');
galaxyAssets = galaxyAssets.replace(
  "import type { PlanetBiome, StarClass } from '../simulation/galaxy/types';",
  "import { resolveCompleteMechanicalAsset } from './completeMechanicalAssetManifest';\nimport type { PlanetBiome, StarClass } from '../simulation/galaxy/types';",
);
galaxyAssets = galaxyAssets.replace(
`export function getFleetShipArtUrl(factionId: FactionId, unitId: string): string {
  return SHIP_ART_BY_FACTION[factionId][getFleetShipPresentationRole(unitId)];
}`,
`export function getFleetShipArtUrl(factionId: FactionId, unitId: string): string {
  const complete = resolveCompleteMechanicalAsset(unitId);
  if (complete.source === 'complete-manifest' && complete.asset !== undefined) {
    return complete.asset.atlasUrl;
  }
  return SHIP_ART_BY_FACTION[factionId][getFleetShipPresentationRole(unitId)];
}`,
);
await write('src/assets/galaxyFleetRuntimeAssets.ts', galaxyAssets);

let production = await read('src/ui/productionScreen.ts');
production = production.replace(
  "import { getFactionMechanicalAsset } from '../assets/factionMechanicalAssets';",
  "import { resolveCompleteMechanicalAsset } from '../assets/completeMechanicalAssetManifest';\nimport { getFactionMechanicalAsset } from '../assets/factionMechanicalAssets';\nimport { applyMechanicalAssetArtwork } from '../assets/runtimeMechanicalAssets';",
);
production = production.replace(
`function setUnitArtwork(element: HTMLElement, definition: UnitDefinition): void {
  const asset = getFactionMechanicalAsset(definition.assetId);
  if (asset === undefined) return;
  const column = asset.frame.x / asset.frame.width;
  const row = asset.frame.y / asset.frame.height;
  const columns = definition.kind === 'ship' ? 3 : 3;
  const rows = definition.kind === 'ship' ? 2 : 1;
  element.style.backgroundImage = \`url("\${asset.atlasUrl}")\`;
  element.style.backgroundSize = \`\${columns * 100}% \${rows * 100}%\`;
  element.style.backgroundPosition = \`\${column === 0 ? 0 : (column / (columns - 1)) * 100}% \${row === 0 || rows === 1 ? 0 : 100}%\`;
}`,
`function setUnitArtwork(element: HTMLElement, definition: UnitDefinition): void {
  if (definition.kind === 'ship') {
    const asset = resolveCompleteMechanicalAsset(definition.assetId).asset;
    if (asset !== undefined) applyMechanicalAssetArtwork(element, asset);
    return;
  }
  const asset = getFactionMechanicalAsset(definition.assetId);
  if (asset === undefined) return;
  const column = asset.frame.x / asset.frame.width;
  element.style.backgroundImage = \`url("\${asset.atlasUrl}")\`;
  element.style.backgroundSize = '300% 100%';
  element.style.backgroundPosition = \`\${column === 0 ? 0 : (column / 2) * 100}% 0\`;
}`,
);
production = production.replace(
  "      card.className = 'production-card';",
  "      card.className = 'production-card';\n      card.dataset.mechanicalId = definition.id;",
);
await write('src/ui/productionScreen.ts', production);

let presentation = await read('src/ui/developmentPresentation.ts');
presentation = presentation.replace(
  "import { getFleetShipArtUrl } from '../assets/galaxyFleetRuntimeAssets';\n",
  '',
);
presentation = presentation.replace(
`    const definitions = getUnitsByKind(kind, planet.factionId);
    const byName = new Map(definitions.map((definition) => [definition.name, definition]));
    for (const card of dialog.querySelectorAll<HTMLElement>('.production-card')) {
      const name = card.querySelector<HTMLHeadingElement>('h3')?.textContent;
      const art = card.querySelector<HTMLElement>('.production-art');
      const definition = name === undefined ? undefined : byName.get(name);
      if (art === null || definition === undefined) continue;
      if (kind === 'ship') {
        art.style.backgroundImage = \`linear-gradient(180deg, transparent, rgba(2, 8, 14, 0.68)), url("\${getFleetShipArtUrl(planet.factionId, definition.id)}")\`;
        art.style.backgroundSize = '100% 100%, contain';
        art.style.backgroundPosition = 'center';
        art.style.backgroundRepeat = 'no-repeat';
      } else {
        setSheetArtwork(
          art,
          getDefensePresentationArtUrl(planet.factionId, definition.id),
          2,
        );
      }
    }`,
`    if (kind === 'ship') continue;
    const definitions = getUnitsByKind(kind, planet.factionId);
    const byName = new Map(definitions.map((definition) => [definition.name, definition]));
    for (const card of dialog.querySelectorAll<HTMLElement>('.production-card')) {
      const name = card.querySelector<HTMLHeadingElement>('h3')?.textContent;
      const art = card.querySelector<HTMLElement>('.production-art');
      const definition = name === undefined ? undefined : byName.get(name);
      if (art === null || definition === undefined) continue;
      setSheetArtwork(
        art,
        getDefensePresentationArtUrl(planet.factionId, definition.id),
        2,
      );
    }`,
);
await write('src/ui/developmentPresentation.ts', presentation);

let mission = await read('src/ui/missionScreen.ts');
mission = mission.replace(
  "        card.className = 'mission-ship-option';",
  "        card.className = 'mission-ship-option';\n        card.dataset.mechanicalId = unitId;",
);
mission = mission.replace(
  "      card.className = `mission-fleet-card is-${fleet.status}`;",
  "      card.className = `mission-fleet-card is-${fleet.status}`;",
);
await write('src/ui/missionScreen.ts', mission);

let upgrades = await read('src/ui/shipUpgradesScreen.ts');
upgrades = upgrades.replace(
  "      card.className = 'ship-upgrade-card';",
  "      card.className = 'ship-upgrade-card';\n      card.dataset.mechanicalId = ship.id;",
);
await write('src/ui/shipUpgradesScreen.ts', upgrades);

let contactSheet = await read('scripts/assets/contact-sheet.mjs');
contactSheet = contactSheet.replace(
  "console.log('Generated building and technology contact sheets.');",
  `for (const faction of ['aegis', 'synod', 'veyra']) {
  const entries = bindings.entries
    .filter((entry) =>
      entry.category === 'ship' && entry.mechanicalId.startsWith(\`ship.\${faction}.\`),
    )
    .sort((left, right) => left.mechanicalId.localeCompare(right.mechanicalId));
  if (entries.length !== 13) {
    throw new Error(\`Expected 13 ship entries for \${faction}, found \${entries.length}\`);
  }
  await renderSheet(entries, \`docs/assets/qa/ships/\${faction}\`, 5, 3, 190);
}
console.log('Generated building, technology and ship contact sheets.');`,
);
await write('scripts/assets/contact-sheet.mjs', contactSheet);

let check = await read('scripts/assets/check.mjs');
check = check.replace(
  "const generatedIds = new Set(runtimeManifest.assets.map((asset) => asset.semanticId));",
  `const shipBindings = bindings.entries.filter((entry) => entry.category === 'ship');
if (shipBindings.length !== 39) {
  errors.push(\`Expected 39 ship runtime bindings, found \${shipBindings.length}.\`);
}
if (new Set(shipBindings.map((entry) => entry.runtimeSemanticId)).size !== 39) {
  errors.push('Complete ships do not have 39 unique runtime semantic IDs.');
}
const generatedIds = new Set(runtimeManifest.assets.map((asset) => asset.semanticId));`,
);
check = check.replace(
  "if (generatedIds.has('technology.shared.qa-edges-dark-light')) {",
  `for (const binding of shipBindings) {
  if (!generatedIds.has(binding.runtimeSemanticId)) {
    errors.push(\`Missing generated ship runtime asset: \${binding.mechanicalId}\`);
  }
}
if (generatedIds.has('technology.shared.qa-edges-dark-light')) {`,
);
await write('scripts/assets/check.mjs', check);

let pipelineTest = await read('tests/assets/assetPipelineConfig.test.ts');
pipelineTest = pipelineTest.replace(
  "  it('records deterministic building and technology processing while keeping atlases empty', () => {\n    expect(processingPlan.schemaVersion).toBe(1);\n    expect(processingPlan.entries).toHaveLength(94);\n    expect(processingPlan.entries.filter((entry) => entry.family === 'building')).toHaveLength(72);\n    expect(processingPlan.entries.filter((entry) => entry.family === 'technology')).toHaveLength(22);\n    expect(new Set(processingPlan.entries.map((entry) => entry.semanticId)).size).toBe(94);\n    expect(atlasPlan).toEqual({ schemaVersion: 1, atlases: [] });\n  });",
  "  it('records deterministic building, technology and ship processing while keeping atlases empty', () => {\n    expect(processingPlan.schemaVersion).toBe(1);\n    expect(processingPlan.entries).toHaveLength(133);\n    expect(processingPlan.entries.filter((entry) => entry.family === 'building')).toHaveLength(72);\n    expect(processingPlan.entries.filter((entry) => entry.family === 'technology')).toHaveLength(22);\n    expect(processingPlan.entries.filter((entry) => entry.family === 'ship')).toHaveLength(39);\n    expect(new Set(processingPlan.entries.map((entry) => entry.semanticId)).size).toBe(133);\n    expect(atlasPlan).toEqual({ schemaVersion: 1, atlases: [] });\n  });",
);
await write('tests/assets/assetPipelineConfig.test.ts', pipelineTest);

let runtimeTest = await read('tests/assets/runtimeMechanicalAssets.test.ts');
runtimeTest = runtimeTest.replace(
  "import { COMPLETE_RESEARCH_CATALOGS } from '../../src/simulation/research/completeResearchCatalog';",
  "import { COMPLETE_RESEARCH_CATALOGS } from '../../src/simulation/research/completeResearchCatalog';\nimport { COMPLETE_SHIP_CATALOGS } from '../../src/simulation/units/completeShipCatalog';",
);
runtimeTest = runtimeTest.replace(
  "  it('keeps ordinary ships on compatibility art until their dedicated PR', () => {\n    expect(resolveCompleteMechanicalAsset('ship.aegis.scout').source).toBe(\n      'current-runtime-fallback',\n    );\n  });",
  `  it('resolves every complete ordinary ship through unique generated art', () => {
    const definitions = Object.values(COMPLETE_SHIP_CATALOGS).flat();
    expect(definitions).toHaveLength(39);
    const urls = new Set<string>();
    for (const definition of definitions) {
      const resolution = resolveCompleteMechanicalAsset(definition.id);
      expect(resolution.source, definition.id).toBe('complete-manifest');
      expect(resolution.asset?.layout, definition.id).toBe('image');
      expect(resolution.asset?.atlasUrl, definition.id).toContain(
        '/assets/generated/catalog/ships/',
      );
      urls.add(resolution.asset?.atlasUrl ?? '');
    }
    expect(urls).toHaveLength(39);
  });`,
);
await write('tests/assets/runtimeMechanicalAssets.test.ts', runtimeTest);

let galaxyTest = await read('src/assets/galaxyFleetRuntimeAssets.test.ts');
galaxyTest = galaxyTest.replace(
  "  it('maps biome and faction ship art to the committed source library', () => {",
  "  it('keeps legacy map adapters while complete ships use generated art', () => {",
);
galaxyTest = galaxyTest.replace(
  "    expect(getFleetShipArtUrl('veyra', 'ship.aegis.recycler')).toContain(\n      'veyra_recycler_ship.png',\n    );",
  "    expect(getFleetShipArtUrl('veyra', 'ship.aegis.recycler')).toContain(\n      'veyra_recycler_ship.png',\n    );\n    expect(getFleetShipArtUrl('synod', 'ship.synod.titan')).toContain(\n      '/assets/generated/catalog/ships/synod/titan.webp',\n    );",
);
await write('src/assets/galaxyFleetRuntimeAssets.test.ts', galaxyTest);

const status = JSON.parse(await read('docs/project-status.json'));
status.lastMergedPr = 103;
status.lastMergeSha = 'b47ec8df9abc58d1ce455e3bf6ee1279d2e0d9d0';
status.activePr = 104;
status.nextPrAfterActive = 105;
status.nextPrKind = 'implementation';
status.currentBatch.status = 'implementing-ships';
status.currentBatch.implementationPrs = [102, 103, 104];
status.sourceAssetIntake.catalogArt.status = 'buildings-technologies-ships-runtime-integrated';
await writeJson('docs/project-status.json', status);

let execution = await read('docs/audits/current-execution-state.md');
execution = execution.replace('Active implementation PR | #103 — ASSET-TECHNOLOGIES', 'Active implementation PR | #104 — ASSET-SHIPS');
execution = execution.replace('Active work item | ASSET-TECHNOLOGIES', 'Active work item | ASSET-SHIPS');
execution = execution.replace('validate and merge PR #103, then start PR #104 from fresh main', 'validate and merge PR #104, then start PR #105 from fresh main');
await write('docs/audits/current-execution-state.md', execution);

await write('docs/changes/pr104-ship-runtime-assets.md', `# PR #104 — ship runtime assets

- generated 39 approved ordinary ship WebPs at 512×512;
- bound every complete ship mechanical ID to its own image;
- routed shipyard, mission composition, fleet cards and ship upgrades through generated art;
- removed ship-card MutationObserver/name-based replacement;
- retained the legacy map-ship adapter for the later Universe navigation audit;
- added faction dark/light QA sheets and 39-unique-URL gates;
- no mechanics, balance, bot or save-schema changes.
`);

await rm(path.join(root, 'scripts/automation/implement-pr104.mjs'), { force: true });
