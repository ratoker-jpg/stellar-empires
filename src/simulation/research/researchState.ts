import { getFactionMechanicalRoles } from '../factions/factionMechanicalRoles';
import { getBuildingLevel } from '../planet/buildingProgression';
import type { PlanetState } from '../planet/types';
import type { EmpireResearchState, ResearchDefinition } from './types';

export function createInitialResearchStates(
  empireIds: readonly string[],
): readonly EmpireResearchState[] {
  return empireIds.map((empireId) => ({ empireId, levels: {}, queue: [] }));
}

export function getEmpireResearch(
  states: readonly EmpireResearchState[],
  empireId: string,
): EmpireResearchState | undefined {
  return states.find((state) => state.empireId === empireId);
}

export function getResearchLevel(
  state: EmpireResearchState,
  technologyId: string,
): number {
  return state.levels[technologyId] ?? 0;
}

export interface MissingResearchRequirement {
  readonly type: 'technology' | 'laboratory';
  readonly id: string;
  readonly requiredLevel: number;
  readonly currentLevel: number;
}

export function findMissingResearchRequirements(
  definition: ResearchDefinition,
  research: EmpireResearchState,
  planet: PlanetState,
): readonly MissingResearchRequirement[] {
  const missing: MissingResearchRequirement[] = [];
  const laboratoryId = getFactionMechanicalRoles(planet.factionId).buildings.laboratory;
  const laboratoryLevel = getBuildingLevel(planet.buildings, laboratoryId);

  if (laboratoryLevel < definition.requiredLaboratoryLevel) {
    missing.push({
      type: 'laboratory',
      id: laboratoryId,
      requiredLevel: definition.requiredLaboratoryLevel,
      currentLevel: laboratoryLevel,
    });
  }

  for (const requirement of definition.requirements) {
    const currentLevel = getResearchLevel(research, requirement.technologyId);

    if (currentLevel < requirement.level) {
      missing.push({
        type: 'technology',
        id: requirement.technologyId,
        requiredLevel: requirement.level,
        currentLevel,
      });
    }
  }

  return missing;
}
