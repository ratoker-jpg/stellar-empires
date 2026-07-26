import { getCompleteShipClass } from '../units/completeShipCatalog';
import { resolveCanonicalUnitId } from '../units/unitAliases';
import type { CompleteShipClass } from '../units/types';

export type WeaponType = 'kinetic' | 'plasma' | 'missile' | 'disruptor';
export type ProtectionType = 'light-armor' | 'heavy-armor' | 'shield-grid' | 'fortified';
export type TargetSize = 'small' | 'medium' | 'large' | 'installation';

export interface UnitCombatProfile {
  readonly weaponType: WeaponType;
  readonly protectionType: ProtectionType;
  readonly targetSize: TargetSize;
}

export interface CombatModifierBreakdown {
  readonly weaponType: WeaponType;
  readonly protectionType: ProtectionType;
  readonly targetSize: TargetSize;
  readonly protectionPermille: number;
  readonly sizePermille: number;
  readonly combinedPermille: number;
}

export const COMBAT_MIN_MODIFIER_PERMILLE = 500;
export const COMBAT_MAX_MODIFIER_PERMILLE = 1_600;

const DEFAULT_PROFILE: UnitCombatProfile = {
  weaponType: 'kinetic',
  protectionType: 'heavy-armor',
  targetSize: 'medium',
};

const COMPLETE_SHIP_PROFILES: Readonly<Record<CompleteShipClass, UnitCombatProfile>> = {
  'small-transport': { weaponType: 'kinetic', protectionType: 'light-armor', targetSize: 'medium' },
  'large-transport': { weaponType: 'kinetic', protectionType: 'heavy-armor', targetSize: 'large' },
  'light-fighter': { weaponType: 'plasma', protectionType: 'light-armor', targetSize: 'small' },
  interceptor: { weaponType: 'disruptor', protectionType: 'light-armor', targetSize: 'small' },
  'support-ship': { weaponType: 'plasma', protectionType: 'shield-grid', targetSize: 'medium' },
  'line-battleship': { weaponType: 'missile', protectionType: 'heavy-armor', targetSize: 'large' },
  'heavy-assault': { weaponType: 'plasma', protectionType: 'heavy-armor', targetSize: 'large' },
  bomber: { weaponType: 'missile', protectionType: 'heavy-armor', targetSize: 'large' },
  'planet-destroyer': { weaponType: 'disruptor', protectionType: 'shield-grid', targetSize: 'large' },
  colonizer: { weaponType: 'kinetic', protectionType: 'heavy-armor', targetSize: 'large' },
  recycler: { weaponType: 'kinetic', protectionType: 'heavy-armor', targetSize: 'medium' },
  'spy-probe': { weaponType: 'kinetic', protectionType: 'light-armor', targetSize: 'small' },
  'energy-satellite': { weaponType: 'kinetic', protectionType: 'shield-grid', targetSize: 'medium' },
};

const DEFENSE_PROFILES: Readonly<Record<string, UnitCombatProfile>> = {
  'defense.aegis.gun-battery': { weaponType: 'kinetic', protectionType: 'fortified', targetSize: 'installation' },
  'defense.aegis.missile-battery': { weaponType: 'missile', protectionType: 'fortified', targetSize: 'installation' },
  'defense.aegis.shield-generator': { weaponType: 'disruptor', protectionType: 'shield-grid', targetSize: 'installation' },
  'defense.aegis.point-defense': { weaponType: 'kinetic', protectionType: 'fortified', targetSize: 'installation' },
  'defense.aegis.fortress-array': { weaponType: 'missile', protectionType: 'fortified', targetSize: 'installation' },
  'defense.synod.lance-node': { weaponType: 'plasma', protectionType: 'shield-grid', targetSize: 'installation' },
  'defense.synod.arc-silo': { weaponType: 'missile', protectionType: 'shield-grid', targetSize: 'installation' },
  'defense.synod.harmonic-screen': { weaponType: 'disruptor', protectionType: 'shield-grid', targetSize: 'installation' },
  'defense.synod.predictive-intercept': { weaponType: 'plasma', protectionType: 'fortified', targetSize: 'installation' },
  'defense.synod.concord-bastion': { weaponType: 'disruptor', protectionType: 'shield-grid', targetSize: 'installation' },
  'defense.veyra.thorn-spire': { weaponType: 'plasma', protectionType: 'light-armor', targetSize: 'installation' },
  'defense.veyra.spore-mortar': { weaponType: 'missile', protectionType: 'light-armor', targetSize: 'installation' },
  'defense.veyra.living-veil': { weaponType: 'plasma', protectionType: 'shield-grid', targetSize: 'installation' },
  'defense.veyra.snapper-node': { weaponType: 'plasma', protectionType: 'fortified', targetSize: 'installation' },
  'defense.veyra.hive-bastion': { weaponType: 'plasma', protectionType: 'fortified', targetSize: 'installation' },
};

const WEAPON_VS_PROTECTION: Readonly<Record<WeaponType, Readonly<Record<ProtectionType, number>>>> = {
  kinetic: {
    'light-armor': 1_250,
    'heavy-armor': 900,
    'shield-grid': 700,
    fortified: 1_000,
  },
  plasma: {
    'light-armor': 1_050,
    'heavy-armor': 1_150,
    'shield-grid': 1_300,
    fortified: 850,
  },
  missile: {
    'light-armor': 750,
    'heavy-armor': 1_200,
    'shield-grid': 900,
    fortified: 1_350,
  },
  disruptor: {
    'light-armor': 900,
    'heavy-armor': 800,
    'shield-grid': 1_500,
    fortified: 950,
  },
};

const WEAPON_VS_SIZE: Readonly<Record<WeaponType, Readonly<Record<TargetSize, number>>>> = {
  kinetic: {
    small: 1_200,
    medium: 1_100,
    large: 900,
    installation: 900,
  },
  plasma: {
    small: 1_100,
    medium: 1_100,
    large: 1_000,
    installation: 900,
  },
  missile: {
    small: 650,
    medium: 950,
    large: 1_300,
    installation: 1_350,
  },
  disruptor: {
    small: 1_000,
    medium: 1_050,
    large: 1_000,
    installation: 1_150,
  },
};

export function getUnitCombatProfile(unitId: string): UnitCombatProfile {
  const canonicalId = resolveCanonicalUnitId(unitId);
  const shipClass = getCompleteShipClass(canonicalId);
  if (shipClass !== undefined) return COMPLETE_SHIP_PROFILES[shipClass];
  return DEFENSE_PROFILES[canonicalId] ?? DEFAULT_PROFILE;
}

export function calculateCombatModifier(
  weaponType: WeaponType,
  protectionType: ProtectionType,
  targetSize: TargetSize,
): CombatModifierBreakdown {
  const protectionPermille = WEAPON_VS_PROTECTION[weaponType][protectionType];
  const sizePermille = WEAPON_VS_SIZE[weaponType][targetSize];
  const raw = Math.floor((protectionPermille * sizePermille) / 1_000);
  return {
    weaponType,
    protectionType,
    targetSize,
    protectionPermille,
    sizePermille,
    combinedPermille: Math.max(
      COMBAT_MIN_MODIFIER_PERMILLE,
      Math.min(COMBAT_MAX_MODIFIER_PERMILLE, raw),
    ),
  };
}
