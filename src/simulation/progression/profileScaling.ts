import type { ProgressionProfileId } from '../campaign/settings';
import type { ResourceCost } from '../economy/types';
import {
  getProgressionProfileRules,
  scaleProgressionCost,
  scaleProgressionInteger,
} from './profile';

const MINIMUM_PROFILED_DURATION_SECONDS = 1;

export function scaleRepairCost(
  profileId: ProgressionProfileId,
  cost: ResourceCost,
): ResourceCost {
  return scaleProgressionCost(cost, getProgressionProfileRules(profileId).repair.costPermille);
}

export function scaleRepairSeconds(
  profileId: ProgressionProfileId,
  seconds: number,
): number {
  return Math.max(
    MINIMUM_PROFILED_DURATION_SECONDS,
    scaleProgressionInteger(seconds, getProgressionProfileRules(profileId).repair.timePermille),
  );
}

export function getShipUpgradeMaxLevel(profileId: ProgressionProfileId): number {
  return getProgressionProfileRules(profileId).shipUpgrade.maxLevel;
}

export function scaleShipUpgradeCost(
  profileId: ProgressionProfileId,
  cost: ResourceCost,
): ResourceCost {
  return scaleProgressionCost(
    cost,
    getProgressionProfileRules(profileId).shipUpgrade.costPermille,
  );
}

export function scaleShipUpgradeSeconds(
  profileId: ProgressionProfileId,
  seconds: number,
): number {
  return Math.max(
    MINIMUM_PROFILED_DURATION_SECONDS,
    scaleProgressionInteger(
      seconds,
      getProgressionProfileRules(profileId).shipUpgrade.timePermille,
    ),
  );
}
