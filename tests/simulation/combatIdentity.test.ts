import { describe, expect, it } from 'vitest';
import { stableFleetIdentityContribution } from '../../src/simulation/combat/combatIdentity';

describe('stable combat fleet identity', () => {
  it('returns the same unsigned 32-bit contribution for the same fleet id', () => {
    const first = stableFleetIdentityContribution('fleet-stable-alpha');
    const second = stableFleetIdentityContribution('fleet-stable-alpha');

    expect(second).toBe(first);
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThanOrEqual(0xffff_ffff);
  });

  it('pins deterministic full-id vectors and distinguishes equal-length ids', () => {
    const firstId = 'attack-id-a';
    const secondId = 'attack-id-b';
    expect(firstId).toHaveLength(secondId.length);

    expect(stableFleetIdentityContribution(firstId)).toBe(2_303_295_411);
    expect(stableFleetIdentityContribution(secondId)).toBe(2_320_073_030);
    expect(stableFleetIdentityContribution(secondId)).not.toBe(
      stableFleetIdentityContribution(firstId),
    );
  });
});
