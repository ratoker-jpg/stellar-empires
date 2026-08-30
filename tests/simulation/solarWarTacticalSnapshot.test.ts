import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { applySolarWarResolutionEvent } from '../../src/simulation/endgame/solarWar';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import type { FleetState } from '../../src/simulation/fleets/types';
import { createUnifiedMissionReports } from '../../src/simulation/reports/missionReports';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState, ScheduledGameEvent } from '../../src/simulation/types';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

const SAVE_TIME = '2026-08-24T12:00:00.000Z';

type SolarWarResolutionEvent = ScheduledGameEvent & {
  readonly payload: { readonly type: 'SOLAR_WAR_RESOLVE'; readonly cycleId: string };
};

function execute(state: GameState, command: Parameters<typeof executeCommand>[1]): GameState {
  const result = executeCommand(state, command);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(`${result.code}: ${result.message}`);
  return result.value;
}

function tacticalSolarState(): { readonly state: GameState; readonly fleet: FleetState } {
  const initial = createInitialGameState('solar-war-tactical-snapshot');
  const origin = initial.planets.find((planet) => planet.ownerEmpireId === 'player');
  if (origin === undefined) throw new Error('Player origin missing.');
  const ships = getFactionMechanicalRoles(origin.factionId).ships.complete;
  const fleet: FleetState = {
    id: 'solar-tactical-fleet',
    empireId: 'player',
    originPlanetId: origin.id,
    location: { type: 'planet', planetId: origin.id },
    status: 'stationed',
    ships: {
      'commander.shared.executor': 1,
      [ships.heavyAssault]: 40,
      [ships.lineBattleship]: 80,
      [ships.interceptor]: 120,
    },
    cargo: { metal: 0, crystal: 0, gas: 0 },
    speed: 6,
    cargoCapacity: 10_000,
    formation: 'wedge',
    targetPriority: 'capitals',
    mission: null,
  };
  return {
    fleet,
    state: {
      ...initial,
      fleets: [...initial.fleets, fleet],
      commanders: initial.commanders.map((command) =>
        command.empireId === 'player'
          ? {
              ...command,
              doctrineId: 'vanguard',
              experience: 1_500,
              level: 5,
              flagshipFleetId: fleet.id,
            }
          : command,
      ),
    },
  };
}

function enterAndResolve(state: GameState, fleetId: string): GameState {
  const entered = execute(state, { type: 'ENTER_SOLAR_WAR', empireId: 'player', fleetId });
  const event = entered.pendingEvents.find(
    (candidate): candidate is SolarWarResolutionEvent =>
      candidate.payload.type === 'SOLAR_WAR_RESOLVE',
  );
  if (event === undefined) throw new Error('Solar War resolution event missing.');
  return applySolarWarResolutionEvent({
    ...entered,
    clock: { ...entered.clock, elapsedSeconds: event.executeAt },
    pendingEvents: entered.pendingEvents.filter((candidate) => candidate.id !== event.id),
  }, event);
}

describe('Solar War tactical feedback', () => {
  it('persists resolution-time participant tactics and never reconstructs them from later command state', () => {
    const fixture = tacticalSolarState();
    const resolved = enterAndResolve(fixture.state, fixture.fleet.id);
    const result = resolved.endgameParticipation?.solarWar.history.at(-1);
    if (result === undefined) throw new Error('Solar War result missing.');

    expect(result.battleReport.attackerTacticalSnapshot).toEqual({
      doctrineId: 'vanguard',
      commandLevel: 5,
      isFlagship: true,
      formation: 'wedge',
      targetPriority: 'capitals',
      commanderId: 'commander.shared.executor',
    });
    expect(result.battleReport.defenderTacticalSnapshot).toBeUndefined();

    const changed: GameState = {
      ...resolved,
      commanders: resolved.commanders.map((command) =>
        command.empireId === 'player'
          ? { ...command, doctrineId: 'sentinel', level: 9, flagshipFleetId: null }
          : command,
      ),
    };
    const unified = createUnifiedMissionReports(changed).find((report) => report.id === result.id);
    expect(unified?.tacticalContext?.primary).toEqual(result.battleReport.attackerTacticalSnapshot);
    expect(unified?.tacticalContext?.primary?.doctrineId).toBe('vanguard');
    expect(unified?.tacticalContext?.primary?.commandLevel).toBe(5);
    expect(unified?.tacticalContext?.primary?.isFlagship).toBe(true);
  });

  it('round-trips new snapshots and accepts legacy Solar War results without one', () => {
    const fixture = tacticalSolarState();
    const resolved = enterAndResolve(fixture.state, fixture.fleet.id);
    const result = resolved.endgameParticipation?.solarWar.history.at(-1);
    if (result === undefined) throw new Error('Solar War result missing.');

    const parsed = parseSaveJson(serializeSave(createSaveEnvelope(
      'solar-war-tactical',
      resolved,
      SAVE_TIME,
    )));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.formatVersion).toBe(6);
    expect(parsed.value.state.schemaVersion).toBe(20);
    expect(parsed.value.state.endgameParticipation?.solarWar.history.at(-1)?.battleReport.attackerTacticalSnapshot)
      .toEqual(result.battleReport.attackerTacticalSnapshot);

    const {
      attackerTacticalSnapshot: _attackerTacticalSnapshot,
      defenderTacticalSnapshot: _defenderTacticalSnapshot,
      ...legacyBattleReport
    } = result.battleReport;
    const legacyResult = { ...result, battleReport: legacyBattleReport };
    const legacyState: GameState = {
      ...resolved,
      endgameParticipation: {
        ...resolved.endgameParticipation!,
        solarWar: {
          ...resolved.endgameParticipation!.solarWar,
          history: [legacyResult],
        },
      },
    };
    const legacyParsed = parseSaveJson(serializeSave(createSaveEnvelope(
      'legacy-solar-war-tactical',
      legacyState,
      SAVE_TIME,
    )));
    expect(legacyParsed.ok).toBe(true);
    if (!legacyParsed.ok) return;
    expect(legacyParsed.value.state.endgameParticipation?.solarWar.history[0]?.battleReport.attackerTacticalSnapshot)
      .toBeUndefined();
  });
});
