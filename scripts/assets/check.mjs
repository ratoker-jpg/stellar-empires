import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import {
  buildAuditManifest,
  loadConfig,
  loadJson,
  REPOSITORY_ROOT,
  resolveRepositoryPath,
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

const config = await loadConfig();
const committed = await loadJson(config.auditManifestPath);
const fresh = await buildAuditManifest(config);
const errors = [];
if (stable(committed) !== stable(fresh)) {
  errors.push('Asset audit manifest is stale. Run npm run assets:audit and commit the result.');
}

const newAssets = fresh.assets.filter((asset) => asset.path.startsWith('assets/source/New assets/'));
const universe = fresh.assets.filter((asset) => asset.path.startsWith(`${config.universeSourceRoot}/`));
const universePublicIntake = fresh.assets.filter((asset) => asset.path.startsWith('public/assets/universe/'));
if (newAssets.length !== config.expectedIntake.newAssetsCount) {
  errors.push(`Expected ${config.expectedIntake.newAssetsCount} New assets files, found ${newAssets.length}.`);
}
if (universe.length !== config.expectedIntake.universeCount) {
  errors.push(`Expected ${config.expectedIntake.universeCount} Universe source files, found ${universe.length}.`);
}
if (universePublicIntake.length !== 0) {
  errors.push(`Unprocessed Universe files remain under public/assets/universe: ${universePublicIntake.length}.`);
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
const bindings = await loadJson(config.mechanicalBindingsPath);
const runtimeManifest = await loadJson(config.runtimeManifestPath);
const spaceMapBindings = await loadJson(config.spaceMapBindingsPath);
if (processingPlan.schemaVersion !== 1 || !Array.isArray(processingPlan.entries)) {
  errors.push('Invalid runtime processing plan.');
}
if (atlasPlan.schemaVersion !== 1 || !Array.isArray(atlasPlan.atlases)) {
  errors.push('Invalid runtime atlas plan.');
}
if (bindings.schemaVersion !== 1 || !Array.isArray(bindings.entries)) {
  errors.push('Invalid mechanical runtime bindings.');
}
if (runtimeManifest.schemaVersion !== 1 || !Array.isArray(runtimeManifest.assets)) {
  errors.push('Invalid generated runtime manifest.');
}
if (spaceMapBindings.schemaVersion !== 1 || !Array.isArray(spaceMapBindings.entries)) {
  errors.push('Invalid Space Map runtime bindings.');
}
const buildingBindings = bindings.entries.filter((entry) => entry.category === 'building');
if (buildingBindings.length !== 72) {
  errors.push(`Expected 72 building runtime bindings, found ${buildingBindings.length}.`);
}
const technologyBindings = bindings.entries.filter((entry) => entry.category === 'technology');
if (technologyBindings.length !== 66) {
  errors.push(`Expected 66 technology runtime bindings, found ${technologyBindings.length}.`);
}
const uniqueTechnologyRuntimeIds = new Set(
  technologyBindings.map((entry) => entry.runtimeSemanticId),
);
if (uniqueTechnologyRuntimeIds.size !== 22) {
  errors.push(`Expected 22 technology runtime concepts, found ${uniqueTechnologyRuntimeIds.size}.`);
}
const shipBindings = bindings.entries.filter((entry) => entry.category === 'ship');
if (shipBindings.length !== 39) {
  errors.push(`Expected 39 ship runtime bindings, found ${shipBindings.length}.`);
}
if (new Set(shipBindings.map((entry) => entry.runtimeSemanticId)).size !== 39) {
  errors.push('Complete ships do not have 39 unique runtime semantic IDs.');
}
const defenseBindings = bindings.entries.filter((entry) => entry.category === 'defense');
const commanderBindings = bindings.entries.filter((entry) => entry.category === 'commander');
if (defenseBindings.length !== 27) {
  errors.push(`Expected 27 defense runtime bindings, found ${defenseBindings.length}.`);
}
if (commanderBindings.length !== 13) {
  errors.push(`Expected 13 Commander runtime bindings, found ${commanderBindings.length}.`);
}
if (bindings.entries.length !== 217) {
  errors.push(`Expected 217 complete mechanical bindings, found ${bindings.entries.length}.`);
}
const expectedRuntimeIds = new Set(
  bindings.entries.map((entry) => entry.runtimeSemanticId),
);
if (expectedRuntimeIds.size !== 173) {
  errors.push(`Expected 173 unique runtime semantic IDs, found ${expectedRuntimeIds.size}.`);
}
if (spaceMapBindings.entries.length !== 102) {
  errors.push(`Expected 102 Space Map runtime bindings, found ${spaceMapBindings.entries.length}.`);
}
if (processingPlan.entries.length !== 275) {
  errors.push(`Expected 275 processing entries, found ${processingPlan.entries.length}.`);
}
if (runtimeManifest.assets.length !== 275) {
  errors.push(`Expected 275 generated runtime textures, found ${runtimeManifest.assets.length}.`);
}
const generatedIds = new Set(runtimeManifest.assets.map((asset) => asset.semanticId));
const spaceMapIds = new Set(spaceMapBindings.entries.map((entry) => entry.runtimeSemanticId));
if (spaceMapIds.size !== 102) errors.push(`Expected 102 unique Space Map semantic IDs, found ${spaceMapIds.size}.`);
const allowedGeneratedIds = new Set([...expectedRuntimeIds, ...spaceMapIds]);
for (const binding of buildingBindings) {
  if (!generatedIds.has(binding.runtimeSemanticId)) {
    errors.push(`Missing generated building runtime asset: ${binding.mechanicalId}`);
  }
}
for (const binding of technologyBindings) {
  if (!generatedIds.has(binding.runtimeSemanticId)) {
    errors.push(`Missing generated technology runtime asset: ${binding.mechanicalId}`);
  }
}
for (const binding of shipBindings) {
  if (!generatedIds.has(binding.runtimeSemanticId)) {
    errors.push(`Missing generated ship runtime asset: ${binding.mechanicalId}`);
  }
}
for (const binding of [...defenseBindings, ...commanderBindings]) {
  if (!generatedIds.has(binding.runtimeSemanticId)) {
    errors.push(`Missing final generated runtime asset: ${binding.mechanicalId}`);
  }
}
for (const binding of spaceMapBindings.entries) {
  if (!generatedIds.has(binding.runtimeSemanticId)) errors.push(`Missing generated Space Map asset: ${binding.runtimeSemanticId}`);
}
for (const generatedId of generatedIds) {
  if (!allowedGeneratedIds.has(generatedId)) {
    errors.push(`Orphan generated runtime asset: ${generatedId}`);
  }
}
const sourceAuditByPath = new Map(fresh.assets.map((asset) => [asset.path, asset]));
const outputPaths = new Set();
for (const binding of spaceMapBindings.entries) {
  const source = sourceAuditByPath.get(binding.sourcePath);
  if (source === undefined) errors.push(`Missing Space Map source: ${binding.sourcePath}`);
  else if (source.sha256 !== binding.sourceSha256) errors.push(`Space Map source checksum changed: ${binding.sourcePath}`);
  if (outputPaths.has(binding.outputPath)) errors.push(`Duplicate Space Map output path: ${binding.outputPath}`);
  outputPaths.add(binding.outputPath);
}
const universeRuntime = runtimeManifest.assets.filter((asset) => asset.outputPath.startsWith('public/assets/generated/universe/'));
const universeBytes = universeRuntime.reduce((sum, asset) => sum + asset.bytes, 0);
const universeDecoded = universeRuntime.reduce((sum, asset) => sum + asset.width * asset.height * 4, 0);
if (universeRuntime.length !== 102) errors.push(`Expected 102 generated Universe textures, found ${universeRuntime.length}.`);
if (universeBytes > config.spaceMapBudgets.totalTransferBytes) errors.push(`Universe transfer budget exceeded: ${universeBytes} bytes.`);
if (universeDecoded > config.spaceMapBudgets.totalDecodedBytes) errors.push(`Universe decoded budget exceeded: ${universeDecoded} bytes.`);
const decodedById = new Map(universeRuntime.map((asset) => [asset.semanticId, asset.width * asset.height * 4]));
const groupDecoded = (group) => spaceMapBindings.entries
  .filter((entry) => entry.viewGroup === group)
  .reduce((sum, entry) => sum + (decodedById.get(entry.runtimeSemanticId) ?? 0), 0);
const solarSunMax = Math.max(...spaceMapBindings.entries.filter((entry) => entry.family === 'universe-sun' && entry.runtimeSemanticId.endsWith('.detail')).map((entry) => decodedById.get(entry.runtimeSemanticId) ?? 0));
const solarSlotMax = Math.max(...spaceMapBindings.entries.filter((entry) => ['universe-planet', 'universe-asteroid', 'universe-debris', 'universe-renegade'].includes(entry.family)).map((entry) => decodedById.get(entry.runtimeSemanticId) ?? 0));
const solarMarkers = spaceMapBindings.entries.filter((entry) => entry.family === 'universe-marker').reduce((sum, entry) => sum + (decodedById.get(entry.runtimeSemanticId) ?? 0), 0);
const activeViewDecoded = {
  universe: groupDecoded('universe'),
  galaxy: groupDecoded('galaxy'),
  'solar-system': solarSunMax + solarSlotMax * 24 + solarMarkers,
};
for (const [group, limit] of Object.entries(config.spaceMapBudgets.viewDecodedBytes)) {
  const decoded = activeViewDecoded[group] ?? Number.POSITIVE_INFINITY;
  if (decoded > limit) errors.push(`${group} decoded budget exceeded: ${decoded} bytes.`);
}
const qaFiles = (await readdir(resolveRepositoryPath(config.spaceMapQaRoot))).filter((name) => name.endsWith('.png'));
if (qaFiles.length !== config.spaceMapQaContactSheetCount) errors.push(`Expected ${config.spaceMapQaContactSheetCount} Universe QA contact sheets, found ${qaFiles.length}.`);
const bootScene = await readFile(resolveRepositoryPath('src/game/scenes/BootScene.ts'), 'utf8');
if (bootScene.includes('spaceMapAssets') || bootScene.includes('generated/universe')) errors.push('BootScene eagerly references the Universe runtime family.');
if (generatedIds.has('technology.shared.qa-edges-dark-light')) {
  errors.push('Technology QA reference was registered as runtime art.');
}
try {
  await readFile(resolveRepositoryPath(config.runtimeTypeScriptManifestPath), 'utf8');
  await readFile(resolveRepositoryPath(config.spaceMapTypeScriptManifestPath), 'utf8');
} catch {
  errors.push(`Missing generated TypeScript runtime manifest: ${config.runtimeTypeScriptManifestPath}`);
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
  if (content.includes('assets/universe/') || content.includes('assets/source/universe-navigation/')) {
    errors.push(`Production source directly references unprocessed Universe source art: ${repositoryPath}`);
  }
}

try {
  await readFile(resolveRepositoryPath(config.auditReportPath), 'utf8');
} catch {
  errors.push(`Missing generated audit report: ${config.auditReportPath}`);
}

if (errors.length > 0) {
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Asset pipeline check passed for ${fresh.summary.totalFiles} audited files.`);
}
