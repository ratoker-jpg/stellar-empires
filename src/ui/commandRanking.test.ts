import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../simulation/createInitialGameState';
import { createEmpireRanking, createPlayerCommandProfile } from './commandRanking';

describe('command ranking', () => {
  it('contains every empire exactly once and is deterministically sorted', () => {
    const state = createInitialGameState('ranking-deterministic');
    const first = createEmpireRanking(state);
    const second = createEmpireRanking(state);
    expect(first).toEqual(second);
    expect(first.map((entry) => entry.empireId).sort()).toEqual([...state.empires].sort());
    expect(first.map((entry) => entry.rank)).toEqual([1, 2, 3, 4]);
    for (let index = 1; index < first.length; index += 1) {
      expect(first[index - 1]?.score).toBeGreaterThanOrEqual(first[index]?.score ?? 0);
    }
  });

  it('raises the player rank when its economy is substantially increased', () => {
    const state = createInitialGameState('ranking-player');
    const boosted = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.ownerEmpireId !== 'player'
          ? planet
          : {
              ...planet,
              economy: {
                ...planet.economy,
                resources: Object.fromEntries(
                  Object.entries(planet.economy.resources).map(([resourceId, stock]) => [
                    resourceId,
                    { ...stock, amount: stock.amount + 10_000_000 },
                  ]),
                ) as typeof planet.economy.resources,
              },
            },
      ),
    };
    expect(createPlayerCommandProfile(boosted).rank).toBe(1);
  });
});
