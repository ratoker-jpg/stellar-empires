import { describe, expect, it } from 'vitest';
import { advanceCampaignTime } from '../../src/simulation/campaign/time';
import {
  getPlanetDemolitionThreshold,
  resolvePlanetDemolition,
} from '../../src/simulation/combat/planetDemolition';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import type { ResourceCost } from '../../src/simulation/economy/types';
import { getCampaignOutcomeForEmpire } from '../../src/simulation/endgame/campaignResult';
import {
  reconcileFinalProjectHostPresence,
} from '../../src/simulation/endgame/finalGateVulnerability';
import type {
  FinalObjectProject,
  SolarWarParticipationKind,
  SolarWarResult,
} from '../../src/simulation/endgame/types';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import type { FleetState } from '../../src/simulation/fleets/types';
import { getCompleteBuildingIds } from '../../src/simulation/planet/completeBuildingCatalog';
import type { PlanetState } from '../../src/simulation/planet/types';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameCommand, GameState, ScheduledGameEvent } from '../../src/simulation/types';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

const ZERO: ResourceCost = { metal: 0, crystal: 0, gas: 0 };
const ABUNDANT: ResourceCost = {
  metal: 100_000_000,
  crystal: 100_000_000,
  gas: 100_000_000,
};
const SAVE_TIME = '2026-08-19T00:00:00.000Z';

