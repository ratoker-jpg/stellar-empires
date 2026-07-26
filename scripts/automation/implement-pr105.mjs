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

const defenseSlugs = {
  aegis: [
    'ballistic-turret', 'laser-turret', 'ion-turret', 'plasma-turret',
    'tower-shield', 'planetary-shield', 'laser-ion-battery',
    'plasma-laser-battery', 'ion-plasma-battery',
  ],
  synod: [
    'defense-matrix', 'laser-matrix', 'ion-matrix', 'plasma-matrix',
    'matrix-shield', 'planetary-matrix', 'laser-ion-matrix',
    'plasma-laser-matrix', 'ion-plasma-matrix',
  ],
  veyra: [
    'nox-archer', 'laser-matter', 'ion-weave', 'plasma-weave',
    'chitin-shield', 'surface-shield', 'laser-ion-turret',
    'plasma-laser-turret', 'ion-plasma-turret',
  ],
};
const commanderFiles = {
  annihilator: 'commander-ship.annihilator.png',
  corsair: 'commander-ship.corsair.png',
  regenerator: 'commander-ship.reanimator.png',
  viper: 'commander-ship.viper.png',
  scorpion: 'commander-ship.scorpion.png',
  phantom: 'commander-ship.phantom.png',
  hunter: 'commander-ship.hunter.png',
  typhoon: 'commander-ship.typhoon.png',
  executor: 'commander-ship.executioner.png',
  juggernaut: 'commander-ship.juggernaut.png',
  argo: 'commander-ship.argo.png',
  judge: 'commander-ship.judge.png',
  polias: 'commander-ship.polias.png',
};

const defenseEntries = Object.entries(defenseSlugs).flatMap(([faction, slugs]) =>
  slugs.map((slug) => {
    const mechanicalId = `defense.${faction}.${slug}`;
    return {
      semanticId: mechanicalId,
      family: 'defense',
      sourcePath: `assets/source/New assets/defenses/${faction}/${mechanicalId}.png`,
      outputPath: `public/assets/generated/catalog/defenses/${faction}/${slug}.webp`,
      width: 384,
      height: 384,
      format: 'webp',
      quality: 90,
      trim: true,
      fit: 'contain',
      position: 'centre',
      withoutEnlargement: false,
    };
  }),
);
const commanderEntries = Object.entries(commanderFiles).map(([slug, filename]) => ({
  semanticId: `commander.shared.${slug}`,
  family: 'commander',
  sourcePath: `assets/source/New assets/comander_ship/${filename}`,
  outputPath: `public/assets/generated/catalog/commanders/shared/${slug}.webp`,
  width: 512,
  height: 512,
  format: 'webp',
  quality: 91,
  trim: true,
  fit: 'contain',
  position: 'centre',
  withoutEnlargement: false,
}));

const processingPlan = JSON.parse(await read('assets/manifests/runtime-processing-plan.json'));
processingPlan.entries = [
  ...processingPlan.entries.filter(
    (entry) => entry.family !== 'defense' && entry.family !== 'commander',
  ),
  ...defenseEntries,
  ...commanderEntries,
].sort((left, right) => left.outputPath.localeCompare(right.outputPath));
await writeJson('assets/manifests/runtime-processing-plan.json', processingPlan);

const bindingManifest = JSON.parse(await read('assets/manifests/mechanical-runtime-bindings.json'));
const finalBindings = [...defenseEntries, ...commanderEntries].map((entry) => ({
  mechanicalId: entry.semanticId,
  category: entry.family,
  sourceSemanticId: entry.semanticId,
  sourcePath: entry.sourcePath,
  runtimeSemanticId: entry.semanticId,
  outputPath: entry.outputPath,
  width: entry.width,
  height: entry.height,
}));
bindingManifest.entries = [
  ...bindingManifest.entries.filter(
    (entry) => entry.category !== 'defense' && entry.category !== 'commander',
  ),
  ...finalBindings,
].sort((left, right) => left.mechanicalId.localeCompare(right.mechanicalId));
await writeJson('assets/manifests/mechanical-runtime-bindings.json', bindingManifest);

