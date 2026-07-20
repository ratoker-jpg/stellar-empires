import { getUnitDefinition } from '../units/catalog';
import {
  calculateCombatModifier,
  getUnitCombatProfile,
  type WeaponType,
} from './combatProfiles';
import type {
  BattleResolution,
  BattleRoundReport,
  BattleSideInput,
  BattleTargetDamageReport,
  BattleWeaponContributionReport,
  BattleWinner,
} from './types';

const MAX_ROUNDS = 12;

interface WeaponContribution {
  readonly weaponType: WeaponType;
  readonly damage: number;
}

interface DamageApplication {
  readonly remaining: Readonly<Record<string, number>>;
  readonly losses: Readonly<Record<string, number>>;
  readonly damageCarry: Readonly<Record<string, number>>;
  readonly breakdown: readonly BattleTargetDamageReport[];
  readonly totalDamage: number;
  readonly random: number;
}

function nextRandom(seed: number): number {
  let value = seed | 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return value >>> 0;
}

function countUnits(units: Readonly<Record<string, number>>): number {
  return Object.values(units).reduce((total, count) => total + count, 0);
}

function unitDurability(unitId: string, armorBonusPercent: number): number {
  const definition = getUnitDefinition(unitId);
  const base = Math.max(1, (definition?.stats.armor ?? 1) + (definition?.stats.shield ?? 0));
  return Math.max(1, Math.floor((base * (100 + Math.max(0, armorBonusPercent))) / 100));
}

function collectWeaponContributions(
  units: Readonly<Record<string, number>>,
  weaponBonusPercent: number,
): readonly WeaponContribution[] {
  const byWeapon: Partial<Record<WeaponType, number>> = {};
  for (const [unitId, count] of Object.entries(units)) {
    const definition = getUnitDefinition(unitId);
    const baseDamage = (definition?.stats.attack ?? 0) * count;
    if (baseDamage <= 0) continue;
    const profile = getUnitCombatProfile(unitId);
    const modifiedDamage = Math.floor(
      (baseDamage * (100 + Math.max(0, weaponBonusPercent))) / 100,
    );
    byWeapon[profile.weaponType] = (byWeapon[profile.weaponType] ?? 0) + modifiedDamage;
  }
  return Object.entries(byWeapon)
    .map(([weaponType, damage]) => ({ weaponType: weaponType as WeaponType, damage: damage ?? 0 }))
    .filter((entry) => entry.damage > 0)
    .sort((left, right) => left.weaponType.localeCompare(right.weaponType));
}

function allocateByWeight(
  total: number,
  entries: readonly { readonly key: string; readonly weight: number }[],
): Readonly<Record<string, number>> {
  const allocations: Record<string, number> = {};
  let remainingTotal = Math.max(0, total);
  let remainingWeight = entries.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
  for (const [index, entry] of entries.entries()) {
    const weight = Math.max(0, entry.weight);
    const isLast = index === entries.length - 1;
    const allocated = isLast || remainingWeight <= 0
      ? remainingTotal
      : Math.floor((remainingTotal * weight) / remainingWeight);
    allocations[entry.key] = allocated;
    remainingTotal -= allocated;
    remainingWeight -= weight;
  }
  return allocations;
}

function createWeaponBreakdown(
  contributions: readonly WeaponContribution[],
  allocatedBaseDamage: number,
  targetUnitId: string,
): {
  readonly weightedModifierPermille: number;
  readonly reports: readonly BattleWeaponContributionReport[];
} {
  const targetProfile = getUnitCombatProfile(targetUnitId);
  const totalContribution = contributions.reduce((sum, contribution) => sum + contribution.damage, 0);
  if (totalContribution <= 0 || allocatedBaseDamage <= 0) {
    return { weightedModifierPermille: 1_000, reports: [] };
  }
  const allocation = allocateByWeight(
    allocatedBaseDamage,
    contributions.map((contribution) => ({
      key: contribution.weaponType,
      weight: contribution.damage,
    })),
  );
  const reports = contributions.map((contribution): BattleWeaponContributionReport => {
    const modifier = calculateCombatModifier(
      contribution.weaponType,
      targetProfile.protectionType,
      targetProfile.targetSize,
    );
    return {
      weaponType: contribution.weaponType,
      baseDamage: allocation[contribution.weaponType] ?? 0,
      modifierPermille: modifier.combinedPermille,
    };
  });
  const weightedModifierPermille = Math.floor(
    reports.reduce(
      (sum, report) => sum + report.baseDamage * report.modifierPermille,
      0,
    ) / allocatedBaseDamage,
  );
  return { weightedModifierPermille, reports };
}

