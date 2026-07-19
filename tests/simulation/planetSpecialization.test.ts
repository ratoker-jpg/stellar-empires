import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeGameCommand } from '../../src/simulation/executeGameCommand';
import { COLONY_SPECIALIZATION_CHANGE_COST } from '../../src/simulation/planet/specialization';
import type { GameState } from '../../src/simulation/types';

function richState(seed: string): GameState {
  const state = createInitialGameState(seed);
  const home = state.planets.find((planet) => planet.ownerEmpireId === 'player');
  if (home === undefined) throw new Error('Player planet missing.');
  return {
    ...state,
    planets: state.planets.map((planet) =>
      planet.id === home.id
        ? {
            ...planet,
            economy: {
              ...planet.economy,
              resources: {
                metal: { ...planet.economy.resources.metal, amount: 100_000, capacity: 100_000 },
                crystal: { ...planet.economy.resources.crystal, amount: 100_000, capacity: 100_000 },
                gas: { ...planet.economy.resources.gas, amount: 100_000, capacity: 100_000 },
              },
            },
          }
        : planet,
    ),
  };
}

describe('colony specialization', () => {
  it('starts schema v10 planets as balanced colonies', () => {
    const state = createInitialGameState('specialization-initial');
    expect(state.schemaVersion).toBe(10);
    expect(state.planets.every((planet) => planet.specialization === 'balanced')).toBe(true);
  });

  it('charges reorganization cost and immediately applies mining output', () => {
    const state = richState('specialization-mining');
    const home = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    const baseMetalRate = home.economy.resources.metal.productionPerHour;
    const result = executeGameCommand(state, {
      type: 'SET_PLANET_SPECIALIZATION',
      empireId: 'player',
      planetId: home.id,
      specialization: 'mining',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const updated = result.value.planets.find((planet) => planet.id === home.id)!;
    expect(updated.specialization).toBe('mining');
    expect(updated.economy.resources.metal.amount).toBe(
      home.economy.resources.metal.amount - COLONY_SPECIALIZATION_CHANGE_COST.metal,
    );
    expect(updated.economy.resources.metal.productionPerHour).toBe(
      Math.floor(baseMetalRate * 1.15),
    );
  });

  it('blocks specialization changes while local or funded research queues are active', () => {
    const state = richState('specialization-busy');
    const home = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    const localBusy: GameState = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.id === home.id
          ? {
              ...planet,
              buildQueue: [
                {
                  id: 'busy-build',
                  buildingId: 'building.aegis.command',
                  targetLevel: 2,
                  startedAt: 0,
                  completesAt: 60,
                  cost: { metal: 1, crystal: 1, gas: 1 },
                },
              ],
            }
          : planet,
      ),
    };
    expect(
      executeGameCommand(localBusy, {
        type: 'SET_PLANET_SPECIALIZATION',
        empireId: 'player',
        planetId: home.id,
        specialization: 'science',
      }),
    ).toMatchObject({ ok: false, code: 'SPECIALIZATION_LOCAL_QUEUE_BUSY' });

    const researchBusy: GameState = {
      ...state,
      research: state.research.map((research) =>
        research.empireId === 'player'
          ? {
              ...research,
              queue: [
                {
                  id: 'research-busy',
                  technologyId: 'technology.aegis.construction',
                  targetLevel: 1,
                  startedAt: 0,
                  completesAt: 60,
                  cost: { metal: 1, crystal: 1, gas: 1 },
                  planetId: home.id,
                },
              ],
            }
          : research,
      ),
    };
    expect(
      executeGameCommand(researchBusy, {
        type: 'SET_PLANET_SPECIALIZATION',
        empireId: 'player',
        planetId: home.id,
        specialization: 'science',
      }),
    ).toMatchObject({ ok: false, code: 'SPECIALIZATION_RESEARCH_QUEUE_BUSY' });
  });

  it('accelerates research funded by a science world', () => {
    const base = richState('specialization-science');
    const home = base.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    const prepared = (specialization: 'balanced' | 'science'): GameState => ({
      ...base,
      planets: base.planets.map((planet) =>
        planet.id === home.id
          ? {
              ...planet,
              specialization,
              buildings: [
                ...planet.buildings,
                { buildingId: 'building.aegis.research-lab', level: 1 },
              ],
            }
          : planet,
      ),
    });
    const normal = executeGameCommand(prepared('balanced'), {
      type: 'QUEUE_RESEARCH',
      empireId: 'player',
      planetId: home.id,
      technologyId: 'technology.aegis.construction',
    });
    const specialized = executeGameCommand(prepared('science'), {
      type: 'QUEUE_RESEARCH',
      empireId: 'player',
      planetId: home.id,
      technologyId: 'technology.aegis.construction',
    });
    expect(normal.ok && specialized.ok).toBe(true);
    if (!normal.ok || !specialized.ok) return;
    expect(specialized.value.pendingEvents[0]!.executeAt).toBeLessThan(
      normal.value.pendingEvents[0]!.executeAt,
    );
  });
});
