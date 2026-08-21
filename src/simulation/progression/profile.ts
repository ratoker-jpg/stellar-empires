import {
  LEGACY_PROGRESSION_PROFILE_ID,
  type ProgressionProfileId,
} from '../campaign/settings';
import type { ResourceCost } from '../economy/types';
import {
  COMPLETE_BUILDING_CATALOGS,
  getCompleteBuildingIds,
  type CompleteBuildingIds,
} from '../planet/completeBuildingCatalog';
import type { BuildingDefinition, BuildingRequirement } from '../planet/buildingDefinitions';
import type { FactionId } from '../planet/types';
import {
  COMPLETE_RESEARCH_CATALOGS,
  getCompleteResearchId,
} from '../research/completeResearchCatalog';
import type { ResearchDefinition, ResearchRequirement } from '../research/types';

const FACTION_IDS: readonly FactionId[] = ['aegis', 'synod', 'veyra'];

export interface ProgressionProfileRules {
  readonly id: ProgressionProfileId;
  readonly building: {
    readonly baseCostPermille: number;
    readonly costGrowthPermille: number;
    readonly baseTimePermille: number;
    readonly timeGrowthPermille: number;
  };
  readonly research: {
    readonly baseCostPermille: number;
    readonly costGrowthPermille: number;
    readonly baseTimePermille: number;
    readonly timeGrowthPermille: number;
  };
  readonly unit: {
    readonly costPermille: number;
    readonly timePermille: number;
  };
  readonly repair: {
    readonly costPermille: number;
    readonly timePermille: number;
  };
  readonly shipUpgrade: {
    readonly maxLevel: number;
    readonly costPermille: number;
    readonly timePermille: number;
  };
}

const PROFILE_RULES: Readonly<Record<ProgressionProfileId, ProgressionProfileRules>> = {
  'legacy-v1': {
    id: 'legacy-v1',
    building: {
      baseCostPermille: 1_000,
      costGrowthPermille: 1_600,
      baseTimePermille: 1_000,
      timeGrowthPermille: 1_450,
    },
    research: {
      baseCostPermille: 1_000,
      costGrowthPermille: 1_600,
      baseTimePermille: 1_000,
      timeGrowthPermille: 1_450,
    },
    unit: { costPermille: 1_000, timePermille: 1_000 },
    repair: { costPermille: 1_000, timePermille: 1_000 },
    shipUpgrade: { maxLevel: 10, costPermille: 1_000, timePermille: 1_000 },
  },
  'compressed-v1': {
    id: 'compressed-v1',
    building: {
      baseCostPermille: 1_000,
      costGrowthPermille: 1_280,
      baseTimePermille: 600,
      timeGrowthPermille: 1_180,
    },
    research: {
      baseCostPermille: 900,
      costGrowthPermille: 1_280,
      baseTimePermille: 600,
      timeGrowthPermille: 1_180,
    },
    unit: { costPermille: 850, timePermille: 700 },
    repair: { costPermille: 850, timePermille: 700 },
    shipUpgrade: { maxLevel: 5, costPermille: 700, timePermille: 700 },
  },
};

const COMPRESSED_BUILDING_CAPS: Readonly<Record<keyof CompleteBuildingIds, number>> = {
  metalPrimary: 10,
  metalSecondary: 6,
  metalTertiary: 4,
  crystalPrimary: 10,
  crystalSecondary: 6,
  gasPrimary: 10,
  gasSecondary: 6,
  solarPower: 10,
  independentPower: 5,
  hangar: 8,
  constructionComplex: 8,
  advancedFactory: 8,
  metalStorage: 6,
  crystalStorage: 6,
  gasStorage: 6,
  scrapyard: 5,
  tradeCenter: 5,
  shipyard: 8,
  researchCenter: 8,
  spaceport: 8,
  government: 6,
  bank: 5,
  galacticObelisk: 1,
  supremeGalacticGates: 1,
};

const COMPRESSED_RESEARCH_CAPS: Readonly<Record<string, number>> = {
  physics: 6,
  chemistry: 6,
  mathematics: 6,
  astronomy: 6,
  espionage: 6,
  'computer-systems': 6,
  'ship-armor': 6,
  'fuel-cells': 6,
  'jet-engines': 6,
  'laser-science': 6,
  'ion-science': 5,
  'plasma-science': 4,
  ecology: 5,
  hyperspace: 6,
  'parallel-universes': 3,
  'improved-construction': 6,
  'piercing-attack': 5,
  'maneuver-defense': 5,
  'critical-hit': 5,
  'light-armor': 1,
  'medium-armor': 1,
  'heavy-armor': 1,
};

const compressedBuildingCapById = new Map<string, number>();
const legacyBuildingCapById = new Map<string, number>();
const compressedResearchCapById = new Map<string, number>();
const legacyResearchCapById = new Map<string, number>();
const compressedEndgameBaseSecondsById = new Map<string, number>();
const compressedEndgameBaseCostPermilleById = new Map<string, number>();

