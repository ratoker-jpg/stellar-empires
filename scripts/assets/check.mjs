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
const universe = fresh.assets.filter((asset) => asset.classification === 'source-intake');
if (newAssets.length !== config.expectedIntake.newAssetsCount) {
  errors.push(`Expected ${config.expectedIntake.newAssetsCount} New assets files, found ${newAssets.length}.`);
}
if (universe.length !== config.expectedIntake.universeCount) {
  errors.push(`Expected ${config.expectedIntake.universeCount} Universe intake files, found ${universe.length}.`);
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
const buildingBindings = bindings.entries.filter((entry) => entry.category === 'building');
if (buildingBindings.length !== 72) {
  errors.push(`Expected 72 building runtime bindings, found ${buildingBindings.length}.`);
}
const generatedIds = new Set(runtimeManifest.assets.map((asset) => asset.semanticId));
for (const binding of buildingBindings) {
  if (!generatedIds.has(binding.runtimeSemanticId)) {
    errors.push(`Missing generated building runtime asset: ${binding.mechanicalId}`);
  }
}
try {
  await readFile(resolveRepositoryPath(config.runtimeTypeScriptManifestPath), 'utf8');
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
  if (content.includes('assets/universe/')) {
    errors.push(`Production source directly references unprocessed Universe intake: ${repositoryPath}`);
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
