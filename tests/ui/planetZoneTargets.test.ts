import { describe, expect, it } from 'vitest';
import { getPlanetZoneTarget, PLANET_ZONE_TARGETS } from '../../src/ui/planetZoneTargets';

describe('planet zone targets', () => {
  it('exposes the overview plus the three direct zone targets', () => {
    expect(PLANET_ZONE_TARGETS.map((target) => target.mode)).toEqual([
      'overview',
      'resource',
      'industry',
      'military',
    ]);
  });

  it('labels every target and keeps zone descriptions distinct', () => {
    const labels = PLANET_ZONE_TARGETS.map((target) => target.label);
    for (const label of labels) expect(label.length).toBeGreaterThan(0);
    expect(new Set(labels).size).toBe(labels.length);

    const zoneTargets = PLANET_ZONE_TARGETS.filter((target) => target.mode !== 'overview');
    const descriptions = zoneTargets.map((target) => target.description);
    expect(new Set(descriptions).size).toBe(descriptions.length);
    for (const kicker of zoneTargets.map((target) => target.kicker)) {
      expect(kicker.endsWith('сектор')).toBe(true);
    }
  });

  it('resolves each workspace mode and rejects unknown modes', () => {
    for (const target of PLANET_ZONE_TARGETS) {
      expect(getPlanetZoneTarget(target.mode)).toBe(target);
    }
    expect(() => getPlanetZoneTarget('fleet' as never)).toThrow(/Unknown planet workspace mode/);
  });
});
