import {
  getFactionIdForEmpire,
  getResearchCatalogForFaction,
  getUnitCatalogForFaction,
} from '../factions/factionMechanicalCatalogRegistry';
import { getFactionMechanicalRoles } from '../factions/factionMechanicalRoles';
import {
  getResearchMaxLevelById,
  resolveResearchRequirement,
} from '../progression/profile';
import type { GameState } from '../types';
import type { UnitDefinition } from '../units/types';
import type { BotProgressionPhase } from './progressionPhase';

export interface BotResearchTarget {
  readonly technologyId: string;
  readonly level: number;
}

export interface BotProductionTarget {
  readonly unitId: string;
  readonly quantity: number;
  readonly desiredTotal: number;
}

function phaseShipTargets(
  state: GameState,
  empireId: string,
  phase: BotProgressionPhase,
): readonly string[] {
  const factionId = getFactionIdForEmpire(state, empireId);
  const roles = getFactionMechanicalRoles(factionId).ships;
  switch (phase) {
    case 'foundation':
      return [roles.scout];
    case 'reconnaissance':
      return [roles.fighter, roles.corvette];
    case 'first-combat':
      return [roles.colonizer];
    case 'colonization':
      return [roles.frigate, roles.cruiser];
    case 'heavy-fleet':
      return [roles.dreadnought];
    case 'planet-destruction':
    case 'endgame-preparation':
      return [];
  }
}

export function getBotPhaseResearchTargets(
  state: GameState,
  empireId: string,
  phase: BotProgressionPhase,
  threatened: boolean,
): readonly BotResearchTarget[] {
  const factionId = getFactionIdForEmpire(state, empireId);
  const profileId = state.campaignSettings.progressionProfile;
  const roles = getFactionMechanicalRoles(factionId);
  const researchCatalog = getResearchCatalogForFaction(factionId);
  const researchById = new Map(
    researchCatalog.map((definition) => [definition.id, definition]),
  );
  const unitsById = new Map(
    getUnitCatalogForFaction(factionId).map((definition) => [definition.id, definition]),
  );
  const levels = new Map<string, number>();
  const order: string[] = [];

  const addTarget = (technologyId: string, requestedLevel: number): void => {
    const maximum = getResearchMaxLevelById(profileId, technologyId) ?? requestedLevel;
    const level = Math.min(requestedLevel, maximum);
    const currentTarget = levels.get(technologyId) ?? 0;
    if (currentTarget >= level) return;
    const definition = researchById.get(technologyId);
    if (definition === undefined) return;
    for (const rawRequirement of definition.requirements) {
      const requirement = resolveResearchRequirement(profileId, rawRequirement);
      addTarget(requirement.technologyId, requirement.level);
    }
    levels.set(technologyId, level);
    if (!order.includes(technologyId)) order.push(technologyId);
  };

  const addUnitRequirements = (unitId: string): void => {
    const definition: UnitDefinition | undefined = unitsById.get(unitId);
    if (definition === undefined) return;
    for (const rawRequirement of definition.researchRequirements) {
      const requirement = resolveResearchRequirement(profileId, rawRequirement);
      addTarget(requirement.technologyId, requirement.level);
    }
  };

  for (const unitId of phaseShipTargets(state, empireId, phase)) {
    addUnitRequirements(unitId);
  }

  const baselineTargets: readonly BotResearchTarget[] = [
    { technologyId: roles.research.construction, level: 2 },
    { technologyId: roles.research.energy, level: 2 },
    { technologyId: roles.research.sensors, level: 2 },
    { technologyId: roles.research.propulsion, level: 2 },
    { technologyId: roles.research.logistics, level: 2 },
    { technologyId: roles.research.colonization, level: 1 },
    { technologyId: roles.research.protection, level: threatened ? 3 : 2 },
    { technologyId: roles.research.weapons, level: threatened ? 3 : 2 },
    { technologyId: roles.research.advancedProtection, level: 2 },
    { technologyId: roles.research.battleNetwork, level: 2 },
  ];
  for (const target of baselineTargets) addTarget(target.technologyId, target.level);

  return order.map((technologyId) => ({
    technologyId,
    level: levels.get(technologyId) ?? 1,
  }));
}

export function getBotPhaseProductionTargets(
  state: GameState,
  empireId: string,
  phase: BotProgressionPhase,
  threatened: boolean,
): readonly BotProductionTarget[] {
  const factionId = getFactionIdForEmpire(state, empireId);
  const roles = getFactionMechanicalRoles(factionId).ships;
  const primary: readonly BotProductionTarget[] = (() => {
    switch (phase) {
      case 'foundation':
        return [
          { unitId: roles.scout, quantity: 1, desiredTotal: 1 },
          { unitId: roles.transport, quantity: 1, desiredTotal: 1 },
        ];
      case 'reconnaissance':
        return [
          { unitId: roles.fighter, quantity: 2, desiredTotal: 2 },
          { unitId: roles.corvette, quantity: 1, desiredTotal: 1 },
        ];
      case 'first-combat':
        return [
          { unitId: roles.colonizer, quantity: 1, desiredTotal: 1 },
          { unitId: roles.transport, quantity: 1, desiredTotal: 1 },
        ];
      case 'colonization':
        return [
          { unitId: roles.frigate, quantity: 1, desiredTotal: 1 },
          { unitId: roles.cruiser, quantity: 1, desiredTotal: 1 },
          { unitId: roles.recycler, quantity: 1, desiredTotal: 1 },
        ];
      case 'heavy-fleet':
        return [
          { unitId: roles.dreadnought, quantity: 1, desiredTotal: 1 },
          { unitId: roles.cruiser, quantity: 1, desiredTotal: 2 },
        ];
      case 'planet-destruction':
      case 'endgame-preparation':
        return [
          { unitId: roles.dreadnought, quantity: 1, desiredTotal: 2 },
          { unitId: roles.cruiser, quantity: 1, desiredTotal: 3 },
          { unitId: roles.frigate, quantity: 1, desiredTotal: 3 },
        ];
    }
  })();
  const pressure: readonly BotProductionTarget[] = threatened
    ? [
        { unitId: roles.fighter, quantity: 3, desiredTotal: 6 },
        { unitId: roles.corvette, quantity: 2, desiredTotal: 4 },
      ]
    : [];
  return [...primary, ...pressure];
}
