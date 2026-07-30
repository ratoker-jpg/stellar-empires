import { describe, expect, it } from 'vitest';
import { createCampaignSettings } from '../../src/simulation/campaign/settings';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { applyPvePlunderMultiplier } from '../../src/simulation/pve/pveBalance';
import {
  getRequiredSpaceObjectShipId,
  type SpaceObjectKind,
} from '../../src/simulation/pve/spaceObjects';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState } from '../../src/simulation/types';

function stateFor(profile: 'legacy-v1' | 'compressed-v1', seed: string): GameState {
  return createInitialGameState(seed, {
    campaignSettings: createCampaignSettings({
      progressionProfile: profile,
      createdAtReal: '2026-07-30T12:00:00.000Z',
    }),
  });
}

function withExpeditionFleet(state: GameState): GameState {
  const origin = state.planets.find((planet) => planet.ownerEmpireId === 'player');
  if (origin === undefined) throw new Error('Player origin missing.');
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
                gas: { ...planet.economy.resources.gas, amount: 1_000_000, capacity: 1_000_000 },
              },
            },
          }
        : planet,
    ),
    fleets: [
      ...state.fleets,
      {
        id: 'reward-expedition',
        empireId: 'player',
        originPlanetId: origin.id,
        location: { type: 'planet' as const, planetId: origin.id },
        status: 'stationed' as const,
        ships: { 'ship.aegis.scout': 2 },
        cargo: { metal: 0, crystal: 0, gas: 0 },
        speed: 14,
        cargoCapacity: 40,
        mission: null,
      },
    ],
  };
}

function expeditionReport(state: GameState) {
  const occupied = new Set(state.planets.map((planet) => planet.galaxyPlanetId));
  const target = state.galaxy.systems
    .flatMap((system) => system.planets)
    .find((planet) => !occupied.has(planet.id));
  if (target === undefined) throw new Error('Expedition target missing.');
  const started = executeCommand(state, {
    type: 'START_EXPEDITION',
    empireId: 'player',
    fleetId: 'reward-expedition',
    targetGalaxyPlanetId: target.id,
  });
  expect(started.ok).toBe(true);
  if (!started.ok) throw new Error(started.message);
  const event = started.value.pendingEvents.find(
    (candidate) => candidate.payload.type === 'EXPEDITION_RESOLVE',
  );
  if (event === undefined || event.payload.type !== 'EXPEDITION_RESOLVE') {
    throw new Error('Expedition report missing.');
  }
  return event.payload.report;
}

function withSpaceObjectFleet(state: GameState, kind: SpaceObjectKind): GameState {
  const origin = state.planets.find((planet) => planet.ownerEmpireId === 'player');
  if (origin === undefined) throw new Error('Player origin missing.');
  const requiredShipId = getRequiredSpaceObjectShipId(kind);
  return {
    ...state,
    planets: state.planets.map((planet) =>
      planet.id === origin.id
        ? {
            ...planet,
            economy: {
              ...planet.economy,
              resources: {
                metal: { ...planet.economy.resources.metal, amount: 0, capacity: 1_000_000 },
                crystal: { ...planet.economy.resources.crystal, amount: 0, capacity: 1_000_000 },
                gas: { ...planet.economy.resources.gas, amount: 1_000_000, capacity: 1_000_000 },
              },
            },
          }
        : planet,
    ),
    fleets: [
      ...state.fleets,
      {
        id: 'reward-space-object',
        empireId: 'player',
        originPlanetId: origin.id,
        location: { type: 'planet' as const, planetId: origin.id },
        status: 'stationed' as const,
        ships: { [requiredShipId]: 2 },
        cargo: { metal: 0, crystal: 0, gas: 0 },
        speed: 10,
        cargoCapacity: 2_000,
        mission: null,
      },
    ],
  };
}

function spaceObjectReport(state: GameState, kind: SpaceObjectKind) {
  const object = state.spaceObjects.find((candidate) => candidate.kind === kind);
  if (object === undefined) throw new Error(`Space object missing: ${kind}.`);
  const started = executeCommand(withSpaceObjectFleet(state, kind), {
    type: 'START_SPACE_OBJECT_MISSION',
    empireId: 'player',
    fleetId: 'reward-space-object',
    objectId: object.id,
  });
  expect(started.ok).toBe(true);
  if (!started.ok) throw new Error(started.message);
  const event = started.value.pendingEvents.find(
    (candidate) => candidate.payload.type === 'SPACE_OBJECT_MISSION_RESOLVE',
  );
  if (event === undefined || event.payload.type !== 'SPACE_OBJECT_MISSION_RESOLVE') {
    throw new Error('Space object report missing.');
  }
  return event.payload.report;
}

describe('compressed campaign resource rewards', () => {
  it('applies the campaign multiplier before the expedition contextual multiplier', () => {
    const legacy = expeditionReport(withExpeditionFleet(stateFor('legacy-v1', 'reward-expedition')));
    const compressed = expeditionReport(withExpeditionFleet(stateFor('compressed-v1', 'reward-expedition')));

    expect(compressed.outcome).toBe(legacy.outcome);
    expect(compressed.rewardMultiplierPermille).toBe(legacy.rewardMultiplierPermille);
    for (const resourceId of ['metal', 'crystal', 'gas'] as const) {
      expect(compressed.reward[resourceId]).toBeGreaterThanOrEqual(legacy.reward[resourceId] * 2);
      expect(compressed.reward[resourceId]).toBeLessThanOrEqual(legacy.reward[resourceId] * 2 + 1);
    }
  });

  it('doubles space-object resources but leaves exotic matter unchanged', () => {
    const legacyAsteroid = spaceObjectReport(stateFor('legacy-v1', 'reward-asteroid'), 'asteroid');
    const compressedAsteroid = spaceObjectReport(stateFor('compressed-v1', 'reward-asteroid'), 'asteroid');
    expect(compressedAsteroid.reward.metal).toBe(legacyAsteroid.reward.metal * 2);
    expect(compressedAsteroid.reward.crystal).toBe(legacyAsteroid.reward.crystal * 2);
    expect(compressedAsteroid.reward.gas).toBe(legacyAsteroid.reward.gas * 2);

    const legacyAnomaly = spaceObjectReport(stateFor('legacy-v1', 'reward-anomaly'), 'anomaly');
    const compressedAnomaly = spaceObjectReport(stateFor('compressed-v1', 'reward-anomaly'), 'anomaly');
    expect(compressedAnomaly.reward.exoticMatter).toBe(legacyAnomaly.reward.exoticMatter);
  });

  it('does not add a campaign multiplier to plunder', () => {
    const plunder = { metal: 1_000, crystal: 500, gas: 250 } as const;
    expect(applyPvePlunderMultiplier(plunder, 1_250)).toEqual({
      metal: 1_250,
      crystal: 625,
      gas: 312,
    });
  });
});
