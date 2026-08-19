import { describe, expect, it } from 'vitest';
import { runCampaignCatchUp } from '../../src/runtime/campaignTimeRuntime';
import { advanceCampaignTime } from '../../src/simulation/campaign/time';
import { runBotScheduler } from '../../src/simulation/bots/scheduler';
import { planBotEndgameFinalObjects } from '../../src/simulation/bots/endgameFinalObjectPlanner';
import { planBotEndgameParticipation } from '../../src/simulation/bots/endgameParticipationPlanner';
import { DEFAULT_BOT_PROFILES } from '../../src/simulation/bots/profiles';
import { getBotProgressionPhase } from '../../src/simulation/bots/progressionPhase';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import type { ResourceCost } from '../../src/simulation/economy/types';
import { applySolarWarResolutionEvent } from '../../src/simulation/endgame/solarWar';
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
import { createCampaignRuntimeMetadata } from '../../src/storage/runtimeMetadata';

const BOT_EMPIRES = ['aegis-bot', 'synod-bot', 'veyra-bot'] as const;
const SAVE_TIME = '2026-08-19T06:00:00.000Z';
const RUNTIME_START = '2026-08-19T07:00:00.000Z';

type SolarWarResolutionEvent = ScheduledGameEvent & {
  readonly payload: {
    readonly type: 'SOLAR_WAR_RESOLVE';
    readonly cycleId: string;
  };
};

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

function prepareBotPlanet(state: GameState, empireId: string): GameState {
  let planet = getPlanet(state, empireId);
  const ids = getCompleteBuildingIds(planet.factionId);
  const ships = getFactionMechanicalRoles(planet.factionId).ships;
  planet = setBuildingLevel(planet, ids.constructionComplex, 3);
  planet = setBuildingLevel(planet, ids.metalPrimary, 2);
  planet = setBuildingLevel(planet, ids.crystalPrimary, 2);
  planet = setBuildingLevel(planet, ids.solarPower, 5);
  planet = setBuildingLevel(planet, ids.shipyard, 4);
  planet = setBuildingLevel(planet, ids.government, 10);
  planet = setBuildingLevel(planet, ids.researchCenter, 15);
  planet = setBuildingLevel(planet, ids.spaceport, 12);
  planet = setBuildingLevel(planet, ids.galacticObelisk, 1);
  planet = withResources(planet, {
    metal: 100_000_000,
    crystal: 100_000_000,
    gas: 100_000_000,
  });
  planet = {
    ...planet,
    inventory: {
      ...planet.inventory,
      ships: {
        ...planet.inventory.ships,
        [ships.scout]: 1,
        [ships.fighter]: 1,
        [ships.colonizer]: 1,
        [ships.frigate]: 1,
        [ships.dreadnought]: 1,
      },
    },
  };
  return replacePlanet(state, planet);
}

function addSolarFleet(state: GameState, empireId: string): GameState {
  const origin = getPlanet(state, empireId);
  const ships = getFactionMechanicalRoles(origin.factionId).ships.complete;
  const fleet: FleetState = {
    id: `closure-solar-${empireId}`,
    empireId,
    originPlanetId: origin.id,
    location: { type: 'planet', planetId: origin.id },
    status: 'stationed',
    ships: {
      [ships.heavyAssault]: 4_000,
      [ships.lineBattleship]: 8_000,
      [ships.interceptor]: 12_000,
    },
    cargo: { metal: 0, crystal: 0, gas: 0 },
    speed: 6,
    cargoCapacity: 100_000,
    mission: null,
  };
  return { ...state, fleets: [...state.fleets, fleet] };
}

function baseEndgameState(seed: string): GameState {
  let state = createInitialGameState(seed);
  state = {
    ...state,
    pendingEvents: [],
    logisticsRoutes: [],
    worldEvents: {
      ...state.worldEvents,
      active: [],
      nextEvaluationAt: Number.MAX_SAFE_INTEGER,
    },
  };
  for (const empireId of BOT_EMPIRES) {
    state = prepareBotPlanet(state, empireId);
    state = addSolarFleet(state, empireId);
    expect(getBotProgressionPhase(state, empireId)).toBe('endgame-preparation');
  }
  return state;
}

function executeParticipationPlan(state: GameState, empireId: string): GameState {
  const plan = planBotEndgameParticipation(state, profile(empireId));
  expect(plan.command).not.toBeNull();
  if (plan.command === null) throw new Error(`No endgame participation command for ${empireId}.`);
  return execute(state, plan.command);
}

function enterAllBots(state: GameState): GameState {
  let working = state;
  working = executeParticipationPlan(working, 'aegis-bot');
  working = executeParticipationPlan(working, 'aegis-bot');
  working = executeParticipationPlan(working, 'synod-bot');
  working = executeParticipationPlan(working, 'synod-bot');
  working = executeParticipationPlan(working, 'veyra-bot');
  return working;
}

