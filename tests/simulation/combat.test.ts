import { describe, expect, it } from 'vitest';
import { resolveBattle } from '../../src/simulation/combat/resolveBattle';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeGameCommand } from '../../src/simulation/executeGameCommand';
import { estimateFlight } from '../../src/simulation/fleets/flightCalculations';
import type { GameState } from '../../src/simulation/types';

const ATTACKER = {
  empireId: 'player',
  units: { 'ship.aegis.fighter': 8, 'ship.aegis.frigate': 2 },
  weaponBonusPercent: 0,
  armorBonusPercent: 0,
} as const;

const DEFENDER = {
  empireId: 'aegis-bot',
  units: {
    'ship.aegis.fighter': 5,
    'defense.aegis.gun-battery': 4,
  },
  weaponBonusPercent: 0,
  armorBonusPercent: 0,
} as const;

function prepareAttackState(seed: string): GameState {
  const state = createInitialGameState(seed);
  const origin = state.planets.find((planet) => planet.ownerEmpireId === 'player');
  const target = state.planets.find((planet) => planet.ownerEmpireId !== 'player');
  if (origin === undefined || target === undefined) throw new Error('Combat test planets missing.');

  return {
    ...state,
    planets: state.planets.map((planet) => {
      if (planet.id === origin.id) {
        return {
          ...planet,
          inventory: {
            ...planet.inventory,
            ships: {
              'ship.aegis.fighter': 12,
              'ship.aegis.frigate': 4,
            },
          },
          economy: {
            ...planet.economy,
            resources: {
              ...planet.economy.resources,
              gas: {
                ...planet.economy.resources.gas,
                amount: 100_000,
                capacity: 100_000,
              },
            },
          },
        };
      }
      if (planet.id === target.id) {
        return {
          ...planet,
          inventory: {
            ...planet.inventory,
            defenses: { 'defense.aegis.gun-battery': 3 },
          },
        };
      }
      return planet;
    }),
    fleets: [
      {
        id: 'defender-fleet',
        empireId: target.ownerEmpireId,
        originPlanetId: target.id,
        location: { type: 'planet', planetId: target.id },
        status: 'stationed',
        ships: { 'ship.aegis.fighter': 3 },
        cargo: { metal: 0, crystal: 0, gas: 0 },
        speed: 13,
        cargoCapacity: 90,
        mission: null,
      },
    ],
  };
}

function launchAttack(state: GameState): GameState {
  const origin = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
  const created = executeGameCommand(state, {
    type: 'CREATE_FLEET',
    empireId: 'player',
    planetId: origin.id,
    ships: {
      'ship.aegis.fighter': 10,
      'ship.aegis.frigate': 3,
    },
    cargo: { metal: 0, crystal: 0, gas: 0 },
  });
  if (!created.ok) throw new Error(created.code);

  const target = created.value.planets.find(
    (planet) => planet.ownerEmpireId !== 'player',
  )!;
  const attacker = created.value.fleets.find(
    (fleet) => fleet.empireId === 'player',
  )!;
  const estimate = estimateFlight(
    created.value.galaxy,
    created.value.planets,
    attacker,
    target.id,
  );
  const sent = executeGameCommand(created.value, {
    type: 'SEND_FLEET',
    empireId: 'player',
    fleetId: attacker.id,
    targetPlanetId: target.id,
    mission: 'attack',
  });
  if (!sent.ok) throw new Error(sent.code);
  const resolved = executeGameCommand(sent.value, {
    type: 'ADVANCE_TIME',
    seconds: estimate.durationSeconds,
  });
  if (!resolved.ok) throw new Error(resolved.code);
  return resolved.value;
}

describe('deterministic combat', () => {
  it('returns the exact same resolution for the same seed and inputs', () => {
    const first = resolveBattle(42, ATTACKER, DEFENDER);
    const second = resolveBattle(42, ATTACKER, DEFENDER);
    expect(second).toEqual(first);
    expect(first.rounds.length).toBeGreaterThan(0);
  });

  it('applies technology modifiers to combat outcomes', () => {
    const baseline = resolveBattle(71, ATTACKER, DEFENDER);
    const boosted = resolveBattle(
      71,
      { ...ATTACKER, weaponBonusPercent: 100, armorBonusPercent: 50 },
      DEFENDER,
    );
    const baselineDefenders = Object.values(baseline.defenderRemaining).reduce(
      (total, count) => total + count,
      0,
    );
    const boostedDefenders = Object.values(boosted.defenderRemaining).reduce(
      (total, count) => total + count,
      0,
    );
    expect(boostedDefenders).toBeLessThanOrEqual(baselineDefenders);
  });

  it('resolves an attack mission and writes a battle report to the event log', () => {
    const final = launchAttack(prepareAttackState('attack-mission'));
    const reportEntry = final.eventLog.find(
      (entry) => entry.event.payload.type === 'BATTLE_REPORT',
    );
    expect(reportEntry).toBeDefined();
    if (reportEntry?.event.payload.type !== 'BATTLE_REPORT') return;

    const report = reportEntry.event.payload.report;
    expect(report.targetPlanetId).toBeTruthy();
    expect(report.rounds.length).toBeGreaterThan(0);
    expect(report.attackerInitial).toEqual({
      'ship.aegis.fighter': 10,
      'ship.aegis.frigate': 3,
    });
    expect(report.defenderInitial).toEqual({
      'defense.aegis.gun-battery': 3,
      'ship.aegis.fighter': 3,
    });
    expect(final.pendingEvents.some((event) => event.payload.type === 'BATTLE_REPORT')).toBe(false);
  });

  it('replays an identical attack into an identical battle report', () => {
    const first = launchAttack(prepareAttackState('replay-combat'));
    const second = launchAttack(prepareAttackState('replay-combat'));
    const firstReport = first.eventLog.find(
      (entry) => entry.event.payload.type === 'BATTLE_REPORT',
    )?.event.payload;
    const secondReport = second.eventLog.find(
      (entry) => entry.event.payload.type === 'BATTLE_REPORT',
    )?.event.payload;
    expect(secondReport).toEqual(firstReport);
  });

  it('rejects attacks against an owned planet', () => {
    const state = prepareAttackState('friendly-fire');
    const origin = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    const target = state.planets.find((planet) => planet.id !== origin.id)!;
    const ownedState = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.id === target.id
          ? { ...planet, ownerEmpireId: 'player', factionId: 'aegis' as const }
          : planet,
      ),
    };
    const created = executeGameCommand(ownedState, {
      type: 'CREATE_FLEET',
      empireId: 'player',
      planetId: origin.id,
      ships: { 'ship.aegis.fighter': 1 },
      cargo: { metal: 0, crystal: 0, gas: 0 },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(
      executeGameCommand(created.value, {
        type: 'SEND_FLEET',
        empireId: 'player',
        fleetId: created.value.fleets.find((fleet) => fleet.empireId === 'player')!.id,
        targetPlanetId: target.id,
        mission: 'attack',
      }),
    ).toMatchObject({ ok: false, code: 'ATTACK_TARGET_OWNED' });
  });
});
