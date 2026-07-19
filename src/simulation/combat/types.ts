import type { ResourceCost } from '../economy/types';
import type { DebrisAmount } from './debris';

export type BattleWinner = 'attacker' | 'defender' | 'draw';

export interface BattleSideInput {
  readonly empireId: string;
  readonly units: Readonly<Record<string, number>>;
  readonly weaponBonusPercent: number;
  readonly armorBonusPercent: number;
}

export interface BattleRoundReport {
  readonly round: number;
  readonly attackerDamage: number;
  readonly defenderDamage: number;
  readonly attackerLosses: Readonly<Record<string, number>>;
  readonly defenderLosses: Readonly<Record<string, number>>;
}

export interface BattleReport {
  readonly id: string;
  readonly seed: number;
  readonly resolvedAt: number;
  readonly targetPlanetId: string;
  readonly attackerEmpireId: string;
  readonly defenderEmpireId: string;
  readonly winner: BattleWinner;
  readonly rounds: readonly BattleRoundReport[];
  readonly attackerInitial: Readonly<Record<string, number>>;
  readonly defenderInitial: Readonly<Record<string, number>>;
  readonly attackerRemaining: Readonly<Record<string, number>>;
  readonly defenderRemaining: Readonly<Record<string, number>>;
  readonly debrisCreated?: DebrisAmount;
  readonly plunderedCargo?: ResourceCost;
}

export interface BattleResolution {
  readonly winner: BattleWinner;
  readonly rounds: readonly BattleRoundReport[];
  readonly attackerRemaining: Readonly<Record<string, number>>;
  readonly defenderRemaining: Readonly<Record<string, number>>;
}