function findSolarWarResolution(state: GameState): SolarWarResolutionEvent {
  const event = state.pendingEvents.find(
    (candidate): candidate is SolarWarResolutionEvent =>
      candidate.payload.type === 'SOLAR_WAR_RESOLVE',
  );
  if (event === undefined) throw new Error('Solar War resolution event missing.');
  return event;
}

function resolveSolarWar(state: GameState): GameState {
  const event = findSolarWarResolution(state);
  return applySolarWarResolutionEvent(
    {
      ...state,
      clock: { ...state.clock, elapsedSeconds: event.executeAt },
      pendingEvents: state.pendingEvents.filter((candidate) => candidate.id !== event.id),
    },
    event,
  );
}

function qualifiedThreeFactionState(seed: string): GameState {
  const resolved = resolveSolarWar(enterAllBots(baseEndgameState(seed)));
  const history = resolved.endgameParticipation?.solarWar.history ?? [];
  expect(history).toHaveLength(3);
  expect(history.every((result) => result.score > 0)).toBe(true);
  expect(new Set(history.map((result) => result.empireId))).toEqual(new Set(BOT_EMPIRES));
  return resolved;
}

function dueNow(state: GameState): GameState {
  return {
    ...state,
    botAutomation: {
      ...state.botAutomation,
      nextDecisionAtByEmpire: Object.fromEntries(
        BOT_EMPIRES.map((empireId) => [empireId, state.clock.elapsedSeconds]),
      ),
    },
  };
}

function botsAfterTerminal(state: GameState): GameState {
  return {
    ...state,
    botAutomation: {
      ...state.botAutomation,
      nextDecisionAtByEmpire: Object.fromEntries(
        BOT_EMPIRES.map((empireId) => [empireId, Number.MAX_SAFE_INTEGER]),
      ),
    },
  };
}

function roundTrip(state: GameState, label: string): GameState {
  const parsed = parseSaveJson(serializeSave(createSaveEnvelope(label, state, SAVE_TIME)));
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) throw new Error(`${parsed.code}: ${parsed.message}`);
  return parsed.value.state;
}

function planAndExecuteFinal(state: GameState, empireId: string): GameState {
  const plan = planBotEndgameFinalObjects(state, profile(empireId));
  expect(plan.command).not.toBeNull();
  if (plan.command === null) throw new Error(`No final-object command for ${empireId}.`);
  return execute(state, plan.command);
}

