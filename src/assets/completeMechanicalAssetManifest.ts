import type { AegisVerticalSliceAsset } from './aegisVerticalSliceAssets';
import { parseMechanicalId } from '../simulation/factions/mechanicalIds';
import { COMPLETE_SHIP_CATALOGS, getCompleteShipClass } from '../simulation/units/completeShipCatalog';
import type { CompleteShipClass } from '../simulation/units/types';
import { getFactionMechanicalAsset } from './factionMechanicalAssets';

export type CompleteMechanicalAssetCategory =
  | 'building'
  | 'technology'
  | 'ship'
  | 'defense'
  | 'commander';

export interface CompleteMechanicalAssetBinding {
  readonly mechanicalId: string;
  readonly category: CompleteMechanicalAssetCategory;
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

const COMPLETE_SHIP_BINDINGS: Readonly<Record<string, CompleteMechanicalAssetBinding>> = Object.fromEntries(
  Object.values(COMPLETE_SHIP_CATALOGS)
    .flat()
    .map((definition) => [
      definition.id,
      {
        mechanicalId: definition.id,
        category: 'ship' as const,
        sourcePath: `${SOURCE_ROOT}/ship/${definition.factionId}/${definition.id}.png`,
      },
    ]),
);

export const COMPLETE_MECHANICAL_ASSET_MANIFEST: CompleteMechanicalAssetManifest = {
  version: 1,
  sourceRoot: SOURCE_ROOT,
  bindings: COMPLETE_SHIP_BINDINGS,
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
  if (binding?.runtimeAsset !== undefined) {
    return {
      asset: binding.runtimeAsset,
      source: 'complete-manifest',
      provenancePath: binding.sourcePath,
    };
  }

  const fallback =
    getFactionMechanicalAsset(mechanicalId) ??
    resolveBuildingCompatibilityAsset(mechanicalId) ??
    resolveShipCompatibilityAsset(mechanicalId);
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
      errors.push(`Mechanical asset manifest key mismatch: ${mechanicalId}`);
    }
    if (binding.runtimeAsset !== undefined && binding.runtimeAsset.id !== mechanicalId) {
      errors.push(`Mechanical runtime asset id mismatch: ${mechanicalId}`);
    }
    if (binding.sourcePath?.startsWith(`${manifest.sourceRoot}/`) === false) {
      errors.push(`Mechanical source asset is outside source root: ${binding.sourcePath}`);
    }
  }
  return errors;
}
