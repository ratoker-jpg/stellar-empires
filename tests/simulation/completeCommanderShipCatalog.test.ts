import { describe, expect, it } from 'vitest';
import { resolveCompleteMechanicalAsset } from '../../src/assets/completeMechanicalAssetManifest';
import {
  getCommanderFleetEffects,
  selectActiveCommanderShip,
} from '../../src/simulation/command/commanderShips';
import { COMMAND_LEVEL_THRESHOLDS } from '../../src/simulation/command/commandDoctrine';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionCatalogCompleteness } from '../../src/simulation/factions/factionMechanicalCatalogRegistry';
import { getCompleteBuildingIds } from '../../src/simulation/planet/completeBuildingCatalog';
import { executeCommand } from '../../src/simulation/reducer';
import {
  COMPLETE_COMMANDER_SHIP_CATALOG,
  getCompleteCommanderShipId,
} from '../../src/simulation/units/completeCommanderShipCatalog';
import { runFullGameValidation } from '../../src/simulation/validation/fullGameValidation';
import type { GameState } from '../../src/simulation/types';

function prepareCommanderProduction(state: GameState): GameState {
  const shipyardId = getCompleteBuildingIds('aegis').shipyard;
  return {
    ...state,
    planets: state.planets.map((planet) =>
      planet.ownerEmpireId !== 'player'
        ? planet
        : {
            ...planet,
            buildings: [
              ...planet.buildings.filter((building) => building.buildingId !== shipyardId),
              { buildingId: shipyardId, level: 15 },
            ],
            economy: {
              ...planet.economy,
              resources: {
                metal: { ...planet.economy.resources.metal, amount: 100_000, capacity: 100_000 },
                crystal: { ...planet.economy.resources.crystal, amount: 100_000, capacity: 100_000 },
                gas: { ...planet.economy.resources.gas, amount: 100_000, capacity: 100_000 },
              },
              population: { used: 0, capacity: 10_000 },
            },
          },
    ),
    commanders: state.commanders.map((command) =>
      command.empireId === 'player'
        ? { ...command, experience: 1_000_000, level: 40 }
        : command,
    ),
  };
}

function playerPlanet(state: GameState) {
  const planet = state.planets.find((candidate) => candidate.ownerEmpireId === 'player');
  if (planet === undefined) throw new Error('Player planet missing.');
  return planet;
}

describe('complete Commander Ship catalog', () => {
  it('registers thirteen unique shared ships with source asset resolution', () => {
    expect(COMPLETE_COMMANDER_SHIP_CATALOG).toHaveLength(13);
    expect(new Set(COMPLETE_COMMANDER_SHIP_CATALOG.map((definition) => definition.id)).size).toBe(13);
    for (const definition of COMPLETE_COMMANDER_SHIP_CATALOG) {
      expect(definition.id).toMatch(/^commander\.shared\./);
      expect(definition.factionId).toBe('shared');
      expect(definition.role).toBe('commander');
      expect(definition.commanderAbility).toBeDefined();
      expect(definition.requiredAdmiralLevel).toBeGreaterThanOrEqual(2);
      const resolution = resolveCompleteMechanicalAsset(definition.id);
      expect(resolution.source).toBe('current-runtime-fallback');
      expect(resolution.asset?.id).toBe(definition.id);
      expect(resolution.provenancePath).toContain('/comander_ship/commander-ship.');
    }
  });

  it('extends deterministic Admiral progression through level 40', () => {
    expect(COMMAND_LEVEL_THRESHOLDS).toHaveLength(40);
    expect(COMMAND_LEVEL_THRESHOLDS.slice(0, 5)).toEqual([0, 100, 300, 700, 1_500]);
    expect(COMMAND_LEVEL_THRESHOLDS.every((threshold, index) =>
      index === 0 || threshold > COMMAND_LEVEL_THRESHOLDS[index - 1]!,
    )).toBe(true);
  });

  it('selects exactly one active ability from the appointed flagship', () => {
    const units = {
      [getCompleteCommanderShipId('executor')]: 1,
      [getCompleteCommanderShipId('annihilator')]: 1,
    };
    const command = {
      empireId: 'player', doctrineId: 'adaptive' as const, experience: 1_000_000,
      level: 40, flagshipFleetId: 'flagship-1',
    };
    const active = selectActiveCommanderShip(command, 'flagship-1', units);
    expect(active?.unitId).toBe(getCompleteCommanderShipId('annihilator'));
    expect(selectActiveCommanderShip(command, 'other-fleet', units)).toBeUndefined();
    const state = { commanders: [command] };
    expect(getCommanderFleetEffects(state, 'player', 'flagship-1', units)).toMatchObject({
      activeCommanderId: getCompleteCommanderShipId('annihilator'),
      activeEffect: 'demolition',
    });
  });

  it('produces a Commander Ship and rejects an empire-wide duplicate', () => {
    const initial = prepareCommanderProduction(createInitialGameState('commander-production'));
    const planet = playerPlanet(initial);
    const commanderId = getCompleteCommanderShipId('corsair');
    const queued = executeCommand(initial, {
      type: 'QUEUE_UNIT_BATCH', empireId: 'player', planetId: planet.id,
      unitId: commanderId, quantity: 1,
    });
    expect(queued.ok).toBe(true);
    if (!queued.ok) return;
    const duplicate = executeCommand(queued.value, {
      type: 'QUEUE_UNIT_BATCH', empireId: 'player', planetId: planet.id,
      unitId: commanderId, quantity: 1,
    });
    expect(duplicate).toMatchObject({ ok: false, code: 'COMMANDER_OWNERSHIP_LIMIT' });
  });

  it('closes the complete catalog gate and all production paths', () => {
    for (const factionId of ['aegis', 'synod', 'veyra'] as const) {
      expect(getFactionCatalogCompleteness(factionId)).toMatchObject({
        current: { buildings: 24, technologies: 22, ships: 13, defenses: 9, commanderShips: 13 },
        complete: true,
      });
    }
    expect(runFullGameValidation('commander-full-game')).toEqual([]);
  });
});
