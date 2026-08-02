import { describe, expect, it } from 'vitest';
import { runCampaignCatchUp } from '../../src/runtime/campaignTimeRuntime';
import { planBotArenaParticipation } from '../../src/simulation/bots/arenaPlanner';
import type { BotProfile } from '../../src/simulation/bots/profiles';
import { advanceCampaignTime } from '../../src/simulation/campaign/time';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import type { FleetState } from '../../src/simulation/fleets/types';
import { STATE_HISTORY_LIMITS } from '../../src/simulation/history/stateHistory';
import { getArenaChallenges } from '../../src/simulation/pveMeta/arena';
import { ARENA_HISTORY_LIMIT } from '../../src/simulation/pveMeta/reputation';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState } from '../../src/simulation/types';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';
import { createCampaignRuntimeMetadata } from '../../src/storage/runtimeMetadata';

const TOTAL_SECONDS = 172_800;
const CHUNK_SECONDS = 21_600;
const SAVE_SPLIT_SECONDS = 86_400;
const STARTED_AT_REAL = '2026-08-02T00:00:00.000Z';

const BOT_CASES: readonly {
  readonly empireId: string;
  readonly personality: BotProfile['personality'];
}[] = [
  { empireId: 'aegis-bot', personality: 'industrial' },
  { empireId: 'synod-bot', personality: 'explorer' },
  { empireId: 'veyra-bot', personality: 'aggressive' },
];

function profile(
  empireId: string,
  personality: BotProfile['personality'],
): BotProfile {
  return {
    id: `closure.${empireId}.${personality}`,
    empireId,
    personality,
    difficulty: 'normal',
    decisionIntervalSeconds: 300,
    maxCommandsPerDecision: 4,
  };
}

