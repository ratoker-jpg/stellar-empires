import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import {
  buildAuditManifest,
  loadConfig,
  loadJson,
  REPOSITORY_ROOT,
  resolveRepositoryPath,
  walkFiles,
} from './lib.mjs';

function stable(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function textFiles(root) {
  const result = [];
  async function visit(current) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const next = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(next);
      else if (entry.isFile() && /\.(?:ts|tsx|js|mjs|css|html)$/.test(entry.name)) result.push(next);
    }
  }
  await visit(root);
  return result;
}

function duplicates(values) {
  const seen = new Set();
  return values.filter((value) => {
    if (seen.has(value)) return true;
    seen.add(value);
    return false;
  });
}

const config = await loadConfig();
const committed = await loadJson(config.auditManifestPath);
const fresh = await buildAuditManifest(config);
const errors = [];
if (stable(committed) !== stable(fresh)) {
  errors.push('Asset audit manifest is stale. Run npm run assets:audit and commit the result.');
}

const newAssets = fresh.assets.filter((asset) => asset.path.startsWith('assets/source/New assets/'));
const universe = fresh.assets.filter((asset) => asset.classification === 'source-intake');
if (newAssets.length !== config.expectedIntake.newAssetsCount) {
  errors.push(`Expected ${config.expectedIntake.newAssetsCount} New assets files, found ${newAssets.length}.`);
}
if (universe.length !== config.expectedIntake.universeCount) {
  errors.push(`Expected ${config.expectedIntake.universeCount} Universe intake files, found ${universe.length}.`);
}
if (universe.some((asset) => !asset.path.startsWith('assets/source/universe-navigation/'))) {
  errors.push('Universe originals are not fully contained by assets/source/universe-navigation/.');
}
const oldUniverseFiles = await walkFiles('public/assets/universe', config.supportedExtensions);
if (oldUniverseFiles.length > 0) {
  errors.push(`Expected no public/assets/universe files, found ${oldUniverseFiles.length}.`);
}

for (const scope of [newAssets, universe]) {
  const ids = new Set();
  for (const asset of scope) {
    if (asset.semanticId === null) continue;
    if (ids.has(asset.semanticId)) errors.push(`Duplicate semantic asset ID: ${asset.semanticId}`);
    ids.add(asset.semanticId);
    if (!/^[a-f0-9]{64}$/.test(asset.sha256)) errors.push(`Invalid checksum for ${asset.path}`);
    if (asset.width === null || asset.height === null) errors.push(`Missing dimensions for ${asset.path}`);
  }
}

const generated = fresh.assets.filter((asset) => asset.classification === 'generated-runtime');
const generatedBytes = generated.reduce((sum, asset) => sum + asset.bytes, 0);
const generatedDecoded = generated.reduce((sum, asset) => sum + (asset.decodedBytes ?? 0), 0);
if (generated.length > config.budgets.generatedRuntimeTextureCount) {
  errors.push(`Generated texture count budget exceeded: ${generated.length}.`);
}
if (generatedBytes > config.budgets.generatedRuntimeTotalBytes) {
  errors.push(`Generated transfer budget exceeded: ${generatedBytes} bytes.`);
}
if (generatedDecoded > config.budgets.generatedRuntimeDecodedBytes) {
  errors.push(`Generated decoded-memory budget exceeded: ${generatedDecoded} bytes.`);
}
for (const asset of generated) {
  if ((asset.width ?? 0) * (asset.height ?? 0) > config.budgets.singleRuntimeTexturePixels) {
    errors.push(`Single texture pixel budget exceeded: ${asset.path}`);
  }
}

