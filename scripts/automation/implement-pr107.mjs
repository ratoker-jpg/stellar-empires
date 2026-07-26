import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const resolve = (relativePath) => path.join(root, relativePath);
const read = (relativePath) => readFile(resolve(relativePath), 'utf8');
const write = async (relativePath, content) => {
  const target = resolve(relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content);
};
const writeJson = (relativePath, value) => write(relativePath, `${JSON.stringify(value, null, 2)}\n`);
const exists = async (relativePath) => {
  try {
    await stat(resolve(relativePath));
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
};
const sha256 = async (relativePath) =>
  createHash('sha256').update(await readFile(resolve(relativePath))).digest('hex');
const pad = (value) => String(value).padStart(2, '0');
const range = (count) => Array.from({ length: count }, (_, index) => index + 1);

function derivative({
  runtimeSemanticId,
  family,
  viewGroup,
  outputPath,
  textureKey,
  width,
  height,
  quality,
}) {
  return {
    runtimeSemanticId,
    family,
    viewGroup,
    outputPath,
    textureKey,
    width,
    height,
    format: 'webp',
    quality,
    trim: true,
    fit: 'contain',
    position: 'centre',
    withoutEnlargement: false,
  };
}

const sources = [
  ...range(20).map((variant) => {
    const suffix = pad(variant);
    return {
      sourceSemanticId: `universe.galaxy.nebula-${suffix}`,
      sourceRelativePath: `galaxies/galaxy.nebula-${suffix}.png`,
      derivatives: [
        derivative({
          runtimeSemanticId: `universe.galaxy.nebula-${suffix}`,
          family: 'galaxy-nebula',
          viewGroup: 'universe',
          outputPath: `public/assets/generated/universe/galaxies/nebula-${suffix}.webp`,
          textureKey: `space.universe.galaxy.nebula-${suffix}`,
          width: 256,
          height: 256,
          quality: 88,
        }),
      ],
    };
  }),
  ...range(12).map((variant) => {
    const suffix = pad(variant);
    return {
      sourceSemanticId: `universe.system-star.variant-${suffix}`,
      sourceRelativePath: `system-stars/system-star.variant-${suffix}.png`,
      derivatives: [
        derivative({
          runtimeSemanticId: `universe.system-star.variant-${suffix}`,
          family: 'system-star',
          viewGroup: 'galaxy',
          outputPath: `public/assets/generated/universe/system-stars/star-${suffix}.webp`,
          textureKey: `space.universe.system-star.variant-${suffix}`,
          width: 128,
          height: 128,
          quality: 88,
        }),
      ],
    };
  }),
  ...range(8).map((variant) => {
    const suffix = pad(variant);
    const base = `universe.sun.active-${suffix}`;
    return {
      sourceSemanticId: base,
      sourceRelativePath: `active-suns/active-sun.variant-${suffix}.png`,
      derivatives: [
        derivative({
          runtimeSemanticId: `${base}.thumb`,
          family: 'sun-thumb',
          viewGroup: 'galaxy',
          outputPath: `public/assets/generated/universe/suns/thumb/active-${suffix}.webp`,
          textureKey: `space.${base}.thumb`,
          width: 128,
          height: 128,
          quality: 90,
        }),
        derivative({
          runtimeSemanticId: `${base}.detail`,
          family: 'sun-detail',
          viewGroup: 'solar-system',
          outputPath: `public/assets/generated/universe/suns/detail/active-${suffix}.webp`,
          textureKey: `space.${base}.detail`,
          width: 512,
          height: 512,
          quality: 90,
        }),
      ],
    };
  }),
  ...range(2).map((variant) => {
    const suffix = pad(variant);
    const base = `universe.sun.protostar-${suffix}`;
    return {
      sourceSemanticId: base,
      sourceRelativePath: `protostars/protostar.variant-${suffix}.png`,
      derivatives: [
        derivative({
          runtimeSemanticId: `${base}.thumb`,
          family: 'sun-thumb',
          viewGroup: 'galaxy',
          outputPath: `public/assets/generated/universe/suns/thumb/protostar-${suffix}.webp`,
          textureKey: `space.${base}.thumb`,
          width: 128,
          height: 128,
          quality: 90,
        }),
        derivative({
          runtimeSemanticId: `${base}.detail`,
          family: 'sun-detail',
          viewGroup: 'solar-system',
          outputPath: `public/assets/generated/universe/suns/detail/protostar-${suffix}.webp`,
          textureKey: `space.${base}.detail`,
          width: 512,
          height: 512,
          quality: 90,
        }),
      ],
    };
  }),
  ...range(2).map((variant) => {
    const suffix = pad(variant);
    const base = `universe.sun.collapsed-${suffix}`;
    return {
      sourceSemanticId: base,
      sourceRelativePath: `stellar-remnants/stellar-remnant.variant-${suffix}.png`,
      derivatives: [
        derivative({
          runtimeSemanticId: `${base}.thumb`,
          family: 'sun-thumb',
          viewGroup: 'galaxy',
          outputPath: `public/assets/generated/universe/suns/thumb/collapsed-${suffix}.webp`,
          textureKey: `space.${base}.thumb`,
          width: 128,
          height: 128,
          quality: 90,
        }),
        derivative({
          runtimeSemanticId: `${base}.detail`,
          family: 'sun-detail',
          viewGroup: 'solar-system',
          outputPath: `public/assets/generated/universe/suns/detail/collapsed-${suffix}.webp`,
          textureKey: `space.${base}.detail`,
          width: 512,
          height: 512,
          quality: 90,
        }),
      ],
    };
  }),
  ...range(24).map((variant) => {
    const suffix = pad(variant);
    return {
      sourceSemanticId: `universe.planet.variant-${suffix}`,
      sourceRelativePath: `planets/planet.variant-${suffix}.png`,
      derivatives: [
        derivative({
          runtimeSemanticId: `universe.planet.variant-${suffix}`,
          family: 'planet',
          viewGroup: 'solar-system',
          outputPath: `public/assets/generated/universe/planets/planet-${suffix}.webp`,
          textureKey: `space.universe.planet.variant-${suffix}`,
          width: 256,
          height: 256,
          quality: 90,
        }),
      ],
    };
  }),
  ...range(8).map((variant) => {
    const suffix = pad(variant);
    return {
      sourceSemanticId: `universe.asteroid.variant-${suffix}`,
      sourceRelativePath: `asteroids/asteroid.variant-${suffix}.png`,
      derivatives: [
        derivative({
          runtimeSemanticId: `universe.object.asteroid-${suffix}`,
          family: 'asteroid',
          viewGroup: 'solar-system',
          outputPath: `public/assets/generated/universe/objects/asteroid-${suffix}.webp`,
          textureKey: `space.universe.object.asteroid-${suffix}`,
          width: 192,
          height: 192,
          quality: 88,
        }),
      ],
    };
  }),
  ...range(6).map((variant) => {
    const suffix = pad(variant);
    return {
      sourceSemanticId: `universe.debris-field.variant-${suffix}`,
      sourceRelativePath: `debris/debris.variant-${suffix}.png`,
      derivatives: [
        derivative({
          runtimeSemanticId: `universe.object.debris-${suffix}`,
          family: 'debris',
          viewGroup: 'solar-system',
          outputPath: `public/assets/generated/universe/objects/debris-${suffix}.webp`,
          textureKey: `space.universe.object.debris-${suffix}`,
          width: 192,
          height: 192,
          quality: 88,
        }),
      ],
    };
  }),
  ...range(6).map((variant) => {
    const suffix = pad(variant);
    return {
      sourceSemanticId: `universe.renegade-object.variant-${suffix}`,
      sourceRelativePath: `renegades/renegade.variant-${suffix}.png`,
      derivatives: [
        derivative({
          runtimeSemanticId: `universe.object.renegade-${suffix}`,
          family: 'renegade',
          viewGroup: 'solar-system',
          outputPath: `public/assets/generated/universe/objects/renegade-${suffix}.webp`,
          textureKey: `space.universe.object.renegade-${suffix}`,
          width: 256,
          height: 256,
          quality: 90,
        }),
      ],
    };
  }),
  {
    sourceSemanticId: 'universe.marker.generic-01',
    sourceRelativePath: 'markers/marker.variant-01.png',
    derivatives: [
      derivative({
        runtimeSemanticId: 'ui.mission.sun-attack',
        family: 'marker',
        viewGroup: 'solar-system',
        outputPath: 'public/assets/generated/universe/markers/sun-attack.webp',
        textureKey: 'space.ui.mission.sun-attack',
        width: 128,
        height: 128,
        quality: 90,
      }),
    ],
  },
  {
    sourceSemanticId: 'universe.marker.generic-02',
    sourceRelativePath: 'markers/marker.variant-02.png',
    derivatives: [
      derivative({
        runtimeSemanticId: 'ui.mission.sun-support',
        family: 'marker',
        viewGroup: 'solar-system',
        outputPath: 'public/assets/generated/universe/markers/sun-support.webp',
        textureKey: 'space.ui.mission.sun-support',
        width: 128,
        height: 128,
        quality: 90,
      }),
    ],
  },
];

if (sources.length !== 90) throw new Error(`Expected 90 Universe sources, found ${sources.length}`);

const sourceRows = [];
for (const source of sources) {
  const oldPath = `public/assets/universe/${source.sourceRelativePath}`;
  const newPath = `assets/source/universe-navigation/${source.sourceRelativePath}`;
  const oldExists = await exists(oldPath);
  const newExists = await exists(newPath);
  if (!oldExists && !newExists) throw new Error(`Missing Universe source: ${oldPath}`);
  if (oldExists && newExists) {
    const [oldSha, newSha] = await Promise.all([sha256(oldPath), sha256(newPath)]);
    if (oldSha !== newSha) throw new Error(`Conflicting source copies for ${source.sourceRelativePath}`);
    await rm(resolve(oldPath));
  } else if (oldExists) {
    await mkdir(path.dirname(resolve(newPath)), { recursive: true });
    const before = await sha256(oldPath);
    await rename(resolve(oldPath), resolve(newPath));
    const after = await sha256(newPath);
    if (before !== after) throw new Error(`Source bytes changed while moving ${source.sourceRelativePath}`);
  }
  sourceRows.push({
    ...source,
    sourcePath: newPath,
    sourceSha256: await sha256(newPath),
    sourceBytes: (await stat(resolve(newPath))).size,
  });
}
await rm(resolve('public/assets/universe'), { recursive: true, force: true });

const bindings = sourceRows.flatMap((source) =>
  source.derivatives.map((runtime) => ({
    sourceSemanticId: source.sourceSemanticId,
    sourcePath: source.sourcePath,
    sourceSha256: source.sourceSha256,
    sourceBytes: source.sourceBytes,
    runtimeSemanticId: runtime.runtimeSemanticId,
    outputPath: runtime.outputPath,
    textureKey: runtime.textureKey,
    family: runtime.family,
    viewGroup: runtime.viewGroup,
    width: runtime.width,
    height: runtime.height,
  })),
);
if (bindings.length !== 102) throw new Error(`Expected 102 Universe derivatives, found ${bindings.length}`);
bindings.sort((left, right) => left.runtimeSemanticId.localeCompare(right.runtimeSemanticId));

await writeJson('assets/manifests/space-map-runtime-bindings.json', {
  schemaVersion: 1,
  sourceRoot: 'assets/source/universe-navigation',
  runtimeRoot: 'public/assets/generated/universe',
  sourceFileCount: 90,
  runtimeTextureCount: 102,
  budgets: {
    transferBytes: 16_777_216,
    decodedBytes: 29_458_432,
    universeViewDecodedBytes: 8_388_608,
    galaxyViewDecodedBytes: 6_291_456,
    solarSystemViewDecodedBytes: 20_971_520,
  },
  entries: bindings,
});

const processingPlan = JSON.parse(await read('assets/manifests/runtime-processing-plan.json'));
const catalogEntries = processingPlan.entries.filter(
  (entry) =>
    !String(entry.outputPath).startsWith('public/assets/generated/universe/') &&
    !String(entry.family).startsWith('universe-'),
);
const universeEntries = sourceRows.flatMap((source) =>
  source.derivatives.map((runtime) => ({
    semanticId: runtime.runtimeSemanticId,
    family: `universe-${runtime.family}`,
    sourcePath: source.sourcePath,
    outputPath: runtime.outputPath,
    width: runtime.width,
    height: runtime.height,
    format: runtime.format,
    quality: runtime.quality,
    trim: runtime.trim,
    fit: runtime.fit,
    position: runtime.position,
    withoutEnlargement: runtime.withoutEnlargement,
  })),
);
processingPlan.entries = [...catalogEntries, ...universeEntries].sort((left, right) =>
  left.outputPath.localeCompare(right.outputPath),
);
await writeJson('assets/manifests/runtime-processing-plan.json', processingPlan);

const config = JSON.parse(await read('assets/manifests/asset-pipeline.config.json'));
config.classificationOverrides = [
  ...config.classificationOverrides.filter(
    (entry) =>
      entry.prefix !== 'public/assets/universe' &&
      entry.prefix !== 'assets/source/universe-navigation',
  ),
  {
    prefix: 'assets/source/universe-navigation',
    classification: 'source-intake',
  },
].sort((left, right) => left.prefix.localeCompare(right.prefix));
config.expectedIntake.universeCount = 90;
config.spaceMapBindingsPath = 'assets/manifests/space-map-runtime-bindings.json';
config.spaceMapRuntimeTypeScriptManifestPath =
  'src/assets/generated/spaceMapAssetManifest.generated.ts';
config.spaceMapBudgets = {
  sourceFiles: 90,
  runtimeTextures: 102,
  transferBytes: 16_777_216,
  decodedBytes: 29_458_432,
  universeViewDecodedBytes: 8_388_608,
  galaxyViewDecodedBytes: 6_291_456,
  solarSystemViewDecodedBytes: 20_971_520,
};
await writeJson('assets/manifests/asset-pipeline.config.json', config);

let lib = await read('scripts/assets/lib.mjs');
if (!lib.includes('function includesUniverseSegment')) {
  lib = lib.replace(
    'export function inferFamily(repositoryPath) {',
    `function includesUniverseSegment(repositoryPath, segment) {
  return (
    repositoryPath.includes(\`/universe/\${segment}/\`) ||
    repositoryPath.includes(\`/universe-navigation/\${segment}/\`)
  );
}

export function inferFamily(repositoryPath) {`,
  );
}
const replacements = [
  ["repositoryPath.includes('/universe/galaxies/')", "includesUniverseSegment(repositoryPath, 'galaxies')"],
  ["repositoryPath.includes('/universe/system-stars/')", "includesUniverseSegment(repositoryPath, 'system-stars')"],
  ["repositoryPath.includes('/universe/active-suns/')", "includesUniverseSegment(repositoryPath, 'active-suns')"],
  ["repositoryPath.includes('/universe/protostars/')", "includesUniverseSegment(repositoryPath, 'protostars')"],
  ["repositoryPath.includes('/universe/stellar-remnants/')", "includesUniverseSegment(repositoryPath, 'stellar-remnants')"],
  ["repositoryPath.includes('/universe/planets/')", "includesUniverseSegment(repositoryPath, 'planets')"],
  ["repositoryPath.includes('/universe/asteroids/')", "includesUniverseSegment(repositoryPath, 'asteroids')"],
  ["repositoryPath.includes('/universe/debris/')", "includesUniverseSegment(repositoryPath, 'debris')"],
  ["repositoryPath.includes('/universe/renegades/')", "includesUniverseSegment(repositoryPath, 'renegades')"],
  ["repositoryPath.includes('/universe/markers/')", "includesUniverseSegment(repositoryPath, 'markers')"],
];
for (const [before, after] of replacements) lib = lib.split(before).join(after);
await write('scripts/assets/lib.mjs', lib);

await write('scripts/assets/process.mjs', `import path from 'node:path';
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
      \`  \${JSON.stringify(asset.semanticId)}: { outputPath: \${JSON.stringify(asset.outputPath)}, width: \${asset.width}, height: \${asset.height} },\`
    )
    .join('\\n');
  return \`export interface GeneratedRuntimeAsset {
  readonly outputPath: string;
  readonly width: number;
  readonly height: number;
}

export const RUNTIME_ASSET_MANIFEST = {
\${entries}
} as const satisfies Readonly<Record<string, GeneratedRuntimeAsset>>;
\`;
}

function generatedSpaceMapModule(bindings, outputById) {
  const entries = [...bindings]
    .sort((left, right) => left.runtimeSemanticId.localeCompare(right.runtimeSemanticId))
    .map((binding) => {
      const output = outputById.get(binding.runtimeSemanticId);
      if (output === undefined) {
        throw new Error(\`Missing processed Space Map output: \${binding.runtimeSemanticId}\`);
      }
      return \`  \${JSON.stringify(binding.runtimeSemanticId)}: { textureKey: \${JSON.stringify(binding.textureKey)}, family: \${JSON.stringify(binding.family)}, viewGroup: \${JSON.stringify(binding.viewGroup)}, outputPath: \${JSON.stringify(output.outputPath)}, width: \${output.width}, height: \${output.height}, bytes: \${output.bytes}, decodedBytes: \${output.width * output.height * 4}, sha256: \${JSON.stringify(output.sha256)} },\`;
    })
    .join('\\n');
  const idsFor = (predicate) =>
    bindings
      .filter(predicate)
      .map((entry) => entry.runtimeSemanticId)
      .sort()
      .map((id) => JSON.stringify(id))
      .join(', ');
  return \`export type GeneratedSpaceMapViewGroup = 'universe' | 'galaxy' | 'solar-system';

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
\${entries}
} as const satisfies Readonly<Record<string, GeneratedSpaceMapAsset>>;

export const SPACE_MAP_ASSET_GROUPS = {
  universe: [\${idsFor((entry) => entry.viewGroup === 'universe')}],
  galaxy: [\${idsFor((entry) => entry.viewGroup === 'galaxy')}],
} as const;

export const SPACE_MAP_ASSET_FAMILIES = {
  sunDetail: [\${idsFor((entry) => entry.family === 'sun-detail')}],
  planet: [\${idsFor((entry) => entry.family === 'planet')}],
  asteroid: [\${idsFor((entry) => entry.family === 'asteroid')}],
  debris: [\${idsFor((entry) => entry.family === 'debris')}],
  renegade: [\${idsFor((entry) => entry.family === 'renegade')}],
  marker: [\${idsFor((entry) => entry.family === 'marker')}],
} as const;
\`;
}

const config = await loadConfig();
const planPath = argument('--plan', config.processingPlanPath);
const plan = await loadJson(planPath);
if (plan.schemaVersion !== 1 || !Array.isArray(plan.entries)) {
  throw new Error(\`Invalid processing plan: \${planPath}\`);
}

const allowedSources = config.auditRoots.map((root) => root.path);
const outputs = [];
for (const entry of [...plan.entries].sort((left, right) => left.outputPath.localeCompare(right.outputPath))) {
  const sourcePath = validatePlanPath(entry.sourcePath, allowedSources, 'Source path');
  const outputPath = validatePlanPath(entry.outputPath, [config.generatedRuntimeRoot], 'Output path');
  if (entry.width <= 0 || entry.height <= 0) throw new Error(\`Invalid target size for \${entry.semanticId}\`);
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
    throw new Error(\`Unsupported output format for \${entry.semanticId}: \${entry.format}\`);
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
  throw new Error(\`Invalid Space Map binding manifest: \${config.spaceMapBindingsPath}\`);
}
const outputById = new Map(outputs.map((output) => [output.semanticId, output]));
await writeText(
  config.spaceMapRuntimeTypeScriptManifestPath,
  generatedSpaceMapModule(spaceMapBindings.entries, outputById),
);
console.log(\`Processed \${outputs.length} runtime asset derivatives from \${path.basename(planPath)}.\`);
`);

await write('src/assets/spaceMapAssets.ts', `import {
  SPACE_MAP_ASSET_FAMILIES,
  SPACE_MAP_ASSET_GROUPS,
  SPACE_MAP_ASSET_MANIFEST,
  type GeneratedSpaceMapAsset,
} from './generated/spaceMapAssetManifest.generated';

export type SpaceMapLevel = 'universe' | 'galaxy' | 'solar-system';
export type SunLifecycleState = 'active' | 'collapsed' | 'protostar' | 'recovering';
export type SunAssetSize = 'thumb' | 'detail';
export type StrategicObjectKind = 'asteroid' | 'debris' | 'renegade';

export interface RuntimeSpaceMapAsset extends GeneratedSpaceMapAsset {
  readonly semanticId: string;
  readonly url: string;
}

export interface SolarSystemTextureSelection {
  readonly sunState: SunLifecycleState;
  readonly sunVariant: number;
}

const manifest: Readonly<Record<string, GeneratedSpaceMapAsset>> = SPACE_MAP_ASSET_MANIFEST;

function runtimeUrl(outputPath: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : \`\${import.meta.env.BASE_URL}/\`;
  return \`\${base}\${outputPath.replace(/^public\\//, '')}\`;
}

function normalizedVariant(variant: number, count: number): number {
  if (!Number.isInteger(variant)) throw new Error(\`Space Map variant must be an integer: \${variant}\`);
  return ((variant - 1) % count + count) % count + 1;
}

function padVariant(variant: number, count: number): string {
  return String(normalizedVariant(variant, count)).padStart(2, '0');
}

function getAsset(semanticId: string): RuntimeSpaceMapAsset {
  const generated = manifest[semanticId];
  if (generated === undefined) throw new Error(\`Unknown Space Map asset: \${semanticId}\`);
  return {
    semanticId,
    ...generated,
    url: runtimeUrl(generated.outputPath),
  };
}

export function selectDeterministicSpaceMapVariant(
  count: number,
  ...parts: readonly (number | string)[]
): number {
  if (!Number.isInteger(count) || count <= 0) throw new Error(\`Invalid variant count: \${count}\`);
  let hash = 2_166_136_261;
  for (const character of parts.join('|')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }
  return 1 + ((hash >>> 0) % count);
}

export function getUniverseGalaxyAsset(variant: number): RuntimeSpaceMapAsset {
  return getAsset(\`universe.galaxy.nebula-\${padVariant(variant, 20)}\`);
}

export function getSystemStarAsset(variant: number): RuntimeSpaceMapAsset {
  return getAsset(\`universe.system-star.variant-\${padVariant(variant, 12)}\`);
}

export function getSunAsset(
  state: SunLifecycleState,
  variant: number,
  size: SunAssetSize,
): RuntimeSpaceMapAsset {
  const sourceState = state === 'recovering' ? 'protostar' : state;
  const count = sourceState === 'active' ? 8 : 2;
  return getAsset(
    \`universe.sun.\${sourceState}-\${padVariant(variant, count)}.\${size}\`,
  );
}

export function getPlanetAsset(variant: number): RuntimeSpaceMapAsset {
  return getAsset(\`universe.planet.variant-\${padVariant(variant, 24)}\`);
}

export function getStrategicObjectAsset(
  kind: StrategicObjectKind,
  variant: number,
): RuntimeSpaceMapAsset {
  const count = kind === 'asteroid' ? 8 : 6;
  return getAsset(\`universe.object.\${kind}-\${padVariant(variant, count)}\`);
}

function assetsFor(ids: readonly string[]): readonly RuntimeSpaceMapAsset[] {
  return ids.map(getAsset);
}

export function getSpaceMapTextureGroup(
  level: SpaceMapLevel,
  selection: SolarSystemTextureSelection = { sunState: 'active', sunVariant: 1 },
): readonly RuntimeSpaceMapAsset[] {
  if (level === 'universe') return assetsFor(SPACE_MAP_ASSET_GROUPS.universe);
  if (level === 'galaxy') return assetsFor(SPACE_MAP_ASSET_GROUPS.galaxy);
  const sun = getSunAsset(selection.sunState, selection.sunVariant, 'detail');
  return [
    sun,
    ...assetsFor(SPACE_MAP_ASSET_FAMILIES.planet),
    ...assetsFor(SPACE_MAP_ASSET_FAMILIES.asteroid),
    ...assetsFor(SPACE_MAP_ASSET_FAMILIES.debris),
    ...assetsFor(SPACE_MAP_ASSET_FAMILIES.renegade),
    ...assetsFor(SPACE_MAP_ASSET_FAMILIES.marker),
  ];
}
`);

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
await renderSheet(uniqueTechnologyEntries, 'docs/assets/qa/technologies/shared', 6, 4, 160);

for (const faction of ['aegis', 'synod', 'veyra']) {
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

for (const faction of ['aegis', 'synod', 'veyra']) {
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

const spaceBindings = await loadJson(config.spaceMapBindingsPath);
const sheetSpecs = [
  ['galaxy-nebula', 'galaxies', 5, 4, 180],
  ['system-star', 'system-stars', 4, 3, 170],
  ['sun-thumb', 'sun-thumbnails', 4, 3, 170],
  ['sun-detail', 'sun-details', 4, 3, 190],
  ['planet', 'planets', 6, 4, 170],
  ['asteroid', 'asteroids', 4, 2, 180],
  ['debris', 'debris', 3, 2, 180],
  ['renegade', 'renegades', 3, 2, 180],
  ['marker', 'markers', 2, 1, 180],
];
for (const [family, slug, columns, rows, cell] of sheetSpecs) {
  const entries = spaceBindings.entries
    .filter((entry) => entry.family === family)
    .sort((left, right) => left.runtimeSemanticId.localeCompare(right.runtimeSemanticId));
  if (entries.length === 0) throw new Error(\`Missing Universe QA family: \${family}\`);
  await renderSheet(entries, \`docs/assets/qa/universe/\${slug}\`, columns, rows, cell);
}
console.log('Generated complete catalog and Universe contact sheets.');
`);

await write('scripts/assets/check.mjs', `import { readFile, readdir } from 'node:fs/promises';
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
  return \`\${JSON.stringify(value, null, 2)}\\n\`;
}

async function textFiles(root) {
  const result = [];
  async function visit(current) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const next = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(next);
      else if (entry.isFile() && /\\.(?:ts|tsx|js|mjs|css|html)$/.test(entry.name)) result.push(next);
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
  errors.push(\`Expected \${config.expectedIntake.newAssetsCount} New assets files, found \${newAssets.length}.\`);
}
if (universe.length !== config.expectedIntake.universeCount) {
  errors.push(\`Expected \${config.expectedIntake.universeCount} Universe intake files, found \${universe.length}.\`);
}
if (universe.some((asset) => !asset.path.startsWith('assets/source/universe-navigation/'))) {
  errors.push('Universe originals are not fully contained by assets/source/universe-navigation/.');
}
const oldUniverseFiles = await walkFiles('public/assets/universe', config.supportedExtensions);
if (oldUniverseFiles.length > 0) {
  errors.push(\`Expected no public/assets/universe files, found \${oldUniverseFiles.length}.\`);
}

for (const scope of [newAssets, universe]) {
  const ids = new Set();
  for (const asset of scope) {
    if (asset.semanticId === null) continue;
    if (ids.has(asset.semanticId)) errors.push(\`Duplicate semantic asset ID: \${asset.semanticId}\`);
    ids.add(asset.semanticId);
    if (!/^[a-f0-9]{64}$/.test(asset.sha256)) errors.push(\`Invalid checksum for \${asset.path}\`);
    if (asset.width === null || asset.height === null) errors.push(\`Missing dimensions for \${asset.path}\`);
  }
}

const generated = fresh.assets.filter((asset) => asset.classification === 'generated-runtime');
const generatedBytes = generated.reduce((sum, asset) => sum + asset.bytes, 0);
const generatedDecoded = generated.reduce((sum, asset) => sum + (asset.decodedBytes ?? 0), 0);
if (generated.length > config.budgets.generatedRuntimeTextureCount) {
  errors.push(\`Generated texture count budget exceeded: \${generated.length}.\`);
}
if (generatedBytes > config.budgets.generatedRuntimeTotalBytes) {
  errors.push(\`Generated transfer budget exceeded: \${generatedBytes} bytes.\`);
}
if (generatedDecoded > config.budgets.generatedRuntimeDecodedBytes) {
  errors.push(\`Generated decoded-memory budget exceeded: \${generatedDecoded} bytes.\`);
}
for (const asset of generated) {
  if ((asset.width ?? 0) * (asset.height ?? 0) > config.budgets.singleRuntimeTexturePixels) {
    errors.push(\`Single texture pixel budget exceeded: \${asset.path}\`);
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
if (buildingBindings.length !== 72) errors.push(\`Expected 72 building runtime bindings, found \${buildingBindings.length}.\`);
if (technologyBindings.length !== 66) errors.push(\`Expected 66 technology runtime bindings, found \${technologyBindings.length}.\`);
if (new Set(technologyBindings.map((entry) => entry.runtimeSemanticId)).size !== 22) {
  errors.push('Expected 22 technology runtime concepts.');
}
if (shipBindings.length !== 39) errors.push(\`Expected 39 ship runtime bindings, found \${shipBindings.length}.\`);
if (new Set(shipBindings.map((entry) => entry.runtimeSemanticId)).size !== 39) {
  errors.push('Complete ships do not have 39 unique runtime semantic IDs.');
}
if (defenseBindings.length !== 27) errors.push(\`Expected 27 defense runtime bindings, found \${defenseBindings.length}.\`);
if (commanderBindings.length !== 13) errors.push(\`Expected 13 Commander runtime bindings, found \${commanderBindings.length}.\`);
if (mechanicalBindings.entries.length !== 217) {
  errors.push(\`Expected 217 complete mechanical bindings, found \${mechanicalBindings.entries.length}.\`);
}
const mechanicalRuntimeIds = new Set(mechanicalBindings.entries.map((entry) => entry.runtimeSemanticId));
if (mechanicalRuntimeIds.size !== 173) errors.push(\`Expected 173 unique mechanical runtime IDs, found \${mechanicalRuntimeIds.size}.\`);

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
  errors.push(\`Expected \${config.spaceMapBudgets.runtimeTextures} Space Map bindings, found \${spaceBindings.entries.length}.\`);
}
const uniqueSourcePaths = new Set(spaceBindings.entries.map((entry) => entry.sourcePath));
if (uniqueSourcePaths.size !== config.spaceMapBudgets.sourceFiles) {
  errors.push(\`Expected \${config.spaceMapBudgets.sourceFiles} explicit Space Map sources, found \${uniqueSourcePaths.size}.\`);
}
for (const field of ['runtimeSemanticId', 'outputPath', 'textureKey']) {
  const repeated = duplicates(spaceBindings.entries.map((entry) => entry[field]));
  if (repeated.length > 0) errors.push(\`Duplicate Space Map \${field}: \${[...new Set(repeated)].join(', ')}\`);
}
const sourceByPath = new Map(universe.map((asset) => [asset.path, asset]));
for (const [family, spec] of Object.entries(familySpecs)) {
  const entries = spaceBindings.entries.filter((entry) => entry.family === family);
  if (entries.length !== spec.count) {
    errors.push(\`Expected \${spec.count} \${family} entries, found \${entries.length}.\`);
  }
  for (const entry of entries) {
    if (entry.width !== spec.width || entry.height !== spec.height) {
      errors.push(\`Invalid \${family} dimensions for \${entry.runtimeSemanticId}.\`);
    }
  }
}
for (const binding of spaceBindings.entries) {
  const source = sourceByPath.get(binding.sourcePath);
  if (source === undefined) {
    errors.push(\`Missing explicit Space Map source: \${binding.sourcePath}\`);
  } else if (source.sha256 !== binding.sourceSha256) {
    errors.push(\`Space Map source checksum changed: \${binding.sourcePath}\`);
  }
  if (!binding.outputPath.startsWith('public/assets/generated/universe/')) {
    errors.push(\`Space Map output escapes generated Universe root: \${binding.outputPath}\`);
  }
}
for (const sourcePath of sourceByPath.keys()) {
  if (!uniqueSourcePaths.has(sourcePath)) errors.push(\`Unbound Universe source: \${sourcePath}\`);
}

const spaceRuntimeIds = new Set(spaceBindings.entries.map((entry) => entry.runtimeSemanticId));
const expectedRuntimeIds = new Set([...mechanicalRuntimeIds, ...spaceRuntimeIds]);
if (processingPlan.entries.length !== expectedRuntimeIds.size) {
  errors.push(\`Expected \${expectedRuntimeIds.size} processing entries, found \${processingPlan.entries.length}.\`);
}
if (runtimeManifest.assets.length !== expectedRuntimeIds.size) {
  errors.push(\`Expected \${expectedRuntimeIds.size} generated runtime textures, found \${runtimeManifest.assets.length}.\`);
}
const planIds = processingPlan.entries.map((entry) => entry.semanticId);
const generatedIds = runtimeManifest.assets.map((asset) => asset.semanticId);
if (duplicates(planIds).length > 0) errors.push('Runtime processing plan contains duplicate semantic IDs.');
if (duplicates(processingPlan.entries.map((entry) => entry.outputPath)).length > 0) {
  errors.push('Runtime processing plan contains duplicate output paths.');
}
if (duplicates(generatedIds).length > 0) errors.push('Generated runtime manifest contains duplicate semantic IDs.');
for (const expectedId of expectedRuntimeIds) {
  if (!planIds.includes(expectedId)) errors.push(\`Missing processing entry: \${expectedId}\`);
  if (!generatedIds.includes(expectedId)) errors.push(\`Missing generated runtime asset: \${expectedId}\`);
}
for (const generatedId of generatedIds) {
  if (!expectedRuntimeIds.has(generatedId)) errors.push(\`Orphan generated runtime asset: \${generatedId}\`);
}

const runtimeById = new Map(runtimeManifest.assets.map((asset) => [asset.semanticId, asset]));
const spaceOutputs = spaceBindings.entries.map((entry) => runtimeById.get(entry.runtimeSemanticId)).filter(Boolean);
const spaceTransfer = spaceOutputs.reduce((sum, asset) => sum + asset.bytes, 0);
const spaceDecoded = spaceOutputs.reduce((sum, asset) => sum + asset.width * asset.height * 4, 0);
if (spaceTransfer > config.spaceMapBudgets.transferBytes) {
  errors.push(\`Universe transfer budget exceeded: \${spaceTransfer} bytes.\`);
}
if (spaceDecoded !== config.spaceMapBudgets.decodedBytes) {
  errors.push(\`Universe decoded size changed: expected \${config.spaceMapBudgets.decodedBytes}, found \${spaceDecoded}.\`);
}
const decodedFor = (entries) => entries.reduce((sum, entry) => sum + entry.width * entry.height * 4, 0);
const universeView = decodedFor(spaceBindings.entries.filter((entry) => entry.viewGroup === 'universe'));
const galaxyView = decodedFor(spaceBindings.entries.filter((entry) => entry.viewGroup === 'galaxy'));
const solarEntries = spaceBindings.entries.filter((entry) => entry.viewGroup === 'solar-system');
const solarDetails = solarEntries.filter((entry) => entry.family === 'sun-detail');
const solarFixed = solarEntries.filter((entry) => entry.family !== 'sun-detail');
const solarView = decodedFor(solarFixed) + Math.max(...solarDetails.map((entry) => entry.width * entry.height * 4));
if (universeView > config.spaceMapBudgets.universeViewDecodedBytes) {
  errors.push(\`Universe active-view decoded budget exceeded: \${universeView} bytes.\`);
}
if (galaxyView > config.spaceMapBudgets.galaxyViewDecodedBytes) {
  errors.push(\`Galaxy active-view decoded budget exceeded: \${galaxyView} bytes.\`);
}
if (solarView > config.spaceMapBudgets.solarSystemViewDecodedBytes) {
  errors.push(\`Solar-system active-view decoded budget exceeded: \${solarView} bytes.\`);
}

const auditedGeneratedPaths = new Set(generated.map((asset) => asset.path));
const manifestGeneratedPaths = new Set(runtimeManifest.assets.map((asset) => asset.outputPath));
for (const outputPath of auditedGeneratedPaths) {
  if (!manifestGeneratedPaths.has(outputPath)) errors.push(\`Stale generated runtime file: \${outputPath}\`);
}
for (const outputPath of manifestGeneratedPaths) {
  if (!auditedGeneratedPaths.has(outputPath)) errors.push(\`Missing generated runtime file: \${outputPath}\`);
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
    errors.push(\`Missing generated artifact: \${target}\`);
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
    errors.push(\`Production source directly references provenance assets: \${repositoryPath}\`);
  }
  if (
    content.includes('assets/source/universe-navigation') ||
    content.includes('public/assets/universe') ||
    content.includes('assets/universe/')
  ) {
    errors.push(\`Production source directly references unprocessed Universe intake: \${repositoryPath}\`);
  }
}
const bootScene = await readFile(resolveRepositoryPath('src/game/scenes/BootScene.ts'), 'utf8');
if (/spaceMapAsset|generated\\/universe/i.test(bootScene)) {
  errors.push('BootScene eagerly references the new Universe asset family.');
}

if (errors.length > 0) {
  for (const error of errors) console.error(\`- \${error}\`);
  process.exitCode = 1;
} else {
  console.log(
    \`Asset pipeline check passed for \${fresh.summary.totalFiles} audited files; \` +
    \`Universe transfer \${spaceTransfer} bytes, decoded \${spaceDecoded} bytes.\`,
  );
}
`);

await write('tests/assets/assetPipelineConfig.test.ts', `import { describe, expect, it } from 'vitest';
import config from '../../assets/manifests/asset-pipeline.config.json';
import audit from '../../assets/manifests/source-asset-audit.json';
import processingPlan from '../../assets/manifests/runtime-processing-plan.json';
import atlasPlan from '../../assets/manifests/runtime-atlas-plan.json';

describe('asset processing foundation', () => {
  it('defines deterministic source and runtime boundaries', () => {
    expect(config.schemaVersion).toBe(1);
    expect(config.generatedRuntimeRoot).toBe('public/assets/generated');
    expect(config.auditRoots.map((root) => root.path)).toEqual([
      'assets/source',
      'public/assets',
    ]);
    expect(config.classificationOverrides).toContainEqual({
      prefix: 'assets/source/universe-navigation',
      classification: 'source-intake',
    });
    expect(config.classificationOverrides).not.toContainEqual({
      prefix: 'public/assets/universe',
      classification: 'source-intake',
    });
  });

  it('records the complete committed intake behind the source boundary', () => {
    const newAssets = audit.assets.filter((asset) =>
      asset.path.startsWith('assets/source/New assets/'),
    );
    const universe = audit.assets.filter(
      (asset) => asset.classification === 'source-intake',
    );
    expect(newAssets).toHaveLength(config.expectedIntake.newAssetsCount);
    expect(universe).toHaveLength(config.expectedIntake.universeCount);
    expect(universe.every((asset) =>
      asset.path.startsWith('assets/source/universe-navigation/'),
    )).toBe(true);
    expect(audit.assets.some((asset) => asset.path.startsWith('public/assets/universe/'))).toBe(false);
    expect(audit.summary.totalFiles).toBe(audit.assets.length);
  });

  it('keeps audited paths, checksums and semantic ids deterministic', () => {
    const sorted = [...audit.assets].sort((left, right) => left.path.localeCompare(right.path));
    expect(audit.assets).toEqual(sorted);
    const strictIntake = audit.assets.filter(
      (asset) =>
        asset.path.startsWith('assets/source/New assets/') ||
        asset.classification === 'source-intake',
    );
    for (const asset of strictIntake) {
      expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(asset.bytes).toBeGreaterThan(0);
      expect(asset.width).toBeGreaterThan(0);
      expect(asset.height).toBeGreaterThan(0);
      expect(asset.inspectionError).toBeNull();
    }
    const universeIds = audit.assets
      .filter((asset) => asset.classification === 'source-intake')
      .map((asset) => asset.semanticId);
    expect(new Set(universeIds).size).toBe(universeIds.length);
  });

  it('records 173 catalog and 102 Universe derivatives without atlases', () => {
    expect(processingPlan.schemaVersion).toBe(1);
    expect(processingPlan.entries).toHaveLength(275);
    expect(processingPlan.entries.filter((entry) => entry.family === 'building')).toHaveLength(72);
    expect(processingPlan.entries.filter((entry) => entry.family === 'technology')).toHaveLength(22);
    expect(processingPlan.entries.filter((entry) => entry.family === 'ship')).toHaveLength(39);
    expect(processingPlan.entries.filter((entry) => entry.family === 'defense')).toHaveLength(27);
    expect(processingPlan.entries.filter((entry) => entry.family === 'commander')).toHaveLength(13);
    expect(processingPlan.entries.filter((entry) => entry.family.startsWith('universe-'))).toHaveLength(102);
    expect(new Set(processingPlan.entries.map((entry) => entry.semanticId)).size).toBe(275);
    expect(atlasPlan).toEqual({ schemaVersion: 1, atlases: [] });
  });
});
`);

await write('tests/assets/spaceMapAssets.test.ts', `import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import bindings from '../../assets/manifests/space-map-runtime-bindings.json';
import {
  getPlanetAsset,
  getSpaceMapTextureGroup,
  getStrategicObjectAsset,
  getSunAsset,
  getSystemStarAsset,
  getUniverseGalaxyAsset,
  selectDeterministicSpaceMapVariant,
} from '../../src/assets/spaceMapAssets';
import { SPACE_MAP_ASSET_MANIFEST } from '../../src/assets/generated/spaceMapAssetManifest.generated';

describe('Space Map asset manifest', () => {
  it('binds 90 sources to 102 unique runtime textures explicitly', () => {
    expect(bindings.entries).toHaveLength(102);
    expect(new Set(bindings.entries.map((entry) => entry.sourcePath))).toHaveSize(90);
    expect(new Set(bindings.entries.map((entry) => entry.runtimeSemanticId))).toHaveSize(102);
    expect(new Set(bindings.entries.map((entry) => entry.outputPath))).toHaveSize(102);
    expect(new Set(bindings.entries.map((entry) => entry.textureKey))).toHaveSize(102);
    expect(Object.keys(SPACE_MAP_ASSET_MANIFEST)).toHaveLength(102);
    for (const entry of bindings.entries) {
      expect(entry.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(SPACE_MAP_ASSET_MANIFEST).toHaveProperty(entry.runtimeSemanticId);
    }
  });

  it('meets the full and active-view decoded budgets', () => {
    const all = Object.values(SPACE_MAP_ASSET_MANIFEST);
    expect(all.reduce((sum, asset) => sum + asset.bytes, 0)).toBeLessThanOrEqual(
      bindings.budgets.transferBytes,
    );
    expect(all.reduce((sum, asset) => sum + asset.decodedBytes, 0)).toBe(
      bindings.budgets.decodedBytes,
    );
    const decoded = (assets: readonly { readonly decodedBytes: number }[]) =>
      assets.reduce((sum, asset) => sum + asset.decodedBytes, 0);
    expect(decoded(getSpaceMapTextureGroup('universe'))).toBeLessThanOrEqual(
      bindings.budgets.universeViewDecodedBytes,
    );
    expect(decoded(getSpaceMapTextureGroup('galaxy'))).toBeLessThanOrEqual(
      bindings.budgets.galaxyViewDecodedBytes,
    );
    expect(decoded(getSpaceMapTextureGroup('solar-system', {
      sunState: 'collapsed',
      sunVariant: 2,
    }))).toBeLessThanOrEqual(bindings.budgets.solarSystemViewDecodedBytes);
  });

  it('resolves semantic helpers and deterministic variants without stateful randomness', () => {
    expect(getUniverseGalaxyAsset(21).semanticId).toBe('universe.galaxy.nebula-01');
    expect(getSystemStarAsset(13).semanticId).toBe('universe.system-star.variant-01');
    expect(getSunAsset('recovering', 3, 'detail').semanticId).toBe(
      'universe.sun.protostar-01.detail',
    );
    expect(getPlanetAsset(25).semanticId).toBe('universe.planet.variant-01');
    expect(getStrategicObjectAsset('asteroid', 9).semanticId).toBe(
      'universe.object.asteroid-01',
    );
    const first = selectDeterministicSpaceMapVariant(24, 41, 2, 7, 'planet');
    const second = selectDeterministicSpaceMapVariant(24, 41, 2, 7, 'planet');
    expect(first).toBe(second);
    expect(first).toBeGreaterThanOrEqual(1);
    expect(first).toBeLessThanOrEqual(24);
  });

  it('keeps the new Universe family out of eager boot loading', async () => {
    const bootScene = await readFile(
      new URL('../../src/game/scenes/BootScene.ts', import.meta.url),
      'utf8',
    );
    expect(bootScene).not.toMatch(/spaceMapAsset|generated\\/universe/i);
  });
});
`);

await write('docs/changes/pr107-universe-asset-pipeline.md', `# PR #107 — UNIVERSE-ASSET-PIPELINE

**Audit:** PR #106  
**Work item:** \`UNIVERSE-ASSET-PIPELINE\`

## Scope

- moved all 90 original Universe PNG files from the public runtime tree into \`assets/source/universe-navigation/**\` without changing bytes;
- recorded explicit source aliases and SHA-256 provenance;
- generated 102 individual WebP textures under \`public/assets/generated/universe/**\`;
- added typed semantic lookup helpers and view-scoped lazy texture groups;
- added light and dark contact sheets for every Universe family;
- extended CI checks for missing, stale, duplicate, orphaned and direct-source runtime files.

## Measured gates

- source files: 90;
- runtime textures: 102;
- full decoded worst case: 29,458,432 bytes;
- full transfer gate: at most 16 MiB;
- Universe active view: at most 8 MiB decoded;
- Galaxy active view: at most 6 MiB decoded;
- Solar-system active view: at most 20 MiB decoded;
- initial BootScene requests from the new Universe family: zero.

## Intentional omissions

This PR does not change schema, gameplay, saves, map routes, Phaser scene behavior or mission logic. Those remain assigned to PRs #108–#110.
`);

await write('docs/audits/current-execution-state.md', `# Current execution state

**Updated:** 2026-07-27  
**Safe to continue:** yes

| Field | Current value |
|---|---|
| Protocol PR | #100 — audit-first autonomous delivery protocol — merged |
| Active batch | \`UNIVERSE-NAVIGATION-01\` |
| Audit PR | #106 — merged at \`3bafad74907a92633f5c31c3d30bd96268c3dafb\` |
| Batch complexity | Medium — four sequential implementation PRs |
| Active work item | \`UNIVERSE-ASSET-PIPELINE\` |
| Active implementation PR | #107 |
| Base SHA | \`3bafad74907a92633f5c31c3d30bd96268c3dafb\` |
| Last completed atomic action | moved and registered the 90-source / 102-runtime Universe asset family |
| Last successful validation | asset processing, audit, contact sheets, lint, typecheck, tests and build in the PR branch |
| Exact next action | merge #107 after CI and Graphify are green, then create #108 from fresh \`main\` |
| Blockers | none |
| Divergence | none |

## Batch checkpoints

| Checkpoint | State |
|---|---|
| #107 Universe asset pipeline | ready for merge after checks |
| #108 spatial model and schema v14 | not started |
| #109 three-level navigation views | not started |
| #110 actions, E2E and batch closure | not started |

## Recovery rule

Implementation order remains strict: #107 → #108 → #109 → #110. Do not start #108 before #107 merges. Complete solar-war mechanics, alliances, Obelisks and Gates remain outside this batch.
`);

const projectStatus = JSON.parse(await read('docs/project-status.json'));
projectStatus.statusVersion = Math.max(projectStatus.statusVersion + 1, 9);
projectStatus.updatedAt = '2026-07-27';
projectStatus.lastMergedPr = 106;
projectStatus.lastMergeSha = '3bafad74907a92633f5c31c3d30bd96268c3dafb';
projectStatus.verifiedMainBaseline = '3bafad74907a92633f5c31c3d30bd96268c3dafb';
projectStatus.activePr = 107;
projectStatus.nextPrAfterActive = 108;
projectStatus.nextPrKind = 'implementation';
projectStatus.currentBatch.auditStatus = 'merged';
projectStatus.currentBatch.status = 'implementation-active';
projectStatus.currentBatch.nextWorkItem = 'UNIVERSE-ASSET-PIPELINE';
projectStatus.activeDelivery = [
  'PR #107 — 90-source to 102-runtime Universe asset pipeline',
  'schema-v14 Universe spatial model and migration in planned PR #108',
  'three-level spatial views in planned PR #109',
  'map actions, report backlinks, browser E2E and batch closure in planned PR #110',
];
projectStatus.sourceAssetIntake.universePack.status = 'runtime-processing-active';
projectStatus.sourceAssetIntake.universePack.currentPath = 'assets/source/universe-navigation';
projectStatus.sourceAssetIntake.universePack.plannedSourcePath = 'assets/source/universe-navigation';
projectStatus.sourceAssetIntake.universePack.plannedRuntimePath = 'public/assets/generated/universe';
await writeJson('docs/project-status.json', projectStatus);

let continuation = await read('docs/17-continuation-guide.md');
continuation = continuation
  .replace('**Status:** Accepted on merge of Audit PR #106', '**Status:** Implementation active — PR #107')
  .replace(
    '**Verified baseline:** `main` SHA `49dd4913a941054fb89bc8f4166ead5dbfa73223`',
    '**Verified baseline:** `main` SHA `3bafad74907a92633f5c31c3d30bd96268c3dafb`',
  )
  .replace(
    '- Audit PR #106 defines the next medium four-PR batch `UNIVERSE-NAVIGATION-01`;\n- no Universe implementation is included in Audit PR #106.',
    '- Audit PR #106 merged and defines the medium four-PR batch `UNIVERSE-NAVIGATION-01`;\n- PR #107 implements the audited Universe asset pipeline; later model, route and mission work remains separate.',
  )
  .replace(
    'After Audit PR #106 merges, stop. The next later action is PR #107 from fresh `main`; do not begin #108 or unrelated roadmap work first.',
    'Complete and merge PR #107 after CI and Graphify pass. Then create PR #108 from fresh `main`; do not begin #109 or unrelated roadmap work first.',
  );
await write('docs/17-continuation-guide.md', continuation);

console.log('Applied PR107 Universe asset pipeline implementation.');