let manifest = await read('src/assets/completeMechanicalAssetManifest.ts');
manifest = manifest.replace(
  "import {\n  COMPLETE_DEFENSE_CATALOGS,\n  getCompleteDefenseClass,\n} from '../simulation/units/completeDefenseCatalog';",
  "import { COMPLETE_DEFENSE_CATALOGS } from '../simulation/units/completeDefenseCatalog';",
);
manifest = manifest.replace(
  "import type { CompleteDefenseClass, CompleteShipClass } from '../simulation/units/types';",
  "import type { CompleteShipClass } from '../simulation/units/types';",
);
manifest = manifest.replace(
  "          category: 'defense' as const,\n          sourcePath:",
  "          category: 'defense' as const,\n          runtimeSemanticId: definition.id,\n          sourcePath:",
);
manifest = manifest.replace(
  "        category: 'commander' as const,\n        sourcePath:",
  "        category: 'commander' as const,\n        runtimeSemanticId: definition.id,\n        sourcePath:",
);
manifest = manifest.replace(
  /\nconst DEFENSE_COMPATIBILITY_ASSETS:[\s\S]*?\n};\n\nfunction resolveBuildingCompatibilityAsset/,
  '\nfunction resolveBuildingCompatibilityAsset',
);
manifest = manifest.replace(
  /\nfunction resolveDefenseCompatibilityAsset[\s\S]*?\n}\n\nfunction resolveCommanderCompatibilityAsset[\s\S]*?\n}\n\nexport interface MechanicalAssetResolution/,
  '\nexport interface MechanicalAssetResolution',
);
manifest = manifest.replace(
  "    resolveShipCompatibilityAsset(mechanicalId) ??\n    resolveDefenseCompatibilityAsset(mechanicalId) ??\n    resolveCommanderCompatibilityAsset(mechanicalId);",
  '    resolveShipCompatibilityAsset(mechanicalId);',
);
await write('src/assets/completeMechanicalAssetManifest.ts', manifest);

await write('src/assets/planetIndustryRuntimeAssets.ts', `import { resolveCompleteMechanicalAsset } from './completeMechanicalAssetManifest';
import { getFactionMechanicalRoles } from '../simulation/factions/factionMechanicalRoles';
import { parseMechanicalId } from '../simulation/factions/mechanicalIds';
import { resolveCanonicalBuildingId } from '../simulation/planet/buildingAliases';
import type { FactionId, PlanetZoneId } from '../simulation/planet/types';

export type BuildingPresentationRole =
  | 'command'
  | 'metal-extractor'
  | 'crystal-refinery'
  | 'gas-extractor'
  | 'power-plant'
  | 'research-lab'
  | 'shipyard'
  | 'sensor-array';

const ZONE_TERRAINS: Readonly<Record<PlanetZoneId, string>> = {
  resource: new URL('../../assets/source/faction-delivery-v1/territories/resource-terrain.png', import.meta.url).href,
  industry: new URL('../../assets/source/faction-delivery-v1/territories/industry-terrain.png', import.meta.url).href,
  military: new URL('../../assets/source/faction-delivery-v1/territories/military-terrain.png', import.meta.url).href,
};

export function getBuildingPresentationRole(buildingId: string): BuildingPresentationRole {
  const canonicalBuildingId = resolveCanonicalBuildingId(buildingId);
  const parsed = parseMechanicalId(canonicalBuildingId);
  if (parsed?.kind !== 'building' || parsed.factionId === 'shared') return 'command';
  const buildings = getFactionMechanicalRoles(parsed.factionId).buildings;
  if (canonicalBuildingId === buildings.metal) return 'metal-extractor';
  if (canonicalBuildingId === buildings.crystal) return 'crystal-refinery';
  if (canonicalBuildingId === buildings.gas) return 'gas-extractor';
  if (canonicalBuildingId === buildings.power) return 'power-plant';
  if (canonicalBuildingId === buildings.laboratory) return 'research-lab';
  if (canonicalBuildingId === buildings.shipyard) return 'shipyard';
  if (
    canonicalBuildingId === buildings.sensorGrid ||
    canonicalBuildingId === buildings.defenseIndustry
  ) return 'sensor-array';
  return 'command';
}

export function getBuildingSheetUrl(_factionId: FactionId, buildingId: string): string {
  return resolveCompleteMechanicalAsset(resolveCanonicalBuildingId(buildingId)).asset?.atlasUrl ?? '';
}

export function getBuildingSheetFrame(_level: number, _maxLevel: number): number {
  return 0;
}

export function getZoneTerrainUrl(zoneId: PlanetZoneId): string {
  return ZONE_TERRAINS[zoneId];
}

export function getDefensePresentationArtUrl(_factionId: FactionId, unitId: string): string {
  return resolveCompleteMechanicalAsset(unitId).asset?.atlasUrl ?? '';
}
`);

