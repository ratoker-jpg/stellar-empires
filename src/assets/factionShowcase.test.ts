import { describe, expect, it } from 'vitest';
import { FACTION_SHOWCASES } from './factionShowcase';

describe('faction showcase definitions', () => {
  it('uses generated WebP art for every faction', () => {
    expect(FACTION_SHOWCASES.map((item) => item.id)).toEqual(['aegis', 'synod', 'veyra']);

    for (const faction of FACTION_SHOWCASES) {
      expect(faction.emblemUrl).toMatch(/\.webp$/);
      expect(faction.backgroundUrl).toMatch(/\.webp$/);
      expect(faction.heroUrl).toMatch(/hero\.webp$/);
      expect(faction.previewUrl).toBe(faction.backgroundUrl);
    }
  });

  it('keeps the blue, green and red faction accents distinct', () => {
    expect(FACTION_SHOWCASES.map((item) => item.accent)).toEqual([
      '#4EA7FF',
      '#55E985',
      '#FF5A64',
    ]);
  });
});
