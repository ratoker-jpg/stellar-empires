import type { BotPersonality, BotProfile } from './profiles';
import type { BotProgressionPhase } from './progressionPhase';

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

export const COMPRESSED_CLOSURE_DEVELOPMENT_PREFERENCE = Object.freeze([
  'production',
  'research',
  'economy',
  'logistics',
] as const satisfies readonly BotCompressedDevelopmentSource[]);

export const COMPRESSED_CLOSURE_OPPORTUNITY_PREFERENCE = Object.freeze([
  'pve',
  'fleet',
] as const satisfies readonly BotCompressedOpportunitySource[]);

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
    compressedOpportunityPreference: COMPRESSED_CLOSURE_OPPORTUNITY_PREFERENCE,
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
    compressedOpportunityPreference: COMPRESSED_CLOSURE_OPPORTUNITY_PREFERENCE,
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
    compressedOpportunityPreference: COMPRESSED_CLOSURE_OPPORTUNITY_PREFERENCE,
    maxAttackRiskPermille: 900,
  }),
};

export function deriveBotStrategyPolicy(
  profile: Pick<BotProfile, 'personality'>,
): BotStrategyPolicy {
  return STRATEGY_POLICY_BY_PERSONALITY[profile.personality];
}

export function deriveCompressedDevelopmentPreference(
  profile: Pick<BotProfile, 'personality'>,
  phase: BotProgressionPhase,
): readonly BotCompressedDevelopmentSource[] {
  return phase === 'first-combat'
    ? deriveBotStrategyPolicy(profile).compressedDevelopmentPreference
    : COMPRESSED_CLOSURE_DEVELOPMENT_PREFERENCE;
}
