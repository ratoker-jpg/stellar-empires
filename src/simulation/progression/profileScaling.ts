import type { ProgressionProfileId } from '../campaign/settings';
import type { ResourceCost } from '../economy/types';
import {
  getProgressionProfileRules,
  scaleProgressionCost,
  scaleProgressionInteger,
} from './profile';

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
    1,
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
    1,
    scaleProgressionInteger(
      seconds,
      getProgressionProfileRules(profileId).shipUpgrade.timePermille,
    ),
  );
}
