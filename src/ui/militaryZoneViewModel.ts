import { getFactionMechanicalRoles } from '../simulation/factions/factionMechanicalRoles';
import { getBuildingLevel } from '../simulation/planet/buildingProgression';
import type { PlanetState } from '../simulation/planet/types';
import {
  createBuildingCardViewModels,
  type BuildingCardViewModel,
} from './planetViewModel';

export interface MilitaryGatewayViewModel {
  readonly id: 'defense' | 'fleet';
  readonly label: string;
  readonly unlocked: boolean;
  readonly hint: string;
}

export interface MilitaryZoneViewModel {
  readonly buildings: readonly BuildingCardViewModel[];
  readonly gateways: readonly MilitaryGatewayViewModel[];
}

export function createMilitaryZoneViewModel(planet: PlanetState): MilitaryZoneViewModel {
  const roles = getFactionMechanicalRoles(planet.factionId).buildings;
  const sensorLevel = getBuildingLevel(planet.buildings, roles.sensorGrid);
  const commandLevel = getBuildingLevel(planet.buildings, roles.command);

  return {
    buildings: createBuildingCardViewModels(planet).filter(
      (building) => building.zoneId === 'military',
    ),
    gateways: [
      {
        id: 'defense',
        label: 'Планетарная оборона',
        unlocked: sensorLevel > 0,
        hint: sensorLevel > 0 ? `Сенсорный комплекс ур. ${sensorLevel}` : 'Требуется сенсорный комплекс',
      },
      {
        id: 'fleet',
        label: 'Командование флотом',
        unlocked: commandLevel >= 2,
        hint: commandLevel >= 2 ? `Командный узел ур. ${commandLevel}` : 'Требуется командный узел ур. 2',
      },
    ],
  };
}
