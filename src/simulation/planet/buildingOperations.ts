import { getBuildingDefinition } from './buildingCatalog';
import type { PlanetBuildingState, PlanetState } from './types';

export interface PlanetBuildingOperationalSummary {
  readonly constructionSpeedPercent: number;
  readonly shipProductionSpeedPercent: number;
  readonly defenseProductionSpeedPercent: number;
  readonly researchSpeedPercent: number;
  readonly hangarCapacity: number;
  readonly shipUpgradeCapacity: number;
  readonly bankCreditEfficiencyPercent: number;
}

export function calculateBuildingOperationalSummary(
  buildings: readonly PlanetBuildingState[],
): PlanetBuildingOperationalSummary {
  const summary = {
    constructionSpeedPercent: 0,
    shipProductionSpeedPercent: 0,
    defenseProductionSpeedPercent: 0,
    researchSpeedPercent: 0,
    hangarCapacity: 0,
    shipUpgradeCapacity: 0,
    bankCreditEfficiencyPercent: 0,
  };

  for (const building of buildings) {
    const operations = getBuildingDefinition(building.buildingId)?.operations;
    if (operations === undefined) continue;
    const level = Math.max(0, building.level);
    summary.constructionSpeedPercent += (operations.constructionSpeedPercent ?? 0) * level;
    summary.shipProductionSpeedPercent += (operations.shipProductionSpeedPercent ?? 0) * level;
    summary.defenseProductionSpeedPercent += (operations.defenseProductionSpeedPercent ?? 0) * level;
    summary.researchSpeedPercent += (operations.researchSpeedPercent ?? 0) * level;
    summary.hangarCapacity += (operations.hangarCapacity ?? 0) * level;
    summary.shipUpgradeCapacity += (operations.shipUpgradeCapacity ?? 0) * level;
    summary.bankCreditEfficiencyPercent += (operations.bankCreditEfficiencyPercent ?? 0) * level;
  }

  return summary;
}

export function getPlanetBuildingOperationalSummary(
  planet: Pick<PlanetState, 'buildings'>,
): PlanetBuildingOperationalSummary {
  return calculateBuildingOperationalSummary(planet.buildings);
}

export function isBuildingEndgameLocked(buildingId: string): boolean {
  return getBuildingDefinition(buildingId)?.operations?.endgameLocked === true;
}
