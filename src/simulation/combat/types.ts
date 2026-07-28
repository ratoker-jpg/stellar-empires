import type { ResourceCost } from '../economy/types';
import type { FactionId } from '../planet/types';
import type { SpaceCoordinate } from '../space/coordinates';
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

export interface PlanetDemolitionContributionReport {
  readonly unitId: string;
  readonly factionId: FactionId;
  readonly count: number;
  readonly weaponLevel: number;
  readonly pointsPerShip: number;
  readonly totalPoints: number;
}

export interface PlanetDemolitionBuildingRollReport {
  readonly buildingId: string;
  readonly levelBefore: number;
  readonly levelAfter: number;
  readonly chanceBasisPoints: number;
  readonly rollBasisPoints: number;
  readonly demolished: boolean;
}

export type PlanetDemolitionOutcome =
  | 'applied'
  | 'battle-result-ineligible'
  | 'zero-final-points'
  | 'no-eligible-buildings';

export interface PlanetDemolitionReport {
  readonly outcome: PlanetDemolitionOutcome;
  readonly contributions: readonly PlanetDemolitionContributionReport[];
  readonly defensePopulation: number;
  readonly rawPoints: number;
  readonly defenseReduction: number;
  readonly finalPoints: number;
  readonly baseChanceBasisPoints: number;
  readonly commanderBonusBasisPoints: number;
  readonly finalChanceBasisPoints: number;
  readonly maximumSelectedBuildings: number;
  readonly allEligibleBuildingsSelected: boolean;
  readonly eligibleBuildingCount: number;
  readonly selectedBuildingIds: readonly string[];
  readonly rolls: readonly PlanetDemolitionBuildingRollReport[];
  readonly cancelledQueueItemIds: readonly string[];
}

export interface PlanetDestructionContributionReport {
  readonly unitId: string;
  readonly factionId: FactionId;
  readonly count: number;
  readonly weaponLevel: number;
  readonly chanceBasisPointsPerShip: number;
  readonly totalChanceBasisPoints: number;
}

export type PlanetDestructionBlockedReason =
  | 'NO_SURVIVING_PLANET_DESTROYER'
  | 'BATTLE_RESULT_INELIGIBLE'
  | 'LAST_COLONY_PROTECTED'
  | 'ZERO_FINAL_CHANCE';

export interface PlanetDestructionReport {
  readonly attackerContributions: readonly PlanetDestructionContributionReport[];
  readonly defenderContributions: readonly PlanetDestructionContributionReport[];
  readonly defensePopulation: number;
  readonly rawChanceBasisPoints: number;
  readonly defenseReductionBasisPoints: number;
  readonly defenderPlanetDestroyerReductionBasisPoints: number;
  readonly poliasReductionBasisPoints: number;
  readonly finalChanceBasisPoints: number;
  readonly rollBasisPoints: number;
  readonly blockedReason: PlanetDestructionBlockedReason | null;
  readonly planetDestroyed: boolean;
}

export interface BattleReport {
  readonly id: string;
  readonly seed: number;
  readonly resolvedAt: number;
  readonly targetPlanetId: string;
  readonly targetGalaxyPlanetId?: string;
  readonly targetCoordinate?: SpaceCoordinate;
  readonly attackerEmpireId: string;
  readonly defenderEmpireId: string;
  readonly winner: BattleWinner;
  readonly rounds: readonly BattleRoundReport[];
  readonly attackerInitial: Readonly<Record<string, number>>;
  readonly defenderInitial: Readonly<Record<string, number>>;
  readonly attackerRemaining: Readonly<Record<string, number>>;
  readonly defenderRemaining: Readonly<Record<string, number>>;
  readonly attackerCommanderId?: string | null;
  readonly defenderCommanderId?: string | null;
  readonly commanderRecoveredShips?: {
    readonly attacker: Readonly<Record<string, number>>;
    readonly defender: Readonly<Record<string, number>>;
  };
  readonly defensesRecovered?: Readonly<Record<string, number>>;
  readonly debrisCreated?: DebrisAmount;
  readonly plunderedCargo?: ResourceCost;
  readonly demolition?: PlanetDemolitionReport | undefined;
  readonly destruction?: PlanetDestructionReport | undefined;
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
