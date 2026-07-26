import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const write = async (relativePath, content) => {
  const target = path.join(root, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content);
};
const read = async (relativePath) => readFile(path.join(root, relativePath), 'utf8');
const writeJson = async (relativePath, value) => write(relativePath, `${JSON.stringify(value, null, 2)}\n`);

const factions = ['aegis', 'synod', 'veyra'];
const buildingMappings = [
  ['metal-bot-1', 'metal-production-1'],
  ['metal-bot-2', 'metal-production-2'],
  ['metal-bot-3', 'metal-production-3'],
  ['mineral-bot-1', 'mineral-production-1'],
  ['mineral-bot-2', 'mineral-production-2'],
  ['gas-probe-1', 'gas-production-1'],
  ['gas-probe-2', 'gas-production-2'],
  ['infrared-bot', 'basic-energy'],
  ['uranium-bot', 'advanced-energy'],
  ['bunker', 'hangar'],
  ['construction', 'construction'],
  ['teret-factory', 'advanced-factory'],
  ['metal-vault', 'metal-storage'],
  ['mineral-treasury', 'mineral-storage'],
  ['gas-chamber', 'gas-storage'],
  ['scrapyard', 'recycling'],
  ['trade-center', 'trade-center'],
  ['shipyard', 'shipyard'],
  ['experimental-center', 'research'],
  ['spaceport', 'spaceport'],
  ['control-chamber', 'planetary-government'],
  ['bank', 'bank'],
  ['aksum-obelisk', 'galactic-obelisk'],
  ['supreme-galactic-gates', 'supreme-galactic-gates'],
];

const processingPlan = JSON.parse(await read('assets/manifests/runtime-processing-plan.json'));
const existingEntries = processingPlan.entries.filter((entry) => entry.family !== 'building');
const buildingEntries = [];
const bindings = [];
for (const faction of factions) {
  for (const [mechanicalSuffix, sourceSuffix] of buildingMappings) {
    const mechanicalId = `building.${faction}.${mechanicalSuffix}`;
    const sourceSemanticId = `building.${faction}.${sourceSuffix}`;
    const sourcePath = `assets/source/New assets/buildings/${faction}/${sourceSemanticId}.png`;
    const outputPath = `public/assets/generated/catalog/buildings/${faction}/${mechanicalSuffix}.webp`;
    buildingEntries.push({
      semanticId: mechanicalId,
      family: 'building',
      sourcePath,
      outputPath,
      width: 384,
      height: 384,
      format: 'webp',
      quality: 88,
      trim: true,
      fit: 'contain',
      position: 'centre',
      withoutEnlargement: false,
    });
    bindings.push({
      mechanicalId,
      category: 'building',
      sourceSemanticId,
      sourcePath,
      runtimeSemanticId: mechanicalId,
      outputPath,
      width: 384,
      height: 384,
    });
  }
}
processingPlan.entries = [...existingEntries, ...buildingEntries].sort((a, b) => a.outputPath.localeCompare(b.outputPath));
await writeJson('assets/manifests/runtime-processing-plan.json', processingPlan);
await writeJson('assets/manifests/mechanical-runtime-bindings.json', {
  schemaVersion: 1,
  entries: bindings.sort((a, b) => a.mechanicalId.localeCompare(b.mechanicalId)),
});

const config = JSON.parse(await read('assets/manifests/asset-pipeline.config.json'));
config.mechanicalBindingsPath = 'assets/manifests/mechanical-runtime-bindings.json';
config.runtimeTypeScriptManifestPath = 'src/assets/generated/runtimeAssetManifest.generated.ts';
await writeJson('assets/manifests/asset-pipeline.config.json', config);

