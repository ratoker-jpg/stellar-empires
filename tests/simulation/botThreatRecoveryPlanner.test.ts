import { describe, expect, it } from 'vitest';
import {
  planAllBotThreatsAndRecovery,
  planBotThreatAndRecovery,
} from '../../src/simulation/bots/threatRecoveryPlanner';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionIdForEmpire } from '../../src/simulation/factions/factionMechanicalCatalogRegistry';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState } from '../../src/simulation/types';

const ZERO_CARGO = { metal: 0, crystal: 0, gas: 0 } as const;

function prepareMilitaryIndustry(state: GameState, empireId: string): GameState {
  const roles = getFactionMechanicalRoles(getFactionIdForEmpire(state, empireId));
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
            },
            queue: [],
          }
        : research,
    ),
  };
}

describe('bot threat, target and recovery planner', () => {
  it('does not react to hidden player changes without intelligence', () => {
    const state = createInitialGameState('bot-threat-hidden');
    const before = planBotThreatAndRecovery(state, 'synod-bot');
    const changed = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.ownerEmpireId === 'player'
          ? {
              ...planet,
              inventory: {
                ...planet.inventory,
                ships: { 'ship.aegis.frigate': 99 },
              },
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
    expect(planBotThreatAndRecovery(changed, 'synod-bot')).toEqual(before);
  });

  it('selects a profitable current target from stored intelligence', () => {
    let state = prepareMilitaryIndustry(
      createInitialGameState('bot-threat-target'),
      'aegis-bot',
    );
    const empireId = 'aegis-bot';
    const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId)!;
    const target = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    state = {
      ...state,
      fleets: [
        {
          id: 'strike-target',
          empireId,
          originPlanetId: origin.id,
          location: { type: 'planet' as const, planetId: origin.id },
          status: 'stationed' as const,
          ships: { 'ship.aegis.fighter': 3 },
          cargo: ZERO_CARGO,
          speed: 13,
          cargoCapacity: 90,
          mission: null,
        },
      ],
      intelligence: state.intelligence.map((entry) =>
        entry.empireId === empireId
          ? {
              ...entry,
              observations: [
                {
                  id: 'profitable-target',
                  observerEmpireId: empireId,
                  targetPlanetId: target.id,
                  observedAt: 0,
                  expiresAt: 10_000,
                  detected: false,
                  snapshot: {
                    planetId: target.id,
                    name: target.name,
                    ownerEmpireId: 'player',
                    factionId: target.factionId,
                    level: 3 as const,
                    resources: {
                      metal: 2_000,
                      crystal: 1_000,
                      gas: 500,
                      energyProduced: 100,
                      energyConsumed: 50,
                    },
                    buildings: { 'building.aegis.command': 2 },
                    defenses: {},
                    stationedFleets: [],
                  },
                },
              ],
            }
          : entry,
      ),
    };

    const plan = planBotThreatAndRecovery(state, empireId);
    expect(plan.selectedTargetPlanetId).toBe(target.id);
    expect(plan.targets[0]).toMatchObject({
      planetId: target.id,
      attackRecommended: true,
      estimatedReward: 4_200,
    });
    expect(plan.command).toMatchObject({
      type: 'SEND_FLEET',
      fleetId: 'strike-target',
      targetPlanetId: target.id,
      mission: 'attack',
    });
  });

  it('rebuilds military production after fleet losses', () => {
    const state = prepareMilitaryIndustry(
      createInitialGameState('bot-threat-rebuild'),
      'veyra-bot',
    );
    const plan = planBotThreatAndRecovery(state, 'veyra-bot');
    expect(plan.recoveryPhase).toBe('fleet');
    expect(plan.reasonCode).toBe('military-recovery');
    expect(plan.command).toMatchObject({
      type: 'QUEUE_UNIT_BATCH',
      empireId: 'veyra-bot',
      unitId: 'ship.veyra.sting',
      quantity: 3,
    });
    if (plan.command !== null) {
      expect(executeCommand(state, plan.command).ok).toBe(true);
    }
  });

  it('classifies a stronger known defender as a high threat', () => {
    let state = prepareMilitaryIndustry(
      createInitialGameState('bot-threat-high'),
      'synod-bot',
    );
    const empireId = 'synod-bot';
    const target = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    state = {
      ...state,
      intelligence: state.intelligence.map((entry) =>
        entry.empireId === empireId
          ? {
              ...entry,
              observations: [
                {
                  id: 'strong-defender',
                  observerEmpireId: empireId,
                  targetPlanetId: target.id,
                  observedAt: 0,
                  expiresAt: 10_000,
                  detected: true,
                  snapshot: {
                    planetId: target.id,
                    name: target.name,
                    ownerEmpireId: 'player',
                    factionId: target.factionId,
                    level: 3 as const,
                    defenses: { 'defense.aegis.gun-battery': 20 },
                    stationedFleets: [],
                  },
                },
              ],
              alerts: [
                {
                  id: 'high-alert',
                  empireId,
                  sourceEmpireId: 'player',
                  targetPlanetId: entry.empireId,
                  detectedAt: 0,
                  confidence: 'high' as const,
                },
              ],
            }
          : entry,
      ),
    };

    const plan = planBotThreatAndRecovery(state, empireId);
    expect(plan.threatLevel).toBe('high');
    expect(plan.selectedTargetPlanetId).toBeNull();
    expect(plan.reasonCode).toBe('high-threat-response');
    expect(plan.command).toMatchObject({
      type: 'QUEUE_UNIT_BATCH',
      unitId: 'ship.synod.lancet',
      quantity: 3,
    });
  });

  it('returns a critical no-action plan after complete planet loss', () => {
    const state = createInitialGameState('bot-threat-defeat');
    const empireId = 'aegis-bot';
    const defeated = {
      ...state,
      planets: state.planets.filter((planet) => planet.ownerEmpireId !== empireId),
    };
    expect(planBotThreatAndRecovery(defeated, empireId)).toMatchObject({
      recoveryPhase: 'critical',
      keyPlanetId: null,
      command: null,
    });
  });

  it('is deterministic for every bot empire', () => {
    const state = createInitialGameState('bot-threat-determinism');
    expect(planAllBotThreatsAndRecovery(state)).toEqual(
      planAllBotThreatsAndRecovery(state),
    );
  });
});
