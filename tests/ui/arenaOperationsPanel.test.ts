import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import type { FleetState } from '../../src/simulation/fleets/types';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState } from '../../src/simulation/types';
import {
  createPveMetaOperationsView,
  validateArenaEntrySelection,
} from '../../src/ui/arenaOperationsPanel';

function createArenaUiState(): { readonly state: GameState; readonly fleet: FleetState } {
  const initial = createInitialGameState('arena-operations-ui');
  const origin = initial.planets.find((planet) => planet.ownerEmpireId === 'player');
  if (origin === undefined) throw new Error('Player origin missing.');
  const fighter = getFactionMechanicalRoles(origin.factionId).ships.fighter;
  const fleet: FleetState = {
    id: 'arena-ui-fleet',
    empireId: 'player',
    originPlanetId: origin.id,
    location: { type: 'planet', planetId: origin.id },
    status: 'stationed',
    ships: { [fighter]: 40 },
    cargo: { metal: 0, crystal: 0, gas: 0 },
    speed: 100,
    cargoCapacity: 1_000,
    formation: 'line',
    targetPriority: 'balanced',
    mission: null,
  };
  return {
    state: {
      ...initial,
      planets: initial.planets.map((planet) =>
        planet.id === origin.id
          ? {
              ...planet,
              economy: {
                ...planet.economy,
                resources: {
                  metal: { ...planet.economy.resources.metal, amount: 50_000 },
                  crystal: { ...planet.economy.resources.crystal, amount: 50_000 },
                  gas: { ...planet.economy.resources.gas, amount: 50_000 },
                },
              },
            }
          : planet,
      ),
      fleets: [...initial.fleets, fleet],
    },
    fleet,
  };
}

describe('PvE meta Operations view', () => {
  it('derives reputation progress and three public challenges without mutation', () => {
    const state = createInitialGameState('arena-operations-view');
    const before = JSON.stringify(state);
    const view = createPveMetaOperationsView(state);
    expect(view.reputation).toMatchObject({
      score: 0,
      tier: 'recruit',
      tierLabel: 'Рекрут',
      nextTier: 'ranger',
      requiredProgress: 100,
      percent: 0,
    });
    expect(view.challenges).toHaveLength(3);
    expect(view.challenges.map((entry) => entry.challenge.difficulty)).toEqual([
      'patrol',
      'assault',
      'elite',
    ]);
    expect(view.cycleRemainingSeconds).toBeGreaterThan(0);
    expect(view.activeEntry).toBeNull();
    expect(JSON.stringify(state)).toBe(before);
  });

  it('exposes eligible fleets and exact command validation', () => {
    const fixture = createArenaUiState();
    const view = createPveMetaOperationsView(fixture.state);
    expect(view.eligibleFleets).toEqual([
      expect.objectContaining({ id: fixture.fleet.id, shipCount: 40 }),
    ]);
    const challenge = view.challenges[0]!.challenge;
    expect(validateArenaEntrySelection(
      fixture.state,
      challenge.id,
      fixture.fleet.id,
    )).toEqual({
      ok: true,
      code: null,
      message: 'Флот и ресурсы готовы к входу.',
    });

    const entered = executeCommand(fixture.state, {
      type: 'ENTER_ARENA_CHALLENGE',
      empireId: 'player',
      challengeId: challenge.id,
      fleetId: fixture.fleet.id,
    });
    expect(entered.ok).toBe(true);
    if (!entered.ok) return;
    const activeView = createPveMetaOperationsView(entered.value);
    expect(activeView.activeEntry).toMatchObject({
      fleetId: fixture.fleet.id,
      challenge: { id: challenge.id },
    });
    expect(validateArenaEntrySelection(
      entered.value,
      activeView.challenges[1]!.challenge.id,
      fixture.fleet.id,
    )).toMatchObject({
      ok: false,
      code: 'ARENA_ENTRY_ACTIVE',
    });
  });

  it('merges Arena results into the reputation ledger without duplicating mission surfaces', () => {
    const initial = createInitialGameState('arena-operations-ledger');
    const state: GameState = {
      ...initial,
      pveMeta: {
        ...initial.pveMeta!,
        reputations: initial.pveMeta!.reputations.map((entry) =>
          entry.empireId === 'player' ? { ...entry, reputation: 120 } : entry,
        ),
        arenaHistory: [
          {
            id: 'arena-result-ui',
            entryId: 'arena-entry-ui',
            challengeId: 'arena-0-0',
            empireId: 'player',
            fleetId: 'fleet-ui',
            difficulty: 'patrol',
            resolvedAt: 100,
            outcome: 'victory',
            attackerInitial: { 'ship.aegis.fighter': 10 },
            enemyInitial: { 'ship.synod.fighter': 5 },
            attackerRemaining: { 'ship.aegis.fighter': 8 },
            enemyRemaining: {},
            rewardGranted: { metal: 1_200, crystal: 600, gas: 200 },
            reputationAward: 10,
          },
        ],
      },
    };
    const view = createPveMetaOperationsView(state);
    expect(view.reputation).toMatchObject({ score: 120, tier: 'ranger' });
    expect(view.arenaHistory).toHaveLength(1);
    expect(view.reputationLedger).toContainEqual(expect.objectContaining({
      source: 'arena',
      amount: 10,
      title: 'Арена: Патруль',
    }));
  });
});
