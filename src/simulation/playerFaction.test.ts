import { describe, expect, it } from 'vitest';
import { createColonyPlanet, findGalaxyPlanet } from './colonization/colonization';
import { createInitialGameState } from './createInitialGameState';

describe('player faction state', () => {
  it('assigns the selected faction to the player starting colony', () => {
    const state = createInitialGameState('faction-synod', 'synod');
    const playerPlanet = state.planets.find((planet) => planet.ownerEmpireId === 'player');

    expect(playerPlanet?.factionId).toBe('synod');
    expect(playerPlanet?.buildings.length).toBeGreaterThan(0);
  });

  it('keeps bot faction identities independent from player selection', () => {
    const state = createInitialGameState('faction-veyra', 'veyra');

    expect(state.planets.find((planet) => planet.ownerEmpireId === 'aegis-bot')?.factionId)
      .toBe('aegis');
    expect(state.planets.find((planet) => planet.ownerEmpireId === 'synod-bot')?.factionId)
      .toBe('synod');
    expect(state.planets.find((planet) => planet.ownerEmpireId === 'veyra-bot')?.factionId)
      .toBe('veyra');
  });

  it('preserves faction identity for newly created colonies', () => {
    const state = createInitialGameState('faction-colony', 'veyra');
    const target = state.galaxy.systems
      .flatMap((system) => system.planets.map((planet) => ({ system, planet })))
      .find(({ planet }) => planet.ownerEmpireId === null && planet.biome !== 'gas');

    expect(target).toBeDefined();
    if (target === undefined) return;

    const location = findGalaxyPlanet(state.galaxy, target.planet.id);
    expect(location).toBeDefined();
    if (location === undefined) return;

    expect(createColonyPlanet(location, 'player', 'veyra').factionId).toBe('veyra');
  });
});
