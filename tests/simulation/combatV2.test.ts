import { describe, expect, it } from 'vitest';
import {
  COMBAT_MAX_MODIFIER_PERMILLE,
  COMBAT_MIN_MODIFIER_PERMILLE,
  calculateCombatModifier,
} from '../../src/simulation/combat/combatProfiles';
import { resolveBattle } from '../../src/simulation/combat/resolveBattle';

function totalUnits(units: Readonly<Record<string, number>>): number {
  return Object.values(units).reduce((total, count) => total + count, 0);
}

describe('combat engine v2', () => {
  it('applies explicit weapon, protection and target-size counters', () => {
    const missileFortification = calculateCombatModifier(
      'missile',
      'fortified',
      'installation',
    );
    const kineticFortification = calculateCombatModifier(
      'kinetic',
      'fortified',
      'installation',
    );
    const disruptorShield = calculateCombatModifier(
      'disruptor',
      'shield-grid',
      'installation',
    );
    const missileShield = calculateCombatModifier(
      'missile',
      'shield-grid',
      'installation',
    );
    const kineticSmall = calculateCombatModifier(
      'kinetic',
      'light-armor',
      'small',
    );
    const missileSmall = calculateCombatModifier(
      'missile',
      'light-armor',
      'small',
    );

    expect(missileFortification.combinedPermille).toBeGreaterThan(
      kineticFortification.combinedPermille,
    );
    expect(disruptorShield.combinedPermille).toBeGreaterThan(
      missileShield.combinedPermille,
    );
    expect(kineticSmall.combinedPermille).toBeGreaterThan(
      missileSmall.combinedPermille,
    );
    for (const modifier of [
      missileFortification,
      kineticFortification,
      disruptorShield,
      missileShield,
      kineticSmall,
      missileSmall,
    ]) {
      expect(modifier.combinedPermille).toBeGreaterThanOrEqual(
        COMBAT_MIN_MODIFIER_PERMILLE,
      );
      expect(modifier.combinedPermille).toBeLessThanOrEqual(
        COMBAT_MAX_MODIFIER_PERMILLE,
      );
    }
  });

  it('records a reproducible target-level damage explanation', () => {
    const result = resolveBattle(
      8_421,
      {
        empireId: 'player',
        units: {
          'ship.aegis.fighter': 6,
          'ship.aegis.frigate': 3,
        },
        weaponBonusPercent: 0,
        armorBonusPercent: 0,
      },
      {
        empireId: 'aegis-bot',
        units: {
          'defense.aegis.gun-battery': 4,
          'defense.aegis.shield-generator': 2,
        },
        weaponBonusPercent: 0,
        armorBonusPercent: 0,
      },
    );
    const replay = resolveBattle(
      8_421,
      {
        empireId: 'player',
        units: {
          'ship.aegis.fighter': 6,
          'ship.aegis.frigate': 3,
        },
        weaponBonusPercent: 0,
        armorBonusPercent: 0,
      },
      {
        empireId: 'aegis-bot',
        units: {
          'defense.aegis.gun-battery': 4,
          'defense.aegis.shield-generator': 2,
        },
        weaponBonusPercent: 0,
        armorBonusPercent: 0,
      },
    );

    expect(replay).toEqual(result);
    const firstRound = result.rounds[0];
    expect(firstRound).toBeDefined();
    const target = firstRound?.attackerTargetBreakdown.find(
      (entry) => entry.targetUnitId === 'defense.aegis.shield-generator',
    );
    expect(target).toBeDefined();
    if (target === undefined) return;
    expect(target.protectionType).toBe('shield-grid');
    expect(target.targetSize).toBe('installation');
    expect(target.weaponContributions.map((entry) => entry.weaponType).sort()).toEqual([
      'missile',
      'plasma',
    ]);
    expect(target.effectiveDamage).toBe(
      Math.floor(
        (target.allocatedBaseDamage *
          target.weightedModifierPermille *
          target.variancePermille) /
          1_000_000,
      ),
    );
  });

  it('carries partial damage between rounds instead of discarding it', () => {
    const result = resolveBattle(
      17,
      {
        empireId: 'player',
        units: { 'ship.aegis.fighter': 1 },
        weaponBonusPercent: 0,
        armorBonusPercent: 0,
      },
      {
        empireId: 'aegis-bot',
        units: { 'ship.aegis.colony': 1 },
        weaponBonusPercent: 0,
        armorBonusPercent: 0,
      },
    );

    expect(result.rounds.length).toBeGreaterThan(1);
    expect(
      result.rounds.some((round) =>
        round.attackerTargetBreakdown.some((entry) => entry.carriedDamage > 0),
      ),
    ).toBe(true);
    expect(totalUnits(result.defenderRemaining)).toBe(0);
    expect(result.winner).toBe('attacker');
  });

  it('keeps research bonuses effective on top of the counter matrix', () => {
    const attacker = {
      empireId: 'player',
      units: { 'ship.aegis.frigate': 5 },
      weaponBonusPercent: 0,
      armorBonusPercent: 0,
    } as const;
    const defender = {
      empireId: 'aegis-bot',
      units: { 'defense.aegis.gun-battery': 10 },
      weaponBonusPercent: 0,
      armorBonusPercent: 0,
    } as const;
    const baseline = resolveBattle(220, attacker, defender);
    const boosted = resolveBattle(
      220,
      { ...attacker, weaponBonusPercent: 50 },
      defender,
    );
    expect(totalUnits(boosted.defenderRemaining)).toBeLessThanOrEqual(
      totalUnits(baseline.defenderRemaining),
    );
  });
});
