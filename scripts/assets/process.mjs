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
  writeText,
} from './lib.mjs';

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1] ?? fallback;
}

function generatedModule(outputs) {
  const entries = [...outputs]
    .sort((left, right) => left.semanticId.localeCompare(right.semanticId))
    .map((asset) =>
      `  ${JSON.stringify(asset.semanticId)}: { outputPath: ${JSON.stringify(asset.outputPath)}, width: ${asset.width}, height: ${asset.height} },`
    )
    .join('\n');
  return `export interface GeneratedRuntimeAsset {
  readonly outputPath: string;
  readonly width: number;
  readonly height: number;
}

export const RUNTIME_ASSET_MANIFEST = {
${entries}
} as const satisfies Readonly<Record<string, GeneratedRuntimeAsset>>;
`;
}

function generatedSpaceMapModule(bindings, outputs) {
  const outputById = new Map(outputs.map((asset) => [asset.semanticId, asset]));
  const entries = [...bindings]
    .sort((left, right) => left.runtimeSemanticId.localeCompare(right.runtimeSemanticId))
    .map((binding) => {
      const output = outputById.get(binding.runtimeSemanticId);
      if (output === undefined) throw new Error(`Missing processed Space Map asset: ${binding.runtimeSemanticId}`);
      return `  ${JSON.stringify(binding.runtimeSemanticId)}: { outputPath: ${JSON.stringify(output.outputPath)}, width: ${output.width}, height: ${output.height}, family: ${JSON.stringify(binding.family)}, viewGroup: ${JSON.stringify(binding.viewGroup)} },`;
    })
    .join('\n');
  const groups = ['universe', 'galaxy', 'solar-system']
    .map((group) => {
      const ids = bindings
        .filter((binding) => binding.viewGroup === group)
        .map((binding) => binding.runtimeSemanticId)
        .sort()
        .map((id) => JSON.stringify(id))
        .join(', ');
      return `  ${JSON.stringify(group)}: [${ids}],`;
    })
    .join('\n');
  return `export type SpaceMapTextureGroup = 'universe' | 'galaxy' | 'solar-system';

export interface GeneratedSpaceMapAsset {
  readonly outputPath: string;
  readonly width: number;
  readonly height: number;
  readonly family: string;
  readonly viewGroup: SpaceMapTextureGroup;
}

export const SPACE_MAP_ASSET_MANIFEST = {
${entries}
} as const satisfies Readonly<Record<string, GeneratedSpaceMapAsset>>;

export const SPACE_MAP_TEXTURE_GROUPS = {
${groups}
} as const satisfies Readonly<Record<SpaceMapTextureGroup, readonly string[]>>;
`;
}

function resizePipeline(pipeline, entry) {
  const isUniverseRuntime = entry.outputPath.startsWith('public/assets/generated/universe/');
  const contentScale = entry.contentScale ?? (isUniverseRuntime ? 0.9 : 1);
  if (!(contentScale > 0 && contentScale <= 1)) {
    throw new Error(`Invalid content scale for ${entry.semanticId}: ${contentScale}`);
  }
  if (contentScale === 1) {
    return pipeline.resize({
      width: entry.width,
      height: entry.height,
      fit: entry.fit ?? 'contain',
      position: entry.position ?? 'centre',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      withoutEnlargement: entry.withoutEnlargement ?? false,
    });
  }
  const innerWidth = Math.max(1, Math.floor(entry.width * contentScale));
  const innerHeight = Math.max(1, Math.floor(entry.height * contentScale));
  const horizontalPadding = entry.width - innerWidth;
  const verticalPadding = entry.height - innerHeight;
  const left = Math.floor(horizontalPadding / 2);
  const top = Math.floor(verticalPadding / 2);
  return pipeline
    .resize({
      width: innerWidth,
      height: innerHeight,
      fit: entry.fit ?? 'contain',
      position: entry.position ?? 'centre',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      withoutEnlargement: entry.withoutEnlargement ?? false,
    })
    .extend({
      left,
      right: horizontalPadding - left,
      top,
      bottom: verticalPadding - top,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
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
  if (entry.trim === true) {
    pipeline = pipeline.trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } });
  }
  pipeline = resizePipeline(pipeline, entry);
  if (entry.format === 'png') {
    pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: false });
  } else if (entry.format === 'webp') {
    pipeline = pipeline.webp({
      quality: entry.quality ?? 88,
      alphaQuality: 100,
      smartSubsample: false,
    });
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
await writeText(config.runtimeTypeScriptManifestPath, generatedModule(outputs));
if (config.spaceMapBindingsPath !== undefined && config.spaceMapTypeScriptManifestPath !== undefined) {
  const spaceMapBindings = await loadJson(config.spaceMapBindingsPath);
  if (spaceMapBindings.schemaVersion !== 1 || !Array.isArray(spaceMapBindings.entries)) {
    throw new Error(`Invalid Space Map bindings: ${config.spaceMapBindingsPath}`);
  }
  await writeText(
    config.spaceMapTypeScriptManifestPath,
    generatedSpaceMapModule(spaceMapBindings.entries, outputs),
  );
}
console.log(`Processed ${outputs.length} runtime asset derivatives from ${path.basename(planPath)}.`);
