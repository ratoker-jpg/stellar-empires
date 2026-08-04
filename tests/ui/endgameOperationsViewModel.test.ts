import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getCurrentSolarWarCycle } from '../../src/simulation/endgame/solarWarView';
import type { SolarWarResult } from '../../src/simulation/endgame/types';
import type { FleetState } from '../../src/simulation/fleets/types';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameCommand, GameState } from '../../src/simulation/types';
import {
  createEndgameOperationsViewModel,
  validateAllianceNameInput,
  validateSolarWarEntrySelection,
} from '../../src/ui/endgameOperationsViewModel';

function execute(state: GameState, command: GameCommand): GameState {
  const result = executeCommand(state, command);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(`${result.code}: ${result.message}`);
  return result.value;
}

function withCombatFleet(state: GameState, id = 'fleet-endgame-ui'): GameState {
  const origin = state.planets.find((planet) => planet.ownerEmpireId === 'player');
  if (origin === undefined) throw new Error('Player origin is missing.');
  const fleet: FleetState = {
    id,
    empireId: 'player',
    originPlanetId: origin.id,
    location: { type: 'planet', planetId: origin.id },
    status: 'stationed',
    ships: { 'ship.aegis.fighter': 6 },
    cargo: { metal: 0, crystal: 0, gas: 0 },
    speed: 12,
    cargoCapacity: 1_000,
    mission: null,
  };
  return { ...state, fleets: [...state.fleets, fleet] };
}

describe('endgame Operations view model', () => {
  it('shows explicit solo eligibility and validates normalized alliance names', () => {
    const state = createInitialGameState('endgame-operations-view', 'aegis');
    const before = JSON.stringify(state);
    const view = createEndgameOperationsViewModel(state);

    expect(view.available).toBe(true);
    expect(view.soloEligible).toBe(true);
    expect(view.participationKind).toBe('solo');
    expect(view.currentAllianceId).toBeNull();
    expect(view.canCreateAlliance).toBe(true);
    expect(validateAllianceNameInput('  Solar   Union  ')).toEqual({
      ok: true,
      normalizedName: 'Solar Union',
      message: 'Название готово к созданию публичного альянса.',
    });
    expect(validateAllianceNameInput('x').ok).toBe(false);
    expect(JSON.stringify(state)).toBe(before);
  });

  it('derives public alliance membership and active Solar War entry through ordinary commands', () => {
    let state = createInitialGameState('endgame-operations-command', 'aegis');
    state = execute(state, {
      type: 'CREATE_ALLIANCE',
      empireId: 'player',
      name: 'Solar Union',
    });
    state = withCombatFleet(state);

    const beforeEntry = createEndgameOperationsViewModel(state);
    expect(beforeEntry.currentAllianceName).toBe('Solar Union');
    expect(beforeEntry.participationKind).toBe('alliance');
    expect(beforeEntry.alliances[0]?.members).toContain('player');
    expect(beforeEntry.eligibleFleets.map((fleet) => fleet.id)).toContain('fleet-endgame-ui');
    expect(validateSolarWarEntrySelection(state, 'fleet-endgame-ui')).toEqual({
      ok: true,
      code: null,
      message: 'Флот готов к входу и будет удерживаться до завершения цикла.',
    });

    state = execute(state, {
      type: 'ENTER_SOLAR_WAR',
      empireId: 'player',
      fleetId: 'fleet-endgame-ui',
    });
    const active = createEndgameOperationsViewModel(state);
    expect(active.activeEntry?.fleetId).toBe('fleet-endgame-ui');
    expect(active.activeEntry?.participationKind).toBe('alliance');
    expect(active.eligibleFleets).toHaveLength(0);
    expect(validateSolarWarEntrySelection(state, 'fleet-endgame-ui').code).toBe(
      'SOLAR_WAR_ENTRY_ACTIVE',
    );
  });

  it('keeps public results redacted while exposing owned loss details', () => {
    const initial = createInitialGameState('endgame-operations-results', 'aegis');
    const cycle = getCurrentSolarWarCycle(initial);
    const participation = initial.endgameParticipation;
    if (participation === undefined) throw new Error('Endgame participation is missing.');
    const enemyUnitId = Object.keys(cycle.enemyUnits)[0];
    if (enemyUnitId === undefined) throw new Error('Solar War enemy fleet is empty.');
    const result: SolarWarResult = {
      id: 'solar-war-result-ui-player',
      entryId: 'solar-war-entry-0-player',
      cycleId: cycle.id,
      cycleIndex: cycle.cycleIndex,
      empireId: 'player',
      fleetId: 'fleet-ui-result',
      originPlanetId: initial.planets.find((planet) => planet.ownerEmpireId === 'player')!.id,
      participationKind: 'solo',
      participationId: 'player',
      allianceId: null,
      resolvedAt: cycle.resolvesAt,
      outcome: 'victory',
      score: 250,
      attackerInitial: { 'ship.aegis.fighter': 3 },
      enemyInitial: { [enemyUnitId]: 2 },
      attackerRemaining: { 'ship.aegis.fighter': 2 },
      enemyRemaining: { [enemyUnitId]: 1 },
      battleReport: {
        id: 'solar-war-battle-ui-player',
        seed: cycle.combatSeed,
        resolvedAt: cycle.resolvesAt,
        targetPlanetId: cycle.id,
        attackerEmpireId: 'player',
        defenderEmpireId: `solar-war-${cycle.factionId}`,
        winner: 'attacker',
        rounds: [],
        attackerInitial: { 'ship.aegis.fighter': 3 },
        defenderInitial: { [enemyUnitId]: 2 },
        attackerRemaining: { 'ship.aegis.fighter': 2 },
        defenderRemaining: { [enemyUnitId]: 1 },
        mode: 'pve',
      },
    };
    const state: GameState = {
      ...initial,
      endgameParticipation: {
        ...participation,
        solarWar: {
          activeEntries: [],
          history: [result],
        },
      },
    };
    const view = createEndgameOperationsViewModel(state);

    expect(view.publicResults).toHaveLength(1);
    expect(view.publicResults[0]).not.toHaveProperty('ownLosses');
    expect(view.publicResults[0]).not.toHaveProperty('fleetId');
    expect(view.ownedResults[0]).toMatchObject({
      fleetId: 'fleet-ui-result',
      ownLosses: 'Истребитель ×1',
      ownSurvivors: 'Истребитель ×2',
    });
    expect(view.scoreboard[0]).toMatchObject({
      participationId: 'player',
      score: 250,
      victories: 1,
    });
  });
});
