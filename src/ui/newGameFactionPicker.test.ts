import { describe, expect, it } from 'vitest';
import {
  NEW_GAME_FACTION_OPTIONS,
  NEW_GAME_SCENARIO_OPTIONS,
  NEW_GAME_SPEED_OPTIONS,
} from './newGameFactionPicker';

describe('new game campaign options', () => {
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

  it('offers every topology and immutable world-speed preset', () => {
    expect(NEW_GAME_SCENARIO_OPTIONS.map((option) => option.id)).toEqual([
      'test',
      'campaign',
      'fidelity',
    ]);
    expect(NEW_GAME_SPEED_OPTIONS.map((option) => option.value)).toEqual([1, 2, 5, 10]);
    expect(NEW_GAME_SPEED_OPTIONS.filter((option) => option.recommended).map((option) => option.value))
      .toEqual([2]);
  });
});
