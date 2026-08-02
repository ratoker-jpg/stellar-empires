import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  createPveOperationsView,
  describeWorldEventEffect,
  filterPveOperationsView,
} from '../../src/simulation/pve/pveOperationsView';
import { startWorldEventAt } from '../../src/simulation/pve/worldEvents';
import type { GameState } from '../../src/simulation/types';

describe('canonical PvE operations view', () => {
  it('is pure, deterministic and ordered by actionable state before coordinate', () => {
    const initial = createInitialGameState('pve-operations-view-order');
    const object = initial.spaceObjects.find((candidate) => candidate.kind !== 'anomaly');
    if (object === undefined) throw new Error('Missing object fixture.');
    const withEvent = startWorldEventAt(
      initial,
      'mineral-bloom',
      'space-object',
      object.id,
      0,
      initial.clock.elapsedSeconds,
    );
    const before = JSON.stringify(withEvent);
    const first = createPveOperationsView(withEvent);
    const second = createPveOperationsView(withEvent);

    expect(first).toEqual(second);
    expect(first[0]).toMatchObject({
      kind: 'world-event',
      status: 'event-active',
      availabilityCode: 'active-world-event',
      targetId: object.id,
      rewardMultiplierPermille: 1_300,
    });
    expect(first.some((entry) => entry.kind === 'space-object')).toBe(true);
    expect(first.some((entry) => entry.kind === 'pirate-base')).toBe(true);
    expect(first.some((entry) => entry.kind === 'expedition')).toBe(true);
    expect(JSON.stringify(withEvent)).toBe(before);
  });

  it('shows exact object recovery and active-operation fields', () => {
    const initial = createInitialGameState('pve-operations-view-recovery');
    const object = initial.spaceObjects[0];
    if (object === undefined) throw new Error('Missing object fixture.');
    const recoveringAt = initial.clock.elapsedSeconds + 21_600;
    const recovering: GameState = {
      ...initial,
      spaceObjects: initial.spaceObjects.map((candidate) =>
        candidate.id === object.id
          ? { ...candidate, remainingYield: 0, cooldownUntil: recoveringAt }
          : candidate,
      ),
    };
    const entry = createPveOperationsView(recovering).find(
      (candidate) => candidate.kind === 'space-object' && candidate.targetId === object.id,
    );
    expect(entry).toMatchObject({
      status: 'recovering',
      availabilityCode: 'recovering',
      yieldRemaining: 0,
      yieldInitial: object.initialYield,
      recoveryAt: recoveringAt,
    });
  });

  it('describes world-event mechanics without revealing future outcomes', () => {
    const initial = createInitialGameState('pve-event-effects');
    const pirate = initial.planets.find((planet) => planet.ownerEmpireId === 'pirate-neutral');
    const object = initial.spaceObjects[0];
    const system = initial.galaxy.systems[0];
    if (pirate === undefined || object === undefined || system === undefined) {
      throw new Error('Missing event targets.');
    }
    const mineral = startWorldEventAt(initial, 'mineral-bloom', 'space-object', object.id, 0, 0)
      .worldEvents.active[0];
    const hunt = startWorldEventAt(initial, 'pirate-hunt', 'planet', pirate.id, 0, 0)
      .worldEvents.active[0];
    const storm = startWorldEventAt(initial, 'solar-storm', 'system', system.id, 0, 0)
      .worldEvents.active[0];
    if (mineral === undefined || hunt === undefined || storm === undefined) {
      throw new Error('Missing active events.');
    }
    expect(describeWorldEventEffect(mineral)).toContain('30%');
    expect(describeWorldEventEffect(hunt)).toContain('150%');
    expect(describeWorldEventEffect(storm)).toContain('20%');
    for (const description of [mineral, hunt, storm].map(describeWorldEventEffect)) {
      expect(description).not.toMatch(/победит|проиграет|получит/i);
    }
  });

  it('filters the shared model without changing stable order', () => {
    const entries = createPveOperationsView(createInitialGameState('pve-operations-filter'));
    const filtered = filterPveOperationsView(entries, ['space-object', 'world-event']);
    expect(filtered.every((entry) =>
      entry.kind === 'space-object' || entry.kind === 'world-event')).toBe(true);
    expect(filtered).toEqual(entries.filter((entry) =>
      entry.kind === 'space-object' || entry.kind === 'world-event'));
  });
});
