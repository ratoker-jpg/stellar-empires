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
import { stat } from 'node:fs/promises';

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1] ?? fallback;
}

const config = await loadConfig();
const planPath = argument('--plan', config.atlasPlanPath);
const plan = await loadJson(planPath);
if (plan.schemaVersion !== 1 || !Array.isArray(plan.atlases)) {
  throw new Error(`Invalid atlas plan: ${planPath}`);
}

const allowedSources = [config.generatedRuntimeRoot, ...config.auditRoots.map((root) => root.path)];
const manifests = [];
for (const atlas of [...plan.atlases].sort((left, right) => left.outputPath.localeCompare(right.outputPath))) {
  const outputPath = validatePlanPath(atlas.outputPath, [config.generatedRuntimeRoot], 'Atlas output');
  await ensureParent(outputPath);
  const composites = [];
  const frames = {};
  for (const frame of [...atlas.frames].sort((left, right) => left.semanticId.localeCompare(right.semanticId))) {
    const sourcePath = validatePlanPath(frame.sourcePath, allowedSources, 'Atlas source');
    const input = await sharp(resolveRepositoryPath(sourcePath))
      .resize({
        width: frame.width,
        height: frame.height,
        fit: frame.fit ?? 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
    composites.push({ input, left: frame.x, top: frame.y });
    frames[frame.semanticId] = {
      x: frame.x,
      y: frame.y,
      width: frame.width,
      height: frame.height,
    };
  }

  let pipeline = sharp({
    create: {
      width: atlas.width,
      height: atlas.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite(composites);
  if (atlas.format === 'png') pipeline = pipeline.png({ compressionLevel: 9 });
  else if (atlas.format === 'webp') pipeline = pipeline.webp({ quality: atlas.quality ?? 90, alphaQuality: 100 });
  else throw new Error(`Unsupported atlas format: ${atlas.format}`);
  await pipeline.toFile(resolveRepositoryPath(outputPath));
  manifests.push({
    atlasId: atlas.atlasId,
    outputPath,
    width: atlas.width,
    height: atlas.height,
    bytes: (await stat(resolveRepositoryPath(outputPath))).size,
    sha256: await sha256File(resolveRepositoryPath(outputPath)),
    frames,
  });
}

await writeStableJson(`${config.generatedRuntimeRoot}/runtime-atlas-manifest.json`, {
  schemaVersion: 1,
  atlases: manifests,
});
console.log(`Built ${manifests.length} atlases.`);
