import { describe, expect, it } from 'vitest';
import { planBotArenaParticipation } from '../../src/simulation/bots/arenaPlanner';
import type { BotProfile } from '../../src/simulation/bots/profiles';
import { planBotPveOperations } from '../../src/simulation/bots/pveOperationsPlanner';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import type { FleetState } from '../../src/simulation/fleets/types';
import { getArenaChallenges } from '../../src/simulation/pveMeta/arena';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState } from '../../src/simulation/types';

interface ArenaFixture {
  readonly state: GameState;
  readonly profile: BotProfile;
  readonly arenaFleetId: string;
}

function profile(
  empireId: string,
  personality: BotProfile['personality'],
): BotProfile {
  return {
    id: `arena.${empireId}.${personality}`,
    empireId,
    personality,
    difficulty: 'normal',
    decisionIntervalSeconds: 300,
    maxCommandsPerDecision: 4,
  };
}

function prepareArenaFixture(
  seed: string,
  empireId: string,
  personality: BotProfile['personality'],
  gasAmount = 100_000,
): ArenaFixture {
  const initial = createInitialGameState(seed);
  const origin = initial.planets.find((planet) => planet.ownerEmpireId === empireId);
  if (origin === undefined) throw new Error(`Missing Arena origin for ${empireId}.`);
  const roles = getFactionMechanicalRoles(origin.factionId).ships;
  const capabilityFleet: FleetState = {
    id: `${empireId}-arena-capability`,
    empireId,
    originPlanetId: origin.id,
    location: { type: 'planet', planetId: origin.id },
    status: 'holding',
    ships: {
      [roles.scout]: 1,
      [roles.fighter]: 1,
      [roles.colonizer]: 1,
      [roles.cruiser]: 1,
    },
    cargo: { metal: 0, crystal: 0, gas: 0 },
    speed: 100,
    cargoCapacity: 10_000,
    mission: null,
  };
  const arenaFleet: FleetState = {
    id: `${empireId}-arena-ready`,
    empireId,
    originPlanetId: origin.id,
    location: { type: 'planet', planetId: origin.id },
    status: 'stationed',
    ships: {
      [roles.dreadnought]: 200,
      [roles.cruiser]: 200,
    },
    cargo: { metal: 0, crystal: 0, gas: 0 },
    speed: 100,
    cargoCapacity: 100_000,
    mission: null,
  };
  const fundedOrigin = {
    ...origin,
    economy: {
      ...origin.economy,
      resources: {
        metal: {
          ...origin.economy.resources.metal,
          amount: 100_000,
          capacity: 100_000,
        },
        crystal: {
          ...origin.economy.resources.crystal,
          amount: 100_000,
          capacity: 100_000,
        },
        gas: {
          ...origin.economy.resources.gas,
          amount: gasAmount,
          capacity: 100_000,
        },
      },
    },
  };
  return {
    state: {
      ...initial,
      planets: initial.planets.map((planet) =>
        planet.id === origin.id ? fundedOrigin : planet,
      ),
      fleets: [...initial.fleets, capabilityFleet, arenaFleet],
      spaceObjects: [],
      worldEvents: { ...initial.worldEvents, active: [] },
    },
    profile: profile(empireId, personality),
    arenaFleetId: arenaFleet.id,
  };
}

function expectLegalArenaPlan(fixture: ArenaFixture): void {
  const checksum = createStateChecksum(fixture.state);
  const first = planBotArenaParticipation(fixture.state, fixture.profile);
  const repeated = planBotArenaParticipation(fixture.state, fixture.profile);
  expect(repeated).toEqual(first);
  expect(createStateChecksum(fixture.state)).toBe(checksum);
  expect(first).toMatchObject({
    reasonCode: 'arena-selected',
    selectedFleetId: fixture.arenaFleetId,
  });
  expect(first.command).toMatchObject({
    type: 'ENTER_ARENA_CHALLENGE',
    empireId: fixture.profile.empireId,
    fleetId: fixture.arenaFleetId,
  });
  if (first.command === null || first.command.type !== 'ENTER_ARENA_CHALLENGE') return;
  expect(getArenaChallenges(fixture.state).some(
    (challenge) => challenge.id === first.command?.challengeId,
  )).toBe(true);
  expect(executeCommand(fixture.state, first.command).ok).toBe(true);

  const integrated = planBotPveOperations(fixture.state, fixture.profile);
  expect(integrated.reasonCode).toBe('arena-selected');
  expect(integrated.command).toEqual(first.command);
}

describe('honest bot Arena participation', () => {
  it.each([
    ['aegis-bot', 'industrial'],
    ['synod-bot', 'explorer'],
    ['veyra-bot', 'aggressive'],
  ] as const)('%s produces one legal public Arena command', (empireId, personality) => {
    expectLegalArenaPlan(prepareArenaFixture(
      `bot-arena-${empireId}`,
      empireId,
      personality,
    ));
  });

  it('does not unlock before planet-destruction capability', () => {
    const initial = createInitialGameState('bot-arena-locked');
    const empireId = 'aegis-bot';
    const origin = initial.planets.find((planet) => planet.ownerEmpireId === empireId);
    if (origin === undefined) throw new Error('Missing locked Arena origin.');
    const roles = getFactionMechanicalRoles(origin.factionId).ships;
    const state: GameState = {
      ...initial,
      fleets: [...initial.fleets, {
        id: 'locked-arena-fleet',
        empireId,
        originPlanetId: origin.id,
        location: { type: 'planet', planetId: origin.id },
        status: 'stationed',
        ships: { [roles.fighter]: 100 },
        cargo: { metal: 0, crystal: 0, gas: 0 },
        speed: 100,
        cargoCapacity: 10_000,
        mission: null,
      }],
    };
    expect(planBotArenaParticipation(state, profile(empireId, 'industrial'))).toMatchObject({
      reasonCode: 'arena-locked',
      availabilityCode: 'BOT_ARENA_PROGRESSION_LOCKED',
      command: null,
    });
  });

  it('protects the mandatory 40% gas reserve', () => {
    const fixture = prepareArenaFixture(
      'bot-arena-gas-reserve',
      'synod-bot',
      'explorer',
      40_000,
    );
    expect(planBotArenaParticipation(fixture.state, fixture.profile)).toMatchObject({
      reasonCode: 'arena-gas-reserve-protected',
      availabilityCode: 'BOT_ARENA_GAS_RESERVE',
      command: null,
    });
  });

  it('ignores hidden player resources, fleets and defenses', () => {
    const fixture = prepareArenaFixture(
      'bot-arena-hidden-state',
      'veyra-bot',
      'aggressive',
    );
    const before = planBotArenaParticipation(fixture.state, fixture.profile);
    const player = fixture.state.planets.find((planet) => planet.ownerEmpireId === 'player');
    if (player === undefined) throw new Error('Missing hidden player fixture.');
    const changed: GameState = {
      ...fixture.state,
      planets: fixture.state.planets.map((planet) =>
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
      fleets: [...fixture.state.fleets, {
        id: 'hidden-player-arena-fleet',
        empireId: 'player',
        originPlanetId: player.id,
        location: { type: 'planet', planetId: player.id },
        status: 'stationed',
        ships: { 'ship.aegis.death-star': 999 },
        cargo: { metal: 999_999, crystal: 999_999, gas: 999_999 },
        speed: 9_999,
        cargoCapacity: 9_999_999,
        mission: null,
      }],
    };
    expect(planBotArenaParticipation(changed, fixture.profile)).toEqual(before);
  });
});
