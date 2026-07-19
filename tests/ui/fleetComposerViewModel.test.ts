import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import type { GameState } from '../../src/simulation/types';
import {
  createFleetComposerViewModel,
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
      cargoCapacity: 2_420,
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

  it('creates deterministic route previews with round-trip fuel', () => {
    const state = prepareState();
    const home = state.planets.find(
      (planet) => planet.ownerEmpireId === 'player',
    )!;
    const target = state.planets.find((planet) => planet.id !== home.id)!;
    const fleet = {
      id: 'preview-fleet',
      empireId: 'player',
      originPlanetId: home.id,
      location: { type: 'planet' as const, planetId: home.id },
      status: 'stationed' as const,
      ships: { 'ship.aegis.scout': 2 },
      cargo: { metal: 0, crystal: 0, gas: 0 },
      speed: 14,
      cargoCapacity: 40,
      mission: null,
    };
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
    expect(first?.reservedFuel).toBe((first?.oneWayFuel ?? 0) * 2);
    expect(first?.hasEnoughFuel).toBe(true);
  });
});