let production = await read('src/ui/productionScreen.ts');
production = production.replace(
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
`function setUnitArtwork(element: HTMLElement, definition: UnitDefinition): void {
  const complete = resolveCompleteMechanicalAsset(definition.assetId).asset;
  if (complete?.layout === 'image') {
    applyMechanicalAssetArtwork(element, complete);
    return;
  }
  const fallback = getFactionMechanicalAsset(definition.assetId);
  if (fallback === undefined) return;
  applyMechanicalAssetArtwork(element, fallback);
}`,
);
await write('src/ui/productionScreen.ts', production);

let presentation = await read('src/ui/developmentPresentation.ts');
presentation = presentation.replace(
  "  getDefensePresentationArtUrl,\n",
  '',
);
presentation = presentation.replace(
  "import { getUnitsByKind } from '../simulation/units/catalog';\n",
  '',
);
presentation = presentation.replace(
  /\nfunction setSheetArtwork[\s\S]*?\n}\n\nfunction applyPlanetPresentation/,
  '\nfunction applyPlanetPresentation',
);
presentation = presentation.replace(
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
    '',
);
await write('src/ui/developmentPresentation.ts', presentation);

let doctrine = await read('src/ui/commandDoctrineScreen.ts');
doctrine = doctrine.replace(
  "import '../styles/commandDoctrine.css';",
  "import '../styles/commandDoctrine.css';\nimport { resolveCompleteMechanicalAsset } from '../assets/completeMechanicalAssetManifest';\nimport { applyMechanicalAssetArtwork } from '../assets/runtimeMechanicalAssets';",
);
doctrine = doctrine.replace(
`        const card = document.createElement('article');
        card.className = \`commander-ship-card\${active ? ' is-active' : ''}\${owned ? ' is-owned' : ''}\`;
        const status = active`,
`        const card = document.createElement('article');
        card.className = \`commander-ship-card\${active ? ' is-active' : ''}\${owned ? ' is-owned' : ''}\${!owned && unlocked ? ' is-available' : ''}\${!unlocked ? ' is-locked' : ''}\`;
        card.dataset.mechanicalId = definition.id;
        const status = active`,
);
doctrine = doctrine.replace(
`        card.innerHTML = \`
          <header><strong>\${definition.name}</strong><span>\${status}</span></header>
          <p>\${definition.description}</p>
          <dl><div><dt>Адмирал</dt><dd>\${definition.requiredAdmiralLevel}</dd></div><div><dt>Верфь</dt><dd>\${definition.requiredShipyardLevel}</dd></div><div><dt>Способность</dt><dd>\${definition.commanderAbility?.name ?? '—'}</dd></div></dl>
          <small>\${definition.commanderAbility?.description ?? ''}</small>
        \`;
        return card;`,
`        const art = document.createElement('div');
        art.className = 'commander-ship-card__art';
        art.setAttribute('role', 'img');
        art.setAttribute('aria-label', definition.name);
        const asset = resolveCompleteMechanicalAsset(definition.id).asset;
        if (asset !== undefined) applyMechanicalAssetArtwork(art, asset);
        card.innerHTML = \`
          <header><strong>\${definition.name}</strong><span>\${status}</span></header>
          <p>\${definition.description}</p>
          <dl><div><dt>Адмирал</dt><dd>\${definition.requiredAdmiralLevel}</dd></div><div><dt>Верфь</dt><dd>\${definition.requiredShipyardLevel}</dd></div><div><dt>Способность</dt><dd>\${definition.commanderAbility?.name ?? '—'}</dd></div></dl>
          <small>\${definition.commanderAbility?.description ?? ''}</small>
        \`;
        card.prepend(art);
        return card;`,
);
await write('src/ui/commandDoctrineScreen.ts', doctrine);