await write('src/assets/runtimeMechanicalAssets.ts', `import type {
  AegisAssetCategory,
  AegisVerticalSliceAsset,
} from './aegisVerticalSliceAssets';
import { RUNTIME_ASSET_MANIFEST } from './generated/runtimeAssetManifest.generated';

export type RuntimeMechanicalAssetCategory =
  | 'building'
  | 'technology'
  | 'ship'
  | 'defense'
  | 'commander';

function runtimeUrl(outputPath: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : \`\${import.meta.env.BASE_URL}/\`;
  return \`\${base}\${outputPath.replace(/^public\\//, '')}\`;
}

function presentationCategory(category: RuntimeMechanicalAssetCategory): AegisAssetCategory {
  return category === 'commander' ? 'commander' : category;
}

export function getRuntimeMechanicalAsset(
  mechanicalId: string,
  runtimeSemanticId: string,
  category: RuntimeMechanicalAssetCategory,
): AegisVerticalSliceAsset | undefined {
  const generated = RUNTIME_ASSET_MANIFEST[runtimeSemanticId];
  if (generated === undefined) return undefined;
  return {
    id: mechanicalId,
    name: mechanicalId,
    category: presentationCategory(category),
    atlasUrl: runtimeUrl(generated.outputPath),
    frame: {
      x: 0,
      y: 0,
      width: generated.width,
      height: generated.height,
    },
    role: 'generated-runtime',
    stage: 'P1',
    layout: 'image',
  };
}

export function applyMechanicalAssetArtwork(
  element: HTMLElement,
  asset: AegisVerticalSliceAsset,
  overlay = 'linear-gradient(180deg, transparent, rgba(2, 8, 14, 0.58))',
): void {
  if (asset.layout === 'image') {
    element.style.backgroundImage = \`\${overlay}, url("\${asset.atlasUrl}")\`;
    element.style.backgroundSize = '100% 100%, contain';
    element.style.backgroundPosition = 'center';
    element.style.backgroundRepeat = 'no-repeat';
    return;
  }

  const column = asset.frame.x / asset.frame.width;
  const row = asset.frame.y / asset.frame.height;
  element.style.backgroundImage = \`url("\${asset.atlasUrl}")\`;
  element.style.backgroundSize = '400% 200%';
  element.style.backgroundPosition =
    \`\${column === 0 ? 0 : (column / 3) * 100}% \${row === 0 ? 0 : 100}%\`;
  element.style.backgroundRepeat = 'no-repeat';
}
`);

let verticalAssets = await read('src/assets/aegisVerticalSliceAssets.ts');
verticalAssets = verticalAssets.replace(
  "  | 'technology'\n  | 'effect';",
  "  | 'technology'\n  | 'commander'\n  | 'effect';",
);
verticalAssets = verticalAssets.replace(
  "  readonly stage: 'P1';\n}",
  "  readonly stage: 'P1';\n  readonly layout?: 'atlas' | 'image';\n}",
);
await write('src/assets/aegisVerticalSliceAssets.ts', verticalAssets);

