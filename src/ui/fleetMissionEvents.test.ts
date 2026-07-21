import { describe, expect, it } from 'vitest';
import { inferMissionForGalaxyTarget } from './fleetMissionEvents';

describe('galaxy target mission inference', () => {
  it('routes free positions to colonization', () => {
    expect(inferMissionForGalaxyTarget(null, 'unclaimed')).toBe('colonize');
  });

  it('routes owned colonies to transport', () => {
    expect(inferMissionForGalaxyTarget('player', 'owned')).toBe('transport');
  });

  it('routes foreign and unknown contacts to scouting', () => {
    expect(inferMissionForGalaxyTarget('aegis-bot', 'current')).toBe('scout');
    expect(inferMissionForGalaxyTarget(null, 'contact')).toBe('scout');
  });
});
