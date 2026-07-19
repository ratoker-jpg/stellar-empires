import { describe, expect, it } from 'vitest';
import { AEGIS_BUILDING_CATALOG } from '../../src/simulation/planet/buildingCatalog';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { AEGIS_RESEARCH_CATALOG } from '../../src/simulation/research/catalog';
import { AEGIS_UNIT_CATALOG } from '../../src/simulation/units/catalog';
import { getHangarCapacity, getHangarUsed } from '../../src/simulation/units/inventory';
import { validateUnitCatalog } from '../../src/simulation/units/validateUnitCatalog';

describe('unit catalog and inventory', () => {
  it('validates the first Aegis ship and defense set', () => {
    expect(
      validateUnitCatalog(
        AEGIS_UNIT_CATALOG,
        AEGIS_BUILDING_CATALOG,
        AEGIS_RESEARCH_CATALOG,
      ),
    ).toEqual([]);
    expect(AEGIS_UNIT_CATALOG.filter((unit) => unit.kind === 'ship')).toHaveLength(6);
    expect(AEGIS_UNIT_CATALOG.filter((unit) => unit.kind === 'defense')).toHaveLength(3);
  });

  it('initializes empty inventories, fleets, intelligence, debris, logistics and market', () => {
    const state = createInitialGameState('unit-inventory');
    expect(state.schemaVersion).toBe(12);
    expect(state.fleets).toEqual([]);
    expect(state.debrisFields).toEqual([]);
    expect(state.logisticsRoutes).toEqual([]);
    expect(state.market.reserves).toEqual({
      metal: 50_000,
      crystal: 50_000,
      gas: 50_000,
    });
    expect(state.market.trades).toEqual([]);
    expect(state.intelligence).toHaveLength(state.empires.length);
    expect(state.intelligence.every((entry) => entry.observations.length === 0)).toBe(true);
    expect(
      state.planets.every(
        (planet) =>
          Object.keys(planet.inventory.ships).length === 0 &&
          Object.keys(planet.inventory.defenses).length === 0 &&
          planet.productionQueues.shipyard.length === 0 &&
          planet.productionQueues.defense.length === 0,
      ),
    ).toBe(true);
  });

  it('calculates hangar capacity and used space from definitions', () => {
    const state = createInitialGameState('hangar-capacity');
    const planet = state.planets.find((candidate) => candidate.ownerEmpireId === 'player');
    expect(planet).toBeDefined();
    if (planet === undefined) return;
    const upgraded = {
      ...planet,
      buildings: [
        ...planet.buildings,
        { buildingId: 'building.aegis.shipyard', level: 2 },
      ],
      inventory: {
        ...planet.inventory,
        ships: { 'ship.aegis.scout': 3, 'ship.aegis.cargo': 2 },
      },
    };
    expect(getHangarCapacity(upgraded)).toBe(50);
    expect(getHangarUsed(upgraded)).toBe(7);
  });
});
