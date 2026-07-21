import { getUnitCombatProfile, type TargetSize } from './combatProfiles';

export type FleetFormation = 'line' | 'screen' | 'wedge';
export type FleetTargetPriority = 'balanced' | 'interceptors' | 'capitals' | 'installations';

export interface FormationDefinition {
  readonly id: FleetFormation;
  readonly name: string;
  readonly description: string;
  readonly weaponBonusPercent: number;
  readonly armorBonusPercent: number;
}

export interface ClassSkillDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly unitId: string;
  readonly formation: FleetFormation;
  readonly weaponBonusPercent: number;
  readonly armorBonusPercent: number;
}

export const FLEET_FORMATIONS: Readonly<Record<FleetFormation, FormationDefinition>> = {
  line: {
    id: 'line',
    name: 'Линейный строй',
    description: 'Стабильное построение без общего штрафа. Фрегаты формируют защитную связку.',
    weaponBonusPercent: 0,
    armorBonusPercent: 0,
  },
  screen: {
    id: 'screen',
    name: 'Защитный экран',
    description: 'Корабли рассеивают удар: +12% защита, −5% атака. Разведчики получают уклонение.',
    weaponBonusPercent: -5,
    armorBonusPercent: 12,
  },
  wedge: {
    id: 'wedge',
    name: 'Ударный клин',
    description: 'Концентрированный прорыв: +12% атака, −5% защита. Истребители усиливают натиск.',
    weaponBonusPercent: 12,
    armorBonusPercent: -5,
  },
};

export const CLASS_SKILLS: readonly ClassSkillDefinition[] = [
  {
    id: 'ghost-screen',
    name: 'Призрачный экран',
    description: 'Разведчики получают +18% защиты в защитном экране.',
    unitId: 'ship.aegis.scout',
    formation: 'screen',
    weaponBonusPercent: 0,
    armorBonusPercent: 18,
  },
  {
    id: 'spear-swarm',
    name: 'Рой копий',
    description: 'Истребители получают +15% атаки в ударном клине.',
    unitId: 'ship.aegis.fighter',
    formation: 'wedge',
    weaponBonusPercent: 15,
    armorBonusPercent: 0,
  },
  {
    id: 'bulwark-link',
    name: 'Связка бастионов',
    description: 'Фрегаты получают +8% защиты в линейном строю.',
    unitId: 'ship.aegis.frigate',
    formation: 'line',
    weaponBonusPercent: 0,
    armorBonusPercent: 8,
  },
];

const TARGET_PRIORITY_WEIGHTS: Readonly<
  Record<FleetTargetPriority, Readonly<Record<TargetSize, number>>>
> = {
  balanced: { small: 1_000, medium: 1_000, large: 1_000, installation: 1_000 },
  interceptors: { small: 1_700, medium: 900, large: 650, installation: 500 },
  capitals: { small: 650, medium: 1_050, large: 1_700, installation: 1_000 },
  installations: { small: 500, medium: 700, large: 1_150, installation: 1_900 },
};

export function isFleetFormation(value: unknown): value is FleetFormation {
  return value === 'line' || value === 'screen' || value === 'wedge';
}

export function isFleetTargetPriority(value: unknown): value is FleetTargetPriority {
  return (
    value === 'balanced' ||
    value === 'interceptors' ||
    value === 'capitals' ||
    value === 'installations'
  );
}

export function getTargetPriorityWeightPermille(
  priority: FleetTargetPriority,
  targetUnitId: string,
): number {
  return TARGET_PRIORITY_WEIGHTS[priority][getUnitCombatProfile(targetUnitId).targetSize];
}

export function getClassSkillBonusMaps(
  units: Readonly<Record<string, number>>,
  formation: FleetFormation,
): {
  readonly weapon: Readonly<Record<string, number>>;
  readonly armor: Readonly<Record<string, number>>;
} {
  const weapon: Record<string, number> = {};
  const armor: Record<string, number> = {};
  for (const skill of CLASS_SKILLS) {
    if (skill.formation !== formation || (units[skill.unitId] ?? 0) <= 0) continue;
    if (skill.weaponBonusPercent !== 0) weapon[skill.unitId] = skill.weaponBonusPercent;
    if (skill.armorBonusPercent !== 0) armor[skill.unitId] = skill.armorBonusPercent;
  }
  return { weapon, armor };
}
