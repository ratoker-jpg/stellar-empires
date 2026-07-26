import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionMechanicalCatalog } from '../../src/simulation/factions/factionMechanicalCatalogRegistry';

const ZONE_IDS = ['resource', 'industry', 'military'] as const;

describe('planet domain', () => {
  it('creates a managed colony state for every owned galaxy planet', () => {
    const state = createInitialGameState('planet-domain');
    const ownedPlanets = state.galaxy.systems.flatMap((system) =>
      system.planets.filter((planet) => planet.ownerEmpireId !== null),
    );
    const managedColonies = state.planets.filter((planet) =>
      state.empires.includes(planet.ownerEmpireId),
    );

    expect(managedColonies).toHaveLength(ownedPlanets.length);
    expect(new Set(managedColonies.map((planet) => planet.galaxyPlanetId)).size).toBe(
      ownedPlanets.length,
    );
    expect(new Set(state.planets.map((planet) => planet.galaxyPlanetId)).size).toBe(
      state.planets.length,
    );
  });

  it('gives every colony exactly three independent zones', () => {
    const state = createInitialGameState('planet-zones');

    for (const planet of state.planets) {
      expect(Object.keys(planet.zones).sort()).toEqual([...ZONE_IDS].sort());

      for (const zoneId of ZONE_IDS) {
        const zone = planet.zones[zoneId];
        expect(zone.id).toBe(zoneId);
        expect(zone.usedFields).toBeGreaterThanOrEqual(0);
        expect(zone.usedFields).toBeLessThanOrEqual(zone.fieldLimit);
      }
    }
  });

  it('starts Aegis colonies with separate resource and industry chains', () => {
    const state = createInitialGameState('aegis-start');
    const playerPlanet = state.planets.find((planet) => planet.ownerEmpireId === 'player');

    expect(playerPlanet).toBeDefined();
    expect(playerPlanet?.factionId).toBe('aegis');
    expect(playerPlanet?.buildings.map((building) => building.buildingId)).toEqual(
      expect.arrayContaining([
        'building.aegis.control-chamber',
        'building.aegis.metal-bot-1',
        'building.aegis.mineral-bot-1',
        'building.aegis.gas-probe-1',
        'building.aegis.infrared-bot',
      ]),
    );
    expect(playerPlanet?.zones.resource.usedFields).toBe(4);
    expect(playerPlanet?.zones.industry.usedFields).toBe(0);
    expect(playerPlanet?.zones.military.usedFields).toBe(1);
  });

  it('keeps every building definition inside exactly one valid zone', () => {
    const ids = new Set<string>();

    for (const definition of getFactionMechanicalCatalog('aegis').buildings) {
      expect(ids.has(definition.id)).toBe(false);
      ids.add(definition.id);
      expect(ZONE_IDS).toContain(definition.zoneId);
      expect(definition.fieldCost).toBeGreaterThan(0);
      expect(definition.maxLevel).toBeGreaterThan(0);
      expect(definition.assetId).toBe(definition.id);
    }
  });
});
