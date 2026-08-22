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

function freezePolicy(policy: BotStrategyPolicy): BotStrategyPolicy {
  return Object.freeze({
    ...policy,
    compressedDevelopmentPreference: Object.freeze([
      ...policy.compressedDevelopmentPreference,
    ]),
    compressedOpportunityPreference: Object.freeze([
      ...policy.compressedOpportunityPreference,
    ]),
  });
}

const STRATEGY_POLICY_BY_PERSONALITY: Readonly<Record<BotPersonality, BotStrategyPolicy>> = {
  industrial: freezePolicy({
    personality: 'industrial',
    compressedDevelopmentPreference: [
      'economy',
      'research',
      'production',
      'logistics',
    ],
    compressedOpportunityPreference: ['pve', 'fleet'],
    maxAttackRiskPermille: 700,
  }),
  explorer: freezePolicy({
    personality: 'explorer',
    compressedDevelopmentPreference: [
      'research',
      'economy',
      'production',
      'logistics',
    ],
    compressedOpportunityPreference: ['fleet', 'pve'],
    maxAttackRiskPermille: 800,
  }),
  aggressive: freezePolicy({
    personality: 'aggressive',
    compressedDevelopmentPreference: [
      'production',
      'research',
      'economy',
      'logistics',
    ],
    compressedOpportunityPreference: ['pve', 'fleet'],
    maxAttackRiskPermille: 900,
  }),
};

export function deriveBotStrategyPolicy(
  profile: Pick<BotProfile, 'personality'>,
): BotStrategyPolicy {
  return STRATEGY_POLICY_BY_PERSONALITY[profile.personality];
}
