import type { ProgressionProfileId } from '../campaign/settings';
import type { ResourceCost, ResourceId } from '../economy/types';
import { scaleProgressionCost, scaleProgressionInteger } from './profile';

export interface EconomyProgressionProfile {
  readonly startingResources: Readonly<Record<ResourceId, number>>;
  readonly baseStorageCapacity: number;
  readonly basePopulationCapacity: number;
  readonly productionContributionPermille: number;
  readonly storageContributionPermille: number;
  readonly rewardPermille: number;
}

const LEGACY_ECONOMY_PROFILE: EconomyProgressionProfile = {
  startingResources: { metal: 2_500, crystal: 1_800, gas: 900 },
  baseStorageCapacity: 10_000,
  basePopulationCapacity: 10,
  productionContributionPermille: 1_000,
  storageContributionPermille: 1_000,
  rewardPermille: 1_000,
};

const COMPRESSED_ECONOMY_PROFILE: EconomyProgressionProfile = {
  startingResources: { metal: 30_000, crystal: 30_000, gas: 15_000 },
  baseStorageCapacity: 60_000,
  basePopulationCapacity: 25,
  productionContributionPermille: 6_000,
  storageContributionPermille: 3_000,
  rewardPermille: 2_000,
};

export function getEconomyProgressionProfile(
  profileId: ProgressionProfileId,
): EconomyProgressionProfile {
  return profileId === 'compressed-v1'
    ? COMPRESSED_ECONOMY_PROFILE
    : LEGACY_ECONOMY_PROFILE;
}

export function scaleProductionContribution(
  profileId: ProgressionProfileId,
  value: number,
): number {
  return scaleProgressionInteger(
    value,
    getEconomyProgressionProfile(profileId).productionContributionPermille,
  );
}

export function scaleStorageContribution(
  profileId: ProgressionProfileId,
  value: number,
): number {
  return scaleProgressionInteger(
    value,
    getEconomyProgressionProfile(profileId).storageContributionPermille,
  );
}

export function scaleProgressionReward(
  profileId: ProgressionProfileId,
  reward: ResourceCost,
): ResourceCost {
  return scaleProgressionCost(
    reward,
    getEconomyProgressionProfile(profileId).rewardPermille,
  );
}
