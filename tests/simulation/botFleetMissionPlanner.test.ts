import { describe, expect, it } from 'vitest';
import {
  planAllBotFleetMissions,
  planBotFleetMission,
} from '../../src/simulation/bots/fleetMissionPlanner';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState } from '../../src/simulation/types';

const ZERO_CARGO = { metal: 0, crystal: 0, gas: 0 } as const;

function fillGas(state: GameState, empireId: string): GameState {
  return {
    ...state,
    planets: state.planets.map((planet) =>
      planet.ownerEmpireId === empireId
        ? {
            ...planet,
            economy: {
              ...planet.economy,
              resources: {
                ...planet.economy.resources,
                gas: {
                  ...planet.economy.resources.gas,
                  amount: planet.economy.resources.gas.capacity,
                },
              },
            },
          }
        : planet,
    ),
  };
}

describe('bot fleet and mission planner', () => {
  it('forms a valid scout fleet from owned inventory', () => {
    let state = createInitialGameState('bot-fleet-create');
    const empireId = 'synod-bot';
    const planet = state.planets.find((candidate) => candidate.ownerEmpireId === empireId)!;
    state = {
      ...state,
      planets: state.planets.map((candidate) =>
        candidate.id === planet.id
          ? {
              ...candidate,
              inventory: {
                ...candidate.inventory,
                ships: { 'ship.synod.whisper': 1 },
              },
            }
          : candidate,
      ),
    };

    const plan = planBotFleetMission(state, empireId);
    expect(plan).toMatchObject({
      reasonCode: 'fleet-created',
      command: {
        type: 'CREATE_FLEET',
        empireId,
        planetId: planet.id,
        ships: { 'ship.synod.whisper': 1 },
      },
    });
    if (plan.command !== null) {
      expect(executeCommand(state, plan.command).ok).toBe(true);
    }
  });

  it('refreshes observed foreign intelligence without reading hidden resources', () => {
    let state = fillGas(createInitialGameState('bot-fleet-scout'), 'synod-bot');
    const empireId = 'synod-bot';
    const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId)!;
    const target = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    state = {
      ...state,
      fleets: [
        {
          id: 'synod-scout',
          empireId,
          originPlanetId: origin.id,
          location: { type: 'planet' as const, planetId: origin.id },
          status: 'stationed' as const,
          ships: { 'ship.synod.whisper': 1 },
          cargo: ZERO_CARGO,
          speed: 16,
          cargoCapacity: 18,
          mission: null,
        },
      ],
      intelligence: state.intelligence.map((entry) =>
        entry.empireId === empireId
          ? {
              ...entry,
              observations: [
                {
                  id: 'synod-old-player-intel',
                  observerEmpireId: empireId,
                  targetPlanetId: target.id,
                  observedAt: 0,
                  expiresAt: 1,
                  detected: false,
                  snapshot: {
                    planetId: target.id,
                    name: target.name,
                    ownerEmpireId: 'player',
                    factionId: target.factionId,
                    level: 1 as const,
                  },
                },
              ],
            }
          : entry,
      ),
      clock: { ...state.clock, elapsedSeconds: 100 },
    };

    const before = planBotFleetMission(state, empireId);
    const hiddenChanged = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.id === target.id
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
    expect(planBotFleetMission(hiddenChanged, empireId)).toEqual(before);
    expect(before.command).toMatchObject({
      type: 'SEND_FLEET',
      fleetId: 'synod-scout',
      targetPlanetId: target.id,
      mission: 'scout',
    });
    if (before.command !== null) {
      expect(executeCommand(state, before.command).ok).toBe(true);
    }
  });

  it('sends loaded cargo to the weakest owned colony', () => {
    let state = fillGas(createInitialGameState('bot-fleet-transport'), 'aegis-bot');
    const empireId = 'aegis-bot';
    const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId)!;
    const second = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    state = {
      ...state,
      planets: state.planets.map((planet) => {
        if (planet.id === second.id) {
          return {
            ...planet,
            ownerEmpireId: empireId,
            factionId: origin.factionId,
            economy: {
              ...planet.economy,
              resources: {
                ...planet.economy.resources,
                metal: { ...planet.economy.resources.metal, amount: 0 },
              },
            },
          };
        }
        return planet;
      }),
      fleets: [
        {
          id: 'aegis-transport',
          empireId,
          originPlanetId: origin.id,
          location: { type: 'planet' as const, planetId: origin.id },
          status: 'stationed' as const,
          ships: { 'ship.aegis.cargo': 1 },
          cargo: { metal: 300, crystal: 0, gas: 0 },
          speed: 9,
          cargoCapacity: 1_200,
          mission: null,
        },
      ],
    };

    const plan = planBotFleetMission(state, empireId);
    expect(plan.command).toMatchObject({
      type: 'SEND_FLEET',
      fleetId: 'aegis-transport',
      targetPlanetId: second.id,
      mission: 'transport',
    });
    if (plan.command !== null) {
      expect(executeCommand(state, plan.command).ok).toBe(true);
    }
  });

  it('selects a legal colonization target through normal mission validation', () => {
    let state = fillGas(createInitialGameState('bot-fleet-colonize'), 'veyra-bot');
    const empireId = 'veyra-bot';
    const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId)!;
    state = {
      ...state,
      research: state.research.map((research) =>
        research.empireId === empireId
          ? {
              ...research,
              levels: { ...research.levels, 'technology.aegis.colonization': 1 },
            }
          : research,
      ),
      fleets: [
        {
          id: 'veyra-colonizer',
          empireId,
          originPlanetId: origin.id,
          location: { type: 'planet' as const, planetId: origin.id },
          status: 'stationed' as const,
          ships: { 'ship.aegis.colony': 1 },
          cargo: ZERO_CARGO,
          speed: 6,
          cargoCapacity: 500,
          mission: null,
        },
      ],
    };

    const plan = planBotFleetMission(state, empireId);
    expect(plan.reasonCode).toBe('mission-colonize-selected');
    expect(plan.command).toMatchObject({
      type: 'SEND_FLEET',
      fleetId: 'veyra-colonizer',
      mission: 'colonize',
    });
    if (plan.command !== null) {
      expect(executeCommand(state, plan.command).ok).toBe(true);
    }
  });

  it('attacks only a current level-three target with favorable perceived power', () => {
    let state = fillGas(createInitialGameState('bot-fleet-attack'), 'aegis-bot');
    const empireId = 'aegis-bot';
    const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId)!;
    const target = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    state = {
      ...state,
      fleets: [
        {
          id: 'aegis-strike',
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
                  id: 'aegis-target-intel',
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
                    defenses: {},
                    stationedFleets: [],
                  },
                },
              ],
            }
          : entry,
      ),
    };

    const plan = planBotFleetMission(state, empireId);
    expect(plan).toMatchObject({
      reasonCode: 'mission-attack-selected',
      command: {
        type: 'SEND_FLEET',
        fleetId: 'aegis-strike',
        targetPlanetId: target.id,
        mission: 'attack',
      },
    });
  });

  it('is deterministic for all bot empires', () => {
    const state = createInitialGameState('bot-fleet-determinism');
    expect(planAllBotFleetMissions(state)).toEqual(planAllBotFleetMissions(state));
  });
});