let doctrineCss = await read('src/styles/commandDoctrine.css');
doctrineCss = doctrineCss.replace(
  '.commander-ship-card { padding: 16px; border:',
  '.commander-ship-card { overflow: hidden; padding: 16px; border:',
);
doctrineCss = doctrineCss.replace(
  '.commander-ship-card.is-owned { opacity: 1; border-color: var(--border-strong); }',
  `.commander-ship-card.is-owned, .commander-ship-card.is-available { opacity: 1; border-color: var(--border-strong); }
.commander-ship-card.is-locked { filter: saturate(.55); }
.commander-ship-card__art { height: 190px; margin: -16px -16px 14px; background-position: center; background-repeat: no-repeat; }`,
);
await write('src/styles/commandDoctrine.css', doctrineCss);

let contactSheet = await read('scripts/assets/contact-sheet.mjs');
contactSheet = contactSheet.replace(
  "console.log('Generated building, technology and ship contact sheets.');",
  `for (const faction of ['aegis', 'synod', 'veyra']) {
  const entries = bindings.entries
    .filter((entry) =>
      entry.category === 'defense' && entry.mechanicalId.startsWith(\`defense.\${faction}.\`),
    )
    .sort((left, right) => left.mechanicalId.localeCompare(right.mechanicalId));
  if (entries.length !== 9) {
    throw new Error(\`Expected 9 defense entries for \${faction}, found \${entries.length}\`);
  }
  await renderSheet(entries, \`docs/assets/qa/defenses/\${faction}\`, 3, 3, 190);
}
const commanderEntries = bindings.entries
  .filter((entry) => entry.category === 'commander')
  .sort((left, right) => left.mechanicalId.localeCompare(right.mechanicalId));
if (commanderEntries.length !== 13) {
  throw new Error(\`Expected 13 Commander entries, found \${commanderEntries.length}\`);
}
await renderSheet(commanderEntries, 'docs/assets/qa/commanders/shared', 5, 3, 190);
console.log('Generated complete catalog contact sheets.');`,
);
await write('scripts/assets/contact-sheet.mjs', contactSheet);

let check = await read('scripts/assets/check.mjs');
check = check.replace(
  "const generatedIds = new Set(runtimeManifest.assets.map((asset) => asset.semanticId));",
  `const defenseBindings = bindings.entries.filter((entry) => entry.category === 'defense');
const commanderBindings = bindings.entries.filter((entry) => entry.category === 'commander');
if (defenseBindings.length !== 27) {
  errors.push(\`Expected 27 defense runtime bindings, found \${defenseBindings.length}.\`);
}
if (commanderBindings.length !== 13) {
  errors.push(\`Expected 13 Commander runtime bindings, found \${commanderBindings.length}.\`);
}
if (bindings.entries.length !== 217) {
  errors.push(\`Expected 217 complete mechanical bindings, found \${bindings.entries.length}.\`);
}
const expectedRuntimeIds = new Set(
  bindings.entries.map((entry) => entry.runtimeSemanticId),
);
if (expectedRuntimeIds.size !== 173) {
  errors.push(\`Expected 173 unique runtime semantic IDs, found \${expectedRuntimeIds.size}.\`);
}
if (processingPlan.entries.length !== 173) {
  errors.push(\`Expected 173 processing entries, found \${processingPlan.entries.length}.\`);
}
if (runtimeManifest.assets.length !== 173) {
  errors.push(\`Expected 173 generated runtime textures, found \${runtimeManifest.assets.length}.\`);
}
const generatedIds = new Set(runtimeManifest.assets.map((asset) => asset.semanticId));`,
);
check = check.replace(
  "if (generatedIds.has('technology.shared.qa-edges-dark-light')) {",
  `for (const binding of [...defenseBindings, ...commanderBindings]) {
  if (!generatedIds.has(binding.runtimeSemanticId)) {
    errors.push(\`Missing final generated runtime asset: \${binding.mechanicalId}\`);
  }
}
for (const generatedId of generatedIds) {
  if (!expectedRuntimeIds.has(generatedId)) {
    errors.push(\`Orphan generated runtime asset: \${generatedId}\`);
  }
}
if (generatedIds.has('technology.shared.qa-edges-dark-light')) {`,
);
await write('scripts/assets/check.mjs', check);

