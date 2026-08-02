import { describe, expect, it } from 'vitest';
import type { BotProfile } from '../../src/simulation/bots/profiles';
import { planBotPveOperations } from '../../src/simulation/bots/pveOperationsPlanner';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import { getRequiredSpaceObjectShipId } from '../../src/simulation/pve/spaceObjects';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameCommand, GameState } from '../../src/simulation/types';

const ALLOWED_COMMANDS = new Set<GameCommand['type']>([
  'CREATE_FLEET',
  'START_EXPEDITION',
  'START_SPACE_OBJECT_MISSION',
  'SEND_FLEET',
  'RECALL_FLEET',
]);

function profile(
  empireId: string,
  personality: BotProfile['personality'],
): BotProfile {
  return {
    id: `closure.${empireId}.${personality}`,
    empireId,
    personality,
    difficulty: 'normal',
    decisionIntervalSeconds: 300,
    maxCommandsPerDecision: 4,
  };
}

function prepareOrigin(state: GameState, empireId: string): GameState {
  const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId);
  if (origin === undefined) throw new Error(`Missing origin for ${empireId}.`);
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

function expectAcceptedOrdinaryPlan(
  state: GameState,
  botProfile: BotProfile,
  expectedType: GameCommand['type'],
): void {
  const checksum = createStateChecksum(state);
  const first = planBotPveOperations(state, botProfile);
  const second = planBotPveOperations(state, botProfile);
  expect(second).toEqual(first);
  expect(createStateChecksum(state)).toBe(checksum);
  expect(first.command).not.toBeNull();
  if (first.command === null) return;
  expect(ALLOWED_COMMANDS.has(first.command.type)).toBe(true);
  expect(first.command.type).toBe(expectedType);
  const result = executeCommand(state, first.command);
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.commandLog.at(-1)?.command).toEqual(first.command);
  }
}

describe('three-faction honest bot PvE closure gate', () => {
  it('Synod explorer starts a legal expedition', () => {
    const empireId = 'synod-bot';
    let state = prepareOrigin(
      createInitialGameState('closure-synod-expedition'),
      empireId,
    );
    const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId)!;
    const roles = getFactionMechanicalRoles(origin.factionId);
    state = addFleet(state, empireId, 'closure-synod-scout', { [roles.ships.scout]: 2 });
    state = { ...state, spaceObjects: [] };
    expectAcceptedOrdinaryPlan(
      state,
      profile(empireId, 'explorer'),
      'START_EXPEDITION',
    );
  });

  it('Aegis industrial bot starts a legal object operation', () => {
    const empireId = 'aegis-bot';
    let state = prepareOrigin(
      createInitialGameState('closure-aegis-object'),
      empireId,
    );
    const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId)!;
    const object = state.spaceObjects.find(
      (candidate) => candidate.kind === 'asteroid' || candidate.kind === 'gas-cloud',
    );
    if (object === undefined) throw new Error('Missing object fixture.');
    const unitId = getRequiredSpaceObjectShipId(object.kind, origin.factionId);
    state = addFleet(state, empireId, 'closure-aegis-specialist', { [unitId]: 1 });
    state = { ...state, spaceObjects: [object] };
    expectAcceptedOrdinaryPlan(
      state,
      profile(empireId, 'industrial'),
      'START_SPACE_OBJECT_MISSION',
    );
  });

  it('Veyra aggressive bot attacks only a legal active pirate-hunt target', () => {
    const empireId = 'veyra-bot';
    let state = prepareOrigin(
      createInitialGameState('closure-veyra-pirate'),
      empireId,
    );
    const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId)!;
    const pirate = state.planets.find((planet) => planet.ownerEmpireId === 'pirate-neutral');
    if (pirate === undefined) throw new Error('Missing pirate fixture.');
    const roles = getFactionMechanicalRoles(origin.factionId);
    state = addFleet(state, empireId, 'closure-veyra-combat', {
      [roles.ships.fighter]: 100,
    });
    state = {
      ...state,
      intelligence: state.intelligence.map((entry) =>
        entry.empireId === empireId
          ? {
              ...entry,
              observations: [
                ...entry.observations,
                {
                  id: 'closure-veyra-pirate-intel',
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
          id: 'closure-pirate-hunt',
          definitionId: 'pirate-hunt',
          targetType: 'planet',
          targetId: pirate.id,
          startedAt: 0,
          endsAt: 3_600,
          chainDepth: 0,
        }],
      },
    };
    expectAcceptedOrdinaryPlan(
      state,
      profile(empireId, 'aggressive'),
      'SEND_FLEET',
    );
  });

  it('ignores hidden player resources, fleets and defenses', () => {
    const empireId = 'aegis-bot';
    let state = prepareOrigin(
      createInitialGameState('closure-hidden-state'),
      empireId,
    );
    const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId)!;
    const object = state.spaceObjects.find((candidate) => candidate.kind === 'asteroid');
    const player = state.planets.find((planet) => planet.ownerEmpireId === 'player');
    if (object === undefined || player === undefined) throw new Error('Missing hidden-state fixture.');
    const unitId = getRequiredSpaceObjectShipId(object.kind, origin.factionId);
    state = addFleet(state, empireId, 'closure-hidden-specialist', { [unitId]: 1 });
    state = { ...state, spaceObjects: [object] };
    const before = planBotPveOperations(state, profile(empireId, 'industrial'));
    const changed: GameState = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.id === player.id
          ? {
              ...planet,
              economy: {
                ...planet.economy,
                resources: {
                  metal: { ...planet.economy.resources.metal, amount: 999_999 },
                  crystal: { ...planet.economy.resources.crystal, amount: 999_999 },
                  gas: { ...planet.economy.resources.gas, amount: 999_999 },
                },
              },
              inventory: {
                ships: { 'ship.aegis.death-star': 999 },
                defenses: { 'defense.aegis.plasma-cannon': 999 },
              },
            }
          : planet,
      ),
      fleets: [
        ...state.fleets,
        {
          id: 'closure-hidden-player-fleet',
          empireId: 'player',
          originPlanetId: player.id,
          location: { type: 'planet' as const, planetId: player.id },
          status: 'stationed' as const,
          ships: { 'ship.aegis.death-star': 999 },
          cargo: { metal: 999_999, crystal: 999_999, gas: 999_999 },
          speed: 9_999,
          cargoCapacity: 9_999_999,
          mission: null,
        },
      ],
    };
    expect(planBotPveOperations(changed, profile(empireId, 'industrial'))).toEqual(before);
  });
});