await write('src/assets/completeMechanicalAssetManifest.ts', `import type { AegisVerticalSliceAsset } from './aegisVerticalSliceAssets';
import { getFactionMechanicalAsset } from './factionMechanicalAssets';
import {
  getRuntimeMechanicalAsset,
  type RuntimeMechanicalAssetCategory,
} from './runtimeMechanicalAssets';
import { parseMechanicalId } from '../simulation/factions/mechanicalIds';
import { COMPLETE_BUILDING_CATALOGS } from '../simulation/planet/completeBuildingCatalog';
import { COMPLETE_COMMANDER_SHIP_CATALOG } from '../simulation/units/completeCommanderShipCatalog';
import {
  COMPLETE_DEFENSE_CATALOGS,
  getCompleteDefenseClass,
} from '../simulation/units/completeDefenseCatalog';
import {
  COMPLETE_SHIP_CATALOGS,
  getCompleteShipClass,
} from '../simulation/units/completeShipCatalog';
import type { CompleteDefenseClass, CompleteShipClass } from '../simulation/units/types';

export type CompleteMechanicalAssetCategory = RuntimeMechanicalAssetCategory;

export interface CompleteMechanicalAssetBinding {
  readonly mechanicalId: string;
  readonly category: CompleteMechanicalAssetCategory;
  readonly runtimeSemanticId?: string;
  readonly runtimeAsset?: AegisVerticalSliceAsset;
  /**
   * Provenance-only repository path. Source files are never imported directly by
   * gameplay components and must be processed before becoming runtime assets.
   */
  readonly sourcePath?: string;
}

export interface CompleteMechanicalAssetManifest {
  readonly version: 1;
  readonly sourceRoot: 'assets/source/New assets';
  readonly bindings: Readonly<Record<string, CompleteMechanicalAssetBinding>>;
}

const SOURCE_ROOT = 'assets/source/New assets' as const;

const BUILDING_SOURCE_SUFFIX: Readonly<Record<string, string>> = {
  'metal-bot-1': 'metal-production-1',
  'metal-bot-2': 'metal-production-2',
  'metal-bot-3': 'metal-production-3',
  'mineral-bot-1': 'mineral-production-1',
  'mineral-bot-2': 'mineral-production-2',
  'gas-probe-1': 'gas-production-1',
  'gas-probe-2': 'gas-production-2',
  'infrared-bot': 'basic-energy',
  'uranium-bot': 'advanced-energy',
  bunker: 'hangar',
  construction: 'construction',
  'teret-factory': 'advanced-factory',
  'metal-vault': 'metal-storage',
  'mineral-treasury': 'mineral-storage',
  'gas-chamber': 'gas-storage',
  scrapyard: 'recycling',
  'trade-center': 'trade-center',
  shipyard: 'shipyard',
  'experimental-center': 'research',
  spaceport: 'spaceport',
  'control-chamber': 'planetary-government',
  bank: 'bank',
  'aksum-obelisk': 'galactic-obelisk',
  'supreme-galactic-gates': 'supreme-galactic-gates',
};

const COMPLETE_BUILDING_BINDINGS: Readonly<Record<string, CompleteMechanicalAssetBinding>> =
  Object.fromEntries(
    Object.values(COMPLETE_BUILDING_CATALOGS)
      .flat()
      .map((definition) => {
        const parsed = parseMechanicalId(definition.id);
        if (parsed?.kind !== 'building' || parsed.factionId === 'shared') {
          throw new Error(\`Invalid complete building ID: \${definition.id}\`);
        }
        const sourceSuffix = BUILDING_SOURCE_SUFFIX[parsed.slug];
        if (sourceSuffix === undefined) {
          throw new Error(\`Missing building source mapping: \${definition.id}\`);
        }
        return [
          definition.id,
          {
            mechanicalId: definition.id,
            category: 'building' as const,
            runtimeSemanticId: definition.id,
            sourcePath:
              \`\${SOURCE_ROOT}/buildings/\${parsed.factionId}/building.\${parsed.factionId}.\${sourceSuffix}.png\`,
          },
        ];
      }),
  );

const COMPLETE_SHIP_BINDINGS: Readonly<Record<string, CompleteMechanicalAssetBinding>> =
  Object.fromEntries(
    Object.values(COMPLETE_SHIP_CATALOGS)
      .flat()
      .map((definition) => [
        definition.id,
        {
          mechanicalId: definition.id,
          category: 'ship' as const,
          sourcePath: \`\${SOURCE_ROOT}/ship/\${definition.factionId}/\${definition.id}.png\`,
        },
      ]),
  );

const COMPLETE_DEFENSE_BINDINGS: Readonly<Record<string, CompleteMechanicalAssetBinding>> =
  Object.fromEntries(
    Object.values(COMPLETE_DEFENSE_CATALOGS)
      .flat()
      .map((definition) => [
        definition.id,
        {
          mechanicalId: definition.id,
          category: 'defense' as const,
          sourcePath: \`\${SOURCE_ROOT}/defenses/\${definition.factionId}/\${definition.id}.png\`,
        },
      ]),
  );

const COMMANDER_SOURCE_NAMES: Readonly<Record<string, string>> = {
  'commander.shared.annihilator': 'commander-ship.annihilator.png',
  'commander.shared.corsair': 'commander-ship.corsair.png',
  'commander.shared.regenerator': 'commander-ship.reanimator.png',
  'commander.shared.viper': 'commander-ship.viper.png',
  'commander.shared.scorpion': 'commander-ship.scorpion.png',
  'commander.shared.phantom': 'commander-ship.phantom.png',
  'commander.shared.hunter': 'commander-ship.hunter.png',
  'commander.shared.typhoon': 'commander-ship.typhoon.png',
  'commander.shared.executor': 'commander-ship.executioner.png',
  'commander.shared.juggernaut': 'commander-ship.juggernaut.png',
  'commander.shared.argo': 'commander-ship.argo.png',
  'commander.shared.judge': 'commander-ship.judge.png',
  'commander.shared.polias': 'commander-ship.polias.png',
};

const COMPLETE_COMMANDER_BINDINGS: Readonly<Record<string, CompleteMechanicalAssetBinding>> =
  Object.fromEntries(
    COMPLETE_COMMANDER_SHIP_CATALOG.map((definition) => [
      definition.id,
      {
        mechanicalId: definition.id,
        category: 'commander' as const,
        sourcePath: \`\${SOURCE_ROOT}/comander_ship/\${COMMANDER_SOURCE_NAMES[definition.id]}\`,
      },
    ]),
  );

export const COMPLETE_MECHANICAL_ASSET_MANIFEST: CompleteMechanicalAssetManifest = {
  version: 1,
  sourceRoot: SOURCE_ROOT,
  bindings: {
    ...COMPLETE_BUILDING_BINDINGS,
    ...COMPLETE_SHIP_BINDINGS,
    ...COMPLETE_DEFENSE_BINDINGS,
    ...COMPLETE_COMMANDER_BINDINGS,
  },
};

const BUILDING_COMPATIBILITY_ASSETS = {
  aegis: {
    resourceMetal: 'building.aegis.metal-extractor',
    resourceCrystal: 'building.aegis.crystal-refinery',
    resourceGas: 'building.aegis.gas-extractor',
    power: 'building.aegis.power-plant',
    research: 'building.aegis.research-lab',
    shipyard: 'building.aegis.shipyard',
    military: 'building.aegis.sensor-array',
    command: 'building.aegis.command',
  },
  synod: {
    resourceMetal: 'building.synod.matter-weave',
    resourceCrystal: 'building.synod.prism-refinery',
    resourceGas: 'building.synod.flux-well',
    power: 'building.synod.resonant-core',
    research: 'building.synod.cognition-vault',
    shipyard: 'building.synod.lattice-yard',
    military: 'building.synod.deep-array',
    command: 'building.synod.concord-nexus',
  },
  veyra: {
    resourceMetal: 'building.veyra.alloy-bloom',
    resourceCrystal: 'building.veyra.crystal-grove',
    resourceGas: 'building.veyra.vapor-root',
    power: 'building.veyra.solar-membrane',
    research: 'building.veyra.memory-pod',
    shipyard: 'building.veyra.living-dock',
    military: 'building.veyra.pulse-canopy',
    command: 'building.veyra.swarm-heart',
  },
} as const;

const SHIP_COMPATIBILITY_ASSETS: Readonly<
  Record<'aegis' | 'synod' | 'veyra', Readonly<Record<CompleteShipClass, string>>>
> = {
  aegis: {
    'small-transport': 'ship.aegis.cargo',
    'large-transport': 'ship.aegis.cargo',
    'light-fighter': 'ship.aegis.scout',
    interceptor: 'ship.aegis.fighter',
    'support-ship': 'ship.aegis.frigate',
    'line-battleship': 'ship.aegis.frigate',
    'heavy-assault': 'ship.aegis.frigate',
    bomber: 'ship.aegis.fighter',
    'planet-destroyer': 'ship.aegis.frigate',
    colonizer: 'ship.aegis.colony',
    recycler: 'ship.aegis.recycler',
    'spy-probe': 'ship.aegis.scout',
    'energy-satellite': 'ship.aegis.cargo',
  },
  synod: {
    'small-transport': 'ship.synod.thread-carrier',
    'large-transport': 'ship.synod.relay-carrier',
    'light-fighter': 'ship.synod.lancet',
    interceptor: 'ship.synod.phase-corvette',
    'support-ship': 'ship.synod.ward-frigate',
    'line-battleship': 'ship.synod.chorus-cruiser',
    'heavy-assault': 'ship.synod.oracle-dreadnought',
    bomber: 'ship.synod.oracle-dreadnought',
    'planet-destroyer': 'ship.synod.oracle-dreadnought',
    colonizer: 'ship.synod.seed-ark',
    recycler: 'ship.synod.salvage-mind',
    'spy-probe': 'ship.synod.whisper',
    'energy-satellite': 'ship.synod.thread-carrier',
  },
  veyra: {
    'small-transport': 'ship.veyra.tendril',
    'large-transport': 'ship.veyra.hive-carrier',
    'light-fighter': 'ship.veyra.sting',
    interceptor: 'ship.veyra.dart',
    'support-ship': 'ship.veyra.shellwing',
    'line-battleship': 'ship.veyra.manta',
    'heavy-assault': 'ship.veyra.leviathan',
    bomber: 'ship.veyra.leviathan',
    'planet-destroyer': 'ship.veyra.leviathan',
    colonizer: 'ship.veyra.brood-ark',
    recycler: 'ship.veyra.devourer',
    'spy-probe': 'ship.veyra.wisp',
    'energy-satellite': 'ship.veyra.tendril',
  },
};

const DEFENSE_COMPATIBILITY_ASSETS: Readonly<
  Record<'aegis' | 'synod' | 'veyra', Readonly<Record<CompleteDefenseClass, string>>>
> = {
  aegis: {
    'basic-turret': 'defense.aegis.gun-battery',
    'laser-turret': 'defense.aegis.gun-battery',
    'ion-turret': 'defense.aegis.missile-battery',
    'plasma-turret': 'defense.aegis.missile-battery',
    'secondary-shield': 'defense.aegis.shield-generator',
    'planetary-shield': 'defense.aegis.shield-generator',
    'laser-ion-battery': 'defense.aegis.missile-battery',
    'plasma-laser-battery': 'defense.aegis.missile-battery',
    'ion-plasma-battery': 'defense.aegis.missile-battery',
  },
  synod: {
    'basic-turret': 'defense.synod.lance-node',
    'laser-turret': 'defense.synod.lance-node',
    'ion-turret': 'defense.synod.predictive-intercept',
    'plasma-turret': 'defense.synod.arc-silo',
    'secondary-shield': 'defense.synod.harmonic-screen',
    'planetary-shield': 'defense.synod.concord-bastion',
    'laser-ion-battery': 'defense.synod.predictive-intercept',
    'plasma-laser-battery': 'defense.synod.arc-silo',
    'ion-plasma-battery': 'defense.synod.concord-bastion',
  },
  veyra: {
    'basic-turret': 'defense.veyra.thorn-spire',
    'laser-turret': 'defense.veyra.thorn-spire',
    'ion-turret': 'defense.veyra.snapper-node',
    'plasma-turret': 'defense.veyra.spore-mortar',
    'secondary-shield': 'defense.veyra.living-veil',
    'planetary-shield': 'defense.veyra.hive-bastion',
    'laser-ion-battery': 'defense.veyra.snapper-node',
    'plasma-laser-battery': 'defense.veyra.spore-mortar',
    'ion-plasma-battery': 'defense.veyra.hive-bastion',
  },
};

function resolveBuildingCompatibilityAsset(mechanicalId: string): AegisVerticalSliceAsset | undefined {
  const parsed = parseMechanicalId(mechanicalId);
  if (parsed?.kind !== 'building' || parsed.factionId === 'shared') return undefined;
  const assets = BUILDING_COMPATIBILITY_ASSETS[parsed.factionId];
  const slug = parsed.slug;
  const fallbackId = slug.startsWith('metal-')
    ? assets.resourceMetal
    : slug.startsWith('mineral-')
      ? assets.resourceCrystal
      : slug.startsWith('gas-')
        ? assets.resourceGas
        : slug === 'infrared-bot' || slug === 'uranium-bot'
          ? assets.power
          : slug === 'experimental-center'
            ? assets.research
            : slug === 'shipyard'
              ? assets.shipyard
              : slug === 'spaceport' || slug === 'teret-factory'
                ? assets.military
                : assets.command;
  const fallback = getFactionMechanicalAsset(fallbackId);
  return fallback === undefined ? undefined : { ...fallback, id: mechanicalId };
}

function resolveShipCompatibilityAsset(mechanicalId: string): AegisVerticalSliceAsset | undefined {
  const parsed = parseMechanicalId(mechanicalId);
  if (parsed?.kind !== 'ship' || parsed.factionId === 'shared') return undefined;
  const shipClass = getCompleteShipClass(mechanicalId);
  if (shipClass === undefined) return undefined;
  const fallback = getFactionMechanicalAsset(SHIP_COMPATIBILITY_ASSETS[parsed.factionId][shipClass]);
  return fallback === undefined ? undefined : { ...fallback, id: mechanicalId };
}

function resolveDefenseCompatibilityAsset(mechanicalId: string): AegisVerticalSliceAsset | undefined {
  const parsed = parseMechanicalId(mechanicalId);
  if (parsed?.kind !== 'defense' || parsed.factionId === 'shared') return undefined;
  const defenseClass = getCompleteDefenseClass(mechanicalId);
  if (defenseClass === undefined) return undefined;
  const fallback = getFactionMechanicalAsset(
    DEFENSE_COMPATIBILITY_ASSETS[parsed.factionId][defenseClass],
  );
  return fallback === undefined ? undefined : { ...fallback, id: mechanicalId };
}

function resolveCommanderCompatibilityAsset(mechanicalId: string): AegisVerticalSliceAsset | undefined {
  const parsed = parseMechanicalId(mechanicalId);
  if (parsed?.kind !== 'commander' || parsed.factionId !== 'shared') return undefined;
  const fallback = getFactionMechanicalAsset('ship.aegis.frigate');
  return fallback === undefined ? undefined : { ...fallback, id: mechanicalId };
}

export interface MechanicalAssetResolution {
  readonly asset: AegisVerticalSliceAsset | undefined;
  readonly source: 'complete-manifest' | 'current-runtime-fallback' | 'missing';
  readonly provenancePath: string | undefined;
}

export function resolveCompleteMechanicalAsset(
  mechanicalId: string,
  manifest: CompleteMechanicalAssetManifest = COMPLETE_MECHANICAL_ASSET_MANIFEST,
): MechanicalAssetResolution {
  const binding = manifest.bindings[mechanicalId];
  const generated = binding?.runtimeSemanticId === undefined
    ? undefined
    : getRuntimeMechanicalAsset(mechanicalId, binding.runtimeSemanticId, binding.category);
  const runtimeAsset = binding?.runtimeAsset ?? generated;
  if (runtimeAsset !== undefined) {
    return {
      asset: runtimeAsset,
      source: 'complete-manifest',
      provenancePath: binding?.sourcePath,
    };
  }

  const fallback =
    getFactionMechanicalAsset(mechanicalId) ??
    resolveBuildingCompatibilityAsset(mechanicalId) ??
    resolveShipCompatibilityAsset(mechanicalId) ??
    resolveDefenseCompatibilityAsset(mechanicalId) ??
    resolveCommanderCompatibilityAsset(mechanicalId);
  if (fallback !== undefined) {
    return {
      asset: fallback,
      source: 'current-runtime-fallback',
      provenancePath: binding?.sourcePath,
    };
  }

  return {
    asset: undefined,
    source: 'missing',
    provenancePath: binding?.sourcePath,
  };
}

export function validateCompleteMechanicalAssetManifest(
  manifest: CompleteMechanicalAssetManifest = COMPLETE_MECHANICAL_ASSET_MANIFEST,
): readonly string[] {
  const errors: string[] = [];
  for (const [mechanicalId, binding] of Object.entries(manifest.bindings)) {
    if (binding.mechanicalId !== mechanicalId) {
      errors.push(\`Mechanical asset manifest key mismatch: \${mechanicalId}\`);
    }
    if (binding.runtimeAsset !== undefined && binding.runtimeAsset.id !== mechanicalId) {
      errors.push(\`Mechanical runtime asset id mismatch: \${mechanicalId}\`);
    }
    if (binding.sourcePath?.startsWith(\`\${manifest.sourceRoot}/\`) === false) {
      errors.push(\`Mechanical source asset is outside source root: \${binding.sourcePath}\`);
    }
  }
  return errors;
}
`);

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
console.log(\`Processed \${outputs.length} runtime asset derivatives from \${path.basename(planPath)}.\`);
`);

