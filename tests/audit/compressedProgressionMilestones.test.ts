import { describe, expect, it } from 'vitest';
import type { WorldSpeed } from '../../src/simulation/campaign/settings';
import type { FactionId } from '../../src/simulation/planet/types';
import {
  measureAllProgressionMilestones,
  type ProgressionMilestoneId,
} from '../../src/simulation/progression/milestones';

const FACTIONS: readonly FactionId[] = ['aegis', 'synod', 'veyra'];
const SPEEDS: readonly WorldSpeed[] = [1, 2, 5, 10];
const MAXIMUM_MINUTES_AT_X2: Readonly<Record<ProgressionMilestoneId, number>> = {
  'first-combat-ship': 16,
  'first-scout': 30,
  'first-colonizer': 120,
  'first-planet-destroyer': 360,
  'endgame-ready-prerequisites': 720,
};

describe('compressed progression milestone envelope', () => {
  it.each(FACTIONS)('meets every accepted x2 maximum for %s', (factionId) => {
    const milestones = measureAllProgressionMilestones(factionId, 'compressed-v1', 2);
    for (const [milestoneId, maximumMinutes] of Object.entries(MAXIMUM_MINUTES_AT_X2)) {
      const measurement = milestones[milestoneId as ProgressionMilestoneId];
      expect(measurement.realMinutes).toBeLessThanOrEqual(maximumMinutes);
      expect(measurement.canonicalSeconds).toBeGreaterThan(0);
      expect(measurement.cost.metal + measurement.cost.crystal + measurement.cost.gas).toBeGreaterThan(0);
    }
  });

  it.each(FACTIONS)('keeps exact x1/x2/x5/x10 time-only scaling for %s', (factionId) => {
    const measurements = Object.fromEntries(
      SPEEDS.map((speed) => [
        speed,
        measureAllProgressionMilestones(factionId, 'compressed-v1', speed),
      ]),
    ) as Record<WorldSpeed, ReturnType<typeof measureAllProgressionMilestones>>;

    for (const milestoneId of Object.keys(MAXIMUM_MINUTES_AT_X2) as ProgressionMilestoneId[]) {
      const canonicalSeconds = measurements[1][milestoneId].canonicalSeconds;
      const cost = measurements[1][milestoneId].cost;
      for (const speed of SPEEDS) {
        expect(measurements[speed][milestoneId].canonicalSeconds).toBe(canonicalSeconds);
        expect(measurements[speed][milestoneId].realSeconds).toBe(canonicalSeconds / speed);
        expect(measurements[speed][milestoneId].cost).toEqual(cost);
      }
    }
  });
});
