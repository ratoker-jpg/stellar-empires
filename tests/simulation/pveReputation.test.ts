import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  applyExpeditionEventWithReturn,
  applySpaceObjectMissionEventWithReturn,
} from '../../src/simulation/pve/specialMissionReturn';
import {
  calculatePirateReputationAward,
  getEmpirePveReputation,
  getPveReputationTier,
} from '../../src/simulation/pveMeta/reputation';
import type { FleetState } from '../../src/simulation/fleets/types';
import type { GameState, ScheduledGameEvent } from '../../src/simulation/types';

function playerOrigin(state: GameState) {
  const origin = state.planets.find((planet) => planet.ownerEmpireId === 'player');
  if (origin === undefined) throw new Error('Player origin missing.');
  return origin;
}

function expeditionFixture(outcome: 'salvage' | 'research-cache' | 'hazard' | 'empty') {
  const initial = createInitialGameState(`reputation-expedition-${outcome}`);
  const origin = playerOrigin(initial);
  const targetId = 'expedition-target';
  const fleet: FleetState = {
    id: 'reputation-expedition-fleet',
    empireId: 'player',
    originPlanetId: origin.id,
    location: {
      type: 'transit',
      fromPlanetId: origin.id,
      toPlanetId: targetId,
      departedAt: 0,
      arrivesAt: 10,
    },
    status: 'outbound',
    ships: { 'ship.aegis.scout': 1 },
    cargo: { metal: 0, crystal: 0, gas: 0 },
    speed: 10,
    cargoCapacity: 100,
    mission: { kind: 'expedition', targetPlanetId: targetId },
  };
  const reward = outcome === 'empty'
    ? { metal: 0, crystal: 0, gas: 0 }
    : { metal: 10, crystal: 5, gas: 2 };
  const event: ScheduledGameEvent = {
    id: 'event-expedition-reputation',
    executeAt: 10,
    sequence: 0,
    payload: {
      type: 'EXPEDITION_RESOLVE',
      report: {
        id: 'expedition-reputation',
        empireId: 'player',
        fleetId: fleet.id,
        originPlanetId: origin.id,
        targetGalaxyPlanetId: targetId,
        startedAt: 0,
        resolvesAt: 10,
        outcome,
        reward,
        losses: {},
        narrative: 'fixture',
      },
    },
  };
  return { state: { ...initial, fleets: [...initial.fleets, fleet] }, event };
}

describe('PvE reputation', () => {
  it('derives the accepted immutable tiers', () => {
    expect(getPveReputationTier(0)).toBe('recruit');
    expect(getPveReputationTier(99)).toBe('recruit');
    expect(getPveReputationTier(100)).toBe('ranger');
    expect(getPveReputationTier(300)).toBe('vanguard');
    expect(getPveReputationTier(700)).toBe('warden');
  });

  it('awards a successful expedition once and awards empty outcomes zero', () => {
    const successful = expeditionFixture('salvage');
    const resolved = applyExpeditionEventWithReturn(successful.state, successful.event);
    expect(getEmpirePveReputation(resolved.pveMeta!, 'player')?.reputation).toBe(10);
    const duplicate = applyExpeditionEventWithReturn(resolved, successful.event);
    expect(getEmpirePveReputation(duplicate.pveMeta!, 'player')?.reputation).toBe(10);

    const empty = expeditionFixture('empty');
    const emptyResolved = applyExpeditionEventWithReturn(empty.state, empty.event);
    expect(getEmpirePveReputation(emptyResolved.pveMeta!, 'player')?.reputation).toBe(0);
  });

  it('awards positive space-object yield once', () => {
    const initial = createInitialGameState('reputation-space-object');
    const origin = playerOrigin(initial);
    const object = initial.spaceObjects[0];
    if (object === undefined) throw new Error('Space object missing.');
    const fleet: FleetState = {
      id: 'reputation-object-fleet',
      empireId: 'player',
      originPlanetId: origin.id,
      location: {
        type: 'transit',
        fromPlanetId: origin.id,
        toPlanetId: object.id,
        departedAt: 0,
        arrivesAt: 10,
      },
      status: 'outbound',
      ships: { 'ship.aegis.scout': 1 },
      cargo: { metal: 0, crystal: 0, gas: 0 },
      speed: 10,
      cargoCapacity: 100,
      mission: { kind: 'space-object', targetPlanetId: object.id },
    };
    const event: ScheduledGameEvent = {
      id: 'event-object-reputation',
      executeAt: 10,
      sequence: 0,
      payload: {
        type: 'SPACE_OBJECT_MISSION_RESOLVE',
        report: {
          id: 'object-reputation',
          empireId: 'player',
          fleetId: fleet.id,
          originPlanetId: origin.id,
          objectId: object.id,
          startedAt: 0,
          resolvesAt: 10,
          reward: { metal: 10, crystal: 0, gas: 0, exoticMatter: 0 },
          depletion: 10,
          losses: {},
          controllerUntil: 100,
          narrative: 'fixture',
        },
      },
    };
    const state = { ...initial, fleets: [...initial.fleets, fleet] };
    const resolved = applySpaceObjectMissionEventWithReturn(state, event);
    expect(getEmpirePveReputation(resolved.pveMeta!, 'player')?.reputation).toBe(15);
    const duplicate = applySpaceObjectMissionEventWithReturn(resolved, event);
    expect(getEmpirePveReputation(duplicate.pveMeta!, 'player')?.reputation).toBe(15);
  });

  it('awards pirate destruction and the active-hunt bonus only on destruction', () => {
    expect(calculatePirateReputationAward(false, false)).toBe(0);
    expect(calculatePirateReputationAward(false, true)).toBe(0);
    expect(calculatePirateReputationAward(true, false)).toBe(30);
    expect(calculatePirateReputationAward(true, true)).toBe(50);
  });
});
