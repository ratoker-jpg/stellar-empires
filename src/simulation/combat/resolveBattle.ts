import { getUnitDefinition } from '../units/catalog';
import type {
  BattleResolution,
  BattleRoundReport,
  BattleSideInput,
  BattleWinner,
} from './types';

const MAX_ROUNDS = 12;

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

function totalAttack(side: BattleSideInput): number {
  const base = Object.entries(side.units).reduce((total, [unitId, count]) => {
    const definition = getUnitDefinition(unitId);
    return total + (definition?.stats.attack ?? 0) * count;
  }, 0);
  return Math.floor((base * (100 + Math.max(0, side.weaponBonusPercent))) / 100);
}

function unitDurability(unitId: string, armorBonusPercent: number): number {
  const definition = getUnitDefinition(unitId);
  const base = Math.max(1, (definition?.stats.armor ?? 1) + (definition?.stats.shield ?? 0));
  return Math.max(1, Math.floor((base * (100 + Math.max(0, armorBonusPercent))) / 100));
}

function applyCasualties(
  units: Readonly<Record<string, number>>,
  damage: number,
  armorBonusPercent: number,
  seed: number,
): {
  readonly remaining: Readonly<Record<string, number>>;
  readonly losses: Readonly<Record<string, number>>;
} {
  const remaining = { ...units };
  const losses: Record<string, number> = {};
  const unitIds = Object.keys(remaining).sort();
  if (unitIds.length === 0 || damage <= 0) return { remaining, losses };

  const totalDurability = unitIds.reduce(
    (total, unitId) =>
      total + unitDurability(unitId, armorBonusPercent) * (remaining[unitId] ?? 0),
    0,
  );
  const totalCount = countUnits(remaining);
  const averageDurability = Math.max(1, Math.floor(totalDurability / Math.max(1, totalCount)));
  let casualties = Math.min(totalCount, Math.floor(damage / averageDurability));
  if (casualties === 0 && damage * 2 >= averageDurability) casualties = 1;

  let index = seed % unitIds.length;
  while (casualties > 0 && countUnits(remaining) > 0) {
    const unitId = unitIds[index % unitIds.length]!;
    const available = remaining[unitId] ?? 0;
    if (available > 0) {
      remaining[unitId] = available - 1;
      losses[unitId] = (losses[unitId] ?? 0) + 1;
      casualties -= 1;
      if (remaining[unitId] === 0) delete remaining[unitId];
    }
    index += 1;
  }

  return { remaining, losses };
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
  const rounds: BattleRoundReport[] = [];

  for (let round = 1; round <= MAX_ROUNDS; round += 1) {
    if (countUnits(attackerUnits) === 0 || countUnits(defenderUnits) === 0) break;

    random = nextRandom(random + round);
    const attackerVariance = 90 + (random % 21);
    random = nextRandom(random);
    const defenderVariance = 90 + (random % 21);
    const attackerDamage = Math.floor(
      (totalAttack({ ...attacker, units: attackerUnits }) * attackerVariance) / 100,
    );
    const defenderDamage = Math.floor(
      (totalAttack({ ...defender, units: defenderUnits }) * defenderVariance) / 100,
    );

    const defenderResult = applyCasualties(
      defenderUnits,
      attackerDamage,
      defender.armorBonusPercent,
      random,
    );
    random = nextRandom(random);
    const attackerResult = applyCasualties(
      attackerUnits,
      defenderDamage,
      attacker.armorBonusPercent,
      random,
    );
    attackerUnits = { ...attackerResult.remaining };
    defenderUnits = { ...defenderResult.remaining };
    rounds.push({
      round,
      attackerDamage,
      defenderDamage,
      attackerLosses: attackerResult.losses,
      defenderLosses: defenderResult.losses,
    });
  }

  return {
    winner: resolveWinner(attackerUnits, defenderUnits),
    rounds,
    attackerRemaining: attackerUnits,
    defenderRemaining: defenderUnits,
  };
}
