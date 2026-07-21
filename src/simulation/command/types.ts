export type CommandDoctrineId = 'vanguard' | 'sentinel' | 'adaptive';

export interface EmpireCommandState {
  readonly empireId: string;
  readonly doctrineId: CommandDoctrineId;
  readonly experience: number;
  readonly level: number;
  readonly flagshipFleetId: string | null;
}

export interface CommandCombatEffects {
  readonly weaponBonusPercent: number;
  readonly armorBonusPercent: number;
  readonly experiencePermille: number;
  readonly isFlagship: boolean;
}
