import { describe, expect, it } from 'vitest';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  applySolarWarResolutionEvent,
  getSolarWarCycle,
} from '../../src/simulation/endgame/solarWar';
import {
  getSolarWarPublicResults,
  getSolarWarResultsForEmpire,
  getSolarWarScoreboard,
} from '../../src/simulation/endgame/solarWarView';
import {
  SOLAR_WAR_CYCLE_SECONDS,
  SOLAR_WAR_HISTORY_LIMIT,
  type SolarWarResult,
} from '../../src/simulation/endgame/types';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import type { FleetState } from '../../src/simulation/fleets/types';
import { compactGameStateHistory } from '../../src/simulation/history/stateHistory';
import { createUnifiedMissionReports } from '../../src/simulation/reports/missionReports';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState, ScheduledGameEvent } from '../../src/simulation/types';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

const SAVE_TIME = '2026-08-03T06:00:00.000Z';

type SolarWarResolutionEvent = ScheduledGameEvent & {
  readonly payload: {
    readonly type: 'SOLAR_WAR_RESOLVE';
    readonly cycleId: string;
  };
};

function participation(state: GameState) {
  if (state.endgameParticipation === undefined) {
    throw new Error('Endgame participation is missing.');
  }
  return state.endgameParticipation;
}

function execute(state: GameState, command: Parameters<typeof executeCommand>[1]): GameState {
  const result = executeCommand(state, command);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(`${result.code}: ${result.message}`);
  return result.value;
}

function withCombatFleet(
  state: GameState,
  empireId: string,
  fleetId: string,
  strength = 1,
): { readonly state: GameState; readonly fleet: FleetState } {
  const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId);
  if (origin === undefined) throw new Error(`Origin missing for ${empireId}.`);
  const ships = getFactionMechanicalRoles(origin.factionId).ships.complete;
  const fleet: FleetState = {
    id: fleetId,
    empireId,
    originPlanetId: origin.id,
    location: { type: 'planet', planetId: origin.id },
    status: 'stationed',
    ships: {
      [ships.heavyAssault]: 40 * strength,
      [ships.lineBattleship]: 80 * strength,
      [ships.interceptor]: 120 * strength,
    },
    cargo: { metal: 0, crystal: 0, gas: 0 },
    speed: 6,
    cargoCapacity: 10_000,
    mission: null,
  };
  return { state: { ...state, fleets: [...state.fleets, fleet] }, fleet };
}

function withNonCombatFleet(
  state: GameState,
  empireId: string,
  fleetId: string,
): { readonly state: GameState; readonly fleet: FleetState } {
  const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId);
  if (origin === undefined) throw new Error(`Origin missing for ${empireId}.`);
  const shipId = getFactionMechanicalRoles(origin.factionId).ships.transport;
  const fleet: FleetState = {
    id: fleetId,
    empireId,
    originPlanetId: origin.id,
    location: { type: 'planet', planetId: origin.id },
    status: 'stationed',
    ships: { [shipId]: 10 },
    cargo: { metal: 0, crystal: 0, gas: 0 },
    speed: 8,
    cargoCapacity: 10_000,
    mission: null,
  };
  return { state: { ...state, fleets: [...state.fleets, fleet] }, fleet };
}

function enter(state: GameState, empireId: string, fleetId: string): GameState {
  return execute(state, { type: 'ENTER_SOLAR_WAR', empireId, fleetId });
}

function findResolutionEvent(state: GameState): SolarWarResolutionEvent {
  const event = state.pendingEvents.find(
    (candidate): candidate is SolarWarResolutionEvent =>
      candidate.payload.type === 'SOLAR_WAR_RESOLVE',
  );
  if (event === undefined) throw new Error('Solar War resolution event is missing.');
  return event;
}

function resolveWithoutTimeSimulation(
  state: GameState,
  event: SolarWarResolutionEvent,
): GameState {
  return applySolarWarResolutionEvent(
    {
      ...state,
      clock: { ...state.clock, elapsedSeconds: event.executeAt },
      pendingEvents: state.pendingEvents.filter((candidate) => candidate.id !== event.id),
    },
    event,
  );
}

