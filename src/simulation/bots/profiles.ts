export type BotDifficulty = 'easy' | 'normal' | 'hard';
export type BotPersonality = 'industrial' | 'explorer' | 'aggressive';

export interface BotProfile {
  readonly id: string;
  readonly empireId: string;
  readonly personality: BotPersonality;
  readonly difficulty: BotDifficulty;
  readonly decisionIntervalSeconds: number;
  readonly maxCommandsPerDecision: number;
}

export const DEFAULT_BOT_PROFILES: readonly BotProfile[] = [
  {
    id: 'profile.aegis-industrial',
    empireId: 'aegis-bot',
    personality: 'industrial',
    difficulty: 'normal',
    decisionIntervalSeconds: 600,
    maxCommandsPerDecision: 2,
  },
  {
    id: 'profile.synod-explorer',
    empireId: 'synod-bot',
    personality: 'explorer',
    difficulty: 'hard',
    decisionIntervalSeconds: 300,
    maxCommandsPerDecision: 3,
  },
  {
    id: 'profile.veyra-aggressive',
    empireId: 'veyra-bot',
    personality: 'aggressive',
    difficulty: 'normal',
    decisionIntervalSeconds: 450,
    maxCommandsPerDecision: 2,
  },
] as const;

export function getBotProfile(empireId: string): BotProfile | undefined {
  return DEFAULT_BOT_PROFILES.find((profile) => profile.empireId === empireId);
}
