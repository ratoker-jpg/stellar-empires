import {
  AEGIS_VERTICAL_SLICE_ASSETS,
  type AegisVerticalSliceAsset,
} from '../assets/aegisVerticalSliceAssets';
import type { ResourceCost } from '../simulation/economy/types';
import {
  AEGIS_BUILDING_CATALOG,
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
import type { PlanetState, PlanetZoneId } from '../simulation/planet/types';

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
  const asset = AEGIS_VERTICAL_SLICE_ASSETS.find(
    (candidate) => candidate.category === 'building' && candidate.id === definition.assetId,
  );

  if (asset === undefined) {
    throw new Error(`Building asset is not registered: ${definition.assetId}`);
  }

  return asset;
}

function getBlockReason(
  planet: PlanetState,
  definition: BuildingDefinition,
  currentLevel: number,
  cost: ResourceCost,
): string | null {
  if (planet.buildQueue.length > 0) {
    return 'Очередь строительства занята';
  }

  if (currentLevel >= definition.maxLevel) {
    return 'Достигнут максимальный уровень';
  }

  const missing = findMissingRequirements(planet, definition.requirements);

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
): readonly BuildingCardViewModel[] {
  return AEGIS_BUILDING_CATALOG.filter(
    (definition) => definition.factionId === planet.factionId,
  ).map((definition) => {
    const level = getBuildingLevel(planet.buildings, definition.id);
    const targetLevel = level + 1;
    const cost = calculateBuildingCost(definition, targetLevel);
    const blockReason = getBlockReason(planet, definition, level, cost);

    return {
      id: definition.id,
      name: definition.name,
      zoneId: definition.zoneId,
      level,
      targetLevel,
      maxLevel: definition.maxLevel,
      cost,
      buildSeconds: calculateBuildSeconds(definition, targetLevel),
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
