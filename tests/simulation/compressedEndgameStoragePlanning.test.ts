import { describe, expect, it } from 'vitest';
import { planBotEconomy } from '../../src/simulation/bots/economyPlanner';
import { planBotEndgameFinalObjects } from '../../src/simulation/bots/endgameFinalObjectPlanner';
import { DEFAULT_BOT_PROFILES } from '../../src/simulation/bots/profiles';
import { getBotProgressionPhase } from '../../src/simulation/bots/progressionPhase';
import { createCampaignSettings } from '../../src/simulation/campaign/settings';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { createPlanetEconomy } from '../../src/simulation/economy/planetEconomy';
import type { SolarWarResult } from '../../src/simulation/endgame/types';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import { getBuildingDefinition } from '../../src/simulation/planet/buildingCatalog';
import { getCompleteBuildingIds } from '../../src/simulation/planet/completeBuildingCatalog';
import {
  calculateBuildingCost,
  getBuildingLevel,
} from '../../src/simulation/planet/buildingProgression';
import type { PlanetState } from '../../src/simulation/planet/types';
import { getBuildingMaxLevel } from '../../src/simulation/progression/profile';
import type { GameState } from '../../src/simulation/types';

const PROFILE_ID = 'compressed-v1' as const;
const EMPIRE_ID = 'aegis-bot';

function profile() {
  const value = DEFAULT_BOT_PROFILES.find((candidate) => candidate.empireId === EMPIRE_ID);
  if (value === undefined) throw new Error(`Missing bot profile for ${EMPIRE_ID}.`);
  return value;
}

function setBuildingLevel(planet: PlanetState, buildingId: string, level: number): PlanetState {
  const exists = planet.buildings.some((building) => building.buildingId === buildingId);
  return {
    ...planet,
    buildings: exists
      ? planet.buildings.map((building) =>
          building.buildingId === buildingId ? { ...building, level } : building,
        )
      : [...planet.buildings, { buildingId, level }],
  };
}

function positiveResult(state: GameState, planetId: string): SolarWarResult {
  return {
    id: 'compressed-storage-qualified-result',
    entryId: 'compressed-storage-qualified-entry',
    cycleId: 'compressed-storage-qualified-cycle',
    cycleIndex: 1,
    empireId: EMPIRE_ID,
    fleetId: 'compressed-storage-qualified-fleet',
    originPlanetId: planetId,
    participationKind: 'solo',
    participationId: EMPIRE_ID,
    allianceId: null,
    resolvedAt: 500,
    outcome: 'victory',
    score: 1,
    attackerInitial: { scout: 1 },
    enemyInitial: { enemy: 1 },
    attackerRemaining: { scout: 1 },
    enemyRemaining: {},
    battleReport: {
      id: 'compressed-storage-qualified-battle',
      seed: 1,
      resolvedAt: 500,
      targetPlanetId: 'compressed-storage-solar-war',
      attackerEmpireId: EMPIRE_ID,
      defenderEmpireId: 'solar-war-defender',
      winner: 'attacker',
      rounds: [],
      attackerInitial: { scout: 1 },
      defenderInitial: { enemy: 1 },
      attackerRemaining: { scout: 1 },
      defenderRemaining: {},
      mode: 'pve',
    },
  };
}

