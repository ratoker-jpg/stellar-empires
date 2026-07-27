import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { createE2eFixtureState, E2E_FLEET_ID } from '../../src/runtime/e2eScenario';
import { createSpaceMapOverlayViewModel } from '../../src/ui/spaceMapOverlayViewModel';

describe('Space Map semantic overlays', () => {
  it('creates stable fleet, route and mission marker IDs', () => {
    const base = createE2eFixtureState(createInitialGameState('overlay-fixture'));
    const target = base.planets.find((planet) => planet.ownerEmpireId === 'pirate-neutral')!;
    const fleet = base.fleets.find((candidate) => candidate.id === E2E_FLEET_ID)!;
    const state = {
      ...base,
      fleets: base.fleets.map((candidate) => candidate.id !== fleet.id ? candidate : {
        ...candidate,
        status: 'outbound' as const,
        mission: { kind: 'scout' as const, targetPlanetId: target.id },
        location: {
          type: 'transit' as const,
          fromPlanetId: fleet.originPlanetId,
          toPlanetId: target.id,
          departedAt: 0,
          arrivesAt: 100,
        },
      }),
    };
    const overlay = createSpaceMapOverlayViewModel(
      state,
      target.coordinate.galaxy,
      target.coordinate.solarSystem,
    );
    expect(overlay.routes).toContainEqual(expect.objectContaining({
      semanticId: `space-route-${E2E_FLEET_ID}`,
      mission: 'scout',
    }));
    expect(overlay.markers).toContainEqual(expect.objectContaining({
      semanticId: `space-mission-${E2E_FLEET_ID}`,
      relation: 'self',
      kind: 'mission',
    }));
  });
});
