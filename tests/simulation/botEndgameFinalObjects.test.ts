import { describe, expect, it } from 'vitest';
import { planBotEndgameFinalObjects } from '../../src/simulation/bots/endgameFinalObjectPlanner';
import { planBotEndgameParticipation } from '../../src/simulation/bots/endgameParticipationPlanner';
import { DEFAULT_BOT_PROFILES } from '../../src/simulation/bots/profiles';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import type { ResourceCost } from '../../src/simulation/economy/types';
import type { SolarWarResult } from '../../src/simulation/endgame/types';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import type { FleetState } from '../../src/simulation/fleets/types';
import { getCompleteBuildingIds } from '../../src/simulation/planet/completeBuildingCatalog';
import type { PlanetState } from '../../src/simulation/planet/types';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameCommand, GameState } from '../../src/simulation/types';

function profile(empireId: string) {
  const value = DEFAULT_BOT_PROFILES.find((candidate) => candidate.empireId === empireId);
  if (value === undefined) throw new Error(`Missing bot profile for ${empireId}.`);
  return value;
}

function execute(state: GameState, command: GameCommand): GameState {
  const result = executeCommand(state, command);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(`${result.code}: ${result.message}`);
  return result.value;
}

function getPlanet(state: GameState, empireId: string): PlanetState {
  const planet = state.planets.find((candidate) => candidate.ownerEmpireId === empireId);
  if (planet === undefined) throw new Error(`Missing planet for ${empireId}.`);
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
    planets: state.planets.map((planet) =>
      planet.id === replacement.id ? replacement : planet,
    ),
  };
}

function prepareFinalHost(
  state: GameState,
  empireId: string,
  includeObelisk: boolean,
): GameState {
  let planet = getPlanet(state, empireId);
  const ids = getCompleteBuildingIds(planet.factionId);
  planet = setBuildingLevel(planet, ids.government, 10);
  planet = setBuildingLevel(planet, ids.researchCenter, 15);
  planet = setBuildingLevel(planet, ids.spaceport, 12);
  if (includeObelisk) planet = setBuildingLevel(planet, ids.galacticObelisk, 1);
  planet = withResources(planet, {
    metal: 100_000_000,
    crystal: 100_000_000,
    gas: 100_000_000,
  });
  return replacePlanet(state, planet);
}

