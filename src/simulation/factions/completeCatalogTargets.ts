import type { FactionId } from '../planet/types';

export const COMPLETE_CATALOG_TARGETS = {
  buildingsPerFaction: 24,
  sharedTechnologies: 22,
  shipsPerFaction: 13,
  defensesPerFaction: 9,
  sharedCommanderShips: 13,
} as const;

export type CompleteCatalogCategory =
  | 'buildings'
  | 'technologies'
  | 'ships'
  | 'defenses'
  | 'commanderShips';

export type CompleteCatalogRolloutStage =
  | 'foundation'
  | 'buildings'
  | 'technologies'
  | 'ships'
  | 'defenses'
  | 'commander-ships'
  | 'complete';

export interface CompleteCatalogCounts {
  readonly buildings: number;
  readonly technologies: number;
  readonly ships: number;
  readonly defenses: number;
  readonly commanderShips: number;
}

export interface CompleteCatalogTargetManifest {
  readonly version: 1;
  readonly rolloutStage: CompleteCatalogRolloutStage;
  readonly factions: readonly FactionId[];
  readonly targetCounts: CompleteCatalogCounts;
  readonly stableIdExamples: Readonly<Record<CompleteCatalogCategory, string>>;
}

export const COMPLETE_CATALOG_TARGET_MANIFEST: CompleteCatalogTargetManifest = {
  version: 1,
  rolloutStage: 'complete',
  factions: ['aegis', 'synod', 'veyra'],
  targetCounts: {
    buildings: COMPLETE_CATALOG_TARGETS.buildingsPerFaction,
    technologies: COMPLETE_CATALOG_TARGETS.sharedTechnologies,
    ships: COMPLETE_CATALOG_TARGETS.shipsPerFaction,
    defenses: COMPLETE_CATALOG_TARGETS.defensesPerFaction,
    commanderShips: COMPLETE_CATALOG_TARGETS.sharedCommanderShips,
  },
  stableIdExamples: {
    buildings: 'building.aegis.shipyard',
    technologies: 'technology.shared.physics',
    ships: 'ship.aegis.battleship',
    defenses: 'defense.aegis.laser-turret',
    commanderShips: 'commander.shared.annihilator',
  },
};

export const COMPLETE_BUILDING_ROLES = [
  'metal-primary',
  'metal-secondary',
  'metal-tertiary',
  'crystal-primary',
  'crystal-secondary',
  'gas-primary',
  'gas-secondary',
  'solar-power',
  'independent-power',
  'hangar',
  'construction-complex',
  'advanced-factory',
  'metal-storage',
  'crystal-storage',
  'gas-storage',
  'recycler',
  'trade-center',
  'shipyard',
  'research-center',
  'spaceport',
  'government',
  'bank',
  'galactic-obelisk',
  'supreme-galactic-gates',
] as const;

export const COMPLETE_TECHNOLOGY_ROLES = [
  'physics',
  'chemistry',
  'mathematics',
  'astronomy',
  'espionage',
  'computer-systems',
  'ship-armor',
  'fuel-cells',
  'jet-engines',
  'laser-science',
  'ion-science',
  'plasma-science',
  'ecology',
  'hyperspace',
  'parallel-universes',
  'improved-construction',
  'piercing-attack',
  'maneuver-defense',
  'critical-hit',
  'light-armor',
  'medium-armor',
  'heavy-armor',
] as const;

export const COMPLETE_SHIP_ROLES = [
  'small-transport',
  'large-transport',
  'light-fighter',
  'interceptor',
  'support-ship',
  'line-battleship',
  'heavy-assault',
  'bomber',
  'planet-destroyer',
  'colonizer',
  'recycler',
  'spy-probe',
  'energy-satellite',
] as const;

export const COMPLETE_DEFENSE_ROLES = [
  'basic-turret',
  'laser-turret',
  'ion-turret',
  'plasma-turret',
  'secondary-shield',
  'planetary-shield',
  'laser-ion-battery',
  'plasma-laser-battery',
  'ion-plasma-battery',
] as const;

export const COMPLETE_COMMANDER_ROLES = [
  'annihilator',
  'corsair',
  'regenerator',
  'viper',
  'scorpion',
  'phantom',
  'hunter',
  'typhoon',
  'executor',
  'juggernaut',
  'argo',
  'judge',
  'polias',
] as const;

export function validateCompleteCatalogTargetManifest(
  manifest: CompleteCatalogTargetManifest = COMPLETE_CATALOG_TARGET_MANIFEST,
): readonly string[] {
  const errors: string[] = [];
  const expected: CompleteCatalogCounts = {
    buildings: COMPLETE_BUILDING_ROLES.length,
    technologies: COMPLETE_TECHNOLOGY_ROLES.length,
    ships: COMPLETE_SHIP_ROLES.length,
    defenses: COMPLETE_DEFENSE_ROLES.length,
    commanderShips: COMPLETE_COMMANDER_ROLES.length,
  };

  for (const category of Object.keys(expected) as (keyof CompleteCatalogCounts)[]) {
    if (manifest.targetCounts[category] !== expected[category]) {
      errors.push(
        `Complete catalog target mismatch for ${category}: ${manifest.targetCounts[category]} != ${expected[category]}`,
      );
    }
  }

  if (new Set(manifest.factions).size !== manifest.factions.length) {
    errors.push('Complete catalog manifest contains duplicate factions');
  }

  return errors;
}
