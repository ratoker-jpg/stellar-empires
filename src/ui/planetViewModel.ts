import { resolveCompleteMechanicalAsset } from '../assets/completeMechanicalAssetManifest';
import type { AegisVerticalSliceAsset } from '../assets/aegisVerticalSliceAssets';
import type { ProgressionProfileId } from '../simulation/campaign/settings';
import type { ResourceCost } from '../simulation/economy/types';
import { getBuildingCatalogForFaction } from '../simulation/factions/factionMechanicalCatalogRegistry';
import {
  getBuildingDefinition,
  type BuildingDefinition,
} from '../simulation/planet/buildingCatalog';
import {
  calculateBuildingCost,
  calculateBuildSeconds,
  canAfford,
  findMissingRequirements,
  getBuildingLevel,
} from '../simulation/planet/buildingProgression';
import { isBuildingEndgameLocked } from '../simulation/planet/buildingOperations';
import type { PlanetState, PlanetZoneId } from '../simulation/planet/types';
import { getBuildingMaxLevel } from '../simulation/progression/profile';

export interface BuildingCardViewModel {
  readonly id: string;
  readonly name: string;
  readonly zoneId: PlanetZoneId;
  readonly level: number;
  readonly targetLevel: number;
  readonly maxLevel: number;
  readonly cost: ResourceCost;
  readonly buildSeconds: number;
  readonly available: boolean;
  readonly blockReason: string | null;
  readonly asset: AegisVerticalSliceAsset;
}

function requireBuildingAsset(definition: BuildingDefinition): AegisVerticalSliceAsset {
  const asset = resolveCompleteMechanicalAsset(definition.assetId).asset;
  if (asset === undefined) {
    throw new Error(`Building asset is not registered: ${definition.assetId}`);
  }
  return asset;
}

function getBlockReason(
  planet: PlanetState,
  definition: BuildingDefinition,
  currentLevel: number,
  maxLevel: number,
  cost: ResourceCost,
  profileId: ProgressionProfileId,
): string | null {
  if (isBuildingEndgameLocked(definition.id)) {
    return 'Откроется после внедрения союзного endgame';
  }
  if (planet.buildQueue.length > 0) {
    return 'Очередь строительства занята';
  }
  if (currentLevel >= maxLevel) {
    return 'Достигнут максимальный уровень';
  }

  const missing = findMissingRequirements(planet, definition.requirements, profileId);
  if (missing.length > 0) {
    const requirement = missing[0];
    const requirementName =
      requirement === undefined
        ? 'неизвестное здание'
        : (getBuildingDefinition(requirement.buildingId)?.name ?? requirement.buildingId);
    return `${requirementName} ур. ${requirement?.level ?? 1}`;
  }

  if (currentLevel === 0) {
    const zone = planet.zones[definition.zoneId];
    if (zone.fieldLimit - zone.usedFields < definition.fieldCost) {
      return 'Нет свободных полей в зоне';
    }
  }

  if (!canAfford(planet.economy, cost)) {
    return 'Недостаточно ресурсов';
  }
  return null;
}

export function createBuildingCardViewModels(
  planet: PlanetState,
  profileId: ProgressionProfileId,
): readonly BuildingCardViewModel[] {
  return getBuildingCatalogForFaction(planet.factionId).map((definition) => {
    const level = getBuildingLevel(planet.buildings, definition.id);
    const maxLevel = getBuildingMaxLevel(profileId, definition);
    const targetLevel = Math.min(level + 1, maxLevel);
    const cost = calculateBuildingCost(definition, targetLevel, profileId);
    const blockReason = getBlockReason(
      planet,
      definition,
      level,
      maxLevel,
      cost,
      profileId,
    );

    return {
      id: definition.id,
      name: definition.name,
      zoneId: definition.zoneId,
      level,
      targetLevel,
      maxLevel,
      cost,
      buildSeconds: calculateBuildSeconds(definition, targetLevel, profileId, planet),
      available: blockReason === null,
      blockReason,
      asset: requireBuildingAsset(definition),
    };
  });
}

export function formatGameDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}ч ${minutes}м`;
  }
  if (minutes > 0) {
    return `${minutes}м ${remainingSeconds}с`;
  }
  return `${remainingSeconds}с`;
}
