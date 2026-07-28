import { describe, expect, it } from 'vitest';
import type { PlanetDemolitionReport } from '../../src/simulation/combat/types';
import { createPlanetDemolitionViewModel } from '../../src/ui/planetDemolitionReport';

const REPORT: PlanetDemolitionReport = {
  outcome: 'applied',
  contributions: [
    {
      unitId: 'ship.aegis.death-star',
      factionId: 'aegis',
      count: 3,
      weaponLevel: 10,
      pointsPerShip: 100,
      totalPoints: 300,
    },
  ],
  defensePopulation: 2_500,
  rawPoints: 300,
  defenseReduction: 100,
  finalPoints: 200,
  baseChanceBasisPoints: 4_000,
  commanderBonusBasisPoints: 1_000,
  finalChanceBasisPoints: 5_000,
  maximumSelectedBuildings: 1,
  allEligibleBuildingsSelected: false,
  eligibleBuildingCount: 4,
  selectedBuildingIds: ['building.aegis.metal-bot-1'],
  rolls: [
    {
      buildingId: 'building.aegis.metal-bot-1',
      levelBefore: 4,
      levelAfter: 3,
      chanceBasisPoints: 5_000,
      rollBasisPoints: 1_234,
      demolished: true,
    },
  ],
  cancelledQueueItemIds: ['build-42'],
};

describe('planet demolition report presentation', () => {
  it('creates a concise deterministic view model for the routed report card', () => {
    expect(createPlanetDemolitionViewModel(REPORT)).toEqual({
      summary: 'Демонтаж планеты · снято уровней 1',
      overview: 'результат applied · очки 300 − 100 = 200 · шанс 40% + командир 10% = 50%',
      contributions: [
        'ship.aegis.death-star × 3 · оружие 10 · 100/корабль · всего 300',
      ],
      rolls: [
        {
          buildingId: 'building.aegis.metal-bot-1',
          level: '4 → 3',
          chance: '50%',
          roll: '1234',
          result: 'уровень снят',
        },
      ],
      cancelledQueues: 'Очереди отменены без возврата: build-42',
    });
  });

  it('preserves basis-point precision for odd Annihilator levels', () => {
    const report: PlanetDemolitionReport = {
      ...REPORT,
      baseChanceBasisPoints: 2_000,
      commanderBonusBasisPoints: 50,
      finalChanceBasisPoints: 2_050,
      rolls: [
        {
          ...REPORT.rolls[0]!,
          chanceBasisPoints: 2_050,
        },
      ],
    };
    const model = createPlanetDemolitionViewModel(report);
    expect(model.overview).toContain('шанс 20% + командир 0.5% = 20.5%');
    expect(model.rolls[0]?.chance).toBe('20.5%');
  });
});