for (const factionId of FACTION_IDS) {
  const buildingIds = getCompleteBuildingIds(factionId);
  for (const [role, cap] of Object.entries(COMPRESSED_BUILDING_CAPS)) {
    compressedBuildingCapById.set(buildingIds[role as keyof CompleteBuildingIds], cap);
  }
  for (const definition of COMPLETE_BUILDING_CATALOGS[factionId]) {
    legacyBuildingCapById.set(definition.id, definition.maxLevel);
  }
  compressedEndgameBaseSecondsById.set(buildingIds.galacticObelisk, 14_400);
  compressedEndgameBaseSecondsById.set(buildingIds.supremeGalacticGates, 14_400);
  compressedEndgameBaseCostPermilleById.set(buildingIds.galacticObelisk, 75);

  for (const [slug, cap] of Object.entries(COMPRESSED_RESEARCH_CAPS)) {
    compressedResearchCapById.set(getCompleteResearchId(factionId, slug), cap);
  }
  for (const definition of COMPLETE_RESEARCH_CATALOGS[factionId]) {
    legacyResearchCapById.set(definition.id, definition.maxLevel);
  }
}

export function getProgressionProfileRules(
  profileId: ProgressionProfileId,
): ProgressionProfileRules {
  return PROFILE_RULES[profileId];
}

export function scaleProgressionInteger(value: number, permille: number): number {
  return Math.max(0, Math.ceil((value * permille) / 1_000));
}

export function growProgressionInteger(
  value: number,
  targetLevel: number,
  growthPermille: number,
): number {
  let result = value;
  for (let level = 1; level < targetLevel; level += 1) {
    result = scaleProgressionInteger(result, growthPermille);
  }
  return result;
}

export function scaleProgressionCost(
  cost: ResourceCost,
  permille: number,
): ResourceCost {
  return {
    metal: scaleProgressionInteger(cost.metal, permille),
    crystal: scaleProgressionInteger(cost.crystal, permille),
    gas: scaleProgressionInteger(cost.gas, permille),
  };
}

export function getBuildingMaxLevel(
  profileId: ProgressionProfileId,
  definition: BuildingDefinition,
): number {
  if (profileId === LEGACY_PROGRESSION_PROFILE_ID) return definition.maxLevel;
  return compressedBuildingCapById.get(definition.id) ?? definition.maxLevel;
}

export function getBuildingMaxLevelById(
  profileId: ProgressionProfileId,
  buildingId: string,
): number | undefined {
  return profileId === LEGACY_PROGRESSION_PROFILE_ID
    ? legacyBuildingCapById.get(buildingId)
    : compressedBuildingCapById.get(buildingId) ?? legacyBuildingCapById.get(buildingId);
}

export function getBuildingBaseSeconds(
  profileId: ProgressionProfileId,
  definition: BuildingDefinition,
): number {
  if (profileId !== LEGACY_PROGRESSION_PROFILE_ID) {
    const override = compressedEndgameBaseSecondsById.get(definition.id);
    if (override !== undefined) return override;
  }
  return scaleProgressionInteger(
    definition.baseBuildSeconds,
    getProgressionProfileRules(profileId).building.baseTimePermille,
  );
}

export function getBuildingBaseCostPermille(
  profileId: ProgressionProfileId,
  definition: BuildingDefinition,
): number {
  if (profileId !== LEGACY_PROGRESSION_PROFILE_ID) {
    const override = compressedEndgameBaseCostPermilleById.get(definition.id);
    if (override !== undefined) return override;
  }
  return getProgressionProfileRules(profileId).building.baseCostPermille;
}

export function resolveBuildingRequirement(
  profileId: ProgressionProfileId,
  requirement: BuildingRequirement,
): BuildingRequirement {
  const cap = getBuildingMaxLevelById(profileId, requirement.buildingId);
  return cap === undefined
    ? requirement
    : { ...requirement, level: Math.min(requirement.level, cap) };
}

export function getResearchMaxLevel(
  profileId: ProgressionProfileId,
  definition: ResearchDefinition,
): number {
  if (profileId === LEGACY_PROGRESSION_PROFILE_ID) return definition.maxLevel;
  return compressedResearchCapById.get(definition.id) ?? definition.maxLevel;
}

export function getResearchMaxLevelById(
  profileId: ProgressionProfileId,
  technologyId: string,
): number | undefined {
  return profileId === LEGACY_PROGRESSION_PROFILE_ID
    ? legacyResearchCapById.get(technologyId)
    : compressedResearchCapById.get(technologyId) ?? legacyResearchCapById.get(technologyId);
}

export function resolveResearchRequirement(
  profileId: ProgressionProfileId,
  requirement: ResearchRequirement,
): ResearchRequirement {
  const cap = getResearchMaxLevelById(profileId, requirement.technologyId);
  return cap === undefined
    ? requirement
    : { ...requirement, level: Math.min(requirement.level, cap) };
}