const processingPlan = await loadJson(config.processingPlanPath);
const atlasPlan = await loadJson(config.atlasPlanPath);
const mechanicalBindings = await loadJson(config.mechanicalBindingsPath);
const spaceBindings = await loadJson(config.spaceMapBindingsPath);
const runtimeManifest = await loadJson(config.runtimeManifestPath);
if (processingPlan.schemaVersion !== 1 || !Array.isArray(processingPlan.entries)) {
  errors.push('Invalid runtime processing plan.');
}
if (atlasPlan.schemaVersion !== 1 || !Array.isArray(atlasPlan.atlases)) {
  errors.push('Invalid runtime atlas plan.');
}
if (mechanicalBindings.schemaVersion !== 1 || !Array.isArray(mechanicalBindings.entries)) {
  errors.push('Invalid mechanical runtime bindings.');
}
if (spaceBindings.schemaVersion !== 1 || !Array.isArray(spaceBindings.entries)) {
  errors.push('Invalid Space Map runtime bindings.');
}
if (runtimeManifest.schemaVersion !== 1 || !Array.isArray(runtimeManifest.assets)) {
  errors.push('Invalid generated runtime manifest.');
}

const buildingBindings = mechanicalBindings.entries.filter((entry) => entry.category === 'building');
const technologyBindings = mechanicalBindings.entries.filter((entry) => entry.category === 'technology');
const shipBindings = mechanicalBindings.entries.filter((entry) => entry.category === 'ship');
const defenseBindings = mechanicalBindings.entries.filter((entry) => entry.category === 'defense');
const commanderBindings = mechanicalBindings.entries.filter((entry) => entry.category === 'commander');
if (buildingBindings.length !== 72) errors.push(`Expected 72 building runtime bindings, found ${buildingBindings.length}.`);
if (technologyBindings.length !== 66) errors.push(`Expected 66 technology runtime bindings, found ${technologyBindings.length}.`);
if (new Set(technologyBindings.map((entry) => entry.runtimeSemanticId)).size !== 22) {
  errors.push('Expected 22 technology runtime concepts.');
}
if (shipBindings.length !== 39) errors.push(`Expected 39 ship runtime bindings, found ${shipBindings.length}.`);
if (new Set(shipBindings.map((entry) => entry.runtimeSemanticId)).size !== 39) {
  errors.push('Complete ships do not have 39 unique runtime semantic IDs.');
}
if (defenseBindings.length !== 27) errors.push(`Expected 27 defense runtime bindings, found ${defenseBindings.length}.`);
if (commanderBindings.length !== 13) errors.push(`Expected 13 Commander runtime bindings, found ${commanderBindings.length}.`);
if (mechanicalBindings.entries.length !== 217) {
  errors.push(`Expected 217 complete mechanical bindings, found ${mechanicalBindings.entries.length}.`);
}
const mechanicalRuntimeIds = new Set(mechanicalBindings.entries.map((entry) => entry.runtimeSemanticId));
if (mechanicalRuntimeIds.size !== 173) errors.push(`Expected 173 unique mechanical runtime IDs, found ${mechanicalRuntimeIds.size}.`);