let pipelineTest = await read('tests/assets/assetPipelineConfig.test.ts');
pipelineTest = pipelineTest.replace(
  "  it('records deterministic building, technology and ship processing while keeping atlases empty', () => {\n    expect(processingPlan.schemaVersion).toBe(1);\n    expect(processingPlan.entries).toHaveLength(133);\n    expect(processingPlan.entries.filter((entry) => entry.family === 'building')).toHaveLength(72);\n    expect(processingPlan.entries.filter((entry) => entry.family === 'technology')).toHaveLength(22);\n    expect(processingPlan.entries.filter((entry) => entry.family === 'ship')).toHaveLength(39);\n    expect(new Set(processingPlan.entries.map((entry) => entry.semanticId)).size).toBe(133);\n    expect(atlasPlan).toEqual({ schemaVersion: 1, atlases: [] });\n  });",
  "  it('records all 173 catalog derivatives while keeping atlases empty', () => {\n    expect(processingPlan.schemaVersion).toBe(1);\n    expect(processingPlan.entries).toHaveLength(173);\n    expect(processingPlan.entries.filter((entry) => entry.family === 'building')).toHaveLength(72);\n    expect(processingPlan.entries.filter((entry) => entry.family === 'technology')).toHaveLength(22);\n    expect(processingPlan.entries.filter((entry) => entry.family === 'ship')).toHaveLength(39);\n    expect(processingPlan.entries.filter((entry) => entry.family === 'defense')).toHaveLength(27);\n    expect(processingPlan.entries.filter((entry) => entry.family === 'commander')).toHaveLength(13);\n    expect(new Set(processingPlan.entries.map((entry) => entry.semanticId)).size).toBe(173);\n    expect(atlasPlan).toEqual({ schemaVersion: 1, atlases: [] });\n  });",
);
await write('tests/assets/assetPipelineConfig.test.ts', pipelineTest);

let runtimeTest = await read('tests/assets/runtimeMechanicalAssets.test.ts');
runtimeTest = runtimeTest.replace(
  "import { COMPLETE_SHIP_CATALOGS } from '../../src/simulation/units/completeShipCatalog';",
  "import { COMPLETE_SHIP_CATALOGS } from '../../src/simulation/units/completeShipCatalog';\nimport { COMPLETE_DEFENSE_CATALOGS } from '../../src/simulation/units/completeDefenseCatalog';\nimport { COMPLETE_COMMANDER_SHIP_CATALOG } from '../../src/simulation/units/completeCommanderShipCatalog';",
);
runtimeTest = runtimeTest.replace(
  '\n});\n',
  `
  it('resolves every defense and Commander through unique generated art', () => {
    const defenses = Object.values(COMPLETE_DEFENSE_CATALOGS).flat();
    expect(defenses).toHaveLength(27);
    const defenseUrls = new Set<string>();
    for (const definition of defenses) {
      const resolution = resolveCompleteMechanicalAsset(definition.id);
      expect(resolution.source, definition.id).toBe('complete-manifest');
      expect(resolution.asset?.layout, definition.id).toBe('image');
      expect(resolution.asset?.atlasUrl, definition.id).toContain(
        '/assets/generated/catalog/defenses/',
      );
      defenseUrls.add(resolution.asset?.atlasUrl ?? '');
    }
    expect(defenseUrls).toHaveLength(27);

    expect(COMPLETE_COMMANDER_SHIP_CATALOG).toHaveLength(13);
    const commanderUrls = new Set<string>();
    for (const definition of COMPLETE_COMMANDER_SHIP_CATALOG) {
      const resolution = resolveCompleteMechanicalAsset(definition.id);
      expect(resolution.source, definition.id).toBe('complete-manifest');
      expect(resolution.asset?.layout, definition.id).toBe('image');
      expect(resolution.asset?.atlasUrl, definition.id).toContain(
        '/assets/generated/catalog/commanders/shared/',
      );
      commanderUrls.add(resolution.asset?.atlasUrl ?? '');
    }
    expect(commanderUrls).toHaveLength(13);
  });

  it('closes the 217 mechanical ID and 173 runtime image gate', () => {
    const definitions = [
      ...Object.values(COMPLETE_BUILDING_CATALOGS).flat(),
      ...Object.values(COMPLETE_RESEARCH_CATALOGS).flat(),
      ...Object.values(COMPLETE_SHIP_CATALOGS).flat(),
      ...Object.values(COMPLETE_DEFENSE_CATALOGS).flat(),
      ...COMPLETE_COMMANDER_SHIP_CATALOG,
    ];
    expect(definitions).toHaveLength(217);
    const urls = new Set<string>();
    for (const definition of definitions) {
      const resolution = resolveCompleteMechanicalAsset(definition.id);
      expect(resolution.source, definition.id).toBe('complete-manifest');
      expect(resolution.asset, definition.id).toBeDefined();
      urls.add(resolution.asset?.atlasUrl ?? '');
    }
    expect(urls).toHaveLength(173);
  });
});
`,
);
await write('tests/assets/runtimeMechanicalAssets.test.ts', runtimeTest);