await write('scripts/assets/contact-sheet.mjs', `import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { loadConfig, loadJson, resolveRepositoryPath } from './lib.mjs';

const config = await loadConfig();
const bindings = await loadJson(config.mechanicalBindingsPath);
const entries = bindings.entries.filter((entry) => entry.category === 'building');
const factions = ['aegis', 'synod', 'veyra'];
const backgrounds = [
  ['dark', '#061018'],
  ['light', '#e7edf2'],
];
const columns = 6;
const rows = 4;
const cell = 180;
const width = columns * cell;
const height = rows * cell;

for (const faction of factions) {
  const factionEntries = entries
    .filter((entry) => entry.mechanicalId.startsWith(\`building.\${faction}.\`))
    .sort((left, right) => left.mechanicalId.localeCompare(right.mechanicalId));
  if (factionEntries.length !== 24) {
    throw new Error(\`Expected 24 building entries for \${faction}, found \${factionEntries.length}\`);
  }
  for (const [theme, background] of backgrounds) {
    const composites = [];
    for (const [index, entry] of factionEntries.entries()) {
      const input = await sharp(resolveRepositoryPath(entry.outputPath))
        .resize(144, 144, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      composites.push({
        input,
        left: (index % columns) * cell + 18,
        top: Math.floor(index / columns) * cell + 18,
      });
    }
    const output = \`docs/assets/qa/buildings/\${faction}-\${theme}.png\`;
    await mkdir(path.dirname(resolveRepositoryPath(output)), { recursive: true });
    await sharp({
      create: { width, height, channels: 4, background },
    })
      .composite(composites)
      .png({ compressionLevel: 9 })
      .toFile(resolveRepositoryPath(output));
  }
}
console.log('Generated six building contact sheets.');
`);

