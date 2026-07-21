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

export const UNIT_COMBAT_PROFILES: Readonly<Record<string, UnitCombatProfile>> = {
  'ship.aegis.scout': {
    weaponType: 'kinetic',
    protectionType: 'light-armor',
    targetSize: 'small',
  },
  'ship.aegis.cargo': {
    weaponType: 'kinetic',
    protectionType: 'heavy-armor',
    targetSize: 'medium',
  },
  'ship.aegis.fighter': {
    weaponType: 'plasma',
    protectionType: 'light-armor',
    targetSize: 'small',
  },
  'ship.aegis.frigate': {
    weaponType: 'missile',
    protectionType: 'heavy-armor',
    targetSize: 'large',
  },
  'ship.aegis.colony': {
    weaponType: 'kinetic',
    protectionType: 'heavy-armor',
    targetSize: 'large',
  },
  'ship.aegis.recycler': {
    weaponType: 'kinetic',
    protectionType: 'heavy-armor',
    targetSize: 'medium',
  },
  'ship.aegis.corvette': { weaponType: 'plasma', protectionType: 'light-armor', targetSize: 'small' },
  'ship.aegis.cruiser': { weaponType: 'missile', protectionType: 'heavy-armor', targetSize: 'large' },
  'ship.aegis.carrier': { weaponType: 'kinetic', protectionType: 'shield-grid', targetSize: 'large' },
  'ship.aegis.dreadnought': { weaponType: 'disruptor', protectionType: 'shield-grid', targetSize: 'large' },
  'defense.aegis.point-defense': { weaponType: 'kinetic', protectionType: 'fortified', targetSize: 'installation' },
  'defense.aegis.fortress-array': { weaponType: 'missile', protectionType: 'fortified', targetSize: 'installation' },
  'defense.aegis.gun-battery': {
    weaponType: 'kinetic',
    protectionType: 'fortified',
    targetSize: 'installation',
  },
  'defense.aegis.missile-battery': {
    weaponType: 'missile',
    protectionType: 'fortified',
    targetSize: 'installation',
  },
  'defense.aegis.shield-generator': {
    weaponType: 'disruptor',
    protectionType: 'shield-grid',
    targetSize: 'installation',
  },
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
  return UNIT_COMBAT_PROFILES[unitId] ?? DEFAULT_PROFILE;
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
