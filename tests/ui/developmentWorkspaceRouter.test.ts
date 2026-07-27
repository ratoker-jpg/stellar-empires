import { describe, expect, it } from 'vitest';
import { getDevelopmentSurfacesForMode } from '../../src/ui/developmentWorkspaceRouter';

describe('development workspace routing', () => {
  it('keeps overview and resource routes on the zone surface', () => {
    expect(getDevelopmentSurfacesForMode('overview')).toEqual(['zone']);
    expect(getDevelopmentSurfacesForMode('resource')).toEqual(['zone']);
  });

  it('exposes ship production and upgrades only from Industry', () => {
    expect(getDevelopmentSurfacesForMode('industry')).toEqual([
      'zone', 'shipyard', 'upgrades',
    ]);
  });

  it('exposes defence and repair only from Military', () => {
    expect(getDevelopmentSurfacesForMode('military')).toEqual(['zone', 'defense']);
  });
});
