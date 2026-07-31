import { getColonyLimit } from '../simulation/colonization/colonization';
import {
  createEmpireEconomyPortfolio,
  type ColonyEconomyPortfolio,
  type EmpireEconomyPortfolio,
  type EmpireResourcePortfolio,
} from '../simulation/economy/empireEconomy';
import type { GameState } from '../simulation/types';

export type EmpireResourceSummary = EmpireResourcePortfolio;
export type ColonyOverviewItem = ColonyEconomyPortfolio;

export interface EmpireOverviewViewModel extends EmpireEconomyPortfolio {
  readonly colonyLimit: number;
}

export function createEmpireOverviewViewModel(
  state: GameState,
  empireId: string,
): EmpireOverviewViewModel {
  const portfolio = createEmpireEconomyPortfolio(state, empireId);
  return {
    ...portfolio,
    colonyLimit: getColonyLimit(state, empireId),
  };
}
