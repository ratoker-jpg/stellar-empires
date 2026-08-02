import { describe, expect, it } from 'vitest';
import type { BotProfile } from '../../src/simulation/bots/profiles';
import { planBotPveOperations } from '../../src/simulation/bots/pveOperationsPlanner';
import { runBotScheduler } from '../../src/simulation/bots/scheduler';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import { getRequiredSpaceObjectShipId } from '../../src/simulation/pve/spaceObjects';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState } from '../../src/simulation/types';

function profile(
  empireId: string,
  personality: BotProfile['personality'],
  maxCommandsPerDecision = 8,
): BotProfile {
  return {
    id: `test.${empireId}.${personality}`,
    empireId,
    personality,
    difficulty: 'normal',
    decisionIntervalSeconds: 300,
    maxCommandsPerDecision,
  };
}

function prepareOrigin(
  state: GameState,
  empireId: string,
  extraShips: Readonly<Record<string, number>> = {},
): GameState {
  const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId);
  if (origin === undefined) throw new Error(`Missing origin for ${empireId}.`);
  const roles = getFactionMechanicalRoles(origin.factionId);
  return {
    ...state,
    planets: state.planets.map((planet) =>
      planet.id === origin.id
        ? {
            ...planet,
            economy: {
              ...planet.economy,
              resources: {
                ...planet.economy.resources,
                gas: {
                  ...planet.economy.resources.gas,
                  amount: 1_000_000,
                  capacity: 1_000_000,
                },
              },
            },
            inventory: {
              ...planet.inventory,
              ships: {
                ...planet.inventory.ships,
                [roles.ships.fighter]: Math.max(
                  10,
                  planet.inventory.ships[roles.ships.fighter] ?? 0,
                ),
                ...extraShips,
              },
            },
          }
        : planet,
    ),
  };
}

function addFleet(
  state: GameState,
  empireId: string,
  fleetId: string,
  ships: Readonly<Record<string, number>>,
): GameState {
  const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId);
  if (origin === undefined) throw new Error(`Missing origin for ${empireId}.`);
  return {
    ...state,
    fleets: [
      ...state.fleets,
      {
        id: fleetId,
        empireId,
        originPlanetId: origin.id,
        location: { type: 'planet' as const, planetId: origin.id },
        status: 'stationed' as const,
        ships,
        cargo: { metal: 0, crystal: 0, gas: 0 },
        speed: 1_000,
        cargoCapacity: 10_000,
        mission: null,
      },
    ],
  };
}

function expeditionFixture(seed: string, empireId = 'synod-bot'): GameState {
  let state = createInitialGameState(seed);
  const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId)!;
  const roles = getFactionMechanicalRoles(origin.factionId);
  state = prepareOrigin(state, empireId);
  state = addFleet(state, empireId, 'bot-pve-expedition', { [roles.ships.scout]: 2 });
  return { ...state, spaceObjects: [] };
}

function objectFixture(seed: string, empireId = 'aegis-bot'): GameState {
  let state = createInitialGameState(seed);
  const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId)!;
  const object = state.spaceObjects.find(
    (candidate) => candidate.kind === 'asteroid' || candidate.kind === 'gas-cloud',
  );
  if (object === undefined) throw new Error('Resource object fixture missing.');
  const unitId = getRequiredSpaceObjectShipId(object.kind, origin.factionId);
  state = prepareOrigin(state, empireId);
  state = addFleet(state, empireId, 'bot-pve-object', { [unitId]: 1 });
  return { ...state, spaceObjects: [object] };
}

