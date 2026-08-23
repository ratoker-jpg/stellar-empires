import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BOT_PROFILES,
  type BotPersonality,
} from '../../src/simulation/bots/profiles';
import { BOT_PROGRESSION_PHASES } from '../../src/simulation/bots/progressionPhase';
import {
  calculateBotAttackRiskPermille,
  COMPRESSED_CLOSURE_DEVELOPMENT_PREFERENCE,
  COMPRESSED_CLOSURE_OPPORTUNITY_PREFERENCE,
  deriveBotStrategyPolicy,
  deriveCompressedDevelopmentPreference,
  resolveBotStrategyPolicy,
  type BotStrategyPolicy,
} from '../../src/simulation/bots/strategyPolicy';

function profileFor(personality: BotPersonality) {
  const profile = DEFAULT_BOT_PROFILES.find(
    (candidate) => candidate.personality === personality,
  );
  if (profile === undefined) throw new Error(`Missing ${personality} bot profile.`);
  return profile;
}

function policyFor(personality: BotPersonality): BotStrategyPolicy {
  return deriveBotStrategyPolicy(profileFor(personality));
}

describe('bot strategy policy', () => {
  it('derives deterministic distinct compressed development preferences from existing personality only', () => {
    const industrial = policyFor('industrial');
    const explorer = policyFor('explorer');
    const aggressive = policyFor('aggressive');

    expect(industrial.compressedDevelopmentPreference).toEqual([
      'economy',
      'research',
      'production',
      'logistics',
    ]);
    expect(explorer.compressedDevelopmentPreference).toEqual([
      'research',
      'economy',
      'production',
      'logistics',
    ]);
    expect(aggressive.compressedDevelopmentPreference).toEqual([
      'production',
      'research',
      'economy',
      'logistics',
    ]);

    expect(new Set([
      industrial.compressedDevelopmentPreference[0],
      explorer.compressedDevelopmentPreference[0],
      aggressive.compressedDevelopmentPreference[0],
    ])).toEqual(new Set(['economy', 'research', 'production']));

    for (const personality of ['industrial', 'explorer', 'aggressive'] as const) {
      const profile = profileFor(personality);
      expect(deriveBotStrategyPolicy(profile)).toBe(deriveBotStrategyPolicy(profile));
      expect(deriveBotStrategyPolicy(profile)).toEqual(policyFor(personality));
    }
  });

  it('limits personality development to first combat and uses closure-safe ordering elsewhere', () => {
    const industrial = profileFor('industrial');
    const explorer = profileFor('explorer');
    const aggressive = profileFor('aggressive');

    expect(deriveCompressedDevelopmentPreference(industrial, 'first-combat')[0]).toBe('economy');
    expect(deriveCompressedDevelopmentPreference(explorer, 'first-combat')[0]).toBe('research');
    expect(deriveCompressedDevelopmentPreference(aggressive, 'first-combat')[0]).toBe('production');

    for (const phase of BOT_PROGRESSION_PHASES.filter((phase) => phase !== 'first-combat')) {
      for (const personality of ['industrial', 'explorer', 'aggressive'] as const) {
        expect(deriveCompressedDevelopmentPreference(profileFor(personality), phase)).toBe(
          COMPRESSED_CLOSURE_DEVELOPMENT_PREFERENCE,
        );
      }
    }
  });

  it('keeps compressed opportunity ordering on the closure-safe baseline for every personality', () => {
    for (const personality of ['industrial', 'explorer', 'aggressive'] as const) {
      expect(policyFor(personality).compressedOpportunityPreference).toEqual(['pve', 'fleet']);
    }
    expect(COMPRESSED_CLOSURE_OPPORTUNITY_PREFERENCE).toEqual(['pve', 'fleet']);
  });

  it('exposes one accepted tactical-risk truth and resolves the actual supplied profile', () => {
    expect(policyFor('industrial').maxAttackRiskPermille).toBe(700);
    expect(policyFor('explorer').maxAttackRiskPermille).toBe(800);
    expect(policyFor('aggressive').maxAttackRiskPermille).toBe(900);

    const aegis = DEFAULT_BOT_PROFILES.find((profile) => profile.empireId === 'aegis-bot');
    if (aegis === undefined) throw new Error('Missing Aegis profile.');
    const aggressiveAegis = { ...aegis, personality: 'aggressive' as const };
    expect(resolveBotStrategyPolicy('aegis-bot', aggressiveAegis)?.maxAttackRiskPermille).toBe(900);
    expect(resolveBotStrategyPolicy('aegis-bot')?.maxAttackRiskPermille).toBe(700);
    expect(resolveBotStrategyPolicy('synod-bot', aggressiveAegis)).toBeNull();
    expect(resolveBotStrategyPolicy('unknown-bot')).toBeNull();
  });

  it('uses deterministic integer permille risk semantics shared by tactical planners', () => {
    expect(calculateBotAttackRiskPermille(248, 300)).toBe(826);
    expect(calculateBotAttackRiskPermille(210, 300)).toBe(700);
    expect(calculateBotAttackRiskPermille(271, 300)).toBe(903);
    expect(calculateBotAttackRiskPermille(10_000, 0)).toBe(9_999);
    expect(calculateBotAttackRiskPermille(-5, 100)).toBe(0);
  });

  it('does not mutate profiles and exposes frozen bounded policy data', () => {
    const profile = profileFor('explorer');
    const before = JSON.stringify(profile);
    const policy = deriveBotStrategyPolicy(profile);

    expect(JSON.stringify(profile)).toBe(before);
    expect(Object.isFrozen(policy)).toBe(true);
    expect(Object.isFrozen(policy.compressedDevelopmentPreference)).toBe(true);
    expect(Object.isFrozen(policy.compressedOpportunityPreference)).toBe(true);
    expect(Object.isFrozen(COMPRESSED_CLOSURE_DEVELOPMENT_PREFERENCE)).toBe(true);
    expect(Object.isFrozen(COMPRESSED_CLOSURE_OPPORTUNITY_PREFERENCE)).toBe(true);
  });
});
