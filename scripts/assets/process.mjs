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

function generatedSpaceMapModule(bindings, outputById) {
  const entries = [...bindings]
    .sort((left, right) => left.runtimeSemanticId.localeCompare(right.runtimeSemanticId))
    .map((binding) => {
      const output = outputById.get(binding.runtimeSemanticId);
      if (output === undefined) {
        throw new Error(`Missing processed Space Map output: ${binding.runtimeSemanticId}`);
      }
      return `  ${JSON.stringify(binding.runtimeSemanticId)}: { textureKey: ${JSON.stringify(binding.textureKey)}, family: ${JSON.stringify(binding.family)}, viewGroup: ${JSON.stringify(binding.viewGroup)}, outputPath: ${JSON.stringify(output.outputPath)}, width: ${output.width}, height: ${output.height}, bytes: ${output.bytes}, decodedBytes: ${output.width * output.height * 4}, sha256: ${JSON.stringify(output.sha256)} },`;
    })
    .join('\n');
  const idsFor = (predicate) =>
    bindings
      .filter(predicate)
      .map((entry) => entry.runtimeSemanticId)
      .sort()
      .map((id) => JSON.stringify(id))
      .join(', ');
  return `export type GeneratedSpaceMapViewGroup = 'universe' | 'galaxy' | 'solar-system';

export type GeneratedSpaceMapFamily =
  | 'galaxy-nebula'
  | 'system-star'
  | 'sun-thumb'
  | 'sun-detail'
  | 'planet'
  | 'asteroid'
  | 'debris'
  | 'renegade'
  | 'marker';

export interface GeneratedSpaceMapAsset {
  readonly textureKey: string;
  readonly family: GeneratedSpaceMapFamily;
  readonly viewGroup: GeneratedSpaceMapViewGroup;
  readonly outputPath: string;
  readonly width: number;
  readonly height: number;
  readonly bytes: number;
  readonly decodedBytes: number;
  readonly sha256: string;
}

export const SPACE_MAP_ASSET_MANIFEST = {
${entries}
} as const satisfies Readonly<Record<string, GeneratedSpaceMapAsset>>;

export const SPACE_MAP_ASSET_GROUPS = {
  universe: [${idsFor((entry) => entry.viewGroup === 'universe')}],
  galaxy: [${idsFor((entry) => entry.viewGroup === 'galaxy')}],
} as const;

export const SPACE_MAP_ASSET_FAMILIES = {
  sunDetail: [${idsFor((entry) => entry.family === 'sun-detail')}],
  planet: [${idsFor((entry) => entry.family === 'planet')}],
  asteroid: [${idsFor((entry) => entry.family === 'asteroid')}],
  debris: [${idsFor((entry) => entry.family === 'debris')}],
  renegade: [${idsFor((entry) => entry.family === 'renegade')}],
  marker: [${idsFor((entry) => entry.family === 'marker')}],
} as const;
`;
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

const spaceMapBindings = await loadJson(config.spaceMapBindingsPath);
if (spaceMapBindings.schemaVersion !== 1 || !Array.isArray(spaceMapBindings.entries)) {
  throw new Error(`Invalid Space Map binding manifest: ${config.spaceMapBindingsPath}`);
}
const outputById = new Map(outputs.map((output) => [output.semanticId, output]));
await writeText(
  config.spaceMapRuntimeTypeScriptManifestPath,
  generatedSpaceMapModule(spaceMapBindings.entries, outputById),
);
console.log(`Processed ${outputs.length} runtime asset derivatives from ${path.basename(planPath)}.`);
