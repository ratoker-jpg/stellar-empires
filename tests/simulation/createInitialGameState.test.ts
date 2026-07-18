import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { normalizeSeed } from '../../src/simulation/seed';

describe('simulation bootstrap', () => {
  it('creates the same state for the same seed source', () => {
    const first = createInitialGameState('sector-alpha');
    const second = createInitialGameState('sector-alpha');

    expect(second).toEqual(first);
  });

  it('creates different numeric seeds for different sources', () => {
    expect(normalizeSeed('sector-alpha')).not.toBe(normalizeSeed('sector-beta'));
  });

  it('starts with all three faction representatives', () => {
    const state = createInitialGameState('faction-check');

    expect(state.empires).toEqual([
      'player',
      'aegis-bot',
      'synod-bot',
      'veyra-bot',
    ]);
  });
});
