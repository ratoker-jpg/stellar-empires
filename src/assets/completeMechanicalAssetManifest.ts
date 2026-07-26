import type { AegisVerticalSliceAsset } from './aegisVerticalSliceAssets';
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
          throw new Error(`Invalid complete building ID: ${definition.id}`);
        }
        const sourceSuffix = BUILDING_SOURCE_SUFFIX[parsed.slug];
        if (sourceSuffix === undefined) {
          throw new Error(`Missing building source mapping: ${definition.id}`);
        }
        return [
          definition.id,
          {
            mechanicalId: definition.id,
            category: 'building' as const,
            runtimeSemanticId: definition.id,
            sourcePath:
              `${SOURCE_ROOT}/buildings/${parsed.factionId}/building.${parsed.factionId}.${sourceSuffix}.png`,
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
          sourcePath: `${SOURCE_ROOT}/ship/${definition.factionId}/${definition.id}.png`,
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
          sourcePath: `${SOURCE_ROOT}/defenses/${definition.factionId}/${definition.id}.png`,
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
        sourcePath: `${SOURCE_ROOT}/comander_ship/${COMMANDER_SOURCE_NAMES[definition.id]}`,
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
