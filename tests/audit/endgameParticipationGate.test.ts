import { describe, expect, it } from 'vitest';
import { runCampaignCatchUp } from '../../src/runtime/campaignTimeRuntime';
import { advanceCampaignTime } from '../../src/simulation/campaign/time';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  ENDGAME_PARTICIPATION_HISTORY_LIMIT,
  SOLAR_WAR_HISTORY_LIMIT,
  type SolarWarParticipationKind,
} from '../../src/simulation/endgame/types';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import type { FleetState } from '../../src/simulation/fleets/types';
import {
  compactGameStateHistory,
  STATE_HISTORY_LIMITS,
} from '../../src/simulation/history/stateHistory';
import type { FactionId } from '../../src/simulation/planet/types';
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
const SAVE_SPLIT_SECONDS = 43_200;
const STARTED_AT_REAL = '2026-08-04T00:00:00.000Z';
const FACTIONS: readonly FactionId[] = ['aegis', 'synod', 'veyra'];
const PARTICIPATION_KINDS: readonly SolarWarParticipationKind[] = ['solo', 'alliance'];

function execute(
  state: GameState,
  command: Parameters<typeof executeCommand>[1],
): GameState {
  const result = executeCommand(state, command);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(`${result.code}: ${result.message}`);
  return result.value;
}

function legacyV4Save(seed: string, factionId: FactionId) {
  const current = createInitialGameState(seed, factionId);
  const {
    endgameParticipation: _participation,
    endgameFinalObjects: _finalObjects,
    campaignResult: _campaignResult,
    ...legacyShell
  } = current;
  const state = { ...legacyShell, schemaVersion: 17 as const };
  const runtimeMetadata = createCampaignRuntimeMetadata(STARTED_AT_REAL);
  const unsigned = {
    formatVersion: 4,
    slotId: `legacy-${factionId}`,
    savedAt: STARTED_AT_REAL,
    runtimeMetadata,
    state,
  } as const;
  return {
    ...unsigned,
    checksum: createStateChecksum(unsigned),
  };
}

function migrateLegacyState(seed: string, factionId: FactionId): GameState {
  const legacy = legacyV4Save(seed, factionId);
  const parsed = parseSaveJson(JSON.stringify(legacy));
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) throw new Error(parsed.message);

  expect(parsed.value.formatVersion).toBe(6);
  expect(parsed.value.state.schemaVersion).toBe(19);
  expect(parsed.value.runtimeMetadata).toEqual(legacy.runtimeMetadata);
  const playerPlanet = parsed.value.state.planets.find(
    (planet) => planet.ownerEmpireId === 'player',
  );
  expect(playerPlanet?.factionId).toBe(factionId);
  expect(parsed.value.state.endgameParticipation?.participants).toEqual(
    parsed.value.state.empires.map((empireId) => ({
      empireId,
      allianceId: null,
      joinedAt: null,
      soloEligible: true,
    })),
  );
  expect(parsed.value.state.endgameFinalObjects?.activeProjects).toEqual([]);
  expect(parsed.value.state.campaignResult).toEqual({ status: 'ongoing' });
  return parsed.value.state;
}

function withFastDeterministicTime(state: GameState): GameState {
  return {
    ...state,
    pendingEvents: [],
    logisticsRoutes: [],
    botAutomation: {
      nextDecisionAtByEmpire: Object.fromEntries(
        state.empires
          .filter((empireId) => empireId !== 'player')
          .map((empireId) => [empireId, Number.MAX_SAFE_INTEGER]),
      ),
    },
    worldEvents: {
      ...state.worldEvents,
      active: [],
      nextEvaluationAt: Number.MAX_SAFE_INTEGER,
    },
  };
}

function withPlayerCombatFleet(state: GameState, factionId: FactionId): GameState {
  const origin = state.planets.find((planet) => planet.ownerEmpireId === 'player');
  if (origin === undefined) throw new Error(`Player origin missing for ${factionId}.`);
  const ships = getFactionMechanicalRoles(origin.factionId).ships.complete;
  const fleet: FleetState = {
    id: `endgame-gate-${factionId}`,
    empireId: 'player',
    originPlanetId: origin.id,
    location: { type: 'planet', planetId: origin.id },
    status: 'stationed',
    ships: {
      [ships.heavyAssault]: 60,
      [ships.lineBattleship]: 90,
      [ships.interceptor]: 120,
    },
    cargo: { metal: 0, crystal: 0, gas: 0 },
    speed: 12,
    cargoCapacity: 20_000,
    mission: null,
  };
  return { ...state, fleets: [...state.fleets, fleet] };
}

