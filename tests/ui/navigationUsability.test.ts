import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  createMemoryShellNavigationStore,
  ShellNavigationContextModel,
} from '../../src/ui/shellNavigationContext';

describe('navigation usability acceptance', () => {
  it('retains an equivalent Planet task when the active colony changes', () => {
    const state = createInitialGameState('navigation-usability-colonies', 'aegis');
    const firstPlanet = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    const foreignPlanet = state.planets.find((planet) => planet.ownerEmpireId !== 'player')!;
    const secondPlanetId = `${foreignPlanet.id}-player-colony`;
    const twoColonyState = {
      ...state,
      planets: [
        ...state.planets,
        {
          ...foreignPlanet,
          id: secondPlanetId,
          name: 'Вторая колония',
          ownerEmpireId: 'player',
        },
      ],
    };
    const context = new ShellNavigationContextModel(
      twoColonyState,
      firstPlanet.id,
      createMemoryShellNavigationStore(),
    );
    context.rememberRoute({
      family: 'planet',
      planetId: firstPlanet.id,
      mode: 'industry',
      surface: 'shipyard',
    }, twoColonyState, null);

    expect(context.rememberActivePlanet(twoColonyState, secondPlanetId)).toBe(true);
    expect(context.routeForFamily('planet', twoColonyState).route).toEqual({
      family: 'planet',
      planetId: secondPlanetId,
      mode: 'industry',
      surface: 'shipyard',
    });
    expect(context.snapshot.activePlanetId).toBe(secondPlanetId);
  });
});
