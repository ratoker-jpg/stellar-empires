import { describe, expect, it } from 'vitest';
import { generateGalaxy } from '../../src/simulation/galaxy/generateGalaxy';

describe('galaxy generation', () => {
  it('creates the same galaxy for the same seed', () => {
    expect(generateGalaxy(12345)).toEqual(generateGalaxy(12345));
  });

  it('changes generated systems for a different seed', () => {
    expect(generateGalaxy(12345)).not.toEqual(generateGalaxy(54321));
  });

  it('creates configured systems inside galaxy bounds', () => {
    const galaxy = generateGalaxy(42, {
      systemCount: 16,
      positionsPerSystem: 10,
      width: 1_000,
      height: 500,
    });

    expect(galaxy.systems).toHaveLength(16);

    for (const system of galaxy.systems) {
      expect(system.x).toBeGreaterThanOrEqual(0);
      expect(system.x).toBeLessThanOrEqual(galaxy.width);
      expect(system.y).toBeGreaterThanOrEqual(0);
      expect(system.y).toBeLessThanOrEqual(galaxy.height);
      expect(system.planets.length).toBeGreaterThanOrEqual(3);
      expect(system.planets.length).toBeLessThanOrEqual(10);
    }
  });

  it('assigns the four starting empires to separate home systems', () => {
    const galaxy = generateGalaxy(99);
    const owners = galaxy.systems
      .slice(0, 4)
      .map((system) => system.planets[0]?.ownerEmpireId);

    expect(owners).toEqual(['player', 'aegis-bot', 'synod-bot', 'veyra-bot']);
  });
});
