import { describe, expect, it } from 'vitest';
import type { BattleReport } from '../../src/simulation/combat/types';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  calculatePveRewardMultiplier,
  PIRATE_HUNT_REWARD_PERMILLE,
} from '../../src/simulation/pve/pveBalance';
import { PIRATE_EMPIRE_ID } from '../../src/simulation/pve/neutralForces';
import {
  startWorldEventAt,
  WORLD_EVENT_CATALOG,
} from '../../src/simulation/pve/worldEvents';
import type { GameState } from '../../src/simulation/types';

function completedPirateRaid(
  state: GameState,
  targetPlanetId: string,
  resolvedAt: number,
): BattleReport {
  const target = state.planets.find((planet) => planet.id === targetPlanetId);
  if (target === undefined) throw new Error('Missing pirate target.');
  return {
    id: `pirate-raid-${targetPlanetId}-${resolvedAt}`,
    seed: state.seed,
    resolvedAt,
    targetPlanetId,
    targetGalaxyPlanetId: target.galaxyPlanetId,
    targetCoordinate: target.coordinate,
    attackerEmpireId: 'player',
    defenderEmpireId: PIRATE_EMPIRE_ID,
    winner: 'attacker',
    rounds: [],
    attackerInitial: {},
    defenderInitial: {},
    attackerRemaining: {},
    defenderRemaining: {},
    mode: 'pve',
  };
}

describe('PvE balance', () => {
  it('applies pirate-hunt only to the active targeted base after anti-repeat scaling', () => {
    const initial = createInitialGameState('pirate-hunt-reward');
    const pirates = initial.planets.filter((planet) => planet.ownerEmpireId === PIRATE_EMPIRE_ID);
    const target = pirates[0];
    const other = pirates[1];
    if (target === undefined || other === undefined) throw new Error('Missing pirate targets.');
    const report = completedPirateRaid(initial, target.id, 0);
    const withHistory: GameState = {
      ...initial,
      eventLog: [
        ...initial.eventLog,
        {
          event: {
            id: `event-${report.id}`,
            executeAt: report.resolvedAt,
            sequence: 90_000,
            payload: { type: 'BATTLE_REPORT', report },
          },
          executedAt: report.resolvedAt,
        },
      ],
    };
    const active = startWorldEventAt(
      withHistory,
      'pirate-hunt',
      'planet',
      target.id,
      0,
      0,
    );

    expect(PIRATE_HUNT_REWARD_PERMILLE).toBe(1_500);
    expect(calculatePveRewardMultiplier(active, 'player', 'pirate-raid', target.id, 100)).toBe(1_125);
    expect(calculatePveRewardMultiplier(active, 'player', 'pirate-raid', other.id, 100)).toBe(1_000);
    expect(
      calculatePveRewardMultiplier(
        active,
        'player',
        'pirate-raid',
        target.id,
        WORLD_EVENT_CATALOG['pirate-hunt'].durationSeconds,
      ),
    ).toBe(750);
  });
});
