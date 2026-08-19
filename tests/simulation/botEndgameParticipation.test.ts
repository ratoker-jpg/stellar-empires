import { describe, expect, it } from 'vitest';
import { planBotEndgameParticipation } from '../../src/simulation/bots/endgameParticipationPlanner';
import { DEFAULT_BOT_PROFILES } from '../../src/simulation/bots/profiles';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import type { FleetState } from '../../src/simulation/fleets/types';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameCommand, GameState } from '../../src/simulation/types';

function profile(empireId: string) {
  const value = DEFAULT_BOT_PROFILES.find((candidate) => candidate.empireId === empireId);
  if (value === undefined) throw new Error(`Missing profile for ${empireId}.`);
  return value;
}

function execute(state: GameState, command: GameCommand): GameState {
  const result = executeCommand(state, command);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(`${result.code}: ${result.message}`);
  return result.value;
}

function withCombatFleet(state: GameState, empireId: string, fleetId: string): GameState {
  const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId);
  if (origin === undefined) throw new Error(`Missing origin for ${empireId}.`);
  const ships = getFactionMechanicalRoles(origin.factionId).ships.complete;
  const fleet: FleetState = {
    id: fleetId,
    empireId,
    originPlanetId: origin.id,
    location: { type: 'planet', planetId: origin.id },
    status: 'stationed',
    ships: {
      [ships.heavyAssault]: 40,
      [ships.lineBattleship]: 80,
      [ships.interceptor]: 120,
    },
    cargo: { metal: 0, crystal: 0, gas: 0 },
    speed: 6,
    cargoCapacity: 10_000,
    mission: null,
  };
  return { ...state, fleets: [...state.fleets, fleet] };
}

describe('bot endgame participation planning', () => {
  it('creates the stable Aegis alliance, then enters Solar War through ordinary commands', () => {
    let state = withCombatFleet(
      createInitialGameState('bot-endgame-aegis'),
      'aegis-bot',
      'aegis-endgame-fleet',
    );

    const createPlan = planBotEndgameParticipation(state, profile('aegis-bot'));
    expect(createPlan).toEqual({
      command: {
        type: 'CREATE_ALLIANCE',
        empireId: 'aegis-bot',
        name: 'Aegis Vanguard',
      },
      reasonCode: 'alliance-create',
    });
    state = execute(state, createPlan.command!);

    const enterPlan = planBotEndgameParticipation(state, profile('aegis-bot'));
    expect(enterPlan).toEqual({
      command: {
        type: 'ENTER_SOLAR_WAR',
        empireId: 'aegis-bot',
        fleetId: 'aegis-endgame-fleet',
      },
      reasonCode: 'solar-war-enter',
    });
    state = execute(state, enterPlan.command!);
    expect(planBotEndgameParticipation(state, profile('aegis-bot'))).toMatchObject({
      command: null,
      reasonCode: 'solar-war-already-entered',
    });
  });

  it('joins an existing public alliance for Synod instead of creating private diplomacy state', () => {
    let state = createInitialGameState('bot-endgame-synod');
    state = execute(state, {
      type: 'CREATE_ALLIANCE',
      empireId: 'player',
      name: 'Public Coalition',
    });

    expect(planBotEndgameParticipation(state, profile('synod-bot'))).toEqual({
      command: {
        type: 'JOIN_ALLIANCE',
        empireId: 'synod-bot',
        allianceId: 'alliance-1',
      },
      reasonCode: 'alliance-join',
    });
  });

  it('keeps Veyra solo and enters Solar War with the first legal owned combat fleet', () => {
    const state = withCombatFleet(
      createInitialGameState('bot-endgame-veyra'),
      'veyra-bot',
      'veyra-endgame-fleet',
    );

    expect(planBotEndgameParticipation(state, profile('veyra-bot'))).toEqual({
      command: {
        type: 'ENTER_SOLAR_WAR',
        empireId: 'veyra-bot',
        fleetId: 'veyra-endgame-fleet',
      },
      reasonCode: 'solar-war-enter',
    });
  });

  it('does not plan after the persisted campaign terminal boundary', () => {
    const state = createInitialGameState('bot-endgame-terminal');
    const host = state.planets.find((planet) => planet.ownerEmpireId === 'player');
    if (host === undefined) throw new Error('Missing terminal host.');
    const terminal: GameState = {
      ...state,
      campaignResult: {
        status: 'terminal',
        winningParticipationKind: 'solo',
        winningParticipationId: 'player',
        winningEmpireIds: ['player'],
        ownerEmpireId: 'player',
        hostPlanetId: host.id,
        terminalAt: state.clock.elapsedSeconds,
        reason: 'final-gate-stabilized',
      },
    };

    expect(planBotEndgameParticipation(terminal, profile('aegis-bot'))).toEqual({
      command: null,
      reasonCode: 'campaign-terminal',
    });
  });
});
