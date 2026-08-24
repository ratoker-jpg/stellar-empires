import { describe, expect, it } from 'vitest';
import type {
  FleetFormation,
  FleetTargetPriority,
} from '../../src/simulation/combat/fleetDoctrine';
import { resolveAttackMission } from '../../src/simulation/combat/resolveAttackMission';
import type { BattleReport } from '../../src/simulation/combat/types';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import type { FleetState } from '../../src/simulation/fleets/types';
import { createUnifiedMissionReports } from '../../src/simulation/reports/missionReports';
import type { GameState } from '../../src/simulation/types';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

const EVENT_SEQUENCE = 41;
const SAVE_TIME = '2026-08-21T16:00:00.000Z';

function createFleet(
  id: string,
  empireId: string,
  planetId: string,
  ships: Readonly<Record<string, number>>,
  formation: FleetFormation,
  targetPriority: FleetTargetPriority,
): FleetState {
  return {
    id,
    empireId,
    originPlanetId: planetId,
    location: { type: 'planet', planetId },
    status: 'stationed',
    ships,
    cargo: { metal: 0, crystal: 0, gas: 0 },
    speed: 12,
    cargoCapacity: 0,
    formation,
    targetPriority,
    mission: null,
  };
}

function prepareCombatState(
  attackerFleetId: string,
  defenderOrder: readonly ('a' | 'b')[] = ['a', 'b'],
): {
  readonly state: GameState;
  readonly attacker: FleetState;
  readonly targetPlanetId: string;
} {
  const initial = createInitialGameState('post-1.0-pr2-combat-regression');
  const origin = initial.planets.find((planet) => planet.ownerEmpireId === 'player');
  const target = initial.planets.find((planet) => planet.ownerEmpireId === 'aegis-bot');
  if (origin === undefined || target === undefined) {
    throw new Error('Combat regression planets are missing.');
  }

  const attacker = createFleet(
    attackerFleetId,
    'player',
    origin.id,
    { 'ship.aegis.fighter': 10, 'ship.aegis.frigate': 4 },
    'line',
    'balanced',
  );
  const defenderA = createFleet(
    'defender-a',
    target.ownerEmpireId,
    target.id,
    {
      'commander.shared.executor': 1,
      'ship.aegis.frigate': 4,
    },
    'wedge',
    'capitals',
  );
  const defenderB = createFleet(
    'defender-b',
    target.ownerEmpireId,
    target.id,
    { 'ship.aegis.fighter': 7 },
    'screen',
    'interceptors',
  );
  const defenders = { a: defenderA, b: defenderB } as const;

  return {
    attacker,
    targetPlanetId: target.id,
    state: {
      ...initial,
      planets: initial.planets.map((planet) =>
        planet.id === target.id
          ? {
              ...planet,
              inventory: {
                ...planet.inventory,
                defenses: { 'defense.aegis.gun-battery': 3 },
              },
            }
          : planet,
      ),
      fleets: [attacker, ...defenderOrder.map((key) => defenders[key])],
      commanders: initial.commanders.map((command) =>
        command.empireId === target.ownerEmpireId
          ? {
              ...command,
              experience: 1_500,
              level: 5,
              flagshipFleetId: defenderA.id,
            }
          : command,
      ),
    },
  };
}

function resolvePrepared(input: ReturnType<typeof prepareCombatState>) {
  const target = input.state.planets.find((planet) => planet.id === input.targetPlanetId);
  if (target === undefined) throw new Error('Combat regression target is missing.');
  return resolveAttackMission(input.state, input.attacker, target, EVENT_SEQUENCE);
}

function reloadPrepared(input: ReturnType<typeof prepareCombatState>) {
  const save = createSaveEnvelope('pr2-combat', input.state, SAVE_TIME);
  const parsed = parseSaveJson(serializeSave(save));
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) throw new Error(parsed.code);

  const attacker = parsed.value.state.fleets.find((fleet) => fleet.id === input.attacker.id);
  if (attacker === undefined) throw new Error('Reloaded attacker fleet is missing.');
  return {
    state: parsed.value.state,
    attacker,
    targetPlanetId: input.targetPlanetId,
  };
}