const familySpecs = {
  'galaxy-nebula': { count: 20, width: 256, height: 256 },
  'system-star': { count: 12, width: 128, height: 128 },
  'sun-thumb': { count: 12, width: 128, height: 128 },
  'sun-detail': { count: 12, width: 512, height: 512 },
  planet: { count: 24, width: 256, height: 256 },
  asteroid: { count: 8, width: 192, height: 192 },
  debris: { count: 6, width: 192, height: 192 },
  renegade: { count: 6, width: 256, height: 256 },
  marker: { count: 2, width: 128, height: 128 },
};
if (spaceBindings.entries.length !== config.spaceMapBudgets.runtimeTextures) {
  errors.push(`Expected ${config.spaceMapBudgets.runtimeTextures} Space Map bindings, found ${spaceBindings.entries.length}.`);
}
const uniqueSourcePaths = new Set(spaceBindings.entries.map((entry) => entry.sourcePath));
if (uniqueSourcePaths.size !== config.spaceMapBudgets.sourceFiles) {
  errors.push(`Expected ${config.spaceMapBudgets.sourceFiles} explicit Space Map sources, found ${uniqueSourcePaths.size}.`);
}
for (const field of ['runtimeSemanticId', 'outputPath', 'textureKey']) {
  const repeated = duplicates(spaceBindings.entries.map((entry) => entry[field]));
  if (repeated.length > 0) errors.push(`Duplicate Space Map ${field}: ${[...new Set(repeated)].join(', ')}`);
}
const sourceByPath = new Map(universe.map((asset) => [asset.path, asset]));
for (const [family, spec] of Object.entries(familySpecs)) {
  const entries = spaceBindings.entries.filter((entry) => entry.family === family);
  if (entries.length !== spec.count) {
    errors.push(`Expected ${spec.count} ${family} entries, found ${entries.length}.`);
  }
  for (const entry of entries) {
    if (entry.width !== spec.width || entry.height !== spec.height) {
      errors.push(`Invalid ${family} dimensions for ${entry.runtimeSemanticId}.`);
    }
  }
}
for (const binding of spaceBindings.entries) {
  const source = sourceByPath.get(binding.sourcePath);
  if (source === undefined) {
    errors.push(`Missing explicit Space Map source: ${binding.sourcePath}`);
  } else if (source.sha256 !== binding.sourceSha256) {
    errors.push(`Space Map source checksum changed: ${binding.sourcePath}`);
  }
  if (!binding.outputPath.startsWith('public/assets/generated/universe/')) {
    errors.push(`Space Map output escapes generated Universe root: ${binding.outputPath}`);
  }
}
for (const sourcePath of sourceByPath.keys()) {
  if (!uniqueSourcePaths.has(sourcePath)) errors.push(`Unbound Universe source: ${sourcePath}`);
}

const spaceRuntimeIds = new Set(spaceBindings.entries.map((entry) => entry.runtimeSemanticId));
const expectedRuntimeIds = new Set([...mechanicalRuntimeIds, ...spaceRuntimeIds]);
if (processingPlan.entries.length !== expectedRuntimeIds.size) {
  errors.push(`Expected ${expectedRuntimeIds.size} processing entries, found ${processingPlan.entries.length}.`);
}
if (runtimeManifest.assets.length !== expectedRuntimeIds.size) {
  errors.push(`Expected ${expectedRuntimeIds.size} generated runtime textures, found ${runtimeManifest.assets.length}.`);
}
const planIds = processingPlan.entries.map((entry) => entry.semanticId);
const generatedIds = runtimeManifest.assets.map((asset) => asset.semanticId);
if (duplicates(planIds).length > 0) errors.push('Runtime processing plan contains duplicate semantic IDs.');
if (duplicates(processingPlan.entries.map((entry) => entry.outputPath)).length > 0) {
  errors.push('Runtime processing plan contains duplicate output paths.');
}
if (duplicates(generatedIds).length > 0) errors.push('Generated runtime manifest contains duplicate semantic IDs.');
for (const expectedId of expectedRuntimeIds) {
  if (!planIds.includes(expectedId)) errors.push(`Missing processing entry: ${expectedId}`);
  if (!generatedIds.includes(expectedId)) errors.push(`Missing generated runtime asset: ${expectedId}`);
}
for (const generatedId of generatedIds) {
  if (!expectedRuntimeIds.has(generatedId)) errors.push(`Orphan generated runtime asset: ${generatedId}`);
}