describe('COMPLETE-ENDGAME-03 bot closure gate', () => {
  it('runs all three real participation policies through one Solar War and keeps bot decisions deterministic across save and chunk partitions', () => {
    let state = baseEndgameState('bot-closure-three-factions');
    state = enterAllBots(state);
    const entries = state.endgameParticipation?.solarWar.activeEntries ?? [];
    expect(entries).toHaveLength(3);
    expect(entries.find((entry) => entry.empireId === 'aegis-bot')).toMatchObject({
      participationKind: 'alliance',
      participationId: 'alliance-1',
    });
    expect(entries.find((entry) => entry.empireId === 'synod-bot')).toMatchObject({
      participationKind: 'alliance',
      participationId: 'alliance-1',
    });
    expect(entries.find((entry) => entry.empireId === 'veyra-bot')).toMatchObject({
      participationKind: 'solo',
      participationId: 'veyra-bot',
    });

    state = dueNow(resolveSolarWar(state));
    const loaded = roundTrip(state, 'bot-closure-qualified');
    expect(runBotScheduler(loaded)).toEqual(runBotScheduler(state));

    const direct = advanceCampaignTime(state, 600, { operationBudget: 50_000 });
    const first = advanceCampaignTime(state, 300, { operationBudget: 50_000 });
    const second = advanceCampaignTime(first.state, 300, { operationBudget: 50_000 });
    const loadedDirect = advanceCampaignTime(loaded, 600, { operationBudget: 50_000 });
    expect(direct.complete).toBe(true);
    expect(first.complete).toBe(true);
    expect(second.complete).toBe(true);
    expect(loadedDirect.complete).toBe(true);
    expect(second.state).toEqual(direct.state);
    expect(loadedDirect.state).toEqual(direct.state);
    expect(direct.botAudit.some((entry) => entry.source === 'endgame')).toBe(true);
  });

  it('composes real alliance funding with a real-qualified Veyra solo Gate through save, direct/chunk, offline and terminal fixed points', async () => {
    let state = qualifiedThreeFactionState('bot-closure-terminal');
    state = replacePlanet(
      state,
      withResources(getPlanet(state, 'aegis-bot'), { metal: 0, crystal: 0, gas: 0 }),
    );

    state = planAndExecuteFinal(state, 'aegis-bot');
    const allianceProject = state.endgameFinalObjects?.activeProjects.find(
      (project) => project.ownerEmpireId === 'aegis-bot',
    );
    if (allianceProject === undefined) throw new Error('Alliance project missing.');
    expect(allianceProject.participationKind).toBe('alliance');
    expect(allianceProject.eligibleEmpireIds).toEqual(['aegis-bot', 'synod-bot']);

    state = planAndExecuteFinal(state, 'synod-bot');
    expect(state.endgameFinalObjects?.activeProjects.find(
      (project) => project.id === allianceProject.id,
    )).toMatchObject({ phase: 'building' });
    expect(state.endgameFinalObjects?.activeProjects.find(
      (project) => project.id === allianceProject.id,
    )?.contributionByEmpire).toContainEqual({
      empireId: 'synod-bot',
      resources: allianceProject.requiredResources,
    });

    state = planAndExecuteFinal(state, 'veyra-bot');
    state = planAndExecuteFinal(state, 'veyra-bot');
    const veyraProject = state.endgameFinalObjects?.activeProjects.find(
      (project) => project.ownerEmpireId === 'veyra-bot',
    );
    if (veyraProject?.gateCompletesAt === undefined) throw new Error('Veyra building project missing.');
    expect(veyraProject.phase).toBe('building');
    expect(roundTrip(state, 'bot-closure-building').endgameFinalObjects).toEqual(
      state.endgameFinalObjects,
    );

    state = execute(state, {
      type: 'CANCEL_FINAL_OBJECT_PROJECT',
      empireId: 'aegis-bot',
      projectId: allianceProject.id,
    });
    state = execute(state, {
      type: 'ADVANCE_TIME',
      seconds: veyraProject.gateCompletesAt - state.clock.elapsedSeconds,
    });
    const vulnerable = botsAfterTerminal(state);
    const vulnerableProject = vulnerable.endgameFinalObjects?.activeProjects.find(
      (project) => project.ownerEmpireId === 'veyra-bot',
    );
    if (vulnerableProject?.stabilizesAt === undefined) {
      throw new Error('Veyra vulnerable project missing stabilization deadline.');
    }
    expect(vulnerableProject.phase).toBe('vulnerable');
    const loadedVulnerable = roundTrip(vulnerable, 'bot-closure-vulnerable');
    expect(loadedVulnerable.endgameFinalObjects).toEqual(vulnerable.endgameFinalObjects);

    const remaining = vulnerableProject.stabilizesAt - vulnerable.clock.elapsedSeconds;
    const direct = advanceCampaignTime(vulnerable, remaining, {
      operationBudget: 50_000,
      botProfiles: [],
    });
    const first = advanceCampaignTime(vulnerable, Math.floor(remaining / 2), {
      operationBudget: 50_000,
      botProfiles: [],
    });
    const second = advanceCampaignTime(
      first.state,
      remaining - first.processedGameSeconds,
      { operationBudget: 50_000, botProfiles: [] },
    );
    const loadedDirect = advanceCampaignTime(loadedVulnerable, remaining, {
      operationBudget: 50_000,
      botProfiles: [],
    });
    expect(direct.complete).toBe(true);
    expect(second.complete).toBe(true);
    expect(loadedDirect.complete).toBe(true);
    expect(second.state).toEqual(direct.state);
    expect(loadedDirect.state).toEqual(direct.state);
    expect(direct.state.campaignResult).toMatchObject({
      status: 'terminal',
      winningParticipationKind: 'solo',
      winningParticipationId: 'veyra-bot',
      winningEmpireIds: ['veyra-bot'],
      ownerEmpireId: 'veyra-bot',
      hostPlanetId: vulnerableProject.ownerPlanetId,
      terminalAt: vulnerableProject.stabilizesAt,
      reason: 'final-gate-stabilized',
    });
    expect(roundTrip(direct.state, 'bot-closure-terminal')).toEqual(direct.state);

    const runtimeStartMs = Date.parse(RUNTIME_START);
    const target = new Date(runtimeStartMs + (remaining + 10) * 1_000).toISOString();
    const offline = await runCampaignCatchUp({
      state: loadedVulnerable,
      runtimeMetadata: createCampaignRuntimeMetadata(RUNTIME_START),
      targetAtReal: target,
      operationBudget: 50_000,
      checkpoint: async () => undefined,
    });
    expect(offline.state).toEqual(direct.state);
    expect(offline.runtimeMetadata.lastActiveAtReal).toBe(target);
    expect(offline.runtimeMetadata.pendingCatchUp).toBeUndefined();
    expect(offline.runtimeMetadata.pendingReturnSummary?.result.status).toBe('defeat');

    const terminalNoOp = advanceCampaignTime(direct.state, 100_000);
    expect(terminalNoOp.state).toBe(direct.state);
    expect(terminalNoOp.processedGameSeconds).toBe(0);
    expect(terminalNoOp.botAudit).toEqual([]);
  });
});