function prepareEntry(
  factionId: FactionId,
  participationKind: SolarWarParticipationKind,
): GameState {
  let state = migrateLegacyState(
    `endgame-participation-gate-${factionId}-${participationKind}`,
    factionId,
  );
  state = withFastDeterministicTime(state);
  if (participationKind === 'alliance') {
    state = execute(state, {
      type: 'CREATE_ALLIANCE',
      empireId: 'player',
      name: `${factionId} Closure Union`,
    });
  }
  state = withPlayerCombatFleet(state, factionId);
  state = execute(state, {
    type: 'ENTER_SOLAR_WAR',
    empireId: 'player',
    fleetId: `endgame-gate-${factionId}`,
  });

  const entries = state.endgameParticipation?.solarWar.activeEntries.filter(
    (entry) => entry.empireId === 'player',
  ) ?? [];
  expect(entries).toHaveLength(1);
  expect(entries[0]?.participationKind).toBe(participationKind);
  expect(entries[0]?.allianceId === null).toBe(participationKind === 'solo');
  expect(executeCommand(state, {
    type: 'ENTER_SOLAR_WAR',
    empireId: 'player',
    fleetId: `endgame-gate-${factionId}`,
  })).toMatchObject({ ok: false, code: 'SOLAR_WAR_ENTRY_ACTIVE' });
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

function runSaveLoaded(initial: GameState, slotId: string): GameState {
  const first = advanceFully(initial, SAVE_SPLIT_SECONDS);
  const savedAt = new Date(Date.parse(STARTED_AT_REAL) + 1_000).toISOString();
  const parsed = parseSaveJson(serializeSave(createSaveEnvelope(slotId, first, savedAt)));
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
  expect(result.runtimeMetadata.pendingCatchUp).toBeUndefined();
  return result.state;
}

function expectClosedScenario(
  state: GameState,
  participationKind: SolarWarParticipationKind,
): void {
  expect(state.clock.elapsedSeconds).toBe(TOTAL_SECONDS);
  const participation = state.endgameParticipation;
  expect(participation).toBeDefined();
  if (participation === undefined) return;
  expect(participation.solarWar.activeEntries.filter(
    (entry) => entry.empireId === 'player',
  )).toHaveLength(0);
  const results = participation.solarWar.history.filter(
    (result) => result.empireId === 'player',
  );
  expect(results).toHaveLength(1);
  expect(results[0]?.participationKind).toBe(participationKind);
  expect(participation.membershipHistory.length).toBeLessThanOrEqual(
    ENDGAME_PARTICIPATION_HISTORY_LIMIT,
  );
  expect(participation.solarWar.history.length).toBeLessThanOrEqual(
    SOLAR_WAR_HISTORY_LIMIT,
  );
}

describe('COMPLETE-ENDGAME-01 closure matrix', () => {
  for (const factionId of FACTIONS) {
    it(`${factionId} migrates v17/v4 with explicit solo eligibility`, () => {
      migrateLegacyState(`endgame-migration-${factionId}`, factionId);
    });

    for (const participationKind of PARTICIPATION_KINDS) {
      it(`${factionId} ${participationKind} Solar War is exact across 48-hour partitions`, async () => {
        const initial = prepareEntry(factionId, participationKind);
        const direct = advanceFully(initial, TOTAL_SECONDS);
        const chunked = runChunked(initial);
        const saveLoaded = runSaveLoaded(
          initial,
          `endgame-gate-${factionId}-${participationKind}`,
        );
        const offline = await runOffline(initial);

        expect(chunked).toEqual(direct);
        expect(saveLoaded).toEqual(direct);
        expect(offline).toEqual(direct);
        expectClosedScenario(direct, participationKind);
      }, 120_000);
    }
  }

  it('keeps both endgame histories bounded to the accepted 64-entry limits', () => {
    const resolved = advanceFully(prepareEntry('aegis', 'alliance'), TOTAL_SECONDS);
    const participation = resolved.endgameParticipation;
    expect(participation).toBeDefined();
    if (participation === undefined) return;
    const membership = participation.membershipHistory[0];
    const result = participation.solarWar.history[0];
    expect(membership).toBeDefined();
    expect(result).toBeDefined();
    if (membership === undefined || result === undefined) return;

    const overflow: GameState = {
      ...resolved,
      endgameParticipation: {
        ...participation,
        membershipHistory: Array.from({ length: 70 }, (_, index) => ({
          ...membership,
          sequence: index,
        })),
        solarWar: {
          ...participation.solarWar,
          history: Array.from({ length: 70 }, (_, index) => ({
            ...result,
            id: `overflow-solar-war-${index}`,
          })),
        },
      },
    };
    const compacted = compactGameStateHistory(overflow);

    expect(STATE_HISTORY_LIMITS.allianceMembership).toBe(64);
    expect(STATE_HISTORY_LIMITS.solarWarResults).toBe(64);
    expect(compacted.endgameParticipation?.membershipHistory).toHaveLength(64);
    expect(compacted.endgameParticipation?.solarWar.history).toHaveLength(64);
    expect(compacted.endgameParticipation?.membershipHistory[0]?.sequence).toBe(6);
    expect(compacted.endgameParticipation?.solarWar.history[0]?.id).toBe(
      'overflow-solar-war-6',
    );
  }, 120_000);

  for (const factionId of FACTIONS) {
    it(`${factionId} rejects malformed current v19/v6 endgame state with a valid checksum`, () => {
      const state = createInitialGameState(`endgame-malformed-${factionId}`, factionId);
      const save = createSaveEnvelope(
        `malformed-${factionId}`,
        state,
        STARTED_AT_REAL,
      );
      const malformedState = {
        ...state,
        endgameParticipation: {
          ...state.endgameParticipation!,
          solarWar: { activeEntries: 'invalid', history: [] },
        },
      };
      const unsigned = {
        formatVersion: save.formatVersion,
        slotId: save.slotId,
        savedAt: save.savedAt,
        runtimeMetadata: save.runtimeMetadata,
        state: malformedState,
      };
      const malformed = {
        ...unsigned,
        checksum: createStateChecksum(unsigned),
      };
      expect(parseSaveJson(JSON.stringify(malformed))).toMatchObject({
        ok: false,
        code: 'SAVE_MIGRATION_FAILED',
      });
    });
  }
});