await write('src/assets/planetIndustryRuntimeAssets.ts', `import { resolveCompleteMechanicalAsset } from './completeMechanicalAssetManifest';
import { getFactionMechanicalRoles } from '../simulation/factions/factionMechanicalRoles';
import { parseMechanicalId } from '../simulation/factions/mechanicalIds';
import { resolveCanonicalBuildingId } from '../simulation/planet/buildingAliases';
import type { FactionId, PlanetZoneId } from '../simulation/planet/types';
import { getUnitDefinition } from '../simulation/units/catalog';

export type BuildingPresentationRole =
  | 'command'
  | 'metal-extractor'
  | 'crystal-refinery'
  | 'gas-extractor'
  | 'power-plant'
  | 'research-lab'
  | 'shipyard'
  | 'sensor-array';

const DEFENSE_SHEETS: Readonly<Record<FactionId, Readonly<Record<string, string>>>> = {
  aegis: {
    kinetic: new URL('../../assets/source/faction-delivery-v1/building_sheets/aegis_defense_platform_sheet.png', import.meta.url).href,
    missile: new URL('../../assets/source/faction-delivery-v1/building_sheets/aegis_missile_battery_sheet.png', import.meta.url).href,
    shield: new URL('../../assets/source/faction-delivery-v1/building_sheets/aegis_shield_generator_sheet.png', import.meta.url).href,
  },
  synod: {
    kinetic: new URL('../../assets/source/faction-delivery-v1/building_sheets/synod_defense_platform_sheet.png', import.meta.url).href,
    missile: new URL('../../assets/source/faction-delivery-v1/building_sheets/synod_missile_battery_sheet.png', import.meta.url).href,
    shield: new URL('../../assets/source/faction-delivery-v1/building_sheets/synod_shield_generator_sheet.png', import.meta.url).href,
  },
  veyra: {
    kinetic: new URL('../../assets/source/faction-delivery-v1/building_sheets/veyra_defense_platform_sheet.png', import.meta.url).href,
    missile: new URL('../../assets/source/faction-delivery-v1/building_sheets/veyra_missile_battery_sheet.png', import.meta.url).href,
    shield: new URL('../../assets/source/faction-delivery-v1/building_sheets/veyra_shield_generator_sheet.png', import.meta.url).href,
  },
};

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

export function getDefensePresentationArtUrl(factionId: FactionId, unitId: string): string {
  const role = getUnitDefinition(unitId)?.role;
  const presentationRole = role === 'missile' || role === 'shield' ? role : 'kinetic';
  return DEFENSE_SHEETS[factionId][presentationRole] ?? DEFENSE_SHEETS[factionId].kinetic ?? '';
}
`);