function tacticalPrepared(attackerFleetId: string) {
  const prepared = prepareCombatState(attackerFleetId);
  const attacker: FleetState = {
    ...prepared.attacker,
    ships: {
      ...prepared.attacker.ships,
      'commander.shared.executor': 1,
    },
    formation: 'wedge',
    targetPriority: 'capitals',
  };
  const state: GameState = {
    ...prepared.state,
    fleets: prepared.state.fleets.map((fleet) =>
      fleet.id === attacker.id ? attacker : fleet,
    ),
    commanders: prepared.state.commanders.map((command) =>
      command.empireId === 'player'
        ? {
            ...command,
            doctrineId: 'vanguard',
            experience: 1_500,
            level: 5,
            flagshipFleetId: attacker.id,
          }
        : command,
    ),
  };
  return { ...prepared, state, attacker };
}

function stateWithBattleReport(state: GameState, report: BattleReport): GameState {
  return {
    ...state,
    eventLog: [{
      event: {
        id: `event-${report.id}`,
        executeAt: report.resolvedAt,
        sequence: EVENT_SEQUENCE,
        payload: { type: 'BATTLE_REPORT', report },
      },
      executedAt: report.resolvedAt,
    }],
  };
}

describe('POST-1.0-PR2 combat identity and defender doctrine regressions', () => {
  it('uses deterministic full attacker fleet identity entropy in the battle seed', () => {
    const firstId = 'attack-id-a';
    const secondId = 'attack-id-b';
    expect(firstId).toHaveLength(secondId.length);

    const first = resolvePrepared(prepareCombatState(firstId));
    const replay = resolvePrepared(prepareCombatState(firstId));
    const equalLengthOther = resolvePrepared(prepareCombatState(secondId));

    expect(replay.report.seed).toBe(first.report.seed);
    expect(equalLengthOther.report.seed).not.toBe(first.report.seed);
  });

  it('selects one stable primary defender independent of state.fleets array order', () => {
    const bThenA = resolvePrepared(prepareCombatState('stable-attack', ['b', 'a']));
    const aThenB = resolvePrepared(prepareCombatState('stable-attack', ['a', 'b']));

    for (const result of [bThenA, aThenB]) {
      expect(result.report.defenderFormation).toBe('wedge');
      expect(result.report.defenderTargetPriority).toBe('capitals');
      expect(result.report.defenderCommanderId).toBe('commander.shared.executor');
    }

    expect(bThenA.report).toEqual(aThenB.report);
  });

  it('replays the same combat report after a real schema-v19 save/load round trip', () => {
    const prepared = prepareCombatState('save-load-attack', ['b', 'a']);
    const direct = resolvePrepared(prepared);
    const reloaded = resolvePrepared(reloadPrepared(prepared));

    expect(reloaded.report).toEqual(direct.report);
  });

  it('preserves resolution-time doctrine, level, flagship, formation, priority and commander', () => {
    const prepared = tacticalPrepared('historical-context-attack');
    const target = prepared.state.planets.find(
      (planet) => planet.id === prepared.targetPlanetId,
    );
    if (target === undefined) throw new Error('Historical context target is missing.');
    const resolved = resolveAttackMission(
      prepared.state,
      prepared.attacker,
      target,
      EVENT_SEQUENCE,
    );
    expect(resolved.report.attackerFormation).toBe('wedge');
    expect(resolved.report.attackerTargetPriority).toBe('capitals');
    expect(resolved.report.attackerCommanderId).toBe('commander.shared.executor');
    expect(resolved.report.attackerTacticalSnapshot).toEqual({
      doctrineId: 'vanguard',
      commandLevel: 5,
      isFlagship: true,
      formation: 'wedge',
      targetPriority: 'capitals',
      commanderId: 'commander.shared.executor',
    });

    const historicalState = stateWithBattleReport({
      ...resolved.state,
      commanders: resolved.state.commanders.map((command) =>
        command.empireId === 'player'
          ? {
              ...command,
              doctrineId: 'sentinel',
              experience: 12_000,
              level: 9,
              flagshipFleetId: null,
            }
          : command,
      ),
    }, resolved.report);
    const unified = createUnifiedMissionReports(historicalState).find(
      (report) => report.id === resolved.report.id,
    );

    expect(unified?.tacticalContext?.primary).toEqual(resolved.report.attackerTacticalSnapshot);
    expect(unified?.tacticalContext?.primary?.doctrineId).toBe('vanguard');
    expect(unified?.tacticalContext?.primary?.commandLevel).toBe(5);
    expect(unified?.tacticalContext?.primary?.isFlagship).toBe(true);
  });

  it('round-trips new snapshots and keeps legacy reports loadable without current-state reconstruction', () => {
    const prepared = tacticalPrepared('save-tactical-attack');
    const target = prepared.state.planets.find((planet) => planet.id === prepared.targetPlanetId);
    if (target === undefined) throw new Error('Snapshot save target is missing.');
    const resolved = resolveAttackMission(prepared.state, prepared.attacker, target, EVENT_SEQUENCE);
    const persisted = stateWithBattleReport(resolved.state, resolved.report);
    const parsed = parseSaveJson(serializeSave(createSaveEnvelope(
      'combat-tactical-snapshot',
      persisted,
      SAVE_TIME,
    )));
    const {
      attackerTacticalSnapshot: _attackerTacticalSnapshot,
      defenderTacticalSnapshot: _defenderTacticalSnapshot,
      ...legacyReport
    } = resolved.report;
    const legacyProbe = parseSaveJson(serializeSave(createSaveEnvelope(
      'combat-tactical-snapshot-legacy-probe',
      stateWithBattleReport(resolved.state, legacyReport),
      SAVE_TIME,
    )));
    const stateOnlyProbe = parseSaveJson(serializeSave(createSaveEnvelope(
      'combat-tactical-snapshot-state-only-probe',
      resolved.state,
      SAVE_TIME,
    )));
    if (!parsed.ok) {
      throw new Error(`parseSaveJson diagnostic: ${JSON.stringify({
        current: {
          code: parsed.code,
          message: parsed.message,
          details: parsed.details,
        },
        legacySameState: legacyProbe.ok
          ? { ok: true, formatVersion: legacyProbe.value.formatVersion }
          : {
              ok: false,
              code: legacyProbe.code,
              message: legacyProbe.message,
              details: legacyProbe.details,
            },
        stateOnly: stateOnlyProbe.ok
          ? { ok: true, formatVersion: stateOnlyProbe.value.formatVersion }
          : {
              ok: false,
              code: stateOnlyProbe.code,
              message: stateOnlyProbe.message,
              details: stateOnlyProbe.details,
            },
      })}`);
    }
    expect(parsed.value.formatVersion).toBe(6);
    expect(parsed.value.state.schemaVersion).toBe(19);
    const loadedBattle = parsed.value.state.eventLog.find(
      (entry) => entry.event.payload.type === 'BATTLE_REPORT' &&
        entry.event.payload.report.id === resolved.report.id,
    );
    expect(loadedBattle?.event.payload.type).toBe('BATTLE_REPORT');
    if (loadedBattle?.event.payload.type !== 'BATTLE_REPORT') return;
    expect(loadedBattle.event.payload.report.attackerTacticalSnapshot)
      .toEqual(resolved.report.attackerTacticalSnapshot);

    const legacyCurrentState = stateWithBattleReport({
      ...resolved.state,
      commanders: resolved.state.commanders.map((command) =>
        command.empireId === 'player'
          ? { ...command, doctrineId: 'sentinel', level: 9, flagshipFleetId: null }
          : command,
      ),
    }, legacyReport);
    const legacyParsed = parseSaveJson(serializeSave(createSaveEnvelope(
      'legacy-combat-report',
      legacyCurrentState,
      SAVE_TIME,
    )));
    expect(legacyParsed.ok).toBe(true);
    if (!legacyParsed.ok) return;
    const legacyUnified = createUnifiedMissionReports(legacyParsed.value.state).find(
      (report) => report.id === legacyReport.id,
    );
    expect(legacyUnified?.tacticalContext).toBeUndefined();
  });
});
