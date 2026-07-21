import { describe, expect, it } from 'vitest';
import { resolveBattle } from '../../src/simulation/combat/resolveBattle';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState } from '../../src/simulation/types';
import {
  applyCargoUpgrades,
  getShipUpgradeLevels,
} from '../../src/simulation/upgrades/shipUpgrades';

function prepareUpgradeState(): { readonly state: GameState; readonly planetId: string } {
  const initial = createInitialGameState('ship-upgrades');
  const planet = initial.planets.find((candidate) => candidate.ownerEmpireId === 'player');
  if (planet === undefined) throw new Error('Player planet is missing.');
  const hasShipyard = planet.buildings.some(
    (building) => building.buildingId === 'building.aegis.shipyard',
  );
  const buildings = hasShipyard
    ? planet.buildings.map((building) =>
        building.buildingId === 'building.aegis.shipyard'
          ? { ...building, level: Math.max(2, building.level) }
          : building,
      )
    : [...planet.buildings, { buildingId: 'building.aegis.shipyard', level: 2 }];
  const upgradedPlanet = {
    ...planet,
    buildings,
    economy: {
      ...planet.economy,
      resources: Object.fromEntries(
        Object.entries(planet.economy.resources).map(([resourceId, stock]) => [
          resourceId,
          { ...stock, amount: 10_000_000, capacity: 20_000_000 },
        ]),
      ) as typeof planet.economy.resources,
    },
  };
  return {
    state: {
      ...initial,
      planets: initial.planets.map((candidate) =>
        candidate.id === planet.id ? upgradedPlanet : candidate,
      ),
    },
    planetId: planet.id,
  };
}

describe('ship upgrades', () => {
  it('queues and deterministically completes a hull upgrade', () => {
    const prepared = prepareUpgradeState();
    const queued = executeCommand(prepared.state, {
      type: 'QUEUE_SHIP_UPGRADE',
      empireId: 'player',
      planetId: prepared.planetId,
      unitId: 'ship.aegis.fighter',
      track: 'weapons',
    });
    expect(queued.ok, queued.ok ? undefined : `${queued.code}: ${queued.message}`).toBe(true);
    if (!queued.ok) return;

    const item = queued.value.shipUpgrades.find((entry) => entry.empireId === 'player')?.queue[0];
    expect(item).toBeDefined();
    expect(
      queued.value.pendingEvents.some(
        (event) => event.payload.type === 'SHIP_UPGRADE_COMPLETE',
      ),
    ).toBe(true);
    if (item === undefined) return;

    const completed = executeCommand(queued.value, {
      type: 'ADVANCE_TIME',
      seconds: item.completesAt - queued.value.clock.elapsedSeconds,
    });
    expect(completed.ok).toBe(true);
    if (!completed.ok) return;
    expect(
      getShipUpgradeLevels(
        completed.value.shipUpgrades,
        'player',
        'ship.aegis.fighter',
      ).weapons,
    ).toBe(1);
    expect(
      completed.value.shipUpgrades.find((entry) => entry.empireId === 'player')?.queue,
    ).toEqual([]);
  });

  it('cancels an upgrade, clears its event and refunds part of the cost', () => {
    const prepared = prepareUpgradeState();
    const before = prepared.state.planets.find((planet) => planet.id === prepared.planetId)!;
    const queued = executeCommand(prepared.state, {
      type: 'QUEUE_SHIP_UPGRADE',
      empireId: 'player',
      planetId: prepared.planetId,
      unitId: 'ship.aegis.frigate',
      track: 'armor',
    });
    expect(queued.ok, queued.ok ? undefined : `${queued.code}: ${queued.message}`).toBe(true);
    if (!queued.ok) return;
    const item = queued.value.shipUpgrades.find((entry) => entry.empireId === 'player')?.queue[0];
    expect(item).toBeDefined();
    if (item === undefined) return;

    const canceled = executeCommand(queued.value, {
      type: 'CANCEL_SHIP_UPGRADE',
      empireId: 'player',
      queueItemId: item.id,
    });
    expect(canceled.ok).toBe(true);
    if (!canceled.ok) return;
    const after = canceled.value.planets.find((planet) => planet.id === prepared.planetId)!;
    expect(after.economy.resources.metal.amount).toBeGreaterThan(
      queued.value.planets.find((planet) => planet.id === prepared.planetId)!.economy.resources.metal.amount,
    );
    expect(after.economy.resources.metal.amount).toBeLessThan(before.economy.resources.metal.amount);
    expect(canceled.value.pendingEvents).not.toContainEqual(
      expect.objectContaining({ payload: expect.objectContaining({ queueItemId: item.id }) }),
    );
  });

  it('applies cargo and per-hull combat bonuses', () => {
    const initial = createInitialGameState('ship-upgrade-effects');
    const upgrades = initial.shipUpgrades.map((entry) =>
      entry.empireId === 'player'
        ? {
            ...entry,
            levels: {
              'ship.aegis.fighter': { weapons: 10, armor: 0, cargo: 2 },
            },
          }
        : entry,
    );
    expect(
      applyCargoUpgrades(upgrades, 'player', { 'ship.aegis.fighter': 5 }, 100),
    ).toBe(116);

    const base = resolveBattle(
      42,
      {
        empireId: 'player',
        units: { 'ship.aegis.fighter': 10 },
        weaponBonusPercent: 0,
        armorBonusPercent: 0,
      },
      {
        empireId: 'enemy',
        units: { 'ship.aegis.frigate': 4 },
        weaponBonusPercent: 0,
        armorBonusPercent: 0,
      },
    );
    const upgraded = resolveBattle(
      42,
      {
        empireId: 'player',
        units: { 'ship.aegis.fighter': 10 },
        weaponBonusPercent: 0,
        armorBonusPercent: 0,
        unitWeaponBonusPercent: { 'ship.aegis.fighter': 60 },
      },
      {
        empireId: 'enemy',
        units: { 'ship.aegis.frigate': 4 },
        weaponBonusPercent: 0,
        armorBonusPercent: 0,
      },
    );
    expect(upgraded.rounds[0]?.attackerDamage ?? 0).toBeGreaterThan(
      base.rounds[0]?.attackerDamage ?? 0,
    );
  });
});
