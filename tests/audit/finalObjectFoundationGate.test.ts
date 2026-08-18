import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import type { ResourceCost } from '../../src/simulation/economy/types';
import type {
  SolarWarParticipationKind,
  SolarWarResult,
} from '../../src/simulation/endgame/types';
import { getBuildingDefinition } from '../../src/simulation/planet/buildingCatalog';
import { calculateBuildingCost } from '../../src/simulation/planet/buildingProgression';
import { getCompleteBuildingIds } from '../../src/simulation/planet/completeBuildingCatalog';
import type { FactionId, PlanetState } from '../../src/simulation/planet/types';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameCommand, GameState } from '../../src/simulation/types';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

const FACTIONS: readonly FactionId[] = ['aegis', 'synod', 'veyra'];
const PARTICIPATION_KINDS: readonly SolarWarParticipationKind[] = ['solo', 'alliance'];
const SAVE_TIME = '2026-08-18T17:30:00.000Z';

function execute(state: GameState, command: GameCommand): GameState {
  const result = executeCommand(state, command);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(`${result.code}: ${result.message}`);
  return result.value;
}

function planetFor(state: GameState, empireId: string): PlanetState {
  const planet = state.planets.find((candidate) => candidate.ownerEmpireId === empireId);
  if (planet === undefined) throw new Error(`Planet missing for ${empireId}.`);
  return planet;
}

function replacePlanet(state: GameState, replacement: PlanetState): GameState {
  return {
    ...state,
    planets: state.planets.map((planet) =>
      planet.id === replacement.id ? replacement : planet,
    ),
  };
}

