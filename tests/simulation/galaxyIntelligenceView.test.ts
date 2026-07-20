import { describe, expect, it } from 'vitest';
import {
  createGalaxyIntelligenceView,
  filterGalaxyIntelligence,
  summarizeGalaxyIntelligence,
} from '../../src/simulation/galaxy/intelligenceView';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';

describe('galaxy intelligence view', () => {
  it('shows full owned data and hides unknown foreign state', () => {
    const state = createInitialGameState('galaxy-intel-fog');
    const view = createGalaxyIntelligenceView(state, 'player');
    const own = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    const foreign = state.planets.find((planet) => planet.ownerEmpireId !== 'player')!;
    expect(view.find((planet) => planet.colonyId === own.id)).toMatchObject({
      visibility: 'owned',
      ownerEmpireId: 'player',
      displayName: own.name,
    });
    expect(view.find((planet) => planet.colonyId === own.id)?.resources).not.toBeNull();
    expect(view.find((planet) => planet.colonyId === foreign.id)).toMatchObject({
      visibility: 'contact',
      ownerEmpireId: null,
      factionId: null,
      resources: null,
      buildings: null,
      defenses: null,
      fleets: null,
    });
  });

  it('uses only the stored intelligence snapshot for foreign details', () => {
    const base = createInitialGameState('galaxy-intel-current');
    const foreign = base.planets.find((planet) => planet.ownerEmpireId === 'aegis-bot')!;
    const state = {
      ...base,
      intelligence: base.intelligence.map((entry) =>
        entry.empireId === 'player'
          ? {
              ...entry,
              observations: [
                {
                  id: 'player-galaxy-observation',
                  observerEmpireId: 'player',
                  targetPlanetId: foreign.id,
                  observedAt: 50,
                  expiresAt: 500,
                  detected: false,
                  snapshot: {
                    planetId: foreign.id,
                    name: 'Снимок контакта',
                    ownerEmpireId: foreign.ownerEmpireId,
                    factionId: foreign.factionId,
                    level: 2 as const,
                    resources: {
                      metal: 111,
                      crystal: 222,
                      gas: 333,
                      energyProduced: 40,
                      energyConsumed: 20,
                    },
                    buildings: { 'building.aegis.command': 2 },
                  },
                },
              ],
            }
          : entry,
      ),
      planets: base.planets.map((planet) =>
        planet.id === foreign.id
          ? {
              ...planet,
              name: 'Скрытое новое имя',
              economy: {
                ...planet.economy,
                resources: {
                  ...planet.economy.resources,
                  metal: { ...planet.economy.resources.metal, amount: 9_999 },
                },
              },
            }
          : planet,
      ),
      clock: { ...base.clock, elapsedSeconds: 100 },
    };
    const contact = createGalaxyIntelligenceView(state, 'player').find(
      (planet) => planet.colonyId === foreign.id,
    );
    expect(contact).toMatchObject({
      visibility: 'current',
      displayName: 'Снимок контакта',
      ownerEmpireId: foreign.ownerEmpireId,
      resources: { metal: 111, crystal: 222, gas: 333 },
      buildings: { 'building.aegis.command': 2 },
    });
  });

  it('marks expired observations as stale without replacing their snapshot', () => {
    const base = createInitialGameState('galaxy-intel-stale');
    const foreign = base.planets.find((planet) => planet.ownerEmpireId === 'synod-bot')!;
    const state = {
      ...base,
      clock: { ...base.clock, elapsedSeconds: 1_000 },
      intelligence: base.intelligence.map((entry) =>
        entry.empireId === 'player'
          ? {
              ...entry,
              observations: [
                {
                  id: 'expired-intel',
                  observerEmpireId: 'player',
                  targetPlanetId: foreign.id,
                  observedAt: 10,
                  expiresAt: 20,
                  detected: true,
                  snapshot: {
                    planetId: foreign.id,
                    name: 'Старый контакт',
                    ownerEmpireId: foreign.ownerEmpireId,
                    factionId: foreign.factionId,
                    level: 1 as const,
                  },
                },
              ],
            }
          : entry,
      ),
    };
    expect(
      createGalaxyIntelligenceView(state, 'player').find(
        (planet) => planet.colonyId === foreign.id,
      ),
    ).toMatchObject({
      visibility: 'stale',
      displayName: 'Старый контакт',
      observedAt: 10,
      expiresAt: 20,
    });
  });

  it('filters by owner, visibility, biome, size and text', () => {
    const state = createInitialGameState('galaxy-intel-filter');
    const view = createGalaxyIntelligenceView(state, 'player');
    const own = view.find((planet) => planet.visibility === 'owned')!;
    expect(filterGalaxyIntelligence(view, { owner: 'self' })).toEqual([own]);
    expect(
      filterGalaxyIntelligence(view, {
        search: own.systemName,
        biome: own.biome,
        minimumSize: own.size,
      }),
    ).toContainEqual(own);
    expect(
      filterGalaxyIntelligence(view, { minimumSize: own.size + 100 }),
    ).toEqual([]);
    expect(
      filterGalaxyIntelligence(view, { owner: 'foreign' }).every((planet) =>
        ['contact', 'current', 'stale'].includes(planet.visibility),
      ),
    ).toBe(true);
  });

  it('summarizes every map position exactly once', () => {
    const state = createInitialGameState('galaxy-intel-summary');
    const view = createGalaxyIntelligenceView(state, 'player');
    const summary = summarizeGalaxyIntelligence(view);
    expect(summary.totalPositions).toBe(view.length);
    expect(
      summary.owned +
        summary.current +
        summary.stale +
        summary.contacts +
        summary.unclaimed,
    ).toBe(view.length);
  });
});
