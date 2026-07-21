import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState } from '../../src/simulation/types';
import {
  createBuildingCardViewModels,
  formatGameDuration,
} from '../../src/ui/planetViewModel';

function getPlayerPlanet(state: GameState) {
  const planet = state.planets.find((candidate) => candidate.ownerEmpireId === 'player');

  if (planet === undefined) {
    throw new Error('Player planet was not created.');
  }

  return planet;
}

describe('planet view model', () => {
  it('creates one building card for every Aegis catalog building', () => {
    const planet = getPlayerPlanet(createInitialGameState('planet-ui-cards'));
    const cards = createBuildingCardViewModels(planet);

    expect(cards).toHaveLength(12);
    expect(new Set(cards.map((card) => card.id)).size).toBe(12);
    expect(cards.every((card) => card.asset.category === 'building')).toBe(true);
  });

  it('explains that the research lab requires command center level two', () => {
    const planet = getPlayerPlanet(createInitialGameState('planet-ui-requirement'));
    const card = createBuildingCardViewModels(planet).find(
      (candidate) => candidate.id === 'building.aegis.research-lab',
    );

    expect(card).toBeDefined();
    expect(card?.available).toBe(false);
    expect(card?.blockReason).toBe('Центр командования ур. 2');
  });

  it('marks every action blocked while the construction queue is occupied', () => {
    const initial = createInitialGameState('planet-ui-busy');
    const planet = getPlayerPlanet(initial);
    const queued = executeCommand(initial, {
      type: 'QUEUE_BUILDING',
      empireId: 'player',
      planetId: planet.id,
      buildingId: 'building.aegis.command',
    });

    expect(queued.ok).toBe(true);

    if (!queued.ok) {
      return;
    }

    const cards = createBuildingCardViewModels(getPlayerPlanet(queued.value));
    expect(cards.every((card) => !card.available)).toBe(true);
    expect(cards.every((card) => card.blockReason === 'Очередь строительства занята')).toBe(
      true,
    );
  });

  it('unlocks the research lab after command center level two completes', () => {
    const initial = createInitialGameState('planet-ui-unlock');
    const planet = getPlayerPlanet(initial);
    const queued = executeCommand(initial, {
      type: 'QUEUE_BUILDING',
      empireId: 'player',
      planetId: planet.id,
      buildingId: 'building.aegis.command',
    });

    expect(queued.ok).toBe(true);

    if (!queued.ok) {
      return;
    }

    const queueItem = getPlayerPlanet(queued.value).buildQueue[0];
    expect(queueItem).toBeDefined();

    if (queueItem === undefined) {
      return;
    }

    const advanced = executeCommand(queued.value, {
      type: 'ADVANCE_TIME',
      seconds: queueItem.completesAt - queued.value.clock.elapsedSeconds,
    });

    expect(advanced.ok).toBe(true);

    if (!advanced.ok) {
      return;
    }

    const research = createBuildingCardViewModels(getPlayerPlanet(advanced.value)).find(
      (card) => card.id === 'building.aegis.research-lab',
    );

    expect(research?.available).toBe(true);
    expect(research?.blockReason).toBeNull();
  });

  it('formats game durations for interface labels', () => {
    expect(formatGameDuration(45)).toBe('45с');
    expect(formatGameDuration(125)).toBe('2м 5с');
    expect(formatGameDuration(7_500)).toBe('2ч 5м');
  });
});