function execute(state: GameState, command: GameCommand): GameState {
  const result = executeCommand(state, command);
  expect(result.ok, command.type).toBe(true);
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

function prepareFinalHost(planet: PlanetState): PlanetState {
  const ids = getCompleteBuildingIds(planet.factionId);
  let prepared = withBuildingLevel(planet, ids.government, 10);
  prepared = withBuildingLevel(prepared, ids.researchCenter, 15);
  prepared = withBuildingLevel(prepared, ids.spaceport, 12);
  prepared = withBuildingLevel(prepared, ids.galacticObelisk, 1);
  return withResources(prepared, ABUNDANT);
}

function qualificationResult(
  state: GameState,
  participationKind: SolarWarParticipationKind,
  participationId: string,
  allianceId: string | null,
): SolarWarResult {
  const cycleId = 'solar-war-9';
  return {
    id: `closure-result-${participationId}`,
    entryId: `closure-entry-${participationId}`,
    cycleId,
    cycleIndex: 9,
    empireId: 'player',
    fleetId: 'closure-fleet-player',
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
      id: `closure-battle-${participationId}`,
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
  if (state.endgameParticipation === undefined) throw new Error('Participation state missing.');
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
  seed: string,
  participationKind: SolarWarParticipationKind,
): GameState {
  let state = createInitialGameState(seed, { playerFaction: 'aegis' });
  state = replacePlanet(state, prepareFinalHost(planetFor(state, 'player')));

  let participationId = 'player';
  let allianceId: string | null = null;
  if (participationKind === 'alliance') {
    state = execute(state, {
      type: 'CREATE_ALLIANCE',
      empireId: 'player',
      name: 'Closure Union',
    });
    state = execute(state, {
      type: 'JOIN_ALLIANCE',
      empireId: 'aegis-bot',
      allianceId: 'alliance-1',
    });
    participationId = 'alliance-1';
    allianceId = 'alliance-1';
    state = replacePlanet(state, withResources(planetFor(state, 'aegis-bot'), ABUNDANT));
  }

  state = addQualification(state, participationKind, participationId, allianceId);
  return execute(state, {
    type: 'START_FINAL_OBJECT_PROJECT',
    empireId: 'player',
    planetId: planetFor(state, 'player').id,
  });
}

function activeProject(state: GameState): FinalObjectProject {
  const project = state.endgameFinalObjects?.activeProjects[0];
  if (project === undefined) throw new Error('Active final project missing.');
  return project;
}

function fundProject(state: GameState): GameState {
  const project = activeProject(state);
  let working = state;
  let ownerContribution = project.requiredResources;

  if (project.participationKind === 'alliance') {
    const allyPlanet = planetFor(working, 'aegis-bot');
    working = execute(working, {
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

  return execute(working, {
    type: 'CONTRIBUTE_FINAL_OBJECT_PROJECT',
    empireId: 'player',
    projectId: project.id,
    sourcePlanetId: planetFor(working, 'player').id,
    resources: ownerContribution,
  });
}

function advanceExact(state: GameState, seconds: number): GameState {
  const result = advanceCampaignTime(state, seconds, {
    operationBudget: 50_000,
    botProfiles: [],
  });
  expect(result.complete).toBe(true);
  expect(result.remainingGameSeconds).toBe(0);
  return result.state;
}

function advanceToVulnerability(state: GameState): GameState {
  const project = activeProject(state);
  if (project.phase !== 'building' || project.gateCompletesAt === undefined) {
    throw new Error('Project is not building.');
  }
  const advanced = advanceExact(
    state,
    project.gateCompletesAt - state.clock.elapsedSeconds,
  );
  expect(activeProject(advanced).phase).toBe('vulnerable');
  return advanced;
}

function advanceToTerminal(state: GameState): GameState {
  const project = activeProject(state);
  if (project.phase !== 'vulnerable' || project.stabilizesAt === undefined) {
    throw new Error('Project is not vulnerable.');
  }
  const advanced = advanceExact(
    state,
    project.stabilizesAt - state.clock.elapsedSeconds,
  );
  expect(advanced.campaignResult?.status).toBe('terminal');
  return advanced;
}

function roundTrip(state: GameState, id: string): GameState {
  const envelope = createSaveEnvelope(id, state, SAVE_TIME);
  const parsed = parseSaveJson(serializeSave(envelope));
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) throw new Error(parsed.message);
  expect(parsed.value.state).toEqual(state);
  return parsed.value.state;
}

function advanceInChunks(state: GameState, totalSeconds: number, chunkSeconds: number): GameState {
  let working = state;
  let remaining = totalSeconds;
  while (remaining > 0) {
    const step = Math.min(remaining, chunkSeconds);
    const result = advanceCampaignTime(working, step, {
      operationBudget: 50_000,
      botProfiles: [],
    });
    expect(result.complete).toBe(true);
    working = result.state;
    remaining -= step;
  }
  return working;
}

function withWeaponLevel(
  state: GameState,
  empireId: string,
  unitId: string,
  weapons: number,
): GameState {
  return {
    ...state,
    shipUpgrades: state.shipUpgrades.map((entry) =>
      entry.empireId === empireId
        ? {
            ...entry,
            levels: {
              ...entry.levels,
              [unitId]: { weapons, armor: 0, cargo: 0 },
            },
          }
        : entry,
    ),
  };
}

function addSameSecondAttack(
  state: GameState,
  attackFirst: boolean,
): GameState {
  const project = activeProject(state);
  if (project.phase !== 'vulnerable' || project.stabilizesAt === undefined) {
    throw new Error('Same-second attack requires a vulnerable project.');
  }
  const stabilization = state.pendingEvents.find(
    (event) => event.payload.type === 'FINAL_GATE_STABILIZE' && event.payload.projectId === project.id,
  );
  if (stabilization === undefined) throw new Error('Stabilization event missing.');

  const attackerPlanet = planetFor(state, 'aegis-bot');
  const destroyerId = getFactionMechanicalRoles(attackerPlanet.factionId).ships.complete.planetDestroyer;
  const fleetId = `closure-gate-attacker-${attackFirst ? 'first' : 'second'}`;
  const normalizedStabilization: ScheduledGameEvent = {
    ...stabilization,
    id: 'closure-stabilization',
    sequence: 1_000,
  };
  const attackEvent: ScheduledGameEvent = {
    id: `closure-attack-${attackFirst ? 'first' : 'second'}`,
    executeAt: project.stabilizesAt,
    sequence: attackFirst ? 999 : 1_001,
    payload: {
      type: 'FLEET_ARRIVE',
      fleetId,
      targetPlanetId: project.ownerPlanetId,
    },
  };
  const attackerFleet: FleetState = {
    id: fleetId,
    empireId: 'aegis-bot',
    originPlanetId: attackerPlanet.id,
    location: {
      type: 'transit',
      fromPlanetId: attackerPlanet.id,
      toPlanetId: project.ownerPlanetId,
      departedAt: state.clock.elapsedSeconds,
      arrivesAt: project.stabilizesAt,
    },
    status: 'outbound',
    ships: { [destroyerId]: 1 },
    cargo: ZERO,
    speed: 1,
    cargoCapacity: 0,
    mission: { kind: 'attack', targetPlanetId: project.ownerPlanetId },
  };
  const host = state.planets.find((planet) => planet.id === project.ownerPlanetId);
  if (host === undefined) throw new Error('Final host missing.');
  const quietHost: PlanetState = {
    ...host,
    inventory: { ships: {}, defenses: {} },
    defense: { damaged: {}, repairQueue: [] },
  };
  const unrelatedEvents = state.pendingEvents.filter((event) => event.id !== stabilization.id);
  const pendingEvents = [...unrelatedEvents, normalizedStabilization, attackEvent]
    .sort((left, right) => left.executeAt - right.executeAt || left.sequence - right.sequence);

  return {
    ...replacePlanet(state, quietHost),
    fleets: [
      ...state.fleets.filter((fleet) => fleet.empireId !== 'player' && fleet.id !== fleetId),
      attackerFleet,
    ],
    pendingEvents,
    nextEventSequence: 1_002,
  };
}

describe('ENDGAME-TERMINAL-GATE closure', () => {
  for (const participationKind of ['solo', 'alliance'] as const) {
    it(`${participationKind} project runs start → fund → build → vulnerable → stabilize → terminal`, () => {
      let state = prepareProject(`closure-${participationKind}`, participationKind);
      expect(activeProject(state).phase).toBe('funding');

      state = fundProject(state);
      expect(activeProject(state).phase).toBe('building');

      state = advanceToVulnerability(state);
      const vulnerable = activeProject(state);
      expect(vulnerable.phase).toBe('vulnerable');
      expect(vulnerable.stabilizesAt! - vulnerable.vulnerabilityStartedAt!).toBe(86_400);

      state = advanceToTerminal(state);
      expect(state.clock.elapsedSeconds).toBe(
        state.campaignResult?.status === 'terminal' ? state.campaignResult.terminalAt : -1,
      );
      expect(state.campaignResult).toMatchObject({
        status: 'terminal',
        winningParticipationKind: participationKind,
        winningParticipationId: participationKind === 'solo' ? 'player' : 'alliance-1',
        winningEmpireIds: participationKind === 'solo' ? ['player'] : ['aegis-bot', 'player'],
        ownerEmpireId: 'player',
        hostPlanetId: vulnerable.ownerPlanetId,
        reason: 'final-gate-stabilized',
      });
      expect(getCampaignOutcomeForEmpire(state, 'player')).toBe('victory');
      if (participationKind === 'alliance') {
        expect(getCampaignOutcomeForEmpire(state, 'aegis-bot')).toBe('victory');
        expect(getCampaignOutcomeForEmpire(state, 'synod-bot')).toBe('defeat');
      }
      expect(executeCommand(state, {
        type: 'MARKET_SWAP',
        empireId: 'player',
        planetId: vulnerable.ownerPlanetId,
        giveResourceId: 'metal',
        receiveResourceId: 'crystal',
        giveAmount: 1,
      })).toMatchObject({ ok: false, code: 'CAMPAIGN_TERMINAL' });
      expect(advanceCampaignTime(state, 3_600).state).toBe(state);
    });
  }

  it('round-trips exact state before funding, during construction, during vulnerability and after victory', () => {
    let state = prepareProject('closure-save-phases', 'solo');
    state = roundTrip(state, 'closure-before-funding');
    expect(activeProject(state).phase).toBe('funding');

    state = fundProject(state);
    state = roundTrip(state, 'closure-building');
    expect(activeProject(state).phase).toBe('building');

    state = advanceToVulnerability(state);
    state = roundTrip(state, 'closure-vulnerable');
    expect(activeProject(state).phase).toBe('vulnerable');

    state = advanceToTerminal(state);
    state = roundTrip(state, 'closure-terminal');
    expect(state.campaignResult?.status).toBe('terminal');
  });

  it('preserves exact direct/chunk equality before, at and after the terminal boundary', () => {
    let state = prepareProject('closure-partitions', 'solo');
    state = advanceToVulnerability(fundProject(state));
    const project = activeProject(state);
    const untilTerminal = project.stabilizesAt! - state.clock.elapsedSeconds;
    const beforeSeconds = Math.floor(untilTerminal / 2);

    const beforeDirect = advanceExact(state, beforeSeconds);
    const beforeChunked = advanceInChunks(state, beforeSeconds, 7_200);
    expect(beforeChunked).toEqual(beforeDirect);

    const terminalRemaining = activeProject(beforeDirect).stabilizesAt! - beforeDirect.clock.elapsedSeconds;
    const atDirect = advanceExact(beforeDirect, terminalRemaining);
    const atChunked = advanceInChunks(beforeChunked, terminalRemaining, 7_200);
    expect(atChunked).toEqual(atDirect);
    expect(atDirect.campaignResult?.status).toBe('terminal');

    const afterDirect = advanceCampaignTime(atDirect, 7_200);
    const afterChunked = advanceCampaignTime(atChunked, 3_600);
    expect(afterDirect.state).toBe(atDirect);
    expect(afterChunked.state).toBe(atChunked);
    expect(afterChunked.state).toEqual(afterDirect.state);
  });

  it('uses sequence ordering for same-second attack vs stabilization and rebuilds after attack-first Gate destruction', () => {
    let vulnerable = prepareProject('closure-same-second', 'solo');
    vulnerable = advanceToVulnerability(fundProject(vulnerable));
    const deadline = activeProject(vulnerable).stabilizesAt!;

    const attackFirstState = addSameSecondAttack(vulnerable, true);
    const attackFirst = advanceExact(
      attackFirstState,
      deadline - attackFirstState.clock.elapsedSeconds,
    );
    expect(attackFirst.campaignResult?.status).toBe('ongoing');
    expect(activeProject(attackFirst).phase).toBe('funding');
    expect(
      planetFor(attackFirst, 'player').buildings.some(
        (building) => building.buildingId === activeProject(attackFirst).gateBuildingId,
      ),
    ).toBe(false);

    let rebuilt = fundProject(attackFirst);
    rebuilt = advanceToVulnerability(rebuilt);
    rebuilt = advanceToTerminal(rebuilt);
    expect(rebuilt.campaignResult?.status).toBe('terminal');

    const stabilizeFirstState = addSameSecondAttack(vulnerable, false);
    const stabilizeFirst = advanceExact(
      stabilizeFirstState,
      deadline - stabilizeFirstState.clock.elapsedSeconds,
    );
    expect(stabilizeFirst.campaignResult?.status).toBe('terminal');
    expect(
      stabilizeFirst.pendingEvents.some((event) => event.payload.type === 'FLEET_ARRIVE'),
    ).toBe(true);
    expect(
      stabilizeFirst.fleets.some((fleet) =>
        fleet.id === 'closure-gate-attacker-second' && fleet.status === 'outbound',
      ),
    ).toBe(true);
  });

  it('cancels a lost host project and can start a fresh project on a surviving owned host', () => {
    let state = prepareProject('closure-host-loss', 'solo');
    state = advanceToVulnerability(fundProject(state));
    const lostProject = activeProject(state);
    const recoveryCandidate = planetFor(state, 'aegis-bot');

    state = reconcileFinalProjectHostPresence({
      ...state,
      planets: state.planets.filter((planet) => planet.id !== lostProject.ownerPlanetId),
    });
    expect(state.endgameFinalObjects?.activeProjects).toEqual([]);
    expect(
      state.pendingEvents.some((event) =>
        event.payload.type === 'FINAL_GATE_STABILIZE' && event.payload.projectId === lostProject.id,
      ),
    ).toBe(false);

    const recoveryHost = prepareFinalHost({
      ...recoveryCandidate,
      ownerEmpireId: 'player',
      inventory: { ships: {}, defenses: {} },
      defense: { damaged: {}, repairQueue: [] },
    });
    state = replacePlanet(state, recoveryHost);
    state = execute(state, {
      type: 'START_FINAL_OBJECT_PROJECT',
      empireId: 'player',
      planetId: recoveryHost.id,
    });
    expect(activeProject(state)).toMatchObject({
      phase: 'funding',
      ownerPlanetId: recoveryHost.id,
      participationKind: 'solo',
      eligibleEmpireIds: ['player'],
    });
    expect(activeProject(state).id).not.toBe(lostProject.id);

    state = advanceToTerminal(advanceToVulnerability(fundProject(state)));
    expect(state.campaignResult).toMatchObject({
      status: 'terminal',
      hostPlanetId: recoveryHost.id,
    });
  });

  it('keeps Obelisk and Gate outside ordinary random demolition at the exact 20-point threshold', () => {
    let state = prepareProject('closure-demolition-isolation', 'solo');
    state = advanceToVulnerability(fundProject(state));
    const project = activeProject(state);
    const attackerPlanet = planetFor(state, 'aegis-bot');
    const destroyerId = getFactionMechanicalRoles('aegis').ships.complete.planetDestroyer;
    state = withWeaponLevel(state, 'aegis-bot', destroyerId, 2);
    const target = state.planets.find((planet) => planet.id === project.ownerPlanetId);
    if (target === undefined) throw new Error('Vulnerable target missing.');

    expect(getPlanetDemolitionThreshold(20)).toMatchObject({
      baseChanceBasisPoints: 2_000,
      maximumSelectedBuildings: 1,
    });
    const resolution = resolvePlanetDemolition({
      state,
      attackerEmpireId: 'aegis-bot',
      attackerFleetId: 'closure-demolition-fleet',
      attackerRemaining: { [destroyerId]: 1 },
      target,
      activeDefenses: {},
      winner: 'attacker',
      eventSequence: 77,
      commanderBonusBasisPoints: 10_000,
    });

    expect(resolution.report?.finalPoints).toBe(20);
    expect(resolution.report?.selectedBuildingIds).not.toContain(project.obeliskBuildingId);
    expect(resolution.report?.selectedBuildingIds).not.toContain(project.gateBuildingId);
    expect(
      resolution.planet.buildings.some((building) => building.buildingId === project.obeliskBuildingId),
    ).toBe(true);
    expect(
      resolution.planet.buildings.some((building) => building.buildingId === project.gateBuildingId),
    ).toBe(true);
    expect(attackerPlanet.factionId).toBe('aegis');
  });
});