function applyDamage(
  attackingUnits: Readonly<Record<string, number>>,
  targetUnits: Readonly<Record<string, number>>,
  targetArmorBonusPercent: number,
  weaponBonusPercent: number,
  damageCarry: Readonly<Record<string, number>>,
  seed: number,
): DamageApplication {
  const remaining = { ...targetUnits };
  const losses: Record<string, number> = {};
  const nextCarry: Record<string, number> = {};
  const breakdown: BattleTargetDamageReport[] = [];
  const targetIds = Object.keys(targetUnits).sort();
  const contributions = collectWeaponContributions(attackingUnits, weaponBonusPercent);
  const totalBaseDamage = contributions.reduce((sum, contribution) => sum + contribution.damage, 0);
  if (targetIds.length === 0 || totalBaseDamage <= 0) {
    for (const targetId of targetIds) {
      const carry = damageCarry[targetId] ?? 0;
      if (carry > 0) nextCarry[targetId] = carry;
    }
    return {
      remaining,
      losses,
      damageCarry: nextCarry,
      breakdown,
      totalDamage: 0,
      random: seed,
    };
  }

  const targetEntries = targetIds.map((targetUnitId) => ({
    key: targetUnitId,
    weight: unitDurability(targetUnitId, targetArmorBonusPercent) *
      (targetUnits[targetUnitId] ?? 0),
  }));
  const targetAllocations = allocateByWeight(totalBaseDamage, targetEntries);
  let random = seed;
  let totalDamage = 0;

  for (const targetUnitId of targetIds) {
    const targetCount = targetUnits[targetUnitId] ?? 0;
    if (targetCount <= 0) continue;
    const targetProfile = getUnitCombatProfile(targetUnitId);
    const allocatedBaseDamage = targetAllocations[targetUnitId] ?? 0;
    const weaponBreakdown = createWeaponBreakdown(
      contributions,
      allocatedBaseDamage,
      targetUnitId,
    );
    random = nextRandom(random + targetUnitId.length + targetCount);
    const variancePermille = 900 + (random % 201);
    const effectiveDamage = Math.floor(
      (allocatedBaseDamage * weaponBreakdown.weightedModifierPermille * variancePermille) /
        1_000_000,
    );
    const carriedDamage = damageCarry[targetUnitId] ?? 0;
    const durability = unitDurability(targetUnitId, targetArmorBonusPercent);
    const availableDamage = carriedDamage + effectiveDamage;
    const casualties = Math.min(targetCount, Math.floor(availableDamage / durability));
    const surviving = targetCount - casualties;
    if (casualties > 0) losses[targetUnitId] = casualties;
    if (surviving > 0) {
      remaining[targetUnitId] = surviving;
      const residual = availableDamage - casualties * durability;
      if (residual > 0) nextCarry[targetUnitId] = residual;
    } else {
      delete remaining[targetUnitId];
    }
    totalDamage += effectiveDamage;
    breakdown.push({
      targetUnitId,
      targetCount,
      protectionType: targetProfile.protectionType,
      targetSize: targetProfile.targetSize,
      allocatedBaseDamage,
      weightedModifierPermille: weaponBreakdown.weightedModifierPermille,
      variancePermille,
      effectiveDamage,
      carriedDamage,
      durability,
      losses: casualties,
      weaponContributions: weaponBreakdown.reports,
    });
  }

  return {
    remaining,
    losses,
    damageCarry: nextCarry,
    breakdown,
    totalDamage,
    random,
  };
}

function resolveWinner(
  attacker: Readonly<Record<string, number>>,
  defender: Readonly<Record<string, number>>,
): BattleWinner {
  const attackers = countUnits(attacker);
  const defenders = countUnits(defender);
  if (attackers > 0 && defenders === 0) return 'attacker';
  if (defenders > 0 && attackers === 0) return 'defender';
  return 'draw';
}

export function resolveBattle(
  seed: number,
  attacker: BattleSideInput,
  defender: BattleSideInput,
): BattleResolution {
  let random = seed >>> 0;
  let attackerUnits = { ...attacker.units };
  let defenderUnits = { ...defender.units };
  let attackerDamageCarry: Readonly<Record<string, number>> = {};
  let defenderDamageCarry: Readonly<Record<string, number>> = {};
  const rounds: BattleRoundReport[] = [];

  for (let round = 1; round <= MAX_ROUNDS; round += 1) {
    if (countUnits(attackerUnits) === 0 || countUnits(defenderUnits) === 0) break;

    random = nextRandom(random + round);
    const attackerStrike = applyDamage(
      attackerUnits,
      defenderUnits,
      defender.armorBonusPercent,
      attacker.weaponBonusPercent,
      defenderDamageCarry,
      random,
    );
    random = attackerStrike.random;
    const defenderStrike = applyDamage(
      defenderUnits,
      attackerUnits,
      attacker.armorBonusPercent,
      defender.weaponBonusPercent,
      attackerDamageCarry,
      nextRandom(random),
    );
    random = defenderStrike.random;
    attackerUnits = { ...defenderStrike.remaining };
    defenderUnits = { ...attackerStrike.remaining };
    attackerDamageCarry = defenderStrike.damageCarry;
    defenderDamageCarry = attackerStrike.damageCarry;
    rounds.push({
      round,
      attackerDamage: attackerStrike.totalDamage,
      defenderDamage: defenderStrike.totalDamage,
      attackerLosses: defenderStrike.losses,
      defenderLosses: attackerStrike.losses,
      attackerTargetBreakdown: attackerStrike.breakdown,
      defenderTargetBreakdown: defenderStrike.breakdown,
    });
  }

  return {
    winner: resolveWinner(attackerUnits, defenderUnits),
    rounds,
    attackerRemaining: attackerUnits,
    defenderRemaining: defenderUnits,
  };
}