function prepareClosureState(): GameState {
  let state = createInitialGameState('bot-pve-meta-48-hour-closure');

  for (const entry of BOT_CASES) {
    const origin = state.planets.find(
      (planet) => planet.ownerEmpireId === entry.empireId,
    );
    if (origin === undefined) throw new Error(`Missing origin for ${entry.empireId}.`);
    const ships = getFactionMechanicalRoles(origin.factionId).ships;
    const capabilityFleet: FleetState = {
      id: `${entry.empireId}-meta-capability`,
      empireId: entry.empireId,
      originPlanetId: origin.id,
      location: { type: 'planet', planetId: origin.id },
      status: 'holding',
      ships: {
        [ships.scout]: 1,
        [ships.fighter]: 1,
        [ships.colonizer]: 1,
        [ships.cruiser]: 1,
      },
      cargo: { metal: 0, crystal: 0, gas: 0 },
      speed: 100,
      cargoCapacity: 10_000,
      mission: null,
    };
    const arenaFleet: FleetState = {
      id: `${entry.empireId}-meta-arena`,
      empireId: entry.empireId,
      originPlanetId: origin.id,
      location: { type: 'planet', planetId: origin.id },
      status: 'stationed',
      ships: {
        [ships.dreadnought]: 250,
        [ships.cruiser]: 250,
      },
      cargo: { metal: 0, crystal: 0, gas: 0 },
      speed: 100,
      cargoCapacity: 100_000,
      mission: null,
    };
    state = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.id === origin.id
          ? {
              ...planet,
              economy: {
                ...planet.economy,
                resources: {
                  metal: {
                    ...planet.economy.resources.metal,
                    amount: 1_000_000,
                    capacity: 1_000_000,
                  },
                  crystal: {
                    ...planet.economy.resources.crystal,
                    amount: 1_000_000,
                    capacity: 1_000_000,
                  },
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
      fleets: [...state.fleets, capabilityFleet, arenaFleet],
      spaceObjects: [],
      worldEvents: { ...state.worldEvents, active: [] },
    };
  }

  for (const entry of BOT_CASES) {
    const botProfile = profile(entry.empireId, entry.personality);
    const plan = planBotArenaParticipation(state, botProfile);
    expect(plan.reasonCode).toBe('arena-selected');
    expect(plan.command).toMatchObject({
      type: 'ENTER_ARENA_CHALLENGE',
      empireId: entry.empireId,
    });
    if (plan.command === null) throw new Error(`Arena plan missing for ${entry.empireId}.`);
    const result = executeCommand(state, plan.command);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(`${result.code}: ${result.message}`);
    state = result.value;
  }

  expect(state.pveMeta?.activeArenaEntries.map((entry) => entry.empireId).sort()).toEqual(
    BOT_CASES.map((entry) => entry.empireId).sort(),
  );
  return state;
}

function advanceFully(state: GameState, seconds: number): GameState {
  const result = advanceCampaignTime(state, seconds, { operationBudget: 8_192 });
  expect(result.complete).toBe(true);
  expect(result.remainingGameSeconds).toBe(0);
  return result.state;
}

function runChunked(initial: GameState): GameState {
  let state = initial;
  for (let elapsed = 0; elapsed < TOTAL_SECONDS; elapsed += CHUNK_SECONDS) {
    state = advanceFully(state, CHUNK_SECONDS);
  }
  return state;
}

function runSaveLoaded(initial: GameState): GameState {
  const first = advanceFully(initial, SAVE_SPLIT_SECONDS);
  const savedAt = '2026-08-03T00:00:00.000Z';
  const parsed = parseSaveJson(serializeSave(
    createSaveEnvelope('bot-pve-meta-closure', first, savedAt),
  ));
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) throw new Error(parsed.message);
  return advanceFully(parsed.value.state, TOTAL_SECONDS - SAVE_SPLIT_SECONDS);
}

async function runOffline(initial: GameState): Promise<GameState> {
  const realDurationMilliseconds =
    (TOTAL_SECONDS * 1_000) / initial.campaignSettings.worldSpeed;
  expect(Number.isSafeInteger(realDurationMilliseconds)).toBe(true);
  const targetAtReal = new Date(
    Date.parse(STARTED_AT_REAL) + realDurationMilliseconds,
  ).toISOString();
  const result = await runCampaignCatchUp({
    state: initial,
    runtimeMetadata: createCampaignRuntimeMetadata(STARTED_AT_REAL),
    targetAtReal,
    operationBudget: 2_048,
    checkpoint: () => Promise.resolve(),
    yieldControl: () => Promise.resolve(),
  });
  return result.state;
}

function expectClosedState(state: GameState): void {
  expect(state.clock.elapsedSeconds).toBe(TOTAL_SECONDS);
  expect(state.pveMeta?.arenaHistory.length).toBeGreaterThanOrEqual(BOT_CASES.length);
  expect(state.pveMeta?.arenaHistory.length).toBeLessThanOrEqual(ARENA_HISTORY_LIMIT);
  for (const entry of BOT_CASES) {
    expect(state.pveMeta?.arenaHistory.some(
      (result) => result.empireId === entry.empireId,
    )).toBe(true);
    expect(state.pveMeta?.reputations.find(
      (reputation) => reputation.empireId === entry.empireId,
    )?.reputation).toBeGreaterThanOrEqual(0);
  }
  expect(state.commandLog.length).toBeLessThanOrEqual(STATE_HISTORY_LIMITS.commands);
  expect(state.eventLog.length).toBeLessThanOrEqual(STATE_HISTORY_LIMITS.executedEvents);
}

describe('48-hour three-faction PvE meta closure gate', () => {
  it('preserves reputation, Arena entries, fleets and challenges across every partition', async () => {
    const initial = prepareClosureState();
    const direct = advanceFully(initial, TOTAL_SECONDS);
    const chunked = runChunked(initial);
    const saveLoaded = runSaveLoaded(initial);
    const offline = await runOffline(initial);

    expect(chunked).toEqual(direct);
    expect(saveLoaded).toEqual(direct);
    expect(offline).toEqual(direct);
    expect(getArenaChallenges(chunked)).toEqual(getArenaChallenges(direct));
    expect(getArenaChallenges(saveLoaded)).toEqual(getArenaChallenges(direct));
    expect(getArenaChallenges(offline)).toEqual(getArenaChallenges(direct));
    expectClosedState(direct);
  }, 180_000);
});
