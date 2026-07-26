import { createHash } from 'node:crypto';
import { readFile, readdir, stat, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export const REPOSITORY_ROOT = path.resolve(import.meta.dirname, '../..');
export const CONFIG_PATH = path.join(
  REPOSITORY_ROOT,
  'assets/manifests/asset-pipeline.config.json',
);

export function toPosix(value) {
  return value.split(path.sep).join('/');
}

export function resolveRepositoryPath(relativePath) {
  const absolutePath = path.resolve(REPOSITORY_ROOT, relativePath);
  const relative = path.relative(REPOSITORY_ROOT, absolutePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Path escapes repository root: ${relativePath}`);
  }
  return absolutePath;
}

export async function loadJson(relativePath) {
  const content = await readFile(resolveRepositoryPath(relativePath), 'utf8');
  return JSON.parse(content);
}

export async function loadConfig() {
  return JSON.parse(await readFile(CONFIG_PATH, 'utf8'));
}

export async function ensureParent(relativePath) {
  await mkdir(path.dirname(resolveRepositoryPath(relativePath)), { recursive: true });
}

export async function writeStableJson(relativePath, value) {
  await ensureParent(relativePath);
  await writeFile(resolveRepositoryPath(relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

export async function writeText(relativePath, content) {
  await ensureParent(relativePath);
  await writeFile(resolveRepositoryPath(relativePath), content);
}

export async function walkFiles(relativeRoot, supportedExtensions) {
  const root = resolveRepositoryPath(relativeRoot);
  const files = [];

  async function visit(current) {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch (error) {
      if (error?.code === 'ENOENT') return;
      throw error;
    }
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await visit(entryPath);
        continue;
      }
      if (!entry.isFile()) continue;
      const extension = path.extname(entry.name).toLowerCase();
      if (supportedExtensions.includes(extension)) files.push(entryPath);
    }
  }

  await visit(root);
  return files;
}

export async function sha256File(absolutePath) {
  const content = await readFile(absolutePath);
  return createHash('sha256').update(content).digest('hex');
}

function numberSuffix(stem) {
  const match = stem.match(/(?:-|\.variant-)(\d+)$/);
  return match?.[1];
}

export function inferFamily(repositoryPath) {
  const universePath = repositoryPath.replace('/universe-navigation/', '/universe/');
  if (repositoryPath.includes('/buildings/')) return 'building';
  if (repositoryPath.includes('/technologies/')) return 'technology';
  if (repositoryPath.includes('/ship/')) return 'ship';
  if (repositoryPath.includes('/defenses/')) return 'defense';
  if (repositoryPath.includes('/comander_ship/')) return 'commander';
  if (universePath.includes('/universe/galaxies/')) return 'universe-galaxy';
  if (universePath.includes('/universe/system-stars/')) return 'universe-system-star';
  if (
    universePath.includes('/universe/active-suns/') ||
    universePath.includes('/universe/protostars/') ||
    universePath.includes('/universe/stellar-remnants/')
  ) {
    return 'universe-sun';
  }
  if (universePath.includes('/universe/planets/')) return 'universe-planet';
  if (
    universePath.includes('/universe/asteroids/') ||
    universePath.includes('/universe/debris/') ||
    universePath.includes('/universe/renegades/')
  ) {
    return 'universe-object';
  }
  if (universePath.includes('/universe/markers/')) return 'universe-marker';
  return 'runtime-other';
}

const COMMANDER_ID_BY_FILE = {
  'commander-ship.annihilator': 'commander.shared.annihilator',
  'commander-ship.argo': 'commander.shared.argo',
  'commander-ship.corsair': 'commander.shared.corsair',
  'commander-ship.executioner': 'commander.shared.executor',
  'commander-ship.hunter': 'commander.shared.hunter',
  'commander-ship.judge': 'commander.shared.judge',
  'commander-ship.juggernaut': 'commander.shared.juggernaut',
  'commander-ship.phantom': 'commander.shared.phantom',
  'commander-ship.polias': 'commander.shared.polias',
  'commander-ship.reanimator': 'commander.shared.regenerator',
  'commander-ship.scorpion': 'commander.shared.scorpion',
  'commander-ship.typhoon': 'commander.shared.typhoon',
  'commander-ship.viper': 'commander.shared.viper',
};

export function inferSemanticId(repositoryPath) {
  const extension = path.extname(repositoryPath);
  const stem = path.basename(repositoryPath, extension);
  const universePath = repositoryPath.replace('/universe-navigation/', '/universe/');
  if (/^(building|technology|ship|defense)\./.test(stem)) return stem;
  if (COMMANDER_ID_BY_FILE[stem] !== undefined) return COMMANDER_ID_BY_FILE[stem];

  const suffix = numberSuffix(stem);
  if (universePath.includes('/universe/galaxies/')) {
    return suffix === undefined ? undefined : `universe.galaxy.nebula-${suffix}`;
  }
  if (universePath.includes('/universe/system-stars/')) {
    return suffix === undefined ? undefined : `universe.system-star.variant-${suffix}`;
  }
  if (universePath.includes('/universe/active-suns/')) {
    return suffix === undefined ? undefined : `universe.sun.active-${suffix}`;
  }
  if (universePath.includes('/universe/protostars/')) {
    return suffix === undefined ? undefined : `universe.sun.protostar-${suffix}`;
  }
  if (universePath.includes('/universe/stellar-remnants/')) {
    return suffix === undefined ? undefined : `universe.sun.collapsed-${suffix}`;
  }
  if (universePath.includes('/universe/planets/')) {
    return suffix === undefined ? undefined : `universe.planet.variant-${suffix}`;
  }
  if (universePath.includes('/universe/asteroids/')) {
    return suffix === undefined ? undefined : `universe.asteroid.variant-${suffix}`;
  }
  if (universePath.includes('/universe/debris/')) {
    return suffix === undefined ? undefined : `universe.debris-field.variant-${suffix}`;
  }
  if (universePath.includes('/universe/renegades/')) {
    return suffix === undefined ? undefined : `universe.renegade-object.variant-${suffix}`;
  }
  if (universePath.includes('/universe/markers/')) {
    return suffix === undefined ? undefined : `universe.marker.generic-${suffix}`;
  }
  return undefined;
}

export function classifyPath(repositoryPath, config) {
  const override = [...config.classificationOverrides]
    .sort((left, right) => right.prefix.length - left.prefix.length)
    .find(({ prefix }) => repositoryPath === prefix || repositoryPath.startsWith(`${prefix}/`));
  if (override !== undefined) return override.classification;
  const root = config.auditRoots.find(
    ({ path: rootPath }) => repositoryPath === rootPath || repositoryPath.startsWith(`${rootPath}/`),
  );
  return root?.classification ?? 'unknown';
}

async function alphaBounds(absolutePath, metadata) {
  if (
    metadata.width === undefined ||
    metadata.height === undefined ||
    metadata.format === 'svg' ||
    metadata.width * metadata.height > 20_000_000
  ) {
    return null;
  }

  const { data, info } = await sharp(absolutePath)
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const channels = info.channels;
  const alphaChannel = channels - 1;
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * channels + alphaChannel];
      if (alpha === undefined || alpha === 0) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < 0 || maxY < 0) return null;
  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

export async function inspectAsset(absolutePath, config) {
  const repositoryPath = toPosix(path.relative(REPOSITORY_ROOT, absolutePath));
  const fileStats = await stat(absolutePath);
  let metadata;
  let inspectionError = null;
  try {
    metadata = await sharp(absolutePath, { animated: false }).metadata();
  } catch (error) {
    metadata = {};
    inspectionError = error instanceof Error ? error.message : String(error);
  }
  const width = metadata.width ?? null;
  const height = metadata.height ?? null;
  const decodedBytes = width === null || height === null ? null : width * height * 4;
  return {
    path: repositoryPath,
    classification: classifyPath(repositoryPath, config),
    family: inferFamily(repositoryPath),
    semanticId: inferSemanticId(repositoryPath) ?? null,
    extension: path.extname(repositoryPath).toLowerCase(),
    format: metadata.format ?? null,
    width,
    height,
    channels: metadata.channels ?? null,
    hasAlpha: metadata.hasAlpha ?? null,
    alphaBounds: inspectionError === null ? await alphaBounds(absolutePath, metadata) : null,
    inspectionError,
    bytes: fileStats.size,
    decodedBytes,
    sha256: await sha256File(absolutePath),
  };
}

function increment(record, key, amount = 1) {
  record[key] = (record[key] ?? 0) + amount;
}

export function summarizeAssets(assets) {
  const summary = {
    totalFiles: assets.length,
    totalBytes: 0,
    totalDecodedBytes: 0,
    byClassification: {},
    byFamily: {},
  };
  for (const asset of assets) {
    summary.totalBytes += asset.bytes;
    summary.totalDecodedBytes += asset.decodedBytes ?? 0;
    increment(summary.byClassification, asset.classification);
    increment(summary.byFamily, asset.family);
  }
  return summary;
}

export async function buildAuditManifest(config) {
  const resolvedConfig = config ?? await loadConfig();
  const uniqueFiles = new Map();
  for (const root of resolvedConfig.auditRoots) {
    const files = await walkFiles(root.path, resolvedConfig.supportedExtensions);
    for (const file of files) uniqueFiles.set(file, true);
  }
  const assets = [];
  for (const absolutePath of [...uniqueFiles.keys()].sort()) {
    assets.push(await inspectAsset(absolutePath, resolvedConfig));
  }
  assets.sort((left, right) => left.path.localeCompare(right.path));
  return {
    schemaVersion: 1,
    configPath: 'assets/manifests/asset-pipeline.config.json',
    assets,
    summary: summarizeAssets(assets),
  };
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KiB', 'MiB', 'GiB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

export function validatePlanPath(relativePath, allowedRoots, label) {
  const normalized = toPosix(path.normalize(relativePath));
  const allowed = allowedRoots.some(
    (root) => normalized === root || normalized.startsWith(`${root}/`),
  );
  if (!allowed) throw new Error(`${label} is outside allowed roots: ${relativePath}`);
  return normalized;
}