function withBuildingLevel(
  planet: PlanetState,
  buildingId: string,
  level: number,
): PlanetState {
  const existing = planet.buildings.some((building) => building.buildingId === buildingId);
  return {
    ...planet,
    buildings: existing
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

function prepareHost(state: GameState): GameState {
  let host = planetFor(state, 'player');
  const ids = getCompleteBuildingIds(host.factionId);
  host = withBuildingLevel(host, ids.government, 10);
  host = withBuildingLevel(host, ids.researchCenter, 15);
  host = withBuildingLevel(host, ids.spaceport, 12);
  host = withBuildingLevel(host, ids.galacticObelisk, 1);
  host = withResources(host, {
    metal: 100_000_000,
    crystal: 100_000_000,
    gas: 100_000_000,
  });
  return replacePlanet(state, host);
}

function qualificationResult(
  state: GameState,
  participationKind: SolarWarParticipationKind,
  participationId: string,
  allianceId: string | null,
): SolarWarResult {
  const cycleId = 'solar-war-9';
  return {
    id: `foundation-result-${participationId}`,
    entryId: `foundation-entry-${participationId}`,
    cycleId,
    cycleIndex: 9,
    empireId: 'player',
    fleetId: 'foundation-fleet-player',
    originPlanetId: planetFor(state, 'player').id,
    participationKind,
    participationId,
    allianceId,
    resolvedAt: 900,
    outcome: 'victory',
    score: 9_001,
    attackerInitial: { scout: 1 },
    enemyInitial: { enemy: 1 },
    attackerRemaining: { scout: 1 },
    enemyRemaining: {},
    battleReport: {
      id: `foundation-battle-${participationId}`,
      seed: 9,
      resolvedAt: 900,
      targetPlanetId: cycleId,
      attackerEmpireId: 'player',
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

function addQualification(
  state: GameState,
  participationKind: SolarWarParticipationKind,
  participationId: string,
  allianceId: string | null,
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
          qualificationResult(state, participationKind, participationId, allianceId),
        ],
      },
    },
  };
}

function prepareProject(
  factionId: FactionId,
  participationKind: SolarWarParticipationKind,
): GameState {
  let state = createInitialGameState(
    `final-object-foundation-${factionId}-${participationKind}`,
    { playerFaction: factionId },
  );
  state = prepareHost(state);

  let participationId = 'player';
  let allianceId: string | null = null;
  if (participationKind === 'alliance') {
    state = execute(state, {
      type: 'CREATE_ALLIANCE',
      empireId: 'player',
      name: `${factionId} Foundation Union`,
    });
    state = execute(state, {
      type: 'JOIN_ALLIANCE',
      empireId: 'aegis-bot',
      allianceId: 'alliance-1',
    });
    participationId = 'alliance-1';
    allianceId = 'alliance-1';
    state = replacePlanet(
      state,
      withResources(planetFor(state, 'aegis-bot'), {
        metal: 1_000,
        crystal: 1_000,
        gas: 1_000,
      }),
    );
  }

  state = addQualification(state, participationKind, participationId, allianceId);
  return execute(state, {
    type: 'START_FINAL_OBJECT_PROJECT',
    empireId: 'player',
    planetId: planetFor(state, 'player').id,
  });
}

describe('FINAL-OBJECT-FOUNDATION acceptance matrix', () => {
  for (const factionId of FACTIONS) {
    for (const participationKind of PARTICIPATION_KINDS) {
      it(`${factionId} ${participationKind} reaches pre-funded ordinary Gate construction and round-trips`, () => {
        let state = prepareProject(factionId, participationKind);
        const project = state.endgameFinalObjects?.activeProjects[0];
        expect(project).toBeDefined();
        if (project === undefined) return;

        const ids = getCompleteBuildingIds(factionId);
        const gate = getBuildingDefinition(ids.supremeGalacticGates);
        expect(gate).toBeDefined();
        if (gate === undefined) return;
        expect(project.requiredResources).toEqual(
          calculateBuildingCost(gate, 1, state.campaignSettings.progressionProfile),
        );
        expect(project.eligibleEmpireIds).toEqual(
          participationKind === 'solo' ? ['player'] : ['aegis-bot', 'player'],
        );

        let ownerContribution = project.requiredResources;
        if (participationKind === 'alliance') {
          const allyPlanet = planetFor(state, 'aegis-bot');
          state = execute(state, {
            type: 'CONTRIBUTE_FINAL_OBJECT_PROJECT',
            empireId: 'aegis-bot',
            projectId: project.id,
            sourcePlanetId: allyPlanet.id,
            resources: { metal: 1, crystal: 1, gas: 1 },
          });
          ownerContribution = {
            metal: project.requiredResources.metal - 1,
            crystal: project.requiredResources.crystal - 1,
            gas: project.requiredResources.gas - 1,
          };
        }

        const ownerPlanetBefore = planetFor(state, 'player');
        const ownerBefore = {
          metal: ownerPlanetBefore.economy.resources.metal.amount,
          crystal: ownerPlanetBefore.economy.resources.crystal.amount,
          gas: ownerPlanetBefore.economy.resources.gas.amount,
        };
        state = execute(state, {
          type: 'CONTRIBUTE_FINAL_OBJECT_PROJECT',
          empireId: 'player',
          projectId: project.id,
          sourcePlanetId: ownerPlanetBefore.id,
          resources: ownerContribution,
        });

        const funded = state.endgameFinalObjects?.activeProjects[0];
        const host = planetFor(state, 'player');
        expect(funded).toMatchObject({
          id: project.id,
          phase: 'building',
          contributedResources: project.requiredResources,
        });
        expect(host.buildQueue).toHaveLength(1);
        expect(host.buildQueue[0]).toMatchObject({
          buildingId: ids.supremeGalacticGates,
          targetLevel: 1,
          cost: project.requiredResources,
        });
        expect(host.economy.resources.metal.amount).toBe(ownerBefore.metal - ownerContribution.metal);
        expect(host.economy.resources.crystal.amount).toBe(ownerBefore.crystal - ownerContribution.crystal);
        expect(host.economy.resources.gas.amount).toBe(ownerBefore.gas - ownerContribution.gas);

        const save = createSaveEnvelope(
          `foundation-${factionId}-${participationKind}`,
          state,
          SAVE_TIME,
        );
        expect(parseSaveJson(serializeSave(save))).toEqual({ ok: true, value: save });
      });
    }
  }
});