function pirateFixture(seed: string, empireId = 'veyra-bot'): GameState {
  let state = createInitialGameState(seed);
  const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId)!;
  const pirate = state.planets.find((planet) => planet.ownerEmpireId === 'pirate-neutral');
  if (pirate === undefined) throw new Error('Pirate fixture missing.');
  const roles = getFactionMechanicalRoles(origin.factionId);
  state = prepareOrigin(state, empireId);
  state = addFleet(state, empireId, 'bot-pve-pirate', { [roles.ships.fighter]: 100 });
  return {
    ...state,
    intelligence: state.intelligence.map((entry) =>
      entry.empireId === empireId
        ? {
            ...entry,
            observations: [
              ...entry.observations,
              {
                id: 'bot-pve-pirate-intel',
                observerEmpireId: empireId,
                targetPlanetId: pirate.id,
                coordinate: pirate.coordinate,
                observedAt: 0,
                expiresAt: 10_000,
                detected: false,
                snapshot: {
                  planetId: pirate.id,
                  coordinate: pirate.coordinate,
                  name: pirate.name,
                  ownerEmpireId: 'pirate-neutral',
                  factionId: pirate.factionId,
                  level: 3 as const,
                  defenses: {},
                  stationedFleets: [],
                },
              },
            ],
          }
        : entry,
    ),
    worldEvents: {
      ...state.worldEvents,
      active: [{
        id: 'bot-pve-pirate-hunt',
        definitionId: 'pirate-hunt',
        targetType: 'planet',
        targetId: pirate.id,
        startedAt: 0,
        endsAt: 3_600,
        chainDepth: 0,
      }],
    },
  };
}

describe('honest bot PvE operations planner', () => {
  it('starts an expedition through the ordinary command without mutating input', () => {
    const state = expeditionFixture('bot-pve-expedition-plan');
    const before = createStateChecksum(state);
    const plan = planBotPveOperations(state, profile('synod-bot', 'explorer'));

    expect(plan).toMatchObject({
      reasonCode: 'expedition-selected',
      command: {
        type: 'START_EXPEDITION',
        empireId: 'synod-bot',
        fleetId: 'bot-pve-expedition',
      },
    });
    expect(createStateChecksum(state)).toBe(before);
    expect(plan.command).not.toBeNull();
    if (plan.command !== null) {
      expect(executeCommand(state, plan.command).ok).toBe(true);
    }
  });

  it('starts a resource-object operation through the ordinary command', () => {
    const state = objectFixture('bot-pve-object-plan');
    const plan = planBotPveOperations(state, profile('aegis-bot', 'industrial'));

    expect(plan).toMatchObject({
      reasonCode: 'space-object-selected',
      command: {
        type: 'START_SPACE_OBJECT_MISSION',
        empireId: 'aegis-bot',
        fleetId: 'bot-pve-object',
      },
    });
    expect(plan.command).not.toBeNull();
    if (plan.command !== null) {
      expect(executeCommand(state, plan.command).ok).toBe(true);
    }
  });

  it('creates a specialist fleet only from ready owned inventory', () => {
    let state = createInitialGameState('bot-pve-create-fleet');
    const empireId = 'aegis-bot';
    const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId)!;
    const object = state.spaceObjects.find((candidate) => candidate.kind === 'asteroid');
    if (object === undefined) throw new Error('Asteroid fixture missing.');
    const unitId = getRequiredSpaceObjectShipId(object.kind, origin.factionId);
    state = prepareOrigin(state, empireId, { [unitId]: 1 });
    state = { ...state, fleets: [], spaceObjects: [object] };

    expect(planBotPveOperations(state, profile(empireId, 'industrial'))).toMatchObject({
      reasonCode: 'specialist-fleet-created',
      command: {
        type: 'CREATE_FLEET',
        empireId,
        planetId: origin.id,
        ships: { [unitId]: 1 },
      },
    });
  });

  it('attacks an active pirate hunt only with current full intelligence', () => {
    const state = pirateFixture('bot-pve-pirate-plan');
    const plan = planBotPveOperations(state, profile('veyra-bot', 'aggressive'));

    expect(plan).toMatchObject({
      reasonCode: 'pirate-hunt-selected',
      command: {
        type: 'SEND_FLEET',
        empireId: 'veyra-bot',
        fleetId: 'bot-pve-pirate',
        mission: 'attack',
      },
    });
    expect(plan.command).not.toBeNull();
    if (plan.command !== null) {
      expect(executeCommand(state, plan.command).ok).toBe(true);
    }
  });

  it('records at most one accepted PvE command in one scheduler decision', () => {
    const state = expeditionFixture('bot-pve-scheduler');
    const result = runBotScheduler(
      state,
      [profile('synod-bot', 'explorer', 20)],
      1,
    );
    const pve = result.audit.filter((entry) => entry.source === 'pve');

    expect(pve).toHaveLength(1);
    expect(pve[0]).toMatchObject({
      accepted: true,
      command: { type: 'START_EXPEDITION' },
    });
  });
});
