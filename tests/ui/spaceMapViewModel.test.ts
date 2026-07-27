import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  createGalaxyViewModel,
  createSolarSystemViewModel,
  createUniverseViewModel,
} from '../../src/ui/spaceMapViewModel';

const HIDDEN_KEYS = ['ownerEmpireId', 'owner', 'factionId', 'allianceId', 'defenses', 'ships'];

describe('Space Map view models', () => {
  const state = createInitialGameState('space-map-view-models', 'aegis', 'fidelity');

  it('uses the exact 970×468 Universe geometry with all 20 slots and no routes', () => {
    const view = createUniverseViewModel(state);
    expect(view.logicalWidth).toBe(970);
    expect(view.logicalHeight).toBe(468);
    expect(view.slots).toHaveLength(20);
    expect(view.slots[0]).toMatchObject({ slot: 1, left: 463, top: 95 });
    expect(view.slots[19]).toMatchObject({ slot: 20, left: -33, top: 42 });
    expect(new Set(view.slots.map((slot) => slot.status))).toEqual(
      new Set(['populated', 'discovered', 'unknown', 'empty']),
    );
    expect('routes' in view).toBe(false);
  });

  it('virtualizes Galaxy to exactly nine staggered systems per page', () => {
    const view = createGalaxyViewModel(state, { level: 'galaxy', galaxy: 1, page: 4 });
    expect(view.logicalWidth).toBe(970);
    expect(view.logicalHeight).toBe(530);
    expect(view.systems).toHaveLength(9);
    expect(view.systems.map((system) => system.top)).toEqual([
      30, 50, 110, 160, 190, 260, 290, 310, 390,
    ]);
    expect(view.rangeLabel).toBe('28-36');
  });

  it('materializes exactly 24 fixed Solar-system slots and all required slot kinds', () => {
    const view = createSolarSystemViewModel(state, {
      level: 'solar-system', galaxy: 1, solarSystem: 1, position: 1,
    });
    expect(view.logicalWidth).toBe(970);
    expect(view.logicalHeight).toBe(400);
    expect(view.slots).toHaveLength(24);
    expect(view.slots[0]).toMatchObject({ position: 1, left: 23, top: 5 });
    expect(view.slots[23]).toMatchObject({ position: 24, left: 827, top: 275 });
    expect(new Set(view.slots.map((slot) => slot.kind))).toContain('planet');
    expect(new Set(view.slots.map((slot) => slot.kind))).toContain('empty');
  });

  it('does not expose hidden ownership, faction, alliance, defence or fleet data', () => {
    const models = [
      createUniverseViewModel(state),
      createGalaxyViewModel(state, { level: 'galaxy', galaxy: 1, page: 1 }),
      createSolarSystemViewModel(state, {
        level: 'solar-system', galaxy: 1, solarSystem: 1, position: 1,
      }),
    ];
    const serialized = JSON.stringify(models);
    for (const key of HIDDEN_KEYS) expect(serialized).not.toContain(`"${key}"`);
  });
});
