export type ResourceId = 'metal' | 'crystal' | 'gas';

export type ResourceCost = Readonly<Record<ResourceId, number>>;

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

export interface PopulationBalance {
  readonly used: number;
  readonly capacity: number;
}

export interface StabilityBalance {
  readonly capacity: number;
  readonly demand: number;
  readonly efficiencyPermille: number;
}

export interface PlanetEconomyState {
  readonly resources: Readonly<Record<ResourceId, ResourceStock>>;
  readonly energy: EnergyBalance;
  readonly population: PopulationBalance;
  readonly stability: StabilityBalance;
}

export interface EconomyContribution {
  readonly resourceProductionPerHour?: Partial<Readonly<Record<ResourceId, number>>>;
  readonly storageCapacity?: Partial<Readonly<Record<ResourceId, number>>>;
  readonly energyProduction?: number;
  readonly energyConsumption?: number;
  readonly populationCapacity?: number;
  readonly populationUse?: number;
  readonly stabilityCapacity?: number;
  readonly stabilityDemand?: number;
}
