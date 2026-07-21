import type { ResourceCost } from '../economy/types';
import type {
  ProtectionType,
  TargetSize,
  WeaponType,
} from './combatProfiles';
import type { DebrisAmount } from './debris';
import type { FleetFormation, FleetTargetPriority } from './fleetDoctrine';

export type BattleWinner = 'attacker' | 'defender' | 'draw';
export type BattleMode = 'pve' | 'pvp';

export interface BattleSideInput {
  readonly empireId: string;
  readonly units: Readonly<Record<string, number>>;
  readonly weaponBonusPercent: number;
  readonly armorBonusPercent: number;
  readonly unitWeaponBonusPercent?: Readonly<Record<string, number>>;
  readonly unitArmorBonusPercent?: Readonly<Record<string, number>>;
  readonly formation?: FleetFormation;
  readonly targetPriority?: FleetTargetPriority;
}

export interface BattleWeaponContributionReport {
  readonly weaponType: WeaponType;
  readonly baseDamage: number;
  readonly modifierPermille: number;
}

export interface BattleTargetDamageReport {
  readonly targetUnitId: string;
  readonly targetCount: number;
  readonly protectionType: ProtectionType;
  readonly targetSize: TargetSize;
  readonly allocatedBaseDamage: number;
  readonly weightedModifierPermille: number;
  readonly variancePermille: number;
  readonly effectiveDamage: number;
  readonly carriedDamage: number;
  readonly durability: number;
  readonly losses: number;
  readonly weaponContributions: readonly BattleWeaponContributionReport[];
}

export interface BattleRoundReport {
  readonly round: number;
  readonly attackerDamage: number;
  readonly defenderDamage: number;
  readonly attackerLosses: Readonly<Record<string, number>>;
  readonly defenderLosses: Readonly<Record<string, number>>;
  readonly attackerTargetBreakdown: readonly BattleTargetDamageReport[];
  readonly defenderTargetBreakdown: readonly BattleTargetDamageReport[];
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
  readonly defensesRecovered?: Readonly<Record<string, number>>;
  readonly debrisCreated?: DebrisAmount;
  readonly plunderedCargo?: ResourceCost;
  readonly mode?: BattleMode;
  readonly threatMultiplierPermille?: number;
  readonly rewardMultiplierPermille?: number;
  readonly attackerFormation?: FleetFormation;
  readonly attackerTargetPriority?: FleetTargetPriority;
  readonly defenderFormation?: FleetFormation;
  readonly defenderTargetPriority?: FleetTargetPriority;
}

export interface BattleResolution {
  readonly winner: BattleWinner;
  readonly rounds: readonly BattleRoundReport[];
  readonly attackerRemaining: Readonly<Record<string, number>>;
  readonly defenderRemaining: Readonly<Record<string, number>>;
}
