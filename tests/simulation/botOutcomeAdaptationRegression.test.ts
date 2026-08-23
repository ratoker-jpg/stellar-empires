import { describe, expect, it } from 'vitest';
import { planBotThreatAndRecovery } from '../../src/simulation/bots/threatRecoveryPlanner';
import type { BattleReport } from '../../src/simulation/combat/types';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionIdForEmpire } from '../../src/simulation/factions/factionMechanicalCatalogRegistry';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import { getCompleteResearchId } from '../../src/simulation/research/completeResearchCatalog';
import type { ExecutedGameEvent, GameState } from '../../src/simulation/types';

function prepareStableMilitaryRecoveryState(seed: string, empireId: string): GameState {
  const state = createInitialGameState(seed);
  const factionId = getFactionIdForEmpire(state, empireId);
  const roles = getFactionMechanicalRoles(factionId);
  const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId);
  if (origin === undefined) throw new Error('Missing bot origin planet.');

  return {
    ...state,
    planets: state.planets.map((planet) =>
      planet.ownerEmpireId === empireId
        ? {
            ...planet,
            specializationId: 'military' as const,
            buildings: [
              ...planet.buildings.filter(
                (building) =>
                  building.buildingId !== roles.buildings.command &&
                  building.buildingId !== roles.buildings.shipyard &&
                  building.buildingId !== roles.buildings.laboratory &&
                  building.buildingId !== roles.buildings.sensorGrid,
              ),
              { buildingId: roles.buildings.command, level: 3 },
              { buildingId: roles.buildings.shipyard, level: 2 },
              { buildingId: roles.buildings.laboratory, level: 3 },
              { buildingId: roles.buildings.sensorGrid, level: 2 },
            ],
            inventory: {
              ships: planet.id === origin.id ? { [roles.ships.fighter]: 2 } : {},
              defenses: {},
            },
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
              population: { ...planet.economy.population, capacity: 100 },
            },
          }
        : planet,
    ),
    research: state.research.map((research) =>
      research.empireId === empireId
        ? {
            ...research,
            levels: {
              ...research.levels,
              [roles.research.construction]: 2,
              [roles.research.energy]: 2,
              [roles.research.sensors]: 2,
              [roles.research.weapons]: 1,
              [getCompleteResearchId(factionId, 'astronomy')]: 1,
            },
            queue: [],
          }
        : research,
    ),
    fleets: state.fleets.filter((fleet) => fleet.empireId !== empireId),
  };
}

function pvpBattleEvent(
  id: string,
  executeAt: number,
  sequence: number,
  attackerEmpireId: string,
  defenderEmpireId: string,
  winner: BattleReport['winner'],
  targetPlanetId: string,
): ExecutedGameEvent {
  const report: BattleReport = {
    id,
    seed: sequence,
    resolvedAt: executeAt,
    targetPlanetId,
    attackerEmpireId,
    defenderEmpireId,
    winner,
    rounds: [],
    attackerInitial: {},
    defenderInitial: {},
    attackerRemaining: {},
    defenderRemaining: {},
    mode: 'pvp',
  };
  return {
    event: {
      id: `event-${id}`,
      executeAt,
      sequence,
      payload: { type: 'BATTLE_REPORT', report },
    },
    executedAt: executeAt,
  };
}

describe('bot outcome adaptation regression', () => {
  it('uses a loss-dominant latest-three battle history to choose bounded military recovery', () => {
    const empireId = 'aegis-bot';
    const baselineState = prepareStableMilitaryRecoveryState(
      'bot-outcome-adaptation-regression',
      empireId,
    );
    const target = baselineState.planets.find((planet) => planet.ownerEmpireId === 'player');
    if (target === undefined) throw new Error('Missing player target planet.');

    const baseline = planBotThreatAndRecovery(baselineState, empireId);
    expect(baseline.recoveryPhase).toBe('stable');
    expect(baseline.reasonCode).not.toBe('military-recovery');

    const lossDominantState: GameState = {
      ...baselineState,
      eventLog: [
        pvpBattleEvent('own-attacker-win', 100, 1, empireId, 'player', 'attacker', target.id),
        pvpBattleEvent('own-attacker-loss', 200, 2, empireId, 'player', 'defender', target.id),
        pvpBattleEvent('own-defender-loss', 300, 3, 'player', empireId, 'attacker', target.id),
      ],
    };
    const adapted = planBotThreatAndRecovery(lossDominantState, empireId);

    expect(adapted.reasonCode).toBe('military-recovery');
    expect(adapted.command).toMatchObject({
      type: 'QUEUE_UNIT_BATCH',
      empireId,
    });
    expect(adapted).not.toEqual(baseline);
  });
});
