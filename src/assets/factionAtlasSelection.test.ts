import { describe, expect, it } from 'vitest';
import { getFactionAtlasUrl } from './factionAtlasSelection';

describe('getFactionAtlasUrl', () => {
  it('selects distinct generated atlases for faction buildings', () => {
    expect(getFactionAtlasUrl('aegis', 'building')).toMatch(/aegis\/p1\/buildings-atlas\.webp$/);
    expect(getFactionAtlasUrl('synod', 'building')).toMatch(/synod\/p1\/buildings-atlas\.webp$/);
    expect(getFactionAtlasUrl('veyra', 'building')).toMatch(/veyra\/p1\/buildings-atlas\.webp$/);
  });

  it('selects distinct ship and defense atlases', () => {
    expect(getFactionAtlasUrl('synod', 'ship')).toMatch(/synod\/p1\/ships-atlas\.webp$/);
    expect(getFactionAtlasUrl('veyra', 'defense')).toMatch(/veyra\/p1\/defenses-atlas\.webp$/);
  });

  it('preserves procedural technology and effect fallbacks', () => {
    expect(getFactionAtlasUrl('synod', 'technology')).toMatch(/aegis\/p1\/technologies-atlas\.svg$/);
    expect(getFactionAtlasUrl('veyra', 'effect')).toMatch(/aegis\/p1\/effects-atlas\.svg$/);
  });
});
