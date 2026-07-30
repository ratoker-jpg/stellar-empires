import { describe, expect, it } from 'vitest';
import {
  getShipUpgradeMaxLevel,
  scaleRepairCost,
  scaleRepairSeconds,
  scaleShipUpgradeCost,
  scaleShipUpgradeSeconds,
} from '../../src/simulation/progression/profileScaling';

const BASE_COST = { metal: 1_000, crystal: 800, gas: 200 } as const;

describe('progression profile repair and upgrade scaling', () => {
  it('preserves legacy repair and upgrade pacing', () => {
    expect(scaleRepairCost('legacy-v1', BASE_COST)).toEqual(BASE_COST);
    expect(scaleRepairSeconds('legacy-v1', 1_000)).toBe(1_000);
    expect(scaleShipUpgradeCost('legacy-v1', BASE_COST)).toEqual(BASE_COST);
    expect(scaleShipUpgradeSeconds('legacy-v1', 1_000)).toBe(1_000);
    expect(getShipUpgradeMaxLevel('legacy-v1')).toBe(10);
  });

  it('applies the accepted compressed profile deterministically', () => {
    expect(scaleRepairCost('compressed-v1', BASE_COST)).toEqual({
      metal: 850,
      crystal: 680,
      gas: 170,
    });
    expect(scaleRepairSeconds('compressed-v1', 1_000)).toBe(700);
    expect(scaleRepairSeconds('compressed-v1', 0)).toBe(1);
    expect(scaleShipUpgradeCost('compressed-v1', BASE_COST)).toEqual({
      metal: 700,
      crystal: 560,
      gas: 140,
    });
    expect(scaleShipUpgradeSeconds('compressed-v1', 1_000)).toBe(700);
    expect(scaleShipUpgradeSeconds('compressed-v1', 0)).toBe(1);
    expect(getShipUpgradeMaxLevel('compressed-v1')).toBe(5);
  });
});
