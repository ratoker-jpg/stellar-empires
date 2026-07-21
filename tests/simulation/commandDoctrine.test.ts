import { describe, expect, it } from 'vitest';
import {
  addCommandExperience,
  calculateCommandLevel,
  getCommandCombatEffects,
} from '../../src/simulation/command/commandDoctrine';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeCommand } from '../../src/simulation/reducer';

describe('command doctrine and flagships', () => {
  it('initializes every empire and calculates deterministic levels', () => {
    const state = createInitialGameState('command-initial');
    expect(state.commanders).toHaveLength(state.empires.length);
    expect(state.commanders.every((entry) => entry.level === 1 && entry.experience === 0)).toBe(true);
    expect(calculateCommandLevel(0)).toBe(1);
    expect(calculateCommandLevel(100)).toBe(2);
    expect(calculateCommandLevel(1_500)).toBe(5);
  });

  it('changes doctrine through the shared reducer and applies its effects', () => {
    const state = createInitialGameState('command-doctrine');
    const result = executeCommand(state, {
      type: 'SET_COMMAND_DOCTRINE',
      empireId: 'player',
      doctrineId: 'vanguard',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.commanders.find((entry) => entry.empireId === 'player')?.doctrineId).toBe('vanguard');
    expect(getCommandCombatEffects(result.value.commanders, 'player')).toMatchObject({
      weaponBonusPercent: 8,
      armorBonusPercent: -2,
      isFlagship: false,
    });
  });

  it('requires level two and an armed stationed fleet for a flagship', () => {
    const initial = createInitialGameState('command-flagship');
    const planet = initial.planets.find((candidate) => candidate.ownerEmpireId === 'player');
    if (planet === undefined) throw new Error('Player planet is missing.');
    const fleet = {
      id: 'player-flagship',
      empireId: 'player',
      originPlanetId: planet.id,
      location: { type: 'planet' as const, planetId: planet.id },
      status: 'stationed' as const,
      ships: { 'ship.aegis.fighter': 4 },
      cargo: { metal: 0, crystal: 0, gas: 0 },
      speed: 13,
      cargoCapacity: 120,
      formation: 'wedge' as const,
      targetPriority: 'balanced' as const,
      mission: null,
    };
    const levelOne = { ...initial, fleets: [...initial.fleets, fleet] };
    expect(executeCommand(levelOne, { type: 'ASSIGN_FLAGSHIP', empireId: 'player', fleetId: fleet.id })).toMatchObject({
      ok: false,
      code: 'FLAGSHIP_LEVEL_REQUIRED',
    });
    const levelTwo = {
      ...levelOne,
      commanders: addCommandExperience(levelOne.commanders, 'player', 100),
    };
    const assigned = executeCommand(levelTwo, {
      type: 'ASSIGN_FLAGSHIP',
      empireId: 'player',
      fleetId: fleet.id,
    });
    expect(assigned.ok).toBe(true);
    if (!assigned.ok) return;
    expect(getCommandCombatEffects(assigned.value.commanders, 'player', fleet.id)).toMatchObject({
      isFlagship: true,
      weaponBonusPercent: 11,
      armorBonusPercent: 11,
    });
  });

  it('awards adaptive doctrine experience deterministically', () => {
    const state = createInitialGameState('command-xp');
    const after = addCommandExperience(state.commanders, 'player', 100);
    const player = after.find((entry) => entry.empireId === 'player');
    expect(player).toMatchObject({ experience: 110, level: 2 });
  });
});
