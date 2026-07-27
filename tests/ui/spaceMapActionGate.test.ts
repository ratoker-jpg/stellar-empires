import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { createE2eFixtureState } from '../../src/runtime/e2eScenario';
import { createSpaceMapObjectDetails } from '../../src/ui/spaceMapActionGate';

describe('Space Map action gate', () => {
  const state = createE2eFixtureState(createInitialGameState('action-gate-fixture'));
  const target = state.planets.find((planet) => planet.ownerEmpireId === 'pirate-neutral')!;

  it('reveals owner and faction only with permitted current intelligence', () => {
    const details = createSpaceMapObjectDetails(state, {
      kind: 'position',
      ...target.coordinate,
      label: target.name,
      objectKind: 'planet',
    });
    expect(details.intelQuality).toBe('fresh');
    expect(details.ownerEmpireId).toBe('pirate-neutral');
    expect(details.factionId).toBe(target.factionId);
    expect(details.relation).toBe('hostile');
    expect(details.actions.find((action) => action.id === 'mission-scout')).toMatchObject({
      enabled: true,
      targetId: target.id,
      mission: 'scout',
    });
  });

  it('hides identity for an unknown contact and explains disabled attack', () => {
    const withoutIntel = {
      ...state,
      intelligence: state.intelligence.map((entry) =>
        entry.empireId === 'player' ? { ...entry, observations: [] } : entry,
      ),
    };
    const details = createSpaceMapObjectDetails(withoutIntel, {
      kind: 'position',
      ...target.coordinate,
      label: 'Unknown contact',
      objectKind: 'planet',
    });
    expect(details.ownerEmpireId).toBeNull();
    expect(details.factionId).toBeNull();
    expect(details.actions.find((action) => action.id === 'mission-attack')).toMatchObject({
      enabled: false,
      disabledReason: 'Сначала нужны разведданные с известным владельцем цели.',
    });
  });

  it('keeps Sun Attack and Sun Support visibly disabled until solar-war', () => {
    const details = createSpaceMapObjectDetails(state, {
      kind: 'sun', galaxy: 1, solarSystem: 1, label: 'Sun',
    });
    expect(details.actions.map((action) => action.id)).toEqual(['sun-attack', 'sun-support']);
    expect(details.actions.every((action) => !action.enabled && action.disabledReason?.includes('solar-war'))).toBe(true);
  });
});