let completeManifestTest = await read('tests/assets/completeMechanicalAssetManifest.test.ts');
completeManifestTest = completeManifestTest.replace(
  "  it('binds Commander source assets while retaining processed runtime fallbacks', () => {\n    const resolution = resolveCompleteMechanicalAsset('commander.shared.annihilator');\n    expect(resolution.source).toBe('current-runtime-fallback');\n    expect(resolution.asset?.id).toBe('commander.shared.annihilator');",
  "  it('binds Commander source assets to generated runtime art', () => {\n    const resolution = resolveCompleteMechanicalAsset('commander.shared.annihilator');\n    expect(resolution.source).toBe('complete-manifest');\n    expect(resolution.asset?.id).toBe('commander.shared.annihilator');\n    expect(resolution.asset?.atlasUrl).toContain('/assets/generated/catalog/commanders/shared/annihilator.webp');",
);
completeManifestTest = completeManifestTest.replace(
  "  it('does not invent source provenance for an unknown Commander ID', () => {\n    const resolution = resolveCompleteMechanicalAsset('commander.shared.unknown-future');\n    expect(resolution.source).toBe('current-runtime-fallback');\n    expect(resolution.asset?.id).toBe('commander.shared.unknown-future');",
  "  it('does not invent art or source provenance for an unknown Commander ID', () => {\n    const resolution = resolveCompleteMechanicalAsset('commander.shared.unknown-future');\n    expect(resolution.source).toBe('missing');\n    expect(resolution.asset).toBeUndefined();",
);
await write('tests/assets/completeMechanicalAssetManifest.test.ts', completeManifestTest);

let defenseTest = await read('tests/simulation/completeDefenseCatalog.test.ts');
defenseTest = defenseTest.replace(
  "  it.each(FACTIONS)('binds every %s defense to source provenance and runtime fallback', (factionId) => {\n    for (const defense of COMPLETE_DEFENSE_CATALOGS[factionId]) {\n      const resolution = resolveCompleteMechanicalAsset(defense.assetId);\n      expect(resolution.source).toBe('current-runtime-fallback');\n      expect(resolution.asset?.id).toBe(defense.id);",
  "  it.each(FACTIONS)('binds every %s defense to source provenance and generated art', (factionId) => {\n    for (const defense of COMPLETE_DEFENSE_CATALOGS[factionId]) {\n      const resolution = resolveCompleteMechanicalAsset(defense.assetId);\n      expect(resolution.source).toBe('complete-manifest');\n      expect(resolution.asset?.id).toBe(defense.id);\n      expect(resolution.asset?.layout).toBe('image');\n      expect(resolution.asset?.atlasUrl).toContain(`/assets/generated/catalog/defenses/${factionId}/`);",
);
await write('tests/simulation/completeDefenseCatalog.test.ts', defenseTest);

let commanderTest = await read('tests/simulation/completeCommanderShipCatalog.test.ts');
commanderTest = commanderTest.replace(
  "      expect(resolution.source).toBe('current-runtime-fallback');\n      expect(resolution.asset?.id).toBe(definition.id);",
  "      expect(resolution.source).toBe('complete-manifest');\n      expect(resolution.asset?.id).toBe(definition.id);\n      expect(resolution.asset?.layout).toBe('image');\n      expect(resolution.asset?.atlasUrl).toContain('/assets/generated/catalog/commanders/shared/');",
);
await write('tests/simulation/completeCommanderShipCatalog.test.ts', commanderTest);

let industryTest = await read('src/assets/planetIndustryRuntimeAssets.test.ts');
industryTest = industryTest.replace(
  "    expect(getDefensePresentationArtUrl('aegis', 'defense.aegis.missile-battery')).toContain('aegis_missile_battery_sheet.png');",
  "    expect(getDefensePresentationArtUrl('aegis', 'defense.aegis.plasma-turret')).toContain('/assets/generated/catalog/defenses/aegis/plasma-turret.webp');",
);
await write('src/assets/planetIndustryRuntimeAssets.test.ts', industryTest);

