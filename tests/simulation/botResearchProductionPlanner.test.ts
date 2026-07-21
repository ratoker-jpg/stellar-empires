import { describe, expect, it } from 'vitest';
import {
  planAllBotResearchAndProduction,
  planBotResearchAndProduction,
} from '../../src/simulation/bots/researchProductionPlanner';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionIdForEmpire } from '../../src/simulation/factions/factionMechanicalCatalogRegistry';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState } from '../../src/simulation/types';

function prepareBotInfrastructure(
  state: GameState,
  empireId: string,
  levels: Readonly<Record<string, number>> = {},
): GameState {
  const factionId = getFactionIdForEmpire(state, empireId);
  const roles = getFactionMechanicalRoles(factionId);
  return {
    ...state,
    planets: state.planets.map((planet) =>
      planet.ownerEmpireId === empireId
        ? {
            ...planet,
            buildings: [
              ...planet.buildings.filter(
                (building) =>
                  building.buildingId !== roles.buildings.command &&
                  building.buildingId !== roles.buildings.laboratory &&
                  building.buildingId !== roles.buildings.shipyard &&
                  building.buildingId !== roles.buildings.sensorGrid,
              ),
              { buildingId: roles.buildings.command, level: 3 },
              { buildingId: roles.buildings.laboratory, level: 3 },
              { buildingId: roles.buildings.shipyard, level: 2 },
              { buildingId: roles.buildings.sensorGrid, level: 1 },
            ],
            economy: {
              ...planet.economy,
              resources: {
                metal: {
                  ...planet.economy.resources.metal,
                  amount: planet.economy.resources.metal.capacity,
                },
                crystal: {
                  ...planet.economy.resources.crystal,
                  amount: planet.economy.resources.crystal.capacity,
                },
                gas: {
                  ...planet.economy.resources.gas,
                  amount: planet.economy.resources.gas.capacity,
                },
              },
              population: {
                ...planet.economy.population,
                capacity: 100,
              },
            },
          }
        : planet,
    ),
    research: state.research.map((research) =>
      research.empireId === empireId
        ? { ...research, levels: { ...levels }, queue: [] }
        : research,
    ),
  };
}

function starterResearchLevels(state: GameState, empireId: string): Readonly<Record<string, number>> {
  const roles = getFactionMechanicalRoles(getFactionIdForEmpire(state, empireId));
  return {
    [roles.research.construction]: 1,
    [roles.research.sensors]: 1,
  };
}

describe('bot research and production planner', () => {
  it('returns explicit infrastructure blockers before facilities exist', () => {
    const state = createInitialGameState('bot-science-blockers');
    expect(planBotResearchAndProduction(state, 'synod-bot')).toMatchObject({
      research: {
        reasonCode: 'research-infrastructure-missing',
        command: null,
      },
      production: {
        reasonCode: 'production-infrastructure-missing',
        command: null,
      },
    });
  });

  it('queues faction-valid research and unit production for Synod and Veyra', () => {
    let state = createInitialGameState('bot-science-shared');

    for (const empireId of ['synod-bot', 'veyra-bot'] as const) {
      state = prepareBotInfrastructure(state, empireId, starterResearchLevels(state, empireId));
      const plan = planBotResearchAndProduction(state, empireId);
      expect(plan.research.command?.type).toBe('QUEUE_RESEARCH');
      expect(plan.production.command?.type).toBe('QUEUE_UNIT_BATCH');

      if (plan.research.command?.type === 'QUEUE_RESEARCH') {
        expect(plan.research.command.technologyId).toContain(
          empireId === 'synod-bot' ? '.synod.' : '.veyra.',
        );
        const researchResult = executeCommand(state, plan.research.command);
        expect(researchResult.ok).toBe(true);
        if (researchResult.ok) state = researchResult.value;
      }
      if (plan.production.command?.type === 'QUEUE_UNIT_BATCH') {
        expect(plan.production.command.unitId).toContain(
          empireId === 'synod-bot' ? '.synod.' : '.veyra.',
        );
        const productionResult = executeCommand(state, plan.production.command);
        expect(productionResult.ok).toBe(true);
        if (productionResult.ok) state = productionResult.value;
      }
    }
  });

  it('prioritizes military research and fighters when current intelligence shows a threat', () => {
    let state = prepareBotInfrastructure(
      createInitialGameState('bot-science-threat'),
      'aegis-bot',
      {
        'technology.aegis.construction': 2,
        'technology.aegis.energy': 2,
        'technology.aegis.sensors': 2,
        'technology.aegis.weapons': 1,
      },
    );
    const playerPlanet = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    state = {
      ...state,
      intelligence: state.intelligence.map((entry) =>
        entry.empireId === 'aegis-bot'
          ? {
              ...entry,
              observations: [
                {
                  id: 'threat-observation',
                  observerEmpireId: 'aegis-bot',
                  targetPlanetId: playerPlanet.id,
                  observedAt: 0,
                  expiresAt: 10_000,
                  detected: false,
                  snapshot: {
                    planetId: playerPlanet.id,
                    name: playerPlanet.name,
                    ownerEmpireId: 'player',
                    factionId: playerPlanet.factionId,
                    level: 3 as const,
                    ships: { 'ship.aegis.fighter': 5 },
                    defenses: {},
                    activeFleets: [],
                  },
                },
              ],
            }
          : entry,
      ),
    };

    const plan = planBotResearchAndProduction(state, 'aegis-bot');
    expect(plan.research.command?.type).toBe('QUEUE_RESEARCH');
    if (plan.research.command?.type === 'QUEUE_RESEARCH') {
      expect([
        'technology.aegis.weapons',
        'technology.aegis.armor',
      ]).toContain(plan.research.command.technologyId);
    }
    expect(plan.production.command).toMatchObject({
      type: 'QUEUE_UNIT_BATCH',
      unitId: 'ship.aegis.fighter',
      quantity: 3,
    });
  });

  it('is deterministic for every bot empire', () => {
    let state = createInitialGameState('bot-science-determinism');
    for (const empireId of ['aegis-bot', 'synod-bot', 'veyra-bot']) {
      state = prepareBotInfrastructure(state, empireId, starterResearchLevels(state, empireId));
    }
    expect(planAllBotResearchAndProduction(state)).toEqual(
      planAllBotResearchAndProduction(state),
    );
  });

  it('does not react to hidden player resource changes', () => {
    const initial = createInitialGameState('bot-science-hidden');
    const state = prepareBotInfrastructure(
      initial,
      'synod-bot',
      starterResearchLevels(initial, 'synod-bot'),
    );
    const before = planBotResearchAndProduction(state, 'synod-bot');
    const changed = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.ownerEmpireId === 'player'
          ? {
              ...planet,
              economy: {
                ...planet.economy,
                resources: {
                  ...planet.economy.resources,
                  gas: { ...planet.economy.resources.gas, amount: 9_999 },
                },
              },
            }
          : planet,
      ),
    };
    expect(planBotResearchAndProduction(changed, 'synod-bot')).toEqual(before);
  });
});