function createQualifiedEndgameState(): GameState {
  let state = createInitialGameState('compressed-endgame-storage-planning', {
    campaignSettings: createCampaignSettings({
      scenarioPreset: 'campaign',
      worldSpeed: 2,
      progressionProfile: PROFILE_ID,
      createdAtReal: '2026-08-21T00:00:00.000Z',
    }),
  });
  let planet = state.planets.find((candidate) => candidate.ownerEmpireId === EMPIRE_ID);
  if (planet === undefined) throw new Error(`Missing planet for ${EMPIRE_ID}.`);

  const ids = getCompleteBuildingIds(planet.factionId);
  const buildingLevels = [
    [ids.metalPrimary, 10],
    [ids.crystalPrimary, 10],
    [ids.crystalSecondary, 6],
    [ids.gasPrimary, 10],
    [ids.gasSecondary, 6],
    [ids.solarPower, 10],
    [ids.independentPower, 5],
    [ids.constructionComplex, 4],
    [ids.shipyard, 4],
    [ids.researchCenter, 8],
    [ids.spaceport, 8],
    [ids.government, 6],
  ] as const;
  for (const [buildingId, level] of buildingLevels) {
    planet = setBuildingLevel(planet, buildingId, level);
  }

  const economy = createPlanetEconomy(PROFILE_ID, planet.buildings, 0, 'resource');
  const roles = getFactionMechanicalRoles(planet.factionId).ships;
  planet = {
    ...planet,
    specializationId: 'resource',
    economy: {
      ...economy,
      resources: {
        metal: { ...economy.resources.metal, amount: economy.resources.metal.capacity },
        crystal: { ...economy.resources.crystal, amount: economy.resources.crystal.capacity },
        gas: { ...economy.resources.gas, amount: economy.resources.gas.capacity },
      },
    },
    inventory: {
      ...planet.inventory,
      ships: {
        ...planet.inventory.ships,
        [roles.scout]: 1,
        [roles.fighter]: 1,
        [roles.colonizer]: 1,
        [roles.frigate]: 1,
        [roles.dreadnought]: 1,
      },
    },
  };
  state = {
    ...state,
    planets: state.planets.map((candidate) => candidate.id === planet.id ? planet! : candidate),
  };
  if (state.endgameParticipation === undefined) throw new Error('Participation missing.');
  return {
    ...state,
    endgameParticipation: {
      ...state.endgameParticipation,
      solarWar: {
        ...state.endgameParticipation.solarWar,
        history: [
          ...state.endgameParticipation.solarWar.history,
          positiveResult(state, planet.id),
        ],
      },
    },
  };
}

describe('compressed endgame storage planning', () => {
  it('routes a qualified capacity-blocked bot into legal storage progression', () => {
    const state = createQualifiedEndgameState();
    const planet = state.planets.find((candidate) => candidate.ownerEmpireId === EMPIRE_ID);
    if (planet === undefined) throw new Error(`Missing planet for ${EMPIRE_ID}.`);
    const ids = getCompleteBuildingIds(planet.factionId);
    const obelisk = getBuildingDefinition(ids.galacticObelisk);
    const metalStorage = getBuildingDefinition(ids.metalStorage);
    if (obelisk === undefined || metalStorage === undefined) throw new Error('Endgame buildings missing.');
    const obeliskCost = calculateBuildingCost(obelisk, 1, PROFILE_ID);

    expect(getBotProgressionPhase(state, EMPIRE_ID)).toBe('endgame-preparation');
    expect(obeliskCost.metal).toBeGreaterThan(planet.economy.resources.metal.capacity);
    expect(getBuildingLevel(planet.buildings, ids.metalStorage)).toBe(0);
    expect(getBuildingMaxLevel(PROFILE_ID, metalStorage)).toBeGreaterThan(0);
    expect(planBotEndgameFinalObjects(state, profile())).toEqual({
      command: null,
      reasonCode: 'final-object-no-legal-action',
    });

    const economyPlan = planBotEconomy(state, EMPIRE_ID);
    expect(economyPlan.reasonCode).toBe('expand-industry');
    expect(economyPlan.command).toMatchObject({
      type: 'QUEUE_BUILDING',
      empireId: EMPIRE_ID,
      planetId: planet.id,
    });
    if (economyPlan.command?.type !== 'QUEUE_BUILDING') {
      throw new Error('Compressed endgame planning did not produce a storage build command.');
    }
    expect([ids.metalStorage, ids.crystalStorage]).toContain(economyPlan.command.buildingId);
  });
});
