import { getFactionMechanicalRoles } from '../simulation/factions/factionMechanicalRoles';
import { getBuildingLevel } from '../simulation/planet/buildingProgression';
import type { PlanetState } from '../simulation/planet/types';
import {
  createBuildingCardViewModels,
  type BuildingCardViewModel,
} from './planetViewModel';

export interface IndustryGatewayViewModel {
  readonly id: 'research' | 'shipyard';
  readonly label: string;
  readonly buildingId: string;
  readonly level: number;
  readonly unlocked: boolean;
  readonly hint: string;
}

export interface IndustryZoneViewModel {
  readonly buildings: readonly BuildingCardViewModel[];
  readonly gateways: readonly IndustryGatewayViewModel[];
}

function createGateway(
  planet: PlanetState,
  id: IndustryGatewayViewModel['id'],
  label: string,
  buildingId: string,
): IndustryGatewayViewModel {
  const level = getBuildingLevel(planet.buildings, buildingId);
  return {
    id,
    label,
    buildingId,
    level,
    unlocked: level > 0,
    hint: level > 0 ? `Здание ур. ${level}` : 'Сначала постройте связанное здание',
  };
}

export function createIndustryZoneViewModel(planet: PlanetState): IndustryZoneViewModel {
  const buildings = getFactionMechanicalRoles(planet.factionId).buildings;
  return {
    buildings: createBuildingCardViewModels(planet).filter(
      (building) => building.zoneId === 'industry',
    ),
    gateways: [
      createGateway(
        planet,
        'research',
        'Исследовательский комплекс',
        buildings.laboratory,
      ),
      createGateway(
        planet,
        'shipyard',
        'Орбитальная верфь',
        buildings.shipyard,
      ),
    ],
  };
}
