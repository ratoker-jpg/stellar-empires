import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getBotProgressionPhase } from '../../src/simulation/bots/progressionPhase';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import { COMPLETE_BUILDING_CATALOGS } from '../../src/simulation/planet/completeBuildingCatalog';
import type { FactionId } from '../../src/simulation/planet/types';
import { getBuildingMaxLevel } from '../../src/simulation/progression/profile';
import type { GameState } from '../../src/simulation/types';

const BOT_CASES = [
  { empireId: 'aegis-bot', factionId: 'aegis' },
  { empireId: 'synod-bot', factionId: 'synod' },
  { empireId: 'veyra-bot', factionId: 'veyra' },
] as const satisfies readonly { readonly empireId: string; readonly factionId: FactionId }[];

function addShip(
  state: GameState,
  empireId: string,
  unitId: string,
): GameState {
  const planet = state.planets.find((candidate) => candidate.ownerEmpireId === empireId);
  if (planet === undefined) throw new Error(`Bot planet missing: ${empireId}.`);
  return {
    ...state,
    planets: state.planets.map((candidate) =>
      candidate.id === planet.id
        ? {
            ...candidate,
            inventory: {
              ...candidate.inventory,
              ships: {
                ...candidate.inventory.ships,
                [unitId]: (candidate.inventory.ships[unitId] ?? 0) + 1,
              },
            },
          }
        : candidate,
    ),
  };
}

function addEndgamePreparationInfrastructure(
  state: GameState,
  empireId: string,
  factionId: FactionId,
): GameState {
  const planet = state.planets.find((candidate) => candidate.ownerEmpireId === empireId);
  if (planet === undefined) throw new Error(`Bot planet missing: ${empireId}.`);
  const buildings = COMPLETE_BUILDING_CATALOGS[factionId].map((definition) => ({
    buildingId: definition.id,
    level: getBuildingMaxLevel(state.campaignSettings.progressionProfile, definition),
  }));
  return {
    ...state,
    planets: state.planets.map((candidate) =>
      candidate.id === planet.id ? { ...candidate, buildings } : candidate,
    ),
  };
}

describe('deterministic bot progression phases', () => {
  it.each(BOT_CASES)(
    'derives the full ordinary-capability sequence for $factionId',
    ({ empireId, factionId }) => {
      const roles = getFactionMechanicalRoles(factionId).ships;
      let state = createInitialGameState(`bot-phase-${factionId}`);
      expect(getBotProgressionPhase(state, empireId)).toBe('foundation');

      state = addShip(state, empireId, roles.scout);
      expect(getBotProgressionPhase(state, empireId)).toBe('reconnaissance');

      state = addShip(state, empireId, roles.fighter);
      expect(getBotProgressionPhase(state, empireId)).toBe('first-combat');

      state = addShip(state, empireId, roles.colonizer);
      expect(getBotProgressionPhase(state, empireId)).toBe('colonization');

      state = addShip(state, empireId, roles.frigate);
      expect(getBotProgressionPhase(state, empireId)).toBe('heavy-fleet');

      state = addShip(state, empireId, roles.dreadnought);
      expect(getBotProgressionPhase(state, empireId)).toBe('planet-destruction');

      state = addEndgamePreparationInfrastructure(state, empireId, factionId);
      expect(getBotProgressionPhase(state, empireId)).toBe('endgame-preparation');
    },
  );

  it('does not skip missing earlier capabilities', () => {
    const state = createInitialGameState('bot-phase-no-skip');
    const roles = getFactionMechanicalRoles('aegis').ships;
    const withDestroyerOnly = addShip(state, 'aegis-bot', roles.dreadnought);
    expect(getBotProgressionPhase(withDestroyerOnly, 'aegis-bot')).toBe('foundation');
  });
});
