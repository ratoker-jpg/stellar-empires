import { calculateResearchEffects, type ResearchEffectSummary } from '../research/progression';
import { getEmpireResearch } from '../research/researchState';
import type { GameState } from '../types';
import { getResearchCatalogForEmpire } from './factionMechanicalCatalogRegistry';

const EMPTY_RESEARCH_EFFECTS: ResearchEffectSummary = {
  constructionSpeedPercent: 0,
  energyOutputPercent: 0,
  fleetSpeedPercent: 0,
  sensorStrength: 0,
  armorStrengthPercent: 0,
  weaponStrengthPercent: 0,
};

export function getResearchEffectsForEmpire(
  state: Pick<GameState, 'planets' | 'research'>,
  empireId: string,
): ResearchEffectSummary {
  const research = getEmpireResearch(state.research, empireId);
  return research === undefined
    ? EMPTY_RESEARCH_EFFECTS
    : calculateResearchEffects(
        research,
        getResearchCatalogForEmpire(state, empireId),
      );
}

export function getEnergyOutputByEmpire(
  state: Pick<GameState, 'planets' | 'research'>,
): Readonly<Record<string, number>> {
  return Object.fromEntries(
    state.research.map((research) => [
      research.empireId,
      getResearchEffectsForEmpire(state, research.empireId).energyOutputPercent,
    ]),
  );
}
