import { describe, expect, it } from 'vitest';
import {
  getClassSkillBonusMaps,
  getTargetPriorityWeightPermille,
} from '../../src/simulation/combat/fleetDoctrine';
import { resolveBattle } from '../../src/simulation/combat/resolveBattle';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeCommand } from '../../src/simulation/reducer';

describe('fleet doctrine', () => {
  it('provides original class skills and target-priority weights', () => {
    expect(
      getClassSkillBonusMaps({ 'ship.aegis.scout': 4 }, 'screen').armor,
    ).toEqual({ 'ship.aegis.scout': 18 });
    expect(
      getClassSkillBonusMaps({ 'ship.aegis.fighter': 4 }, 'wedge').weapon,
    ).toEqual({ 'ship.aegis.fighter': 15 });
    expect(
      getTargetPriorityWeightPermille('interceptors', 'ship.aegis.scout'),
    ).toBeGreaterThan(
      getTargetPriorityWeightPermille('interceptors', 'ship.aegis.frigate'),
    );
  });

  it('updates doctrine only for a stationed owned fleet', () => {
    const initial = createInitialGameState('fleet-doctrine-command');
    const planet = initial.planets.find((candidate) => candidate.ownerEmpireId === 'player');
    if (planet === undefined) throw new Error('Player planet is missing.');
    const state = {
      ...initial,
      fleets: [
        ...initial.fleets,
        {
          id: 'player-doctrine-fleet',
          empireId: 'player',
          originPlanetId: planet.id,
          location: { type: 'planet' as const, planetId: planet.id },
          status: 'stationed' as const,
          ships: { 'ship.aegis.fighter': 5 },
          cargo: { metal: 0, crystal: 0, gas: 0 },
          speed: 12,
          cargoCapacity: 0,
          formation: 'line' as const,
          targetPriority: 'balanced' as const,
          mission: null,
        },
      ],
    };
    const result = executeCommand(state, {
      type: 'SET_FLEET_COMBAT_DOCTRINE',
      empireId: 'player',
      fleetId: 'player-doctrine-fleet',
      formation: 'wedge',
      targetPriority: 'capitals',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(
      result.value.fleets.find((fleet) => fleet.id === 'player-doctrine-fleet'),
    ).toMatchObject({ formation: 'wedge', targetPriority: 'capitals' });
  });

  it('changes damage and target allocation deterministically', () => {
    const line = resolveBattle(
      73,
      {
        empireId: 'player',
        units: { 'ship.aegis.fighter': 12 },
        weaponBonusPercent: 0,
        armorBonusPercent: 0,
        formation: 'line',
        targetPriority: 'balanced',
      },
      {
        empireId: 'enemy',
        units: { 'ship.aegis.scout': 8, 'ship.aegis.frigate': 4 },
        weaponBonusPercent: 0,
        armorBonusPercent: 0,
      },
    );
    const wedge = resolveBattle(
      73,
      {
        empireId: 'player',
        units: { 'ship.aegis.fighter': 12 },
        weaponBonusPercent: 0,
        armorBonusPercent: 0,
        formation: 'wedge',
        targetPriority: 'interceptors',
      },
      {
        empireId: 'enemy',
        units: { 'ship.aegis.scout': 8, 'ship.aegis.frigate': 4 },
        weaponBonusPercent: 0,
        armorBonusPercent: 0,
      },
    );
    expect(wedge.rounds[0]?.attackerDamage ?? 0).toBeGreaterThan(
      line.rounds[0]?.attackerDamage ?? 0,
    );
    const scoutAllocation = wedge.rounds[0]?.attackerTargetBreakdown.find(
      (target) => target.targetUnitId === 'ship.aegis.scout',
    )?.allocatedBaseDamage ?? 0;
    const frigateAllocation = wedge.rounds[0]?.attackerTargetBreakdown.find(
      (target) => target.targetUnitId === 'ship.aegis.frigate',
    )?.allocatedBaseDamage ?? 0;
    expect(scoutAllocation).toBeGreaterThan(frigateAllocation);
  });
});
