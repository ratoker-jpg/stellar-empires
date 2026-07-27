import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import type { FleetState } from '../../src/simulation/fleets/types';
import type { GameState } from '../../src/simulation/types';
import {
  createFleetComposerViewModel,
  createFleetMissionTargets,
  createFleetRoutePreview,
} from '../../src/ui/fleetComposerViewModel';

function prepareState(): GameState {
  const state = createInitialGameState('fleet-composer');
  const home = state.planets.find(
    (planet) => planet.ownerEmpireId === 'player',
  );
  if (home === undefined) throw new Error('Player planet missing.');
  return {
    ...state,
    planets: state.planets.map((planet) =>
      planet.id === home.id
        ? {
            ...planet,
            inventory: {
              ...planet.inventory,
              ships: {
                'ship.aegis.scout': 3,
                'ship.aegis.cargo': 2,
              },
            },
            economy: {
              ...planet.economy,
              resources: {
                ...planet.economy.resources,
                metal: {
                  ...planet.economy.resources.metal,
                  amount: 2_000,
                },
                crystal: {
                  ...planet.economy.resources.crystal,
                  amount: 2_000,
                },
                gas: {
                  ...planet.economy.resources.gas,
                  amount: 10_000,
                  capacity: 10_000,
                },
              },
            },
          }
        : planet,
    ),
  };
}

function previewFleet(state: GameState): FleetState {
  const home = state.planets.find(
    (planet) => planet.ownerEmpireId === 'player',
  )!;
  return {
    id: 'preview-fleet',
    empireId: 'player',
    originPlanetId: home.id,
    location: { type: 'planet', planetId: home.id },
    status: 'stationed',
    ships: { 'ship.aegis.scout': 2 },
    cargo: { metal: 0, crystal: 0, gas: 0 },
    speed: 14,
    cargoCapacity: 40,
    mission: null,
  };
}

describe('fleet composer view model', () => {
  it('calculates speed, cargo capacity and valid cargo from one origin', () => {
    const state = prepareState();
    const home = state.planets.find(
      (planet) => planet.ownerEmpireId === 'player',
    )!;
    const view = createFleetComposerViewModel(
      state,
      'player',
      home.id,
      {
        'ship.aegis.scout': 1,
        'ship.aegis.cargo': 2,
      },
      { metal: 1_000, crystal: 500, gas: 100 },
    );
    expect(view).toMatchObject({
      speed: 9,
      shipCount: 3,
      cargoCapacity: 2_430,
      cargoAmount: 1_600,
      errors: [],
      canCreate: true,
    });
  });

  it('blocks unavailable ships, excessive cargo and missing resources', () => {
    const state = prepareState();
    const home = state.planets.find(
      (planet) => planet.ownerEmpireId === 'player',
    )!;
    const view = createFleetComposerViewModel(
      state,
      'player',
      home.id,
      { 'ship.aegis.scout': 4 },
      { metal: 3_000, crystal: 0, gas: 0 },
    );
    expect(view?.canCreate).toBe(false);
    expect(view?.errors).toEqual(
      expect.arrayContaining([
        'INSUFFICIENT_SHIPS:ship.aegis.scout',
        'FLEET_CARGO_OVER_CAPACITY',
        'INSUFFICIENT_CARGO_RESOURCE:metal',
      ]),
    );
  });

  it('creates deterministic route previews from the shared mission rule', () => {
    const base = prepareState();
    const fleet = previewFleet(base);
    const state = { ...base, fleets: [fleet] };
    const target = state.planets.find((planet) => planet.ownerEmpireId !== 'player')!;
    const first = createFleetRoutePreview(
      state,
      fleet,
      'scout',
      target.id,
    );
    const second = createFleetRoutePreview(
      state,
      fleet,
      'scout',
      target.id,
    );
    expect(first).toEqual(second);
    expect(first).toMatchObject({
      allowed: true,
      code: 'MISSION_READY',
      slotUsed: 0,
    });
    expect(first?.reservedFuel).toBe((first?.oneWayFuel ?? 0) * 2);
    expect(first?.hasEnoughFuel).toBe(true);
  });

  it('builds redacted scout target labels without raw foreign owner IDs', () => {
    const base = prepareState();
    const fleet = previewFleet(base);
    const state = { ...base, fleets: [fleet] };
    const targets = createFleetMissionTargets(state, fleet, 'scout');
    const contact = targets.find((target) => target.visibility === 'contact');

    expect(contact).toBeDefined();
    expect(contact?.knownOwnerEmpireId).toBeNull();
    expect(contact?.label).toContain('неизвестный контакт');
    expect(state.empires.some((empireId) => contact?.label.includes(empireId))).toBe(false);
  });
});