function advance(state: GameState, seconds: number): GameState {
  return execute(state, { type: 'ADVANCE_TIME', seconds });
}

function timeProjection(state: GameState) {
  return {
    clock: state.clock,
    fleets: state.fleets,
    endgameParticipation: state.endgameParticipation,
    pendingEvents: state.pendingEvents,
    nextEventSequence: state.nextEventSequence,
  };
}

function fastTimeState(state: GameState): GameState {
  return {
    ...state,
    pendingEvents: [],
    logisticsRoutes: [],
    worldEvents: {
      ...state.worldEvents,
      active: [],
      nextEvaluationAt: Number.MAX_SAFE_INTEGER,
    },
  };
}

describe('deterministic Solar War participation', () => {
  it('derives one public 24-hour cycle only from seed and campaign time', () => {
    const initial = createInitialGameState('solar-war-cycle');
    const first = getSolarWarCycle(initial);
    expect(getSolarWarCycle(structuredClone(initial))).toEqual(first);
    expect(first.id).toBe('solar-war-0');
    expect(first.startsAt).toBe(0);
    expect(first.resolvesAt).toBe(SOLAR_WAR_CYCLE_SECONDS);
    expect(Object.keys(first.enemyUnits).length).toBeGreaterThan(0);

    const hiddenChanged = {
      ...initial,
      planets: initial.planets.map((planet) => ({
        ...planet,
        ownerEmpireId: planet.ownerEmpireId === null ? null : 'hidden-change',
      })),
    };
    expect(getSolarWarCycle(hiddenChanged)).toEqual(first);

    const next = getSolarWarCycle({
      ...initial,
      clock: { ...initial.clock, elapsedSeconds: SOLAR_WAR_CYCLE_SECONDS },
    });
    expect(next.id).toBe('solar-war-1');
    expect(next).not.toEqual(first);
  });

  it('holds one owned combat fleet and schedules one shared exact-cycle event', () => {
    const fixture = withCombatFleet(
      createInitialGameState('solar-war-entry'),
      'player',
      'solar-player',
    );
    const entered = enter(fixture.state, 'player', fixture.fleet.id);
    const current = participation(entered).solarWar;

    expect(current.activeEntries).toHaveLength(1);
    expect(current.activeEntries[0]).toMatchObject({
      id: 'solar-war-entry-0-player',
      empireId: 'player',
      participationKind: 'solo',
      participationId: 'player',
      allianceId: null,
      resolvesAt: SOLAR_WAR_CYCLE_SECONDS,
    });
    expect(entered.fleets.find((fleet) => fleet.id === fixture.fleet.id)?.status).toBe('holding');
    expect(findResolutionEvent(entered)).toMatchObject({
      executeAt: SOLAR_WAR_CYCLE_SECONDS,
      payload: { type: 'SOLAR_WAR_RESOLVE', cycleId: 'solar-war-0' },
    });

    expect(executeCommand(entered, {
      type: 'ENTER_SOLAR_WAR',
      empireId: 'player',
      fleetId: fixture.fleet.id,
    })).toMatchObject({ ok: false, code: 'SOLAR_WAR_ENTRY_ACTIVE' });
    expect(executeCommand(entered, {
      type: 'SCHEDULE_EVENT',
      executeAt: SOLAR_WAR_CYCLE_SECONDS,
      payload: { type: 'SOLAR_WAR_RESOLVE', cycleId: 'forged' },
    })).toMatchObject({ ok: false, code: 'RESERVED_EVENT_TYPE' });
  });

  it('snapshots alliance participation and resolves members in stable empire order', () => {
    let state = createInitialGameState('solar-war-alliance');
    state = execute(state, {
      type: 'CREATE_ALLIANCE',
      empireId: 'player',
      name: 'Solar Coalition',
    });
    state = execute(state, {
      type: 'JOIN_ALLIANCE',
      empireId: 'aegis-bot',
      allianceId: 'alliance-1',
    });
    state = withCombatFleet(state, 'aegis-bot', 'solar-aegis').state;
    state = withCombatFleet(state, 'player', 'solar-player').state;
    state = enter(state, 'aegis-bot', 'solar-aegis');
    state = enter(state, 'player', 'solar-player');

    expect(participation(state).solarWar.activeEntries).toHaveLength(2);
    expect(state.pendingEvents.filter(
      (event) => event.payload.type === 'SOLAR_WAR_RESOLVE',
    )).toHaveLength(1);
    expect(participation(state).solarWar.activeEntries.every(
      (entry) => entry.participationKind === 'alliance' &&
        entry.participationId === 'alliance-1',
    )).toBe(true);

    const resolved = resolveWithoutTimeSimulation(state, findResolutionEvent(state));
    expect(participation(resolved).solarWar.activeEntries).toEqual([]);
    expect(participation(resolved).solarWar.history.map((result) => result.empireId)).toEqual([
      'player',
      'aegis-bot',
    ]);
    const scoreboard = getSolarWarScoreboard(resolved, 0);
    expect(scoreboard).toHaveLength(1);
    expect(scoreboard[0]).toMatchObject({
      participationKind: 'alliance',
      participationId: 'alliance-1',
      allianceId: 'alliance-1',
      entries: 2,
    });
    expect(scoreboard[0]!.score).toBe(
      participation(resolved).solarWar.history.reduce((total, result) => total + result.score, 0),
    );
  });

  it('rejects foreign, busy and non-combat fleets without mutation', () => {
    const combat = withCombatFleet(
      createInitialGameState('solar-war-rejections'),
      'aegis-bot',
      'foreign-fleet',
    );
    const nonCombat = withNonCombatFleet(combat.state, 'player', 'transport-fleet');
    const checksum = createStateChecksum(nonCombat.state);

    expect(executeCommand(nonCombat.state, {
      type: 'ENTER_SOLAR_WAR',
      empireId: 'player',
      fleetId: combat.fleet.id,
    })).toMatchObject({ ok: false, code: 'SOLAR_WAR_FLEET_NOT_FOUND' });
    expect(executeCommand(nonCombat.state, {
      type: 'ENTER_SOLAR_WAR',
      empireId: 'player',
      fleetId: nonCombat.fleet.id,
    })).toMatchObject({ ok: false, code: 'SOLAR_WAR_FLEET_NOT_COMBAT_CAPABLE' });

    const busy: GameState = {
      ...nonCombat.state,
      fleets: nonCombat.state.fleets.map((fleet) =>
        fleet.id === nonCombat.fleet.id ? { ...fleet, status: 'holding' } : fleet,
      ),
    };
    expect(executeCommand(busy, {
      type: 'ENTER_SOLAR_WAR',
      empireId: 'player',
      fleetId: nonCombat.fleet.id,
    })).toMatchObject({ ok: false, code: 'SOLAR_WAR_FLEET_NOT_IDLE' });
    expect(createStateChecksum(nonCombat.state)).toBe(checksum);
  });

  it('resolves through existing combat once and exposes public and owner reports', () => {
    const fixture = withCombatFleet(
      createInitialGameState('solar-war-resolution'),
      'player',
      'solar-heavy',
      3,
    );
    const entered = enter(fixture.state, 'player', fixture.fleet.id);
    const event = findResolutionEvent(entered);
    const resolved = resolveWithoutTimeSimulation(entered, event);
    const result = participation(resolved).solarWar.history[0];

    expect(result).toBeDefined();
    expect(result).toMatchObject({
      entryId: 'solar-war-entry-0-player',
      cycleId: 'solar-war-0',
      empireId: 'player',
      participationKind: 'solo',
      participationId: 'player',
      outcome: 'victory',
    });
    expect(result!.score).toBeGreaterThan(0);
    expect(result!.battleReport.mode).toBe('pve');
    expect(result!.battleReport.rounds.length).toBeGreaterThan(0);
    expect(resolved.fleets.find((fleet) => fleet.id === fixture.fleet.id)?.status).toBe('stationed');

    const publicResult = getSolarWarPublicResults(resolved, 0)[0];
    expect(publicResult).toMatchObject({ empireId: 'player', score: result!.score });
    expect(publicResult).not.toHaveProperty('attackerInitial');
    expect(getSolarWarResultsForEmpire(resolved, 'player')).toEqual([result]);
    expect(createUnifiedMissionReports(resolved).some(
      (report) => report.kind === 'solar-war' && report.id === result!.id,
    )).toBe(true);

    expect(applySolarWarResolutionEvent(resolved, event)).toBe(resolved);
  });

  it('preserves the exact Solar War domain across direct, chunked and save partitions', () => {
    const fixture = withCombatFleet(
      fastTimeState(createInitialGameState('solar-war-partitions')),
      'player',
      'solar-partition',
      2,
    );
    const entered = enter(fixture.state, 'player', fixture.fleet.id);
    const save = createSaveEnvelope('solar-war-active', entered, SAVE_TIME);
    const parsed = parseSaveJson(serializeSave(save));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const direct = advance(entered, SOLAR_WAR_CYCLE_SECONDS);
    const chunked = advance(
      advance(entered, SOLAR_WAR_CYCLE_SECONDS / 2),
      SOLAR_WAR_CYCLE_SECONDS / 2,
    );
    const loaded = advance(parsed.value.state, SOLAR_WAR_CYCLE_SECONDS);

    expect(timeProjection(chunked)).toEqual(timeProjection(direct));
    expect(timeProjection(loaded)).toEqual(timeProjection(direct));
  });

  it('retains only the newest 64 resolved results', () => {
    const initial = createInitialGameState('solar-war-history-bound');
    const template: SolarWarResult = {
      id: 'solar-war-result-template',
      entryId: 'solar-war-entry-template',
      cycleId: 'solar-war-0',
      cycleIndex: 0,
      empireId: 'player',
      fleetId: 'solar-fleet',
      originPlanetId: 'planet-player',
      participationKind: 'solo',
      participationId: 'player',
      allianceId: null,
      resolvedAt: 0,
      outcome: 'defeat',
      score: 0,
      attackerInitial: { 'ship.aegis.scout': 1 },
      enemyInitial: { 'ship.aegis.scout': 1 },
      attackerRemaining: {},
      enemyRemaining: { 'ship.aegis.scout': 1 },
      battleReport: {
        id: 'solar-war-battle-template',
        seed: 1,
        resolvedAt: 0,
        targetPlanetId: 'solar-war-0',
        attackerEmpireId: 'player',
        defenderEmpireId: 'solar-war-aegis',
        winner: 'defender',
        rounds: [],
        attackerInitial: { 'ship.aegis.scout': 1 },
        defenderInitial: { 'ship.aegis.scout': 1 },
        attackerRemaining: {},
        defenderRemaining: { 'ship.aegis.scout': 1 },
        mode: 'pve',
      },
    };
    const withHistory: GameState = {
      ...initial,
      endgameParticipation: {
        ...participation(initial),
        solarWar: {
          activeEntries: [],
          history: Array.from({ length: 70 }, (_, index): SolarWarResult => ({
            ...template,
            id: `solar-war-result-${index}`,
            entryId: `solar-war-entry-${index}`,
            cycleId: `solar-war-${index}`,
            cycleIndex: index,
            resolvedAt: index,
            battleReport: {
              ...template.battleReport,
              id: `solar-war-battle-${index}`,
              resolvedAt: index,
              targetPlanetId: `solar-war-${index}`,
            },
          })),
        },
      },
    };
    const compacted = compactGameStateHistory(withHistory);
    expect(participation(compacted).solarWar.history).toHaveLength(SOLAR_WAR_HISTORY_LIMIT);
    expect(participation(compacted).solarWar.history[0]?.id).toBe('solar-war-result-6');
    expect(participation(compacted).solarWar.history.at(-1)?.id).toBe('solar-war-result-69');
  });
});
