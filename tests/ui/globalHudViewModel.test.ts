import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  createGlobalHudViewModel,
  getCapacityWarningLevel,
  getEnergyWarningLevel,
} from '../../src/ui/globalHudViewModel';

describe('global HUD warning selectors', () => {
  it('uses explicit capacity thresholds', () => {
    expect(getCapacityWarningLevel(69, 100)).toBe('normal');
    expect(getCapacityWarningLevel(70, 100)).toBe('warning');
    expect(getCapacityWarningLevel(85, 100)).toBe('danger');
    expect(getCapacityWarningLevel(95, 100)).toBe('critical');
    expect(getCapacityWarningLevel(1, 0)).toBe('critical');
  });

  it('marks energy deficit and low reserve without colour-only semantics', () => {
    expect(getEnergyWarningLevel(100, 70)).toBe('normal');
    expect(getEnergyWarningLevel(100, 91)).toBe('warning');
    expect(getEnergyWarningLevel(100, 101)).toBe('danger');
  });

  it('derives queues, missions and capacities without mutating GameState', () => {
    const state = createInitialGameState('global-hud', 'aegis');
    const planetId = state.planets.find((planet) => planet.ownerEmpireId === 'player')!.id;
    const before = JSON.stringify(state);
    const view = createGlobalHudViewModel(state, planetId);

    expect(view.planetId).toBe(planetId);
    expect(view.resources.metal.capacity).toBeGreaterThan(0);
    expect(view.population.label.length).toBeGreaterThan(0);
    expect(view.hangar.label.length).toBeGreaterThan(0);
    expect(view.queueCount).toBeGreaterThanOrEqual(0);
    expect(view.activeMissionCount).toBeGreaterThanOrEqual(0);
    expect(view.reportCount).toBeGreaterThanOrEqual(0);
    expect(JSON.stringify(state)).toBe(before);
  });
});