let planetScreen = await read('src/ui/planetScreen.ts');
planetScreen = planetScreen.replace(
  "import type { AegisVerticalSliceAsset } from '../assets/aegisVerticalSliceAssets';",
  "import type { AegisVerticalSliceAsset } from '../assets/aegisVerticalSliceAssets';\nimport { applyMechanicalAssetArtwork } from '../assets/runtimeMechanicalAssets';",
);
planetScreen = planetScreen.replace(
`function setBuildingArtwork(element: HTMLElement, asset: AegisVerticalSliceAsset): void {
  const column = asset.frame.x / asset.frame.width;
  const row = asset.frame.y / asset.frame.height;
  element.style.backgroundImage = \`url("\${asset.atlasUrl}")\`;
  element.style.backgroundSize = '400% 200%';
  element.style.backgroundPosition = \`\${column === 0 ? 0 : (column / 3) * 100}% \${row === 0 ? 0 : 100}%\`;
}`,
`function setBuildingArtwork(element: HTMLElement, asset: AegisVerticalSliceAsset): void {
  applyMechanicalAssetArtwork(element, asset);
}`,
);
await write('src/ui/planetScreen.ts', planetScreen);

let presentation = await read('src/ui/developmentPresentation.ts');
presentation = presentation.replace('  getBuildingSheetFrame,\n', '');
presentation = presentation.replace(
  "import { createBuildingCardViewModels } from './planetViewModel';\n",
  '',
);
presentation = presentation.replace(
/\n  const visibleCards = createBuildingCardViewModels\(planet\)\.filter\([\s\S]*?\n  }\n}\n\nfunction applyResearchPresentation/,
'\n}\n\nfunction applyResearchPresentation',
);
await write('src/ui/developmentPresentation.ts', presentation);

