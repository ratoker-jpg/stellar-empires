import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BOT_PROFILES,
  type BotPersonality,
} from '../../src/simulation/bots/profiles';
import { BOT_PROGRESSION_PHASES } from '../../src/simulation/bots/progressionPhase';
import {
  COMPRESSED_CLOSURE_DEVELOPMENT_PREFERENCE,
  deriveBotStrategyPolicy,
  deriveCompressedDevelopmentPreference,
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
  it('derives deterministic distinct compressed preferences from existing personality only', () => {
    const industrial = policyFor('industrial');
    const explorer = policyFor('explorer');
    const aggressive = policyFor('aggressive');

    expect(industrial.compressedDevelopmentPreference).toEqual([
      'economy',
      'research',
      'production',
      'logistics',
    ]);
    expect(industrial.compressedOpportunityPreference).toEqual(['pve', 'fleet']);

    expect(explorer.compressedDevelopmentPreference).toEqual([
      'research',
      'economy',
      'production',
      'logistics',
    ]);
    expect(explorer.compressedOpportunityPreference).toEqual(['fleet', 'pve']);

    expect(aggressive.compressedDevelopmentPreference).toEqual([
      'production',
      'research',
      'economy',
      'logistics',
    ]);
    expect(aggressive.compressedOpportunityPreference).toEqual(['pve', 'fleet']);

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

  it('uses the evidence-bounded personality window and closure-safe ordering afterwards', () => {
    const industrial = profileFor('industrial');
    const explorer = profileFor('explorer');
    const aggressive = profileFor('aggressive');

    for (const phase of ['foundation', 'reconnaissance', 'first-combat'] as const) {
      expect(deriveCompressedDevelopmentPreference(industrial, phase)[0]).toBe('economy');
      expect(deriveCompressedDevelopmentPreference(explorer, phase)[0]).toBe('research');
      expect(deriveCompressedDevelopmentPreference(aggressive, phase)[0]).toBe('production');
    }

    expect(deriveCompressedDevelopmentPreference(industrial, 'colonization')).toBe(
      COMPRESSED_CLOSURE_DEVELOPMENT_PREFERENCE,
    );
    expect(deriveCompressedDevelopmentPreference(explorer, 'colonization')[0]).toBe('research');
    expect(deriveCompressedDevelopmentPreference(aggressive, 'colonization')).toBe(
      COMPRESSED_CLOSURE_DEVELOPMENT_PREFERENCE,
    );

    for (const phase of BOT_PROGRESSION_PHASES.slice(4)) {
      for (const personality of ['industrial', 'explorer', 'aggressive'] as const) {
        expect(deriveCompressedDevelopmentPreference(profileFor(personality), phase)).toBe(
          COMPRESSED_CLOSURE_DEVELOPMENT_PREFERENCE,
        );
      }
    }
  });

  it('records the accepted future tactical-risk truth without wiring planner behavior', () => {
    expect(policyFor('industrial').maxAttackRiskPermille).toBe(700);
    expect(policyFor('explorer').maxAttackRiskPermille).toBe(800);
    expect(policyFor('aggressive').maxAttackRiskPermille).toBe(900);
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
  });
});
