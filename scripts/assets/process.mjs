import path from 'node:path';
import { stat } from 'node:fs/promises';
import sharp from 'sharp';
import {
  ensureParent,
  loadConfig,
  loadJson,
  resolveRepositoryPath,
  sha256File,
  validatePlanPath,
  writeStableJson,
} from './lib.mjs';

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1] ?? fallback;
}

const config = await loadConfig();
const planPath = argument('--plan', config.processingPlanPath);
const plan = await loadJson(planPath);
if (plan.schemaVersion !== 1 || !Array.isArray(plan.entries)) {
  throw new Error(`Invalid processing plan: ${planPath}`);
}

const allowedSources = config.auditRoots.map((root) => root.path);
const outputs = [];
for (const entry of [...plan.entries].sort((left, right) => left.outputPath.localeCompare(right.outputPath))) {
  const sourcePath = validatePlanPath(entry.sourcePath, allowedSources, 'Source path');
  const outputPath = validatePlanPath(entry.outputPath, [config.generatedRuntimeRoot], 'Output path');
  if (entry.width <= 0 || entry.height <= 0) throw new Error(`Invalid target size for ${entry.semanticId}`);
  await ensureParent(outputPath);

  let pipeline = sharp(resolveRepositoryPath(sourcePath), { animated: false }).rotate();
  if (entry.trim === true) pipeline = pipeline.trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } });
  pipeline = pipeline.resize({
    width: entry.width,
    height: entry.height,
    fit: entry.fit ?? 'contain',
    position: entry.position ?? 'centre',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
    withoutEnlargement: entry.withoutEnlargement ?? false,
  });
  if (entry.format === 'png') {
    pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: false });
  } else if (entry.format === 'webp') {
    pipeline = pipeline.webp({ quality: entry.quality ?? 88, alphaQuality: 100, smartSubsample: false });
  } else {
    throw new Error(`Unsupported output format for ${entry.semanticId}: ${entry.format}`);
  }
  await pipeline.toFile(resolveRepositoryPath(outputPath));
  const metadata = await sharp(resolveRepositoryPath(outputPath)).metadata();
  outputs.push({
    semanticId: entry.semanticId,
    sourcePath,
    outputPath,
    format: metadata.format ?? entry.format,
    width: metadata.width ?? entry.width,
    height: metadata.height ?? entry.height,
    bytes: (await stat(resolveRepositoryPath(outputPath))).size,
    sha256: await sha256File(resolveRepositoryPath(outputPath)),
  });
}

await writeStableJson(config.runtimeManifestPath, {
  schemaVersion: 1,
  generatedRoot: config.generatedRuntimeRoot,
  assets: outputs,
});
console.log(`Processed ${outputs.length} runtime asset derivatives from ${path.basename(planPath)}.`);
