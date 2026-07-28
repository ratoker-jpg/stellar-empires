import type { FactionId } from '../planet/types';
import { getUnitDefinition } from '../units/catalog';
import { getShipUpgradeLevels } from '../upgrades/shipUpgrades';
import type { EmpireShipUpgradeState } from '../upgrades/types';

export interface PlanetSiegeProfile {
  readonly level10DemolitionPoints: number;
  readonly level10DestructionChanceBasisPoints: number;
}

export interface PlanetDestroyerSiegeContribution {
  readonly unitId: string;
  readonly factionId: FactionId;
  readonly count: number;
  readonly weaponLevel: number;
  readonly demolitionPointsPerShip: number;
  readonly totalDemolitionPoints: number;
  readonly destructionChanceBasisPointsPerShip: number;
  readonly totalDestructionChanceBasisPoints: number;
}

export const PLANET_SIEGE_PROFILES: Readonly<Record<FactionId, PlanetSiegeProfile>> = {
  aegis: {
    level10DemolitionPoints: 100,
    level10DestructionChanceBasisPoints: 300,
  },
  synod: {
    level10DemolitionPoints: 90,
    level10DestructionChanceBasisPoints: 250,
  },
  veyra: {
    level10DemolitionPoints: 55,
    level10DestructionChanceBasisPoints: 150,
  },
};

export function scaleSiegeValue(level10Value: number, weaponLevel: number): number {
  const level = Math.max(0, Math.min(10, Math.floor(weaponLevel)));
  return Math.floor((Math.max(0, level10Value) * level) / 10);
}

export function getPlanetDestroyerSiegeContributions(
  upgradeStates: readonly EmpireShipUpgradeState[],
  empireId: string,
  ships: Readonly<Record<string, number>>,
): readonly PlanetDestroyerSiegeContribution[] {
  return Object.entries(ships)
    .filter(([, count]) => count > 0)
    .map(([unitId, count]): PlanetDestroyerSiegeContribution | undefined => {
      const definition = getUnitDefinition(unitId);
      if (
        definition?.kind !== 'ship' ||
        definition.shipClass !== 'planet-destroyer' ||
        definition.factionId === 'shared'
      ) {
        return undefined;
      }
      const factionId = definition.factionId;
      const profile = PLANET_SIEGE_PROFILES[factionId];
      const weaponLevel = getShipUpgradeLevels(
        upgradeStates,
        empireId,
        unitId,
      ).weapons;
      const demolitionPointsPerShip = scaleSiegeValue(
        profile.level10DemolitionPoints,
        weaponLevel,
      );
      const destructionChanceBasisPointsPerShip = scaleSiegeValue(
        profile.level10DestructionChanceBasisPoints,
        weaponLevel,
      );
      return {
        unitId,
        factionId,
        count,
        weaponLevel,
        demolitionPointsPerShip,
        totalDemolitionPoints: demolitionPointsPerShip * count,
        destructionChanceBasisPointsPerShip,
        totalDestructionChanceBasisPoints:
          destructionChanceBasisPointsPerShip * count,
      };
    })
    .filter(
      (contribution): contribution is PlanetDestroyerSiegeContribution =>
        contribution !== undefined,
    )
    .sort((left, right) => left.unitId.localeCompare(right.unitId));
}
