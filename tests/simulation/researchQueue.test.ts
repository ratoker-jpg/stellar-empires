import { describe, expect, it } from 'vitest';
import { refreshPlanetEconomy } from '../../src/simulation/economy/planetEconomy';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { createPlanetZones } from '../../src/simulation/planet/zones';
import { executeCommand } from '../../src/simulation/reducer';
import { calculateResearchCost } from '../../src/simulation/research/progression';
import { AEGIS_RESEARCH_CATALOG } from '../../src/simulation/research/catalog';
import type { GameState } from '../../src/simulation/types';

function withPlayerLaboratory(state: GameState): GameState {
  return {
    ...state,
    planets: state.planets.map((planet) => {
      if (planet.ownerEmpireId !== 'player') {
        return planet;
      }
      const buildings = [
        ...planet.buildings.filter(
          (building) => building.buildingId !== 'building.aegis.research-lab',
        ),
        { buildingId: 'building.aegis.research-lab', level: 1 },
      ];
      return {
        ...planet,
        buildings,
        zones: createPlanetZones(buildings),
        economy: refreshPlanetEconomy(planet.economy, buildings),
      };
    }),
  };
}

function setPlayerResearchLevel(
  state: GameState,
  technologyId: string,
  level: number,
): GameState {
  return {
    ...state,
    research: state.research.map((research) =>
      research.empireId === 'player'
        ? {
            ...research,
            levels: { ...research.levels, [technologyId]: level },
          }
        : research,
    ),
  };
}

function getPlayerPlanet(state: GameState) {
  const planet = state.planets.find((candidate) => candidate.ownerEmpireId === 'player');
  if (planet === undefined) {
    throw new Error('Player planet missing in test state.');
  }
  return planet;
}

describe('research queue', () => {
  it('reserves resources and completes a technology exactly once', () => {
    const initial = withPlayerLaboratory(createInitialGameState('research-complete'));
    const planet = getPlayerPlanet(initial);
    const queued = executeCommand(initial, {
      type: 'QUEUE_RESEARCH',
      empireId: 'player',
      planetId: planet.id,
      technologyId: 'technology.aegis.construction',
    });

    expect(queued.ok).toBe(true);
    if (!queued.ok) {
      return;
    }

    const item = queued.value.research.find(
      (research) => research.empireId === 'player',
    )?.queue[0];
    expect(item).toBeDefined();
    if (item === undefined) {
      return;
    }

    const cost = calculateResearchCost(AEGIS_RESEARCH_CATALOG[0]!, 1);
    expect(getPlayerPlanet(queued.value).economy.resources.metal.amount).toBe(
      planet.economy.resources.metal.amount - cost.metal,
    );

    const completed = executeCommand(queued.value, {
      type: 'ADVANCE_TIME',
      seconds: item.completesAt - queued.value.clock.elapsedSeconds,
    });
    expect(completed.ok).toBe(true);
    if (!completed.ok) {
      return;
    }

    const research = completed.value.research.find(
      (candidate) => candidate.empireId === 'player',
    );
    expect(research?.levels['technology.aegis.construction']).toBe(1);
    expect(research?.queue).toEqual([]);
    expect(
      completed.value.eventLog.filter(
        (entry) => entry.event.payload.type === 'RESEARCH_COMPLETE',
      ),
    ).toHaveLength(1);

    const later = executeCommand(completed.value, { type: 'ADVANCE_TIME', seconds: 10_000 });
    expect(later.ok).toBe(true);
    if (later.ok) {
      expect(
        later.value.eventLog.filter(
          (entry) => entry.event.payload.type === 'RESEARCH_COMPLETE',
        ),
      ).toHaveLength(1);
    }
  });

  it('cancels research, removes the event and refunds 75 percent', () => {
    const initial = withPlayerLaboratory(createInitialGameState('research-cancel'));
    const planet = getPlayerPlanet(initial);
    const queued = executeCommand(initial, {
      type: 'QUEUE_RESEARCH',
      empireId: 'player',
      planetId: planet.id,
      technologyId: 'technology.aegis.construction',
    });
    expect(queued.ok).toBe(true);
    if (!queued.ok) {
      return;
    }
    const item = queued.value.research.find(
      (research) => research.empireId === 'player',
    )?.queue[0];
    if (item === undefined) {
      throw new Error('Research queue item missing.');
    }

    const cancelled = executeCommand(queued.value, {
      type: 'CANCEL_RESEARCH',
      empireId: 'player',
      queueItemId: item.id,
    });
    expect(cancelled.ok).toBe(true);
    if (!cancelled.ok) {
      return;
    }

    const after = getPlayerPlanet(cancelled.value);
    expect(after.economy.resources.metal.amount).toBe(
      planet.economy.resources.metal.amount - item.cost.metal + Math.floor((item.cost.metal * 750) / 1_000),
    );
    expect(cancelled.value.pendingEvents).toHaveLength(0);
    expect(
      cancelled.value.research.find((research) => research.empireId === 'player')?.queue,
    ).toEqual([]);
  });

  it('applies construction and energy research effects to real formulas', () => {
    const base = createInitialGameState('research-effects');
    const boosted = setPlayerResearchLevel(
      setPlayerResearchLevel(base, 'technology.aegis.construction', 1),
      'technology.aegis.energy',
      1,
    );
    const basePlanet = getPlayerPlanet(base);
    const boostedPlanet = getPlayerPlanet(boosted);
    const baseQueue = executeCommand(base, {
      type: 'QUEUE_BUILDING',
      empireId: 'player',
      planetId: basePlanet.id,
      buildingId: 'building.aegis.metal-extractor',
    });
    const boostedQueue = executeCommand(boosted, {
      type: 'QUEUE_BUILDING',
      empireId: 'player',
      planetId: boostedPlanet.id,
      buildingId: 'building.aegis.metal-extractor',
    });
    expect(baseQueue.ok).toBe(true);
    expect(boostedQueue.ok).toBe(true);
    if (!baseQueue.ok || !boostedQueue.ok) {
      return;
    }

    expect(boostedQueue.value.planets.find((p) => p.id === boostedPlanet.id)?.buildQueue[0]?.completesAt)
      .toBeLessThan(baseQueue.value.planets.find((p) => p.id === basePlanet.id)?.buildQueue[0]?.completesAt ?? 0);

    const refreshed = executeCommand(boosted, { type: 'ADVANCE_TIME', seconds: 0 });
    expect(refreshed.ok).toBe(true);
    if (refreshed.ok) {
      expect(getPlayerPlanet(refreshed.value).economy.energy.produced).toBeGreaterThan(
        basePlanet.economy.energy.produced,
      );
    }
  });
});
