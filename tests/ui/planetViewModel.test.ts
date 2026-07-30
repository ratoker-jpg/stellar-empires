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
  it('creates one building card for every complete Aegis catalog building', () => {
    const planet = getPlayerPlanet(createInitialGameState('planet-ui-cards'));
    const cards = createBuildingCardViewModels(planet, 'compressed-v1');

    expect(cards).toHaveLength(24);
    expect(new Set(cards.map((card) => card.id)).size).toBe(24);
    expect(cards.every((card) => card.asset.category === 'building')).toBe(true);
  });

  it('explains the prerequisite for the second metal extraction tier', () => {
    const planet = getPlayerPlanet(createInitialGameState('planet-ui-requirement'));
    const card = createBuildingCardViewModels(planet, 'compressed-v1').find(
      (candidate) => candidate.id === 'building.aegis.metal-bot-2',
    );

    expect(card).toBeDefined();
    expect(card?.available).toBe(false);
    expect(card?.blockReason).toBe('Буровой комплекс «Кестрел I» ур. 10');
  });

  it('marks ordinary actions blocked while preserving explicit endgame locks', () => {
    const initial = createInitialGameState('planet-ui-busy');
    const planet = getPlayerPlanet(initial);
    const queued = executeCommand(initial, {
      type: 'QUEUE_BUILDING',
      empireId: 'player',
      planetId: planet.id,
      buildingId: 'building.aegis.metal-bot-1',
    });

    expect(queued.ok).toBe(true);
    if (!queued.ok) return;

    const cards = createBuildingCardViewModels(
      getPlayerPlanet(queued.value),
      queued.value.campaignSettings.progressionProfile,
    );
    const ordinaryCards = cards.filter(
      (card) =>
        card.id !== 'building.aegis.aksum-obelisk' &&
        card.id !== 'building.aegis.supreme-galactic-gates',
    );
    expect(ordinaryCards.every((card) => !card.available)).toBe(true);
    expect(
      ordinaryCards.every((card) => card.blockReason === 'Очередь строительства занята'),
    ).toBe(true);
    expect(
      cards
        .filter((card) => card.id.includes('obelisk') || card.id.includes('galactic-gates'))
        .every((card) => card.blockReason === 'Откроется после внедрения союзного endgame'),
    ).toBe(true);
  });

  it('unlocks the second extraction tier after its prerequisite reaches level ten', () => {
    const initial = createInitialGameState('planet-ui-unlock');
    const planet = getPlayerPlanet(initial);
    const prepared = {
      ...planet,
      buildings: planet.buildings.map((building) =>
        building.buildingId === 'building.aegis.metal-bot-1'
          ? { ...building, level: 10 }
          : building,
      ),
    };

    const card = createBuildingCardViewModels(prepared, 'compressed-v1').find(
      (candidate) => candidate.id === 'building.aegis.metal-bot-2',
    );

    expect(card?.available).toBe(true);
    expect(card?.blockReason).toBeNull();
  });

  it('formats game durations for interface labels', () => {
    expect(formatGameDuration(45)).toBe('45с');
    expect(formatGameDuration(125)).toBe('2м 5с');
    expect(formatGameDuration(7_500)).toBe('2ч 5м');
  });
});