await write('tests/assets/runtimeMechanicalAssets.test.ts', `import { describe, expect, it } from 'vitest';
import { resolveCompleteMechanicalAsset } from '../../src/assets/completeMechanicalAssetManifest';
import { COMPLETE_BUILDING_CATALOGS } from '../../src/simulation/planet/completeBuildingCatalog';

describe('generated runtime mechanical assets', () => {
  it('resolves every complete building through generated runtime art', () => {
    const definitions = Object.values(COMPLETE_BUILDING_CATALOGS).flat();
    expect(definitions).toHaveLength(72);
    for (const definition of definitions) {
      const resolution = resolveCompleteMechanicalAsset(definition.id);
      expect(resolution.source, definition.id).toBe('complete-manifest');
      expect(resolution.asset?.id, definition.id).toBe(definition.id);
      expect(resolution.asset?.layout, definition.id).toBe('image');
      expect(resolution.asset?.atlasUrl, definition.id).toContain(
        '/assets/generated/catalog/buildings/',
      );
    }
  });

  it('keeps ordinary ships on compatibility art until their dedicated PR', () => {
    expect(resolveCompleteMechanicalAsset('ship.aegis.scout').source).toBe(
      'current-runtime-fallback',
    );
  });
});
`);

let check = await read('scripts/assets/check.mjs');
check = check.replace(
  "const processingPlan = await loadJson(config.processingPlanPath);\nconst atlasPlan = await loadJson(config.atlasPlanPath);",
  `const processingPlan = await loadJson(config.processingPlanPath);
const atlasPlan = await loadJson(config.atlasPlanPath);
const bindings = await loadJson(config.mechanicalBindingsPath);
const runtimeManifest = await loadJson(config.runtimeManifestPath);`,
);
check = check.replace(
  "if (atlasPlan.schemaVersion !== 1 || !Array.isArray(atlasPlan.atlases)) {\n  errors.push('Invalid runtime atlas plan.');\n}",
  `if (atlasPlan.schemaVersion !== 1 || !Array.isArray(atlasPlan.atlases)) {
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
  errors.push(\`Expected 72 building runtime bindings, found \${buildingBindings.length}.\`);
}
const generatedIds = new Set(runtimeManifest.assets.map((asset) => asset.semanticId));
for (const binding of buildingBindings) {
  if (!generatedIds.has(binding.runtimeSemanticId)) {
    errors.push(\`Missing generated building runtime asset: \${binding.mechanicalId}\`);
  }
}
try {
  await readFile(resolveRepositoryPath(config.runtimeTypeScriptManifestPath), 'utf8');
} catch {
  errors.push(\`Missing generated TypeScript runtime manifest: \${config.runtimeTypeScriptManifestPath}\`);
}`,
);
await write('scripts/assets/check.mjs', check);

