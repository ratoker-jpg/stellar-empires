import type { ProgressionProfileId } from '../campaign/settings';
import { getFactionMechanicalRoles } from '../factions/factionMechanicalRoles';
import { getBuildingLevel } from '../planet/buildingProgression';
import type { PlanetState } from '../planet/types';
import {
  getBuildingMaxLevelById,
  resolveResearchRequirement,
} from '../progression/profile';
import {
  getLegacyResearchIdsForCanonical,
  resolveCanonicalResearchId,
} from './researchAliases';
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
  const canonicalId = resolveCanonicalResearchId(technologyId);
  let level = state.levels[canonicalId] ?? 0;
  for (const legacyId of getLegacyResearchIdsForCanonical(canonicalId)) {
    level = Math.max(level, state.levels[legacyId] ?? 0);
  }
  return level;
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
  profileId: ProgressionProfileId,
): readonly MissingResearchRequirement[] {
  const missing: MissingResearchRequirement[] = [];
  const laboratoryId = getFactionMechanicalRoles(planet.factionId).buildings.laboratory;
  const laboratoryLevel = getBuildingLevel(planet.buildings, laboratoryId);
  const laboratoryCap = getBuildingMaxLevelById(profileId, laboratoryId);
  const requiredLaboratoryLevel = laboratoryCap === undefined
    ? definition.requiredLaboratoryLevel
    : Math.min(definition.requiredLaboratoryLevel, laboratoryCap);

  if (laboratoryLevel < requiredLaboratoryLevel) {
    missing.push({
      type: 'laboratory',
      id: laboratoryId,
      requiredLevel: requiredLaboratoryLevel,
      currentLevel: laboratoryLevel,
    });
  }

  for (const sourceRequirement of definition.requirements) {
    const requirement = resolveResearchRequirement(profileId, sourceRequirement);
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
