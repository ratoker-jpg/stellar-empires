import type { BotPersonality, BotProfile } from './profiles';

export type BotCompressedDevelopmentSource =
  | 'economy'
  | 'research'
  | 'production'
  | 'logistics';

export type BotCompressedOpportunitySource = 'pve' | 'fleet';

export interface BotStrategyPolicy {
  readonly personality: BotPersonality;
  readonly compressedDevelopmentPreference: readonly BotCompressedDevelopmentSource[];
  readonly compressedOpportunityPreference: readonly BotCompressedOpportunitySource[];
  readonly maxAttackRiskPermille: number;
}

const STRATEGY_POLICY_BY_PERSONALITY: Readonly<Record<BotPersonality, BotStrategyPolicy>> = {
  industrial: Object.freeze({
    personality: 'industrial',
    compressedDevelopmentPreference: Object.freeze([
      'economy',
      'research',
      'production',
      'logistics',
    ]),
    compressedOpportunityPreference: Object.freeze(['pve', 'fleet']),
    maxAttackRiskPermille: 700,
  }),
  explorer: Object.freeze({
    personality: 'explorer',
    compressedDevelopmentPreference: Object.freeze([
      'research',
      'economy',
      'production',
      'logistics',
    ]),
    compressedOpportunityPreference: Object.freeze(['fleet', 'pve']),
    maxAttackRiskPermille: 800,
  }),
  aggressive: Object.freeze({
    personality: 'aggressive',
    compressedDevelopmentPreference: Object.freeze([
      'production',
      'research',
      'economy',
      'logistics',
    ]),
    compressedOpportunityPreference: Object.freeze(['pve', 'fleet']),
    maxAttackRiskPermille: 900,
  }),
};

export function deriveBotStrategyPolicy(
  profile: Pick<BotProfile, 'personality'>,
): BotStrategyPolicy {
  return STRATEGY_POLICY_BY_PERSONALITY[profile.personality];
}
