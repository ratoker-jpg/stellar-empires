import { describe, expect, it } from 'vitest';
import { FACTION_RUNTIME_ASSETS, getFactionRuntimeAssets } from './factionRuntimeAssets';

describe('faction runtime assets', () => {
  it('defines a complete runtime set for every faction', () => {
    expect(Object.keys(FACTION_RUNTIME_ASSETS)).toEqual(['aegis', 'synod', 'veyra']);

    for (const faction of Object.values(FACTION_RUNTIME_ASSETS)) {
      expect(faction.emblemUrl).toMatch(/\.webp$/);
      expect(faction.backgroundUrl).toMatch(/\.webp$/);
      expect(faction.heroUrl).toMatch(/\.webp$/);
      expect(faction.buildingsAtlasUrl).toMatch(/buildings-atlas\.webp$/);
      expect(faction.shipsAtlasUrl).toMatch(/ships-atlas\.webp$/);
      expect(faction.defensesAtlasUrl).toMatch(/defenses-atlas\.webp$/);
      expect(faction.technologiesAtlasUrl).toMatch(/technologies-atlas\.svg$/);
      expect(faction.effectsAtlasUrl).toMatch(/effects-atlas\.svg$/);
    }
  });

  it('keeps generated faction paths unique while sharing explicit procedural fallbacks', () => {
    const sets = Object.values(FACTION_RUNTIME_ASSETS);
    expect(new Set(sets.map((item) => item.buildingsAtlasUrl)).size).toBe(3);
    expect(new Set(sets.map((item) => item.shipsAtlasUrl)).size).toBe(3);
    expect(new Set(sets.map((item) => item.defensesAtlasUrl)).size).toBe(3);
    expect(new Set(sets.map((item) => item.technologiesAtlasUrl)).size).toBe(1);
    expect(new Set(sets.map((item) => item.effectsAtlasUrl)).size).toBe(1);
  });

  it('returns the requested faction without fallback ambiguity', () => {
    expect(getFactionRuntimeAssets('synod').id).toBe('synod');
    expect(getFactionRuntimeAssets('veyra').accent).toBe('#FF5A64');
  });
});
