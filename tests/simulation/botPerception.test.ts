import { describe, expect, it } from 'vitest';
import { createBotMemoryTimeline, summarizeBotMemory } from '../../src/simulation/bots/memory';
import { createBotPerception } from '../../src/simulation/bots/perception';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';

describe('bot perception and memory', () => {
  it('gives a bot full access to its own state but no unobserved foreign details', () => {
    const state = createInitialGameState('bot-perception-own');
    const perception = createBotPerception(state, 'synod-bot');
    const ownPlanet = state.planets.find((planet) => planet.ownerEmpireId === 'synod-bot');

    expect(ownPlanet).toBeDefined();
    expect(perception.ownPlanets).toHaveLength(1);
    expect(perception.ownPlanets[0]).toMatchObject({
      id: ownPlanet?.id,
      resources: {
        metal: ownPlanet?.economy.resources.metal.amount,
        crystal: ownPlanet?.economy.resources.crystal.amount,
        gas: ownPlanet?.economy.resources.gas.amount,
      },
    });
    expect(perception.foreignPlanets).toEqual([]);
  });

  it('does not change when hidden player state changes without new intelligence', () => {
    const state = createInitialGameState('bot-perception-hidden');
    const before = createBotPerception(state, 'synod-bot');
    const playerPlanet = state.planets.find((planet) => planet.ownerEmpireId === 'player');
    expect(playerPlanet).toBeDefined();
    if (playerPlanet === undefined) return;

    const changed = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.id === playerPlanet.id
          ? {
              ...planet,
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
    };
    const after = createBotPerception(changed, 'synod-bot');
    expect(after.foreignPlanets).toEqual(before.foreignPlanets);
    expect(after.ownPlanets).toEqual(before.ownPlanets);
  });

  it('uses the stored observation rather than current hidden target state', () => {
    const state = createInitialGameState('bot-perception-intel');
    const playerPlanet = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    const intelligence = state.intelligence.map((entry) =>
      entry.empireId === 'synod-bot'
        ? {
            ...entry,
            observations: [
              {
                id: 'intel-synod-player',
                observerEmpireId: 'synod-bot',
                targetPlanetId: playerPlanet.id,
                observedAt: 100,
                expiresAt: 1_000,
                detected: false,
                snapshot: {
                  planetId: playerPlanet.id,
                  name: playerPlanet.name,
                  ownerEmpireId: 'player',
                  factionId: playerPlanet.factionId,
                  level: 2 as const,
                  resources: {
                    metal: 321,
                    crystal: 222,
                    gas: 111,
                    energyProduced: 20,
                    energyConsumed: 10,
                  },
                  buildings: { 'building.aegis.command': 1 },
                },
              },
            ],
          }
        : entry,
    );
    const changed = {
      ...state,
      clock: { ...state.clock, elapsedSeconds: 500 },
      intelligence,
      planets: state.planets.map((planet) =>
        planet.id === playerPlanet.id
          ? {
              ...planet,
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
    };

    const perceived = createBotPerception(changed, 'synod-bot').foreignPlanets[0];
    expect(perceived?.freshness).toBe('current');
    expect(perceived?.snapshot.resources?.metal).toBe(321);
    expect(perceived?.snapshot.resources?.metal).not.toBe(9_999);
  });

  it('keeps expired observations as stale memory with clear freshness', () => {
    const state = createInitialGameState('bot-memory-stale');
    const playerPlanet = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    const withMemory = {
      ...state,
      clock: { ...state.clock, elapsedSeconds: 2_000 },
      intelligence: state.intelligence.map((entry) =>
        entry.empireId === 'veyra-bot'
          ? {
              ...entry,
              observations: [
                {
                  id: 'intel-old',
                  observerEmpireId: 'veyra-bot',
                  targetPlanetId: playerPlanet.id,
                  observedAt: 100,
                  expiresAt: 1_000,
                  detected: true,
                  snapshot: {
                    planetId: playerPlanet.id,
                    name: playerPlanet.name,
                    ownerEmpireId: 'player',
                    factionId: playerPlanet.factionId,
                    level: 1 as const,
                  },
                },
              ],
              alerts: [
                {
                  id: 'alert-old',
                  empireId: 'veyra-bot',
                  sourceEmpireId: 'player',
                  targetPlanetId: entry.empireId,
                  detectedAt: 1_500,
                  confidence: 'medium' as const,
                },
              ],
            }
          : entry,
      ),
    };

    expect(createBotPerception(withMemory, 'veyra-bot').foreignPlanets[0]).toMatchObject({
      freshness: 'stale',
      ageSeconds: 1_900,
    });
    expect(createBotMemoryTimeline(withMemory, 'veyra-bot').map((entry) => entry.kind)).toEqual([
      'alert',
      'observation',
    ]);
    expect(summarizeBotMemory(withMemory, 'veyra-bot')).toMatchObject({
      totalEntries: 2,
      currentObservations: 0,
      staleObservations: 1,
      alerts: 1,
    });
  });
});
