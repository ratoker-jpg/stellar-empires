import { describe, expect, it } from 'vitest';
import {
  planAllBotFleetMissions,
  planBotFleetMission,
} from '../../src/simulation/bots/fleetMissionPlanner';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
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

function isolatedScoutState(seed: string): {
  readonly state: GameState;
  readonly empireId: string;
  readonly originId: string;
  readonly targetId: string;
  readonly scoutId: string;
} {
  let state = fillGas(createInitialGameState(seed), 'aegis-bot');
  const empireId = 'aegis-bot';
  const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId)!;
  const target = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
  const roles = getFactionMechanicalRoles('aegis');
  const scoutId = `${seed}-scout`;
  state = {
    ...state,
    planets: state.planets.map((planet) =>
      planet.id === origin.id
        ? { ...planet, inventory: { ships: {}, defenses: {} } }
        : planet,
    ),
    fleets: [{
      id: scoutId,
      empireId,
      originPlanetId: origin.id,
      location: { type: 'planet' as const, planetId: origin.id },
      status: 'stationed' as const,
      ships: { [roles.ships.scout]: 1 },
      cargo: ZERO_CARGO,
      speed: 1_000,
      cargoCapacity: 100,
      mission: null,
    }],
    pendingEvents: [],
  };
  return { state, empireId, originId: origin.id, targetId: target.id, scoutId };
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
      clock: { ...state.clock, elapsedSeconds: 10_000 },
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
              levels: { ...research.levels, 'technology.veyra.brood-seeding': 1 },
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
          ships: { 'ship.veyra.brood-ark': 1 },
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


  it('reports missing full intelligence instead of planning a blind attack', () => {
    let state = fillGas(createInitialGameState('bot-blocked-intelligence'), 'aegis-bot');
    const empireId = 'aegis-bot';
    const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId)!;
    const roles = getFactionMechanicalRoles('aegis');
    state = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.id === origin.id
          ? { ...planet, inventory: { ships: {}, defenses: {} } }
          : planet,
      ),
      fleets: [{
        id: 'blind-strike',
        empireId,
        originPlanetId: origin.id,
        location: { type: 'planet' as const, planetId: origin.id },
        status: 'stationed' as const,
        ships: { [roles.ships.fighter]: 5 },
        cargo: ZERO_CARGO,
        speed: 1_000,
        cargoCapacity: 100,
        mission: null,
      }],
    };

    expect(planBotFleetMission(state, empireId)).toMatchObject({
      reasonCode: 'mission-blocked-intelligence',
      availabilityCode: 'ATTACK_INTELLIGENCE_REQUIRED',
      command: null,
    });
  });

  it('surfaces the exact shared flight-slot blocker', () => {
    const fixture = isolatedScoutState('bot-blocked-slots');
    const active = {
      ...fixture.state.fleets[0]!,
      id: 'active-slot',
      status: 'returning' as const,
      location: {
        type: 'transit' as const,
        fromPlanetId: fixture.originId,
        toPlanetId: fixture.targetId,
        departedAt: 0,
        arrivesAt: 1_000,
      },
      mission: { kind: 'scout' as const, targetPlanetId: fixture.targetId },
    };
    const state = { ...fixture.state, fleets: [...fixture.state.fleets, active] };
    expect(planBotFleetMission(state, fixture.empireId)).toMatchObject({
      reasonCode: 'mission-blocked-flight-slots',
      availabilityCode: 'FLIGHT_SLOT_LIMIT_REACHED',
      command: null,
    });
  });

  it('surfaces the exact scout cooldown blocker', () => {
    const fixture = isolatedScoutState('bot-blocked-cooldown');
    const target = fixture.state.planets.find((planet) => planet.id === fixture.targetId)!;
    const state = {
      ...fixture.state,
      intelligence: fixture.state.intelligence.map((entry) =>
        entry.empireId === fixture.empireId
          ? {
              ...entry,
              observations: [{
                id: 'recent-observation',
                observerEmpireId: fixture.empireId,
                targetPlanetId: target.id,
                coordinate: target.coordinate,
                observedAt: fixture.state.clock.elapsedSeconds,
                expiresAt: fixture.state.clock.elapsedSeconds + 86_400,
                detected: false,
                snapshot: {
                  planetId: target.id,
                  coordinate: target.coordinate,
                  name: target.name,
                  ownerEmpireId: target.ownerEmpireId,
                  factionId: target.factionId,
                  level: 1 as const,
                },
              }],
            }
          : entry,
      ),
    };
    expect(planBotFleetMission(state, fixture.empireId)).toMatchObject({
      reasonCode: 'mission-blocked-scout-cooldown',
      availabilityCode: 'SCOUT_COOLDOWN_ACTIVE',
      command: null,
    });
  });

  it('surfaces the exact insufficient-fuel blocker', () => {
    const fixture = isolatedScoutState('bot-blocked-fuel');
    const state = {
      ...fixture.state,
      planets: fixture.state.planets.map((planet) =>
        planet.id === fixture.originId
          ? {
              ...planet,
              economy: {
                ...planet.economy,
                resources: {
                  ...planet.economy.resources,
                  gas: { ...planet.economy.resources.gas, amount: 0 },
                },
              },
            }
          : planet,
      ),
    };
    expect(planBotFleetMission(state, fixture.empireId)).toMatchObject({
      reasonCode: 'mission-blocked-fuel',
      availabilityCode: 'INSUFFICIENT_FLIGHT_FUEL',
      command: null,
    });
  });
  it('is deterministic for all bot empires', () => {
    const state = createInitialGameState('bot-fleet-determinism');
    expect(planAllBotFleetMissions(state)).toEqual(planAllBotFleetMissions(state));
  });
});
