import { describe, expect, it } from 'vitest';
import type { BotProfile } from '../../src/simulation/bots/profiles';
import { createBotPerception } from '../../src/simulation/bots/perception';
import { planBotPveOperations } from '../../src/simulation/bots/pveOperationsPlanner';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getRequiredSpaceObjectShipId } from '../../src/simulation/pve/spaceObjects';
import type { GameState } from '../../src/simulation/types';

const PROFILE: BotProfile = {
  id: 'audit.bot-pve-industrial',
  empireId: 'aegis-bot',
  personality: 'industrial',
  difficulty: 'normal',
  decisionIntervalSeconds: 300,
  maxCommandsPerDecision: 3,
};

function visibleObjectFixture(seed: string): GameState {
  let state = createInitialGameState(seed);
  const empireId = PROFILE.empireId;
  const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId)!;
  const object = state.spaceObjects.find(
    (candidate) => candidate.kind === 'asteroid' || candidate.kind === 'gas-cloud',
  );
  if (object === undefined) throw new Error('Public object fixture missing.');
  const unitId = getRequiredSpaceObjectShipId(object.kind, origin.factionId);
  state = {
    ...state,
    spaceObjects: [object],
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
    fleets: [
      ...state.fleets,
      {
        id: 'audit-bot-pve-object',
        empireId,
        originPlanetId: origin.id,
        location: { type: 'planet' as const, planetId: origin.id },
        status: 'stationed' as const,
        ships: { [unitId]: 1 },
        cargo: { metal: 0, crystal: 0, gas: 0 },
        speed: 1_000,
        cargoCapacity: 1_000,
        mission: null,
      },
    ],
  };
  return state;
}

describe('bot PvE information boundary', () => {
  it('exposes only globally public PvE fields', () => {
    const initial = createInitialGameState('bot-pve-public-boundary');
    const pirate = initial.planets.find((planet) => planet.ownerEmpireId === 'pirate-neutral');
    if (pirate === undefined) throw new Error('Pirate fixture missing.');
    const state: GameState = {
      ...initial,
      worldEvents: {
        ...initial.worldEvents,
        active: [{
          id: 'audit-pirate-hunt',
          definitionId: 'pirate-hunt',
          targetType: 'planet',
          targetId: pirate.id,
          startedAt: 0,
          endsAt: 3_600,
          chainDepth: 0,
        }],
      },
    };
    const perception = createBotPerception(state, PROFILE.empireId);

    expect(perception.publicExpeditionPositions.length).toBeGreaterThan(0);
    expect(perception.publicSpaceObjects.length).toBeGreaterThan(0);
    expect(perception.publicPirateBases.length).toBeGreaterThan(0);
    expect(perception.activeWorldEvents).toEqual([{
      id: 'audit-pirate-hunt',
      definitionId: 'pirate-hunt',
      targetType: 'planet',
      targetId: pirate.id,
      startsAt: 0,
      endsAt: 3_600,
    }]);

    const publicObject = perception.publicSpaceObjects[0];
    expect(publicObject).toMatchObject({
      id: expect.any(String),
      coordinate: expect.any(Object),
      kind: expect.any(String),
      remainingYield: expect.any(Number),
      cooldownUntil: expect.any(Number),
    });
    expect(publicObject).not.toHaveProperty('hazardPermille');
    expect(publicObject).not.toHaveProperty('futureOutcome');
    expect(perception.publicPirateBases[0]).not.toHaveProperty('resources');
    expect(perception.publicPirateBases[0]).not.toHaveProperty('defenses');
  });

  it('does not change a PvE plan when hidden player state changes', () => {
    const state = visibleObjectFixture('bot-pve-hidden-boundary');
    const before = planBotPveOperations(state, PROFILE);
    const playerPlanet = state.planets.find((planet) => planet.ownerEmpireId === 'player');
    if (playerPlanet === undefined) throw new Error('Player fixture missing.');

    const changed: GameState = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.id === playerPlanet.id
          ? {
              ...planet,
              economy: {
                ...planet.economy,
                resources: {
                  metal: { ...planet.economy.resources.metal, amount: 999_999 },
                  crystal: { ...planet.economy.resources.crystal, amount: 888_888 },
                  gas: { ...planet.economy.resources.gas, amount: 777_777 },
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
          id: 'hidden-player-fleet',
          empireId: 'player',
          originPlanetId: playerPlanet.id,
          location: { type: 'planet' as const, planetId: playerPlanet.id },
          status: 'stationed' as const,
          ships: { 'ship.aegis.death-star': 999 },
          cargo: { metal: 999_999, crystal: 999_999, gas: 999_999 },
          speed: 9_999,
          cargoCapacity: 9_999_999,
          mission: null,
        },
      ],
    };

    expect(planBotPveOperations(changed, PROFILE)).toEqual(before);
  });
});