const status = JSON.parse(await read('docs/project-status.json'));
status.lastMergedPr = 104;
status.lastMergeSha = 'ba207dac57d3f6bf66559d074cf38abf54cdc12c';
status.activePr = 105;
status.nextPrAfterActive = 106;
status.nextPrKind = 'audit';
status.currentMilestone = 'Complete catalog runtime integration; next batch requires a fresh audit';
status.currentBatch.auditStatus = 'completed-on-pr105-merge';
status.currentBatch.implementationPrs = [102, 103, 104, 105];
status.currentBatch.status = 'closing-on-pr105-merge';
status.currentBatch.nextWorkItem = null;
status.sourceAssetIntake.catalogArt.status = 'runtime-integrated-173-textures';
status.deliveredDomains.push('173 processed catalog runtime images with 217 complete mechanical bindings');
status.activeDelivery = [
  'PR #105 final defence and Commander integration',
  '217-ID combined runtime asset gate',
  'ASSET-RUNTIME-INTEGRATION-01 archive and closure',
];
status.knownLimitations = status.knownLimitations.filter(
  (item) =>
    !item.includes('approved catalog source art') &&
    !item.includes('runtime processing and atlas plans') &&
    !item.includes('three historical runtime modules'),
);
status.knownLimitations.unshift(
  'two historical runtime modules still directly reference licensed source libraries for non-catalog Galaxy/map and faction identity presentation',
);
await writeJson('docs/project-status.json', status);

const currentAuditPath = 'docs/audits/current-batch-audit.md';
let audit = await read(currentAuditPath);
audit = audit.replace(
  '**Status:** accepted implementation contract after Audit PR #101 merges',
  '**Status:** completed by implementation PRs #102–#105; final merge SHA `PR105_MERGE_SHA_PENDING`',
);
audit += `

## 13. Batch completion record

- Audit PR #101: \`2eb5d4996bb24cb7fa48305bb010e48a1263c465\`;
- PR #102 buildings: \`43471d9ab2a6527e3337f1e73e507d85e2d8e094\`;
- PR #103 technologies: \`b47ec8df9abc58d1ce455e3bf6ee1279d2e0d9d0\`;
- PR #104 ships: \`ba207dac57d3f6bf66559d074cf38abf54cdc12c\`;
- PR #105 defences, Commanders and closure: \`PR105_MERGE_SHA_PENDING\`;
- final coverage: 217 mechanical IDs resolving through 173 generated runtime images;
- no save migration, mechanic change, balance change or bot-policy change;
- next implementation batch is prohibited until a fresh Audit PR is accepted.
`;
await write(currentAuditPath, audit);
await write('docs/audits/completed/asset-runtime-integration-01.md', audit);

await write('docs/audits/batch-history.md', `# Audited implementation batch history

This file is append-only for completed batches. An active row may be updated until its final implementation PR closes the batch.

| Batch ID | Complexity | Audit PR | Implementation PRs | Outcome | Archived audit |
|---|---|---:|---|---|---|
| \`ASSET-RUNTIME-INTEGRATION-01\` | Medium | #101 · \`2eb5d4996bb24cb7fa48305bb010e48a1263c465\` | #102 · \`43471d9ab2a6527e3337f1e73e507d85e2d8e094\`; #103 · \`b47ec8df9abc58d1ce455e3bf6ee1279d2e0d9d0\`; #104 · \`ba207dac57d3f6bf66559d074cf38abf54cdc12c\`; #105 · \`PR105_MERGE_SHA_PENDING\` | completed; 217 IDs / 173 runtime images; no mechanics or persistence divergence | \`docs/audits/completed/asset-runtime-integration-01.md\` |

## Recording rules

- never rewrite a completed historical row to hide failed or superseded work;
- every new implementation batch requires its own accepted Audit PR;
- record exact merge SHAs, divergence and archived audit path.
`);