const status = JSON.parse(await read('docs/project-status.json'));
status.lastMergedPr = 101;
status.lastMergeSha = '2eb5d4996bb24cb7fa48305bb010e48a1263c465';
status.activePr = 102;
status.nextPrAfterActive = 103;
status.nextPrKind = 'implementation';
status.currentBatch.status = 'implementing-buildings';
status.currentBatch.implementationPrs = [102];
status.sourceAssetIntake.catalogArt.status = 'buildings-runtime-integration-active';
await writeJson('docs/project-status.json', status);

await write('docs/changes/pr102-building-runtime-assets.md', `# PR #102 — building runtime assets

- generated and registered 72 approved building WebPs;
- added deterministic mechanical/runtime binding and TypeScript lookup generation;
- routed complete building cards and facility backgrounds through the complete resolver;
- removed building-card MutationObserver replacement and fixed-atlas rendering assumptions;
- added dark/light QA contact sheets and 72-ID coverage tests;
- no gameplay, balance, bot or save-schema changes.
`);

let execution = await read('docs/audits/current-execution-state.md');
execution = execution.replace('Active implementation PR | none', 'Active implementation PR | #102 — ASSET-BUILDINGS');
execution = execution.replace('Active work item | Audit accepted; implementation not started', 'Active work item | ASSET-BUILDINGS');
execution = execution.replace('Exact next action | implement PR #102 only', 'Exact next action | validate and merge PR #102, then start PR #103 from fresh main');
await write('docs/audits/current-execution-state.md', execution);

await rm(path.join(root, 'scripts/automation/implement-pr102.mjs'), { force: true });
await rm(path.join(root, '.github/workflows/pr102-bootstrap.yml'), { force: true });
