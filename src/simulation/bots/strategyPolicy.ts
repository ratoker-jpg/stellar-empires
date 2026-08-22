import type { BotPersonality, BotProfile } from './profiles';

export type BotCompressedStrategySource =
  | 'economy'
  | 'research'
  | 'production'
  | 'logistics'
  | 'pve'
  | 'fleet';

export interface BotStrategyPolicy {
  readonly personality: BotPersonality;
  readonly compressedSourcePreference: readonly BotCompressedStrategySource[];
  readonly maxAttackRiskPermille: number;
}

const STRATEGY_POLICY_BY_PERSONALITY: Readonly<Record<BotPersonality, BotStrategyPolicy>> = {
  industrial: Object.freeze({
    personality: 'industrial',
    compressedSourcePreference: Object.freeze([
      'economy',
      'research',
      'production',
      'logistics',
      'pve',
      'fleet',
    ]),
    maxAttackRiskPermille: 700,
  }),
  explorer: Object.freeze({
    personality: 'explorer',
    compressedSourcePreference: Object.freeze([
      'pve',
      'fleet',
      'research',
      'economy',
      'production',
      'logistics',
    ]),
    maxAttackRiskPermille: 800,
  }),
  aggressive: Object.freeze({
    personality: 'aggressive',
    compressedSourcePreference: Object.freeze([
      'production',
      'pve',
      'fleet',
      'research',
      'economy',
      'logistics',
    ]),
    maxAttackRiskPermille: 900,
  }),
};

export function deriveBotStrategyPolicy(
  profile: Pick<BotProfile, 'personality'>,
): BotStrategyPolicy {
  return STRATEGY_POLICY_BY_PERSONALITY[profile.personality];
}
