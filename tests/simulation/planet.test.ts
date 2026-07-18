import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { AEGIS_BUILDING_CATALOG } from '../../src/simulation/planet/buildingCatalog';

const ZONE_IDS = ['resource', 'industry', 'military'] as const;

describe('planet domain', () => {
  it('creates a colony state for every owned galaxy planet', () => {
    const state = createInitialGameState('planet-domain');
    const ownedPlanets = state.galaxy.systems.flatMap((system) =>
      system.planets.filter((planet) => planet.ownerEmpireId !== null),
    );

    expect(state.planets).toHaveLength(ownedPlanets.length);
    expect(new Set(state.planets.map((planet) => planet.galaxyPlanetId)).size).toBe(
      ownedPlanets.length,
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
        'building.aegis.command',
        'building.aegis.metal-extractor',
        'building.aegis.crystal-refinery',
        'building.aegis.gas-extractor',
        'building.aegis.power-plant',
      ]),
    );
    expect(playerPlanet?.zones.resource.usedFields).toBe(4);
    expect(playerPlanet?.zones.industry.usedFields).toBe(2);
    expect(playerPlanet?.zones.military.usedFields).toBe(0);
  });

  it('keeps every building definition inside exactly one valid zone', () => {
    const ids = new Set<string>();

    for (const definition of AEGIS_BUILDING_CATALOG) {
      expect(ids.has(definition.id)).toBe(false);
      ids.add(definition.id);
      expect(ZONE_IDS).toContain(definition.zoneId);
      expect(definition.fieldCost).toBeGreaterThan(0);
      expect(definition.maxLevel).toBeGreaterThan(0);
      expect(definition.assetId).toBe(definition.id);
    }
  });
});