function positiveResult(
  state: GameState,
  empireId: string,
  participationKind: 'solo' | 'alliance',
  participationId: string,
  allianceId: string | null,
): SolarWarResult {
  return {
    id: `bot-final-qualified-${empireId}`,
    entryId: `bot-final-entry-${empireId}`,
    cycleId: 'bot-final-cycle',
    cycleIndex: 5,
    empireId,
    fleetId: `qualified-fleet-${empireId}`,
    originPlanetId: getPlanet(state, empireId).id,
    participationKind,
    participationId,
    allianceId,
    resolvedAt: 500,
    outcome: 'victory',
    score: 9_001,
    attackerInitial: { scout: 1 },
    enemyInitial: { enemy: 1 },
    attackerRemaining: { scout: 1 },
    enemyRemaining: {},
    battleReport: {
      id: `bot-final-battle-${empireId}`,
      seed: 5,
      resolvedAt: 500,
      targetPlanetId: 'bot-final-solar-war',
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
  empireId: string,
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

function createVulnerablePlayerProject(seed: string): GameState {
  let state = prepareFinalHost(createInitialGameState(seed), 'player', true);
  state = withQualification(state, 'player');
  state = execute(state, {
    type: 'START_FINAL_OBJECT_PROJECT',
    empireId: 'player',
    planetId: getPlanet(state, 'player').id,
  });
  const project = state.endgameFinalObjects?.activeProjects[0];
  if (project === undefined) throw new Error('Player final project missing.');
  state = execute(state, {
    type: 'CONTRIBUTE_FINAL_OBJECT_PROJECT',
    empireId: 'player',
    projectId: project.id,
    sourcePlanetId: getPlanet(state, 'player').id,
    resources: project.requiredResources,
  });
  const building = state.endgameFinalObjects?.activeProjects[0];
  if (building?.gateCompletesAt === undefined) throw new Error('Gate completion missing.');
  state = execute(state, {
    type: 'ADVANCE_TIME',
    seconds: building.gateCompletesAt - state.clock.elapsedSeconds,
  });
  expect(state.endgameFinalObjects?.activeProjects[0]?.phase).toBe('vulnerable');
  return state;
}

function withDestroyerFleet(state: GameState, empireId: string): GameState {
  let origin = getPlanet(state, empireId);
  origin = withResources(origin, {
    metal: origin.economy.resources.metal.amount,
    crystal: origin.economy.resources.crystal.amount,
    gas: 100_000_000,
  });
  state = replacePlanet(state, origin);
  const destroyerId = getFactionMechanicalRoles(origin.factionId).ships.complete.planetDestroyer;
  const fleet: FleetState = {
    id: `${empireId}-gate-destroyer-fleet`,
    empireId,
    originPlanetId: origin.id,
    location: { type: 'planet', planetId: origin.id },
    status: 'stationed',
    ships: { [destroyerId]: 1 },
    cargo: { metal: 0, crystal: 0, gas: 0 },
    speed: 6,
    cargoCapacity: 10_000,
    mission: null,
  };
  return { ...state, fleets: [...state.fleets, fleet] };
}

function withCurrentFullIntel(
  state: GameState,
  observerEmpireId: string,
  targetEmpireId: string,
): GameState {
  const target = getPlanet(state, targetEmpireId);
  return {
    ...state,
    intelligence: state.intelligence.map((entry) =>
      entry.empireId === observerEmpireId
        ? {
            ...entry,
            observations: [{
              id: `gate-intel-${observerEmpireId}`,
              observerEmpireId,
              targetPlanetId: target.id,
              coordinate: target.coordinate,
              observedAt: state.clock.elapsedSeconds,
              expiresAt: state.clock.elapsedSeconds + 100_000,
              detected: false,
              snapshot: {
                planetId: target.id,
                coordinate: target.coordinate,
                name: target.name,
                ownerEmpireId: target.ownerEmpireId,
                factionId: target.factionId,
                level: 3,
                resources: {
                  metal: 1,
                  crystal: 1,
                  gas: 1,
                  energyProduced: 1,
                  energyConsumed: 0,
                },
                buildings: {},
                defenses: {},
                stationedFleets: [],
              },
            }],
          }
        : entry,
    ),
  };
}

describe('bot endgame final-object planning', () => {
  it('queues the qualified Obelisk through the ordinary build queue, then starts the legal project', () => {
    let state = prepareFinalHost(
      createInitialGameState('bot-final-obelisk'),
      'aegis-bot',
      false,
    );
    state = withQualification(state, 'aegis-bot');

    const obeliskPlan = planBotEndgameFinalObjects(state, profile('aegis-bot'));
    const ids = getCompleteBuildingIds(getPlanet(state, 'aegis-bot').factionId);
    expect(obeliskPlan).toEqual({
      command: {
        type: 'QUEUE_BUILDING',
        empireId: 'aegis-bot',
        planetId: getPlanet(state, 'aegis-bot').id,
        buildingId: ids.galacticObelisk,
      },
      reasonCode: 'final-obelisk-queue',
    });
    state = execute(state, obeliskPlan.command!);
    const queued = getPlanet(state, 'aegis-bot').buildQueue[0];
    if (queued === undefined) throw new Error('Qualified Obelisk was not queued.');
    state = execute(state, {
      type: 'ADVANCE_TIME',
      seconds: queued.completesAt - state.clock.elapsedSeconds,
    });

    const startPlan = planBotEndgameFinalObjects(state, profile('aegis-bot'));
    expect(startPlan).toEqual({
      command: {
        type: 'START_FINAL_OBJECT_PROJECT',
        empireId: 'aegis-bot',
        planetId: getPlanet(state, 'aegis-bot').id,
      },
      reasonCode: 'final-project-start',
    });
    expect(planBotEndgameParticipation(state, profile('aegis-bot'))).toEqual({
      command: startPlan.command,
      reasonCode: 'final-object-action',
    });
  });

  it('funds an immutable allied project only from the eligible bot owned source', () => {
    let state = createInitialGameState('bot-final-alliance-funding');
    state = execute(state, {
      type: 'CREATE_ALLIANCE',
      empireId: 'aegis-bot',
      name: 'Final Cohort',
    });
    state = execute(state, {
      type: 'JOIN_ALLIANCE',
      empireId: 'synod-bot',
      allianceId: 'alliance-1',
    });
    state = prepareFinalHost(state, 'aegis-bot', true);
    state = withQualification(
      state,
      'aegis-bot',
      'alliance',
      'alliance-1',
      'alliance-1',
    );
    state = execute(state, {
      type: 'START_FINAL_OBJECT_PROJECT',
      empireId: 'aegis-bot',
      planetId: getPlanet(state, 'aegis-bot').id,
    });
    state = replacePlanet(
      state,
      withResources(getPlanet(state, 'synod-bot'), {
        metal: 100_000_000,
        crystal: 100_000_000,
        gas: 100_000_000,
      }),
    );
    const project = state.endgameFinalObjects?.activeProjects[0];
    if (project === undefined) throw new Error('Alliance project missing.');

    const plan = planBotEndgameFinalObjects(state, profile('synod-bot'));
    expect(plan.reasonCode).toBe('final-project-contribute');
    expect(plan.command).toEqual({
      type: 'CONTRIBUTE_FINAL_OBJECT_PROJECT',
      empireId: 'synod-bot',
      projectId: project.id,
      sourcePlanetId: getPlanet(state, 'synod-bot').id,
      resources: project.requiredResources,
    });
    state = execute(state, plan.command!);
    expect(state.endgameFinalObjects?.activeProjects[0]?.phase).toBe('building');
    expect(state.endgameFinalObjects?.activeProjects[0]?.contributionByEmpire)
      .toContainEqual({ empireId: 'synod-bot', resources: project.requiredResources });
  });

  it('targets only a public vulnerable Gate with current full intel and an owned Planet Destroyer, independent of hidden host state', () => {
    let state = createVulnerablePlayerProject('bot-final-gate-attack');
    state = withDestroyerFleet(state, 'aegis-bot');
    state = withCurrentFullIntel(state, 'aegis-bot', 'player');
    const target = getPlanet(state, 'player');

    const plan = planBotEndgameFinalObjects(state, profile('aegis-bot'));
    expect(plan).toEqual({
      command: {
        type: 'SEND_FLEET',
        empireId: 'aegis-bot',
        fleetId: 'aegis-bot-gate-destroyer-fleet',
        targetPlanetId: target.id,
        mission: 'attack',
      },
      reasonCode: 'enemy-gate-attack',
    });

    const hiddenMutation: GameState = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.id === target.id
          ? {
              ...planet,
              economy: {
                ...planet.economy,
                resources: {
                  metal: { ...planet.economy.resources.metal, amount: 77_777_777 },
                  crystal: { ...planet.economy.resources.crystal, amount: 66_666_666 },
                  gas: { ...planet.economy.resources.gas, amount: 55_555_555 },
                },
              },
              inventory: {
                ...planet.inventory,
                defenses: { ...planet.inventory.defenses, hidden-test-defense: 999 },
              },
            }
          : planet,
      ),
    };
    expect(planBotEndgameFinalObjects(hiddenMutation, profile('aegis-bot'))).toEqual(plan);
  });

  it('does not attack the public vulnerable Gate without normal intelligence or destroyer legality', () => {
    let state = createVulnerablePlayerProject('bot-final-gate-blocked');
    state = withDestroyerFleet(state, 'aegis-bot');
    expect(planBotEndgameFinalObjects(state, profile('aegis-bot'))).toMatchObject({
      command: null,
      reasonCode: 'final-object-not-qualified',
    });

    state = withCurrentFullIntel(state, 'aegis-bot', 'player');
    state = {
      ...state,
      fleets: state.fleets.map((fleet) =>
        fleet.id === 'aegis-bot-gate-destroyer-fleet'
          ? { ...fleet, ships: {} }
          : fleet,
      ),
    };
    expect(planBotEndgameFinalObjects(state, profile('aegis-bot'))).toMatchObject({
      command: null,
      reasonCode: 'final-object-not-qualified',
    });
  });

  it('is inert after the persisted terminal boundary', () => {
    const state = createInitialGameState('bot-final-terminal');
    const host = getPlanet(state, 'player');
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
    expect(planBotEndgameFinalObjects(terminal, profile('aegis-bot'))).toEqual({
      command: null,
      reasonCode: 'campaign-terminal',
    });
  });
});
