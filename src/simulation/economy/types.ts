export type ResourceId = 'metal' | 'crystal' | 'gas';

export interface ResourceStock {
  readonly amount: number;
  readonly capacity: number;
  readonly productionPerHour: number;
  readonly productionRemainder: number;
}

export interface EnergyBalance {
  readonly produced: number;
  readonly consumed: number;
  readonly efficiencyPermille: number;
}

export interface PlanetEconomyState {
  readonly resources: Readonly<Record<ResourceId, ResourceStock>>;
  readonly energy: EnergyBalance;
}

export interface EconomyContribution {
  readonly resourceProductionPerHour?: Partial<Readonly<Record<ResourceId, number>>>;
  readonly storageCapacity?: Partial<Readonly<Record<ResourceId, number>>>;
  readonly energyProduction?: number;
  readonly energyConsumption?: number;
}
