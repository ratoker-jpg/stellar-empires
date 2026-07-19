import { describe, expect, it } from 'vitest';
import { NEW_GAME_FACTION_OPTIONS } from './newGameFactionPicker';

describe('new game faction options', () => {
  it('offers all three factions in stable order', () => {
    expect(NEW_GAME_FACTION_OPTIONS.map((option) => option.id)).toEqual([
      'aegis',
      'synod',
      'veyra',
    ]);
  });

  it('uses generated hero, emblem and background art', () => {
    for (const option of NEW_GAME_FACTION_OPTIONS) {
      expect(option.heroUrl).toMatch(/hero\.webp$/);
      expect(option.emblemUrl).toMatch(/emblem\.webp$/);
      expect(option.backgroundUrl).toMatch(/background\.webp$/);
    }
  });
});
