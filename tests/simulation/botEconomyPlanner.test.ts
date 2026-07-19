import { describe, expect, it } from 'vitest';
import {
  planAllBotEconomies,
  planBotEconomy,
} from '../../src/simulation/bots/economyPlanner';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeCommand } from '../../src/simulation/reducer';

describe('bot economy planner', () => {
  it('creates deterministic plans for all bot empires', () => {
    const state = createInitialGameState('bot-economy-all');
    const first = planAllBotEconomies(state);
    const second = planAllBotEconomies(state);

    expect(first).toEqual(second);
    expect(first.map((plan) => plan.empireId)).toEqual([
      'aegis-bot',
      'synod-bot',
      'veyra-bot',
    ]);
    expect(first.every((plan) => plan.command?.type === 'SET_PLANET_SPECIALIZATION')).toBe(true);
  });

  it('executes the shared temporary building catalog for Synod and Veyra', () => {
    let state = createInitialGameState('bot-economy-shared');

    for (const empireId of ['synod-bot', 'veyra-bot'] as const) {
      const specialization = planBotEconomy(state, empireId);
      expect(specialization.command?.type).toBe('SET_PLANET_SPECIALIZATION');
      if (specialization.command === null) continue;
      const specialized = executeCommand(state, specialization.command);
      expect(specialized.ok).toBe(true);
      if (!specialized.ok) continue;
      state = specialized.value;

      const build = planBotEconomy(state, empireId);
      expect(build.command?.type).toBe('QUEUE_BUILDING');
      if (build.command === null) continue;
      const queued = executeCommand(state, build.command);
      expect(queued.ok).toBe(true);
      if (queued.ok) {
        state = queued.value;
        expect(
          state.planets.find((planet) => planet.ownerEmpireId === empireId)?.buildQueue,
        ).toHaveLength(1);
      }
    }
  });

  it('prioritizes energy recovery when consumption exceeds generation', () => {
    const initial = createInitialGameState('bot-economy-energy');
    const state = {
      ...initial,
      planets: initial.planets.map((planet) =>
        planet.ownerEmpireId === 'aegis-bot'
          ? {
              ...planet,
              specializationId: 'industry' as const,
              economy: {
                ...planet.economy,
                energy: { produced: 10, consumed: 100, efficiencyPermille: 100 },
              },
            }
          : planet,
      ),
    };

    expect(planBotEconomy(state, 'aegis-bot')).toMatchObject({
      reasonCode: 'energy-deficit',
      command: {
        type: 'QUEUE_BUILDING',
        buildingId: 'building.aegis.power-plant',
      },
    });
  });

  it('does not react to hidden player changes', () => {
    const initial = createInitialGameState('bot-economy-hidden');
    const before = planBotEconomy(initial, 'synod-bot');
    const changed = {
      ...initial,
      planets: initial.planets.map((planet) =>
        planet.ownerEmpireId === 'player'
          ? {
              ...planet,
              economy: {
                ...planet.economy,
                resources: {
                  ...planet.economy.resources,
                  metal: { ...planet.economy.resources.metal, amount: 9_999 },
                },
              },
            }
          : planet,
      ),
    };
    expect(planBotEconomy(changed, 'synod-bot')).toEqual(before);
  });

  it('waits without issuing invalid commands when every build queue is busy', () => {
    const initial = createInitialGameState('bot-economy-busy');
    const state = {
      ...initial,
      planets: initial.planets.map((planet) =>
        planet.ownerEmpireId === 'aegis-bot'
          ? {
              ...planet,
              buildQueue: [
                {
                  id: 'busy',
                  buildingId: 'building.aegis.command',
                  targetLevel: 2,
                  startedAt: 0,
                  completesAt: 100,
                  cost: { metal: 1, crystal: 1, gas: 1 },
                },
              ],
            }
          : planet,
      ),
    };
    expect(planBotEconomy(state, 'aegis-bot')).toMatchObject({
      reasonCode: 'queues-busy',
      command: null,
    });
  });
});
