import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import type { ResourceCost } from '../../src/simulation/economy/types';
import type { SolarWarResult } from '../../src/simulation/endgame/types';
import { getBuildingDefinition } from '../../src/simulation/planet/buildingCatalog';
import { calculateBuildingCost } from '../../src/simulation/planet/buildingProgression';
import { getCompleteBuildingIds } from '../../src/simulation/planet/completeBuildingCatalog';
import type { FactionId, PlanetState } from '../../src/simulation/planet/types';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState } from '../../src/simulation/types';

function execute(state: GameState, command: Parameters<typeof executeCommand>[1]): GameState {
  const result = executeCommand(state, command);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(`${result.code}: ${result.message}`);
  return result.value;
}

function getPlanet(state: GameState, empireId: string): PlanetState {
  const planet = state.planets.find((candidate) => candidate.ownerEmpireId === empireId);
  if (planet === undefined) throw new Error(`Planet missing for ${empireId}.`);
  return planet;
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

function withResources(planet: PlanetState, resources: ResourceCost): PlanetState {
  return {
    ...planet,
    economy: {
      ...planet.economy,
      resources: {
        metal: { ...planet.economy.resources.metal, amount: resources.metal },
        crystal: { ...planet.economy.resources.crystal, amount: resources.crystal },
        gas: { ...planet.economy.resources.gas, amount: resources.gas },
      },
    },
  };
}

function replacePlanet(state: GameState, replacement: PlanetState): GameState {
  return {
    ...state,
    planets: state.planets.map((planet) => planet.id === replacement.id ? replacement : planet),
  };
}

function positiveResult(
  state: GameState,
  empireId: string,
  participationKind: 'solo' | 'alliance',
  participationId: string,
  allianceId: string | null,
): SolarWarResult {
  return {
    id: `qualified-${participationId}-${empireId}`,
    entryId: `entry-${participationId}-${empireId}`,
    cycleId: 'solar-war-qualified',
    cycleIndex: 7,
    empireId,
    fleetId: `fleet-${empireId}`,
    originPlanetId: getPlanet(state, empireId).id,
    participationKind,
    participationId,
    allianceId,
    resolvedAt: 700,
    outcome: 'victory',
    score: 12_345,
    attackerInitial: { scout: 1 },
    enemyInitial: { enemy: 1 },
    attackerRemaining: { scout: 1 },
    enemyRemaining: {},
    battleReport: {
      id: `battle-${participationId}-${empireId}`,
      seed: 7,
      resolvedAt: 700,
      targetPlanetId: 'solar-war-qualified',
      attackerEmpireId: empireId,
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

function withQualification(
  state: GameState,
  empireId = 'player',
  participationKind: 'solo' | 'alliance' = 'solo',
  participationId = empireId,
  allianceId: string | null = null,
): GameState {
  if (state.endgameParticipation === undefined) throw new Error('Participation missing.');
  return {
    ...state,
    endgameParticipation: {
      ...state.endgameParticipation,
      solarWar: {
        ...state.endgameParticipation.solarWar,
        history: [
          ...state.endgameParticipation.solarWar.history,
          positiveResult(state, empireId, participationKind, participationId, allianceId),
        ],
      },
    },
  };
}

function prepareHost(state: GameState, includeObelisk: boolean): GameState {
  let planet = getPlanet(state, 'player');
  const ids = getCompleteBuildingIds(planet.factionId);
  planet = setBuildingLevel(planet, ids.government, 10);
  planet = setBuildingLevel(planet, ids.researchCenter, 15);
  planet = setBuildingLevel(planet, ids.spaceport, includeObelisk ? 12 : 10);
  if (includeObelisk) planet = setBuildingLevel(planet, ids.galacticObelisk, 1);
  planet = withResources(planet, { metal: 100_000_000, crystal: 100_000_000, gas: 100_000_000 });
  return replacePlanet(state, planet);
}

function startSoloProject(factionId: FactionId): GameState {
  let state = createInitialGameState(`final-project-${factionId}`, { playerFaction: factionId });
  state = prepareHost(state, true);
  state = withQualification(state);
  return execute(state, {
    type: 'START_FINAL_OBJECT_PROJECT',
    empireId: 'player',
    planetId: getPlanet(state, 'player').id,
  });
}

describe('final-object foundation', () => {
  for (const factionId of ['aegis', 'synod', 'veyra'] as const) {
    it(`unlocks only the qualified ${factionId} Obelisk through the ordinary queue`, () => {
      let state = createInitialGameState(`obelisk-${factionId}`, { playerFaction: factionId });
      state = prepareHost(state, false);
      const planet = getPlanet(state, 'player');
      const ids = getCompleteBuildingIds(factionId);

      expect(executeCommand(state, {
        type: 'QUEUE_BUILDING',
        empireId: 'player',
        planetId: planet.id,
        buildingId: ids.galacticObelisk,
      })).toMatchObject({ ok: false, code: 'BUILDING_FEATURE_LOCKED' });

      state = withQualification(state);
      const queued = executeCommand(state, {
        type: 'QUEUE_BUILDING',
        empireId: 'player',
        planetId: planet.id,
        buildingId: ids.galacticObelisk,
      });
      expect(queued.ok).toBe(true);
      if (!queued.ok) return;
      expect(getPlanet(queued.value, 'player').buildQueue[0]?.buildingId).toBe(ids.galacticObelisk);
      expect(executeCommand(state, {
        type: 'QUEUE_BUILDING',
        empireId: 'player',
        planetId: planet.id,
        buildingId: ids.supremeGalacticGates,
      })).toMatchObject({ ok: false, code: 'BUILDING_FEATURE_LOCKED' });
    });

    it(`snapshots exact ${factionId} Gate funding cost for a solo project`, () => {
      const state = startSoloProject(factionId);
      const project = state.endgameFinalObjects?.activeProjects[0];
      const host = getPlanet(state, 'player');
      const ids = getCompleteBuildingIds(factionId);
      const definition = getBuildingDefinition(ids.supremeGalacticGates);
      expect(definition).toBeDefined();
      if (definition === undefined || project === undefined) return;
      expect(project).toMatchObject({
        ownerEmpireId: 'player',
        ownerPlanetId: host.id,
        factionId,
        participationKind: 'solo',
        participationId: 'player',
        allianceId: null,
        eligibleEmpireIds: ['player'],
        phase: 'funding',
        qualification: { cycleId: 'solar-war-qualified', score: 12_345 },
      });
      expect(project.requiredResources).toEqual(
        calculateBuildingCost(definition, 1, state.campaignSettings.progressionProfile),
      );
    });
  }

  it('spends pooled resources once, enters the ordinary Gate queue and requires project cancellation', () => {
    let state = startSoloProject('aegis');
    const project = state.endgameFinalObjects?.activeProjects[0];
    if (project === undefined) throw new Error('Project missing.');
    const before = getPlanet(state, 'player');
    const beforeAmounts = {
      metal: before.economy.resources.metal.amount,
      crystal: before.economy.resources.crystal.amount,
      gas: before.economy.resources.gas.amount,
    };

    state = execute(state, {
      type: 'CONTRIBUTE_FINAL_OBJECT_PROJECT',
      empireId: 'player',
      projectId: project.id,
      sourcePlanetId: before.id,
      resources: project.requiredResources,
    });
    const funded = state.endgameFinalObjects?.activeProjects[0];
    const host = getPlanet(state, 'player');
    expect(funded?.phase).toBe('building');
    expect(funded?.contributedResources).toEqual(project.requiredResources);
    expect(host.buildQueue).toHaveLength(1);
    expect(host.buildQueue[0]?.buildingId).toBe(project.gateBuildingId);
    expect(host.economy.resources.metal.amount).toBe(beforeAmounts.metal - project.requiredResources.metal);
    expect(host.economy.resources.crystal.amount).toBe(beforeAmounts.crystal - project.requiredResources.crystal);
    expect(host.economy.resources.gas.amount).toBe(beforeAmounts.gas - project.requiredResources.gas);

    const ordinaryCancel = executeCommand(state, {
      type: 'CANCEL_BUILDING',
      empireId: 'player',
      planetId: host.id,
      queueItemId: host.buildQueue[0]!.id,
    });
    expect(ordinaryCancel).toMatchObject({ ok: false, code: 'FINAL_PROJECT_CANCEL_REQUIRED' });

    const amountsBeforeCancel = getPlanet(state, 'player').economy.resources;
    state = execute(state, {
      type: 'CANCEL_FINAL_OBJECT_PROJECT',
      empireId: 'player',
      projectId: project.id,
    });
    expect(state.endgameFinalObjects?.activeProjects).toHaveLength(0);
    expect(state.endgameFinalObjects?.history.at(-1)).toMatchObject({ projectId: project.id, action: 'cancelled' });
    expect(getPlanet(state, 'player').buildQueue).toHaveLength(0);
    expect(getPlanet(state, 'player').economy.resources).toEqual(amountsBeforeCancel);
  });

  it('keeps the alliance cohort immutable after project start', () => {
    let state = createInitialGameState('final-project-alliance');
    state = execute(state, { type: 'CREATE_ALLIANCE', empireId: 'player', name: 'Gate Union' });
    state = execute(state, { type: 'JOIN_ALLIANCE', empireId: 'aegis-bot', allianceId: 'alliance-1' });
    state = prepareHost(state, true);
    state = withQualification(state, 'player', 'alliance', 'alliance-1', 'alliance-1');
    let botPlanet = getPlanet(state, 'aegis-bot');
    botPlanet = withResources(botPlanet, { metal: 1_000, crystal: 1_000, gas: 1_000 });
    state = replacePlanet(state, botPlanet);
    state = execute(state, {
      type: 'START_FINAL_OBJECT_PROJECT',
      empireId: 'player',
      planetId: getPlanet(state, 'player').id,
    });
    const project = state.endgameFinalObjects?.activeProjects[0];
    if (project === undefined) throw new Error('Alliance project missing.');
    expect(project.eligibleEmpireIds).toEqual(['aegis-bot', 'player']);

    state = execute(state, { type: 'LEAVE_ALLIANCE', empireId: 'aegis-bot' });
    state = execute(state, {
      type: 'JOIN_ALLIANCE',
      empireId: 'synod-bot',
      allianceId: 'alliance-1',
    });
    const contribution = executeCommand(state, {
      type: 'CONTRIBUTE_FINAL_OBJECT_PROJECT',
      empireId: 'aegis-bot',
      projectId: project.id,
      sourcePlanetId: botPlanet.id,
      resources: { metal: 1, crystal: 0, gas: 0 },
    });
    expect(contribution.ok).toBe(true);
    const rejected = executeCommand(contribution.ok ? contribution.value : state, {
      type: 'CONTRIBUTE_FINAL_OBJECT_PROJECT',
      empireId: 'synod-bot',
      projectId: project.id,
      sourcePlanetId: getPlanet(state, 'synod-bot').id,
      resources: { metal: 1, crystal: 0, gas: 0 },
    });
    expect(rejected).toMatchObject({ ok: false, code: 'FINAL_PROJECT_NOT_ELIGIBLE' });
    if (contribution.ok) {
      expect(contribution.value.endgameFinalObjects?.activeProjects[0]?.eligibleEmpireIds)
        .toEqual(['aegis-bot', 'player']);
    }
  });

  it('bounds contribution history at the newest 64 entries', () => {
    let state = startSoloProject('aegis');
    const project = state.endgameFinalObjects?.activeProjects[0];
    if (project === undefined) throw new Error('Project missing.');
    const source = getPlanet(state, 'player');
    for (let index = 0; index < 70; index += 1) {
      state = execute(state, {
        type: 'CONTRIBUTE_FINAL_OBJECT_PROJECT',
        empireId: 'player',
        projectId: project.id,
        sourcePlanetId: source.id,
        resources: { metal: 1, crystal: 0, gas: 0 },
      });
    }
    expect(state.endgameFinalObjects?.contributionHistory).toHaveLength(64);
    expect(state.endgameFinalObjects?.contributionHistory[0]?.sequence).toBe(6);
    expect(state.endgameFinalObjects?.contributionHistory.at(-1)?.sequence).toBe(69);
  });
});
