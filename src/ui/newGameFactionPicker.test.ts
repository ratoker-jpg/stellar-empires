import { describe, expect, it } from 'vitest';
import {
  formatCompressedCampaignDurationExpectation,
  NEW_GAME_FACTION_OPTIONS,
  NEW_GAME_ORIENTATION,
  NEW_GAME_SCENARIO_OPTIONS,
  NEW_GAME_SPEED_OPTIONS,
  NEW_GAME_TERMINAL_NOTE,
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
      expect(option.heroUrl).toMatch(/_hero\.png$/);
      expect(option.emblemUrl).toMatch(/_emblem\.png$/);
      expect(option.backgroundUrl).toMatch(/_card_bg\.png$/);
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

  it('shows the accepted endgame-ready target and hard maximum for every speed', () => {
    expect(formatCompressedCampaignDurationExpectation(1)).toContain('24 ч · максимум 32 ч');
    expect(formatCompressedCampaignDurationExpectation(2)).toContain('12 ч · максимум 16 ч');
    expect(formatCompressedCampaignDurationExpectation(5)).toContain('4,8 ч · максимум 6,4 ч');
    expect(formatCompressedCampaignDurationExpectation(10)).toContain('2,4 ч · максимум 3,2 ч');
  });

  it('describes the real release route and terminal behavior without stale pre-endgame copy', () => {
    expect(NEW_GAME_ORIENTATION).toContain('добычу и энергию');
    expect(NEW_GAME_ORIENTATION).toContain('Solar War');
    expect(NEW_GAME_ORIENTATION).toContain('финальные Врата');
    expect(NEW_GAME_TERMINAL_NOTE).toContain('Победа фиксируется');
    expect(NEW_GAME_TERMINAL_NOTE).toContain('После завершения кампания останавливается');
    expect(`${NEW_GAME_ORIENTATION} ${NEW_GAME_TERMINAL_NOTE}`).not.toContain(
      'пока не входят в текущий runtime',
    );
  });
});