await write('docs/audits/current-execution-state.md', `# Current execution state

**Updated:** 2026-07-26  
**Safe to continue:** yes, but implementation is blocked pending a fresh Audit PR

| Field | Current value |
|---|---|
| Protocol PR | #100 — audit-first autonomous delivery protocol — merged |
| Completed audit | #101 — \`ASSET-RUNTIME-INTEGRATION-01\` |
| Completed implementation PRs | #102, #103, #104 and #105 |
| Final PR merge SHA | \`PR105_MERGE_SHA_PENDING\` |
| Batch outcome | 217 complete mechanical IDs → 173 generated runtime images |
| Save/gameplay divergence | none |
| Active implementation PR | none after #105 merges |
| Exact next action | create a fresh Audit PR for the next coherent roadmap batch before implementation |
| Blockers | no implementation contract exists for the next batch |

## Completed batch checkpoints

| Checkpoint | State |
|---|---|
| Audit contract | complete and archived |
| Building implementation | complete in #102 |
| Technology implementation | complete in #103 |
| Ship implementation | complete in #104 |
| Defence/Commander implementation | complete in #105 |
| Combined 217-ID gate | complete |
| Generated set | exactly 173 textures |
| Batch archive | \`docs/audits/completed/asset-runtime-integration-01.md\` |

## Recovery rule

Do not start Universe navigation or another implementation item directly. Read the roadmap, current project status and completed audit, then create a dedicated Audit PR for the next batch.
`);

await write('docs/17-continuation-guide.md', `# AI Continuation Guide

**Status:** Accepted  
**Updated:** 2026-07-26  
**Baseline:** merged PR #105, merge SHA \`PR105_MERGE_SHA_PENDING\`

## Repository

\`ratoker-jpg/stellar-empires\` · default branch \`main\` · GitHub Pages deployment.

GitHub history and current \`main\` override stale prose, prior chat memory and abandoned branches.

## Required startup reading

1. \`AGENTS.md\`
2. \`docs/28-audit-first-autonomous-delivery-protocol.md\`
3. \`docs/audits/current-execution-state.md\`
4. \`docs/audits/completed/asset-runtime-integration-01.md\`
5. this document
6. \`docs/project-status.json\`
7. \`docs/27-playable-game-roadmap-v5.md\`
8. \`docs/26-universe-galaxy-solar-system-navigation-contract.md\`
9. latest merged pull requests and actual \`main\`

## Current authoritative state

- #89–#100 delivered the complete mechanical baseline, research, roadmap, asset pipeline and audit protocol;
- #101 audited the four-PR catalog runtime integration batch;
- #102 integrated 72 building images;
- #103 integrated 22 technology concepts across 66 faction IDs;
- #104 integrated 39 ordinary ship images;
- #105 integrated 27 defence and 13 Commander images and closed the batch;
- all 217 complete mechanical IDs resolve through 173 generated WebP runtime images;
- save schema remains v13 and gameplay, balance and bot policy were not changed by the visual batch.

## Remaining limitations

- the Universe pack remains oversized source intake;
- Universe, Galaxy and Solar-system runtime navigation is not implemented;
- the full confirmed interface/navigation shell remains incomplete;
- alliance, solar-war, final Gate, balance, browser E2E, performance and release gates remain open.

## Immediate route

The next action is a new dedicated Audit PR for the next coherent roadmap batch. No implementation starts before that audit is accepted.

## Invariants

- no \`Math.random()\` or system clock in simulation decisions;
- UI never owns canonical game state;
- bots and player use the same commands and validators;
- bots cannot read hidden state;
- events execute once;
- resources cannot become negative;
- fleets cannot exist in two locations;
- incompatible state changes require migration or deterministic alias resolution;
- source assets do not become runtime assets until processed, registered and tested;
- stable mechanical IDs survive visual replacement;
- project-specific \`docs/25-*\` rules override historical Nemexia endgame logic.
`);

await write('docs/changes/pr105-defense-commander-runtime-assets.md', `# PR #105 — defence and Commander runtime assets

- generated 27 approved defence WebPs at 384×384 and 13 Commander WebPs at 512×512;
- routed defence production and Admiral roster cards through complete mechanical IDs;
- added explicit locked, available, owned and active Commander presentation states;
- removed complete defence and Commander fallback resolution paths;
- closed the combined 217-mechanical-ID / 173-runtime-image gate;
- generated dark/light QA sheets, enforced budgets and rejected orphan outputs;
- archived and closed \`ASSET-RUNTIME-INTEGRATION-01\`;
- no mechanics, balance, bot-policy or save-schema changes.
`);

await rm(path.join(root, 'scripts/automation/implement-pr105.mjs'), { force: true });
