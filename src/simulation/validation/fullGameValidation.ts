import { createInitialGameState } from '../createInitialGameState';
import {
  getFactionCatalogCompleteness,
  getFactionMechanicalCatalog,
  validateFactionMechanicalCatalog,
} from '../factions/factionMechanicalCatalogRegistry';
import { COMPLETE_BUILDING_CATALOGS } from '../planet/completeBuildingCatalog';
import type { FactionId } from '../planet/types';
import { COMPLETE_RESEARCH_CATALOGS } from '../research/completeResearchCatalog';
import { queueUnitBatch } from '../units/productionCommands';
import { COMPLETE_COMMANDER_SHIP_CATALOG } from '../units/completeCommanderShipCatalog';
import type { GameState } from '../types';

export interface FullGameValidationIssue {
  readonly code: string;
  readonly factionId?: FactionId;
  readonly mechanicalId?: string;
  readonly details?: string;
}

function richStateForFaction(factionId: FactionId, seed: string): GameState {
  const state = createInitialGameState(seed, factionId);
  const buildings = COMPLETE_BUILDING_CATALOGS[factionId].map((definition) => ({
    buildingId: definition.id,
    level: definition.maxLevel,
  }));
  const levels = Object.fromEntries(
    COMPLETE_RESEARCH_CATALOGS[factionId].map((definition) => [
      definition.id,
      definition.maxLevel,
    ]),
  );
  return {
    ...state,
    planets: state.planets.map((planet) =>
      planet.ownerEmpireId !== 'player'
        ? planet
        : {
            ...planet,
            buildings,
            economy: {
              ...planet.economy,
              resources: {
                metal: { ...planet.economy.resources.metal, amount: 50_000_000, capacity: 50_000_000 },
                crystal: { ...planet.economy.resources.crystal, amount: 50_000_000, capacity: 50_000_000 },
                gas: { ...planet.economy.resources.gas, amount: 50_000_000, capacity: 50_000_000 },
              },
              energy: { produced: 100_000, consumed: 0, efficiencyPermille: 1_000 },
              population: { used: 0, capacity: 100_000 },
              stability: { capacity: 100_000, demand: 0, efficiencyPermille: 1_000 },
            },
          },
    ),
    research: state.research.map((research) =>
      research.empireId === 'player' ? { ...research, levels } : research,
    ),
    commanders: state.commanders.map((command) =>
      command.empireId === 'player'
        ? { ...command, experience: 1_000_000, level: 40 }
        : command,
    ),
  };
}

export function validateFullGameCatalogClosure(): readonly FullGameValidationIssue[] {
  const issues: FullGameValidationIssue[] = [];
  for (const factionId of ['aegis', 'synod', 'veyra'] as const) {
    const catalog = getFactionMechanicalCatalog(factionId);
    for (const details of validateFactionMechanicalCatalog(catalog)) {
      issues.push({ code: 'CATALOG_DEPENDENCY_ERROR', factionId, details });
    }
    const completeness = getFactionCatalogCompleteness(factionId);
    if (!completeness.complete) {
      issues.push({
        code: 'CATALOG_INCOMPLETE',
        factionId,
        details: JSON.stringify(completeness.current),
      });
    }
  }
  if (COMPLETE_COMMANDER_SHIP_CATALOG.length !== 13) {
    issues.push({
      code: 'COMMANDER_CATALOG_COUNT',
      details: `${COMPLETE_COMMANDER_SHIP_CATALOG.length}/13`,
    });
  }
  return issues;
}

export function validateFullGameProductionPaths(
  seed = 'full-game-production-validation',
): readonly FullGameValidationIssue[] {
  const issues: FullGameValidationIssue[] = [];
  for (const factionId of ['aegis', 'synod', 'veyra'] as const) {
    const catalog = getFactionMechanicalCatalog(factionId);
    const definitions = [...catalog.units, ...COMPLETE_COMMANDER_SHIP_CATALOG];
    for (const definition of definitions) {
      const state = richStateForFaction(factionId, `${seed}:${factionId}:${definition.id}`);
      const planet = state.planets.find((candidate) => candidate.ownerEmpireId === 'player');
      if (planet === undefined) {
        issues.push({ code: 'PLAYER_PLANET_MISSING', factionId });
        continue;
      }
      const result = queueUnitBatch(state, {
        type: 'QUEUE_UNIT_BATCH',
        empireId: 'player',
        planetId: planet.id,
        unitId: definition.id,
        quantity: 1,
      });
      if (!result.ok) {
        issues.push({
          code: result.code,
          factionId,
          mechanicalId: definition.id,
          details: result.message,
        });
      }
    }
  }
  return issues;
}

export function runFullGameValidation(
  seed = 'full-game-validation',
): readonly FullGameValidationIssue[] {
  return [
    ...validateFullGameCatalogClosure(),
    ...validateFullGameProductionPaths(seed),
  ];
}