const runtimeById = new Map(runtimeManifest.assets.map((asset) => [asset.semanticId, asset]));
const spaceOutputs = spaceBindings.entries.map((entry) => runtimeById.get(entry.runtimeSemanticId)).filter(Boolean);
const spaceTransfer = spaceOutputs.reduce((sum, asset) => sum + asset.bytes, 0);
const spaceDecoded = spaceOutputs.reduce((sum, asset) => sum + asset.width * asset.height * 4, 0);
if (spaceTransfer > config.spaceMapBudgets.transferBytes) {
  errors.push(`Universe transfer budget exceeded: ${spaceTransfer} bytes.`);
}
if (spaceDecoded !== config.spaceMapBudgets.decodedBytes) {
  errors.push(`Universe decoded size changed: expected ${config.spaceMapBudgets.decodedBytes}, found ${spaceDecoded}.`);
}
const decodedFor = (entries) => entries.reduce((sum, entry) => sum + entry.width * entry.height * 4, 0);
const universeView = decodedFor(spaceBindings.entries.filter((entry) => entry.viewGroup === 'universe'));
const galaxyView = decodedFor(spaceBindings.entries.filter((entry) => entry.viewGroup === 'galaxy'));
const solarEntries = spaceBindings.entries.filter((entry) => entry.viewGroup === 'solar-system');
const solarDetails = solarEntries.filter((entry) => entry.family === 'sun-detail');
const solarFixed = solarEntries.filter((entry) => entry.family !== 'sun-detail');
const solarView = decodedFor(solarFixed) + Math.max(...solarDetails.map((entry) => entry.width * entry.height * 4));
if (universeView > config.spaceMapBudgets.universeViewDecodedBytes) {
  errors.push(`Universe active-view decoded budget exceeded: ${universeView} bytes.`);
}
if (galaxyView > config.spaceMapBudgets.galaxyViewDecodedBytes) {
  errors.push(`Galaxy active-view decoded budget exceeded: ${galaxyView} bytes.`);
}
if (solarView > config.spaceMapBudgets.solarSystemViewDecodedBytes) {
  errors.push(`Solar-system active-view decoded budget exceeded: ${solarView} bytes.`);
}

const auditedGeneratedPaths = new Set(generated.map((asset) => asset.path));
const manifestGeneratedPaths = new Set(runtimeManifest.assets.map((asset) => asset.outputPath));
for (const outputPath of auditedGeneratedPaths) {
  if (!manifestGeneratedPaths.has(outputPath)) errors.push(`Stale generated runtime file: ${outputPath}`);
}
for (const outputPath of manifestGeneratedPaths) {
  if (!auditedGeneratedPaths.has(outputPath)) errors.push(`Missing generated runtime file: ${outputPath}`);
}
if (generatedIds.includes('technology.shared.qa-edges-dark-light')) {
  errors.push('Technology QA reference was registered as runtime art.');
}

for (const target of [
  config.runtimeTypeScriptManifestPath,
  config.spaceMapRuntimeTypeScriptManifestPath,
  config.auditReportPath,
]) {
  try {
    await readFile(resolveRepositoryPath(target), 'utf8');
  } catch {
    errors.push(`Missing generated artifact: ${target}`);
  }
}

const sourceFiles = await textFiles(path.join(REPOSITORY_ROOT, 'src'));
const provenanceMetadataAllowlist = new Set([
  'src/assets/completeMechanicalAssetManifest.ts',
  ...config.legacyDirectSourceReferences,
]);
for (const file of sourceFiles) {
  const repositoryPath = path.relative(REPOSITORY_ROOT, file).split(path.sep).join('/');
  const content = await readFile(file, 'utf8');
  if (content.includes('assets/source/') && !provenanceMetadataAllowlist.has(repositoryPath)) {
    errors.push(`Production source directly references provenance assets: ${repositoryPath}`);
  }
  if (
    content.includes('assets/source/universe-navigation') ||
    content.includes('public/assets/universe') ||
    content.includes('assets/universe/')
  ) {
    errors.push(`Production source directly references unprocessed Universe intake: ${repositoryPath}`);
  }
}
const bootScene = await readFile(resolveRepositoryPath('src/game/scenes/BootScene.ts'), 'utf8');
if (/spaceMapAsset|generated\/universe/i.test(bootScene)) {
  errors.push('BootScene eagerly references the new Universe asset family.');
}

if (errors.length > 0) {
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `Asset pipeline check passed for ${fresh.summary.totalFiles} audited files; ` +
    `Universe transfer ${spaceTransfer} bytes, decoded ${spaceDecoded} bytes.`,
  );
}
