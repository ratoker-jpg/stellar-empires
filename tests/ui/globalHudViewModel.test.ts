import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import type { FleetState } from '../../src/simulation/fleets/types';
import { executeCommand } from '../../src/simulation/reducer';
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

  it('derives queues, missions, capacities and Solar War cycle without mutating GameState', () => {
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
    expect(view.solarWar).toMatchObject({
      cycleIndex: 0,
      activeEntry: false,
      fleetId: null,
      resultCount: 0,
    });
    expect(view.solarWar.remainingSeconds).toBe(86_400);
    expect(JSON.stringify(state)).toBe(before);
  });

  it('marks an entered Solar War fleet in the compact HUD selector', () => {
    const initial = createInitialGameState('global-hud-solar-war', 'aegis');
    const origin = initial.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    const fleet: FleetState = {
      id: 'fleet-hud-solar-war',
      empireId: 'player',
      originPlanetId: origin.id,
      location: { type: 'planet', planetId: origin.id },
      status: 'stationed',
      ships: { 'ship.aegis.fighter': 4 },
      cargo: { metal: 0, crystal: 0, gas: 0 },
      speed: 12,
      cargoCapacity: 1_000,
      mission: null,
    };
    const ready = { ...initial, fleets: [...initial.fleets, fleet] };
    const entered = executeCommand(ready, {
      type: 'ENTER_SOLAR_WAR',
      empireId: 'player',
      fleetId: fleet.id,
    });
    expect(entered.ok).toBe(true);
    if (!entered.ok) throw new Error(entered.message);

    const view = createGlobalHudViewModel(entered.value, origin.id);
    expect(view.solarWar).toMatchObject({
      cycleIndex: 0,
      activeEntry: true,
      fleetId: fleet.id,
      resultCount: 0,
    });
  });
});
