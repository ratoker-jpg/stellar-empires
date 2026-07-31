import {
  createEmpireEconomyPortfolio,
  EMPIRE_ECONOMY_RESOURCE_IDS,
  type ColonyEconomyPortfolio,
} from '../economy/empireEconomy';
import type { ResourceId } from '../economy/types';
import { quoteMarketSwap } from '../market/market';
import type {
  PlanetDevelopmentTemplateId,
  PlanetSpecializationId,
} from '../planet/specialization';
import type { GameCommand, GameState } from '../types';

export const BOT_LOGISTICS_DONOR_FILL_PERMILLE = 550;
export const BOT_LOGISTICS_RECEIVER_FILL_PERMILLE = 350;
export const BOT_LOGISTICS_CRITICAL_FILL_PERMILLE = 150;
export const BOT_LOGISTICS_INTERVAL_SECONDS = 3_600;
export const BOT_LOGISTICS_RESERVE_PERMILLE = 400;
export const BOT_LOGISTICS_MINIMUM_AMOUNT = 100;
export const BOT_LOGISTICS_MAXIMUM_AMOUNT = 1_000;

export type BotColonyLogisticsReasonCode =
  | 'no-planets'
  | 'single-colony'
  | 'role-specialization-busy'
  | 'reconcile-specialization'
  | 'reconcile-template'
  | 'create-route'
  | 'update-route'
  | 'emergency-market'
  | 'balanced';

export interface BotColonyLogisticsPlan {
  readonly empireId: string;
  readonly reasonCode: BotColonyLogisticsReasonCode;
  readonly explanation: string;
  readonly command: GameCommand | null;
  readonly roleChange: boolean;
}

interface ColonyRoleAssignment {
  readonly specializationId: PlanetSpecializationId;
  readonly developmentTemplateId: PlanetDevelopmentTemplateId;
}

interface RouteCandidate {
  readonly resourceId: ResourceId;
  readonly receiver: ColonyEconomyPortfolio;
  readonly receiverIndex: number;
  readonly donor: ColonyEconomyPortfolio;
  readonly donorIndex: number;
}

const RESOURCE_IDS = [...EMPIRE_ECONOMY_RESOURCE_IDS]
  .sort((left, right) => left.localeCompare(right));

function roleForColony(index: number): ColonyRoleAssignment {
  if (index === 0) {
    return { specializationId: 'industry', developmentTemplateId: 'industrial-hub' };
  }
  if (index === 1) {
    return { specializationId: 'resource', developmentTemplateId: 'resource-hub' };
  }
  if (index === 2) {
    return { specializationId: 'military', developmentTemplateId: 'fortress' };
  }
  return { specializationId: 'balanced', developmentTemplateId: 'balanced' };
}

function rolePlan(
  state: GameState,
  empireId: string,
  colonies: readonly ColonyEconomyPortfolio[],
): BotColonyLogisticsPlan | undefined {
  for (const [index, colony] of colonies.entries()) {
    const role = roleForColony(index);
    if (colony.specializationId !== role.specializationId) {
      const planet = state.planets.find((candidate) => candidate.id === colony.id);
      const busy = planet !== undefined && (
        planet.buildQueue.length > 0 ||
        planet.productionQueues.shipyard.length > 0 ||
        planet.productionQueues.defense.length > 0
      );
      if (busy) {
        return {
          empireId,
          reasonCode: 'role-specialization-busy',
          explanation: `Колония ${colony.id} ожидает освобождения локальных очередей перед назначением роли ${role.specializationId}.`,
          command: null,
          roleChange: false,
        };
      }
      return {
        empireId,
        reasonCode: 'reconcile-specialization',
        explanation: `Колония ${colony.id} получает каноническую специализацию ${role.specializationId}.`,
        command: {
          type: 'SET_PLANET_SPECIALIZATION',
          empireId,
          planetId: colony.id,
          specializationId: role.specializationId,
        },
        roleChange: true,
      };
    }
    if (colony.developmentTemplateId !== role.developmentTemplateId) {
      return {
        empireId,
        reasonCode: 'reconcile-template',
        explanation: `Колония ${colony.id} получает канонический шаблон ${role.developmentTemplateId}.`,
        command: {
          type: 'SET_PLANET_DEVELOPMENT_TEMPLATE',
          empireId,
          planetId: colony.id,
          developmentTemplateId: role.developmentTemplateId,
        },
        roleChange: true,
      };
    }
  }
  return undefined;
}

function routePriority(receiverFillPermille: number): 1 | 2 | 3 {
  if (receiverFillPermille < 150) return 3;
  if (receiverFillPermille < 250) return 2;
  return 1;
}

function routeAmount(productionPerHour: number): number {
  return Math.min(
    BOT_LOGISTICS_MAXIMUM_AMOUNT,
    Math.max(BOT_LOGISTICS_MINIMUM_AMOUNT, Math.floor(productionPerHour)),
  );
}

function routeCandidates(
  colonies: readonly ColonyEconomyPortfolio[],
): readonly RouteCandidate[] {
  const candidates: RouteCandidate[] = [];
  for (const [receiverIndex, receiver] of colonies.entries()) {
    for (const resourceId of RESOURCE_IDS) {
      if (receiver.resources[resourceId].fillPermille > BOT_LOGISTICS_RECEIVER_FILL_PERMILLE) {
        continue;
      }
      for (const [donorIndex, donor] of colonies.entries()) {
        if (donor.id === receiver.id) continue;
        if (donor.resources[resourceId].fillPermille < BOT_LOGISTICS_DONOR_FILL_PERMILLE) {
          continue;
        }
        candidates.push({ resourceId, receiver, receiverIndex, donor, donorIndex });
      }
    }
  }
  return candidates.sort((left, right) =>
    left.receiver.resources[left.resourceId].fillPermille -
      right.receiver.resources[right.resourceId].fillPermille ||
    left.resourceId.localeCompare(right.resourceId) ||
    left.receiverIndex - right.receiverIndex ||
    left.donorIndex - right.donorIndex);
}

function routePlan(
  state: GameState,
  empireId: string,
  colonies: readonly ColonyEconomyPortfolio[],
): BotColonyLogisticsPlan | undefined {
  for (const candidate of routeCandidates(colonies)) {
    const donorResource = candidate.donor.resources[candidate.resourceId];
    const receiverResource = candidate.receiver.resources[candidate.resourceId];
    const amountPerTrip = routeAmount(donorResource.productionPerHour);
    const originReserve = Math.floor(
      (donorResource.capacity * BOT_LOGISTICS_RESERVE_PERMILLE) / 1_000,
    );
    const priority = routePriority(receiverResource.fillPermille);
    const existing = state.logisticsRoutes.find((route) =>
      route.empireId === empireId &&
      route.originPlanetId === candidate.donor.id &&
      route.targetPlanetId === candidate.receiver.id &&
      route.resourceId === candidate.resourceId);
    if (existing === undefined) {
      return {
        empireId,
        reasonCode: 'create-route',
        explanation: `Создаётся маршрут ${candidate.donor.id} → ${candidate.receiver.id} для ${candidate.resourceId}: заполнение получателя ${receiverResource.fillPermille}‰.`,
        command: {
          type: 'CREATE_LOGISTICS_ROUTE',
          empireId,
          originPlanetId: candidate.donor.id,
          targetPlanetId: candidate.receiver.id,
          resourceId: candidate.resourceId,
          amountPerTrip,
          originReserve,
          intervalSeconds: BOT_LOGISTICS_INTERVAL_SECONDS,
          priority,
        },
        roleChange: false,
      };
    }
    if (
      existing.amountPerTrip !== amountPerTrip ||
      existing.originReserve !== originReserve ||
      existing.intervalSeconds !== BOT_LOGISTICS_INTERVAL_SECONDS ||
      existing.priority !== priority ||
      existing.status !== 'active'
    ) {
      return {
        empireId,
        reasonCode: 'update-route',
        explanation: `Маршрут ${existing.id} синхронизируется с текущим давлением ${receiverResource.fillPermille}‰.`,
        command: {
          type: 'UPDATE_LOGISTICS_ROUTE',
          empireId,
          routeId: existing.id,
          amountPerTrip,
          originReserve,
          intervalSeconds: BOT_LOGISTICS_INTERVAL_SECONDS,
          priority,
          status: 'active',
        },
        roleChange: false,
      };
    }
  }
  return undefined;
}

function emergencyMarketCommand(
  state: GameState,
  empireId: string,
  colony: ColonyEconomyPortfolio,
  receiveResourceId: ResourceId,
): GameCommand | null {
  const planet = state.planets.find(
    (candidate) => candidate.id === colony.id && candidate.ownerEmpireId === empireId,
  );
  if (planet === undefined) return null;
  const receive = colony.resources[receiveResourceId];
  const targetAmount = Math.ceil(
    (receive.capacity * BOT_LOGISTICS_RECEIVER_FILL_PERMILLE) / 1_000,
  );
  const deficit = Math.max(1, targetAmount - receive.amount);
  const donors = RESOURCE_IDS
    .filter((resourceId) => resourceId !== receiveResourceId)
    .map((resourceId) => {
      const resource = colony.resources[resourceId];
      const reserve = Math.floor(
        (resource.capacity * BOT_LOGISTICS_RESERVE_PERMILLE) / 1_000,
      );
      return {
        resourceId,
        surplus: Math.max(0, resource.amount - reserve),
      };
    })
    .filter((candidate) => candidate.surplus > 0)
    .sort((left, right) =>
      right.surplus - left.surplus || left.resourceId.localeCompare(right.resourceId));

  for (const donor of donors) {
    let giveAmount = Math.min(
      donor.surplus,
      Math.max(BOT_LOGISTICS_MINIMUM_AMOUNT, Math.ceil((deficit * 5) / 4)),
    );
    while (giveAmount > 0) {
      const quote = quoteMarketSwap(
        state.market,
        donor.resourceId,
        receiveResourceId,
        giveAmount,
      );
      const acceptableReturn =
        state.campaignSettings.progressionProfile !== 'compressed-v1' ||
        quote.receiveAmount * 1_000 >= giveAmount * 500;
      if (quote.accepted && quote.receiveAmount > 0 && acceptableReturn) {
        return {
          type: 'MARKET_SWAP',
          empireId,
          planetId: planet.id,
          giveResourceId: donor.resourceId,
          receiveResourceId,
          giveAmount,
        };
      }
      giveAmount = Math.floor(giveAmount / 2);
    }
  }
  return null;
}

function marketPlan(
  state: GameState,
  empireId: string,
  colonies: readonly ColonyEconomyPortfolio[],
): BotColonyLogisticsPlan | undefined {
  const candidates = colonies.flatMap((colony, colonyIndex) =>
    RESOURCE_IDS
      .filter((resourceId) =>
        colony.resources[resourceId].fillPermille < BOT_LOGISTICS_CRITICAL_FILL_PERMILLE)
      .map((resourceId) => ({ colony, colonyIndex, resourceId })))
    .sort((left, right) =>
      left.colony.resources[left.resourceId].fillPermille -
        right.colony.resources[right.resourceId].fillPermille ||
      left.resourceId.localeCompare(right.resourceId) ||
      left.colonyIndex - right.colonyIndex);

  for (const candidate of candidates) {
    const hasEligibleDonor = colonies.some((donor) =>
      donor.id !== candidate.colony.id &&
      donor.resources[candidate.resourceId].fillPermille >= BOT_LOGISTICS_DONOR_FILL_PERMILLE);
    if (hasEligibleDonor) continue;
    const command = emergencyMarketCommand(
      state,
      empireId,
      candidate.colony,
      candidate.resourceId,
    );
    if (command !== null) {
      return {
        empireId,
        reasonCode: 'emergency-market',
        explanation: `Критический ${candidate.resourceId}-дефицит ${candidate.colony.id} не имеет межколониального донора и покрывается обычным рынком.`,
        command,
        roleChange: false,
      };
    }
  }
  return undefined;
}

export function planBotColonyLogistics(
  state: GameState,
  empireId: string,
): BotColonyLogisticsPlan {
  const portfolio = createEmpireEconomyPortfolio(state, empireId);
  if (portfolio.colonyCount === 0) {
    return {
      empireId,
      reasonCode: 'no-planets',
      explanation: 'У империи нет доступных колоний.',
      command: null,
      roleChange: false,
    };
  }
  if (portfolio.colonyCount === 1) {
    return {
      empireId,
      reasonCode: 'single-colony',
      explanation: 'Межколониальная логистика активируется после получения второй колонии.',
      command: null,
      roleChange: false,
    };
  }

  const role = rolePlan(state, empireId, portfolio.colonies);
  if (role !== undefined) return role;
  const route = routePlan(state, empireId, portfolio.colonies);
  if (route !== undefined) return route;
  const market = marketPlan(state, empireId, portfolio.colonies);
  if (market !== undefined) return market;
  return {
    empireId,
    reasonCode: 'balanced',
    explanation: 'Канонические роли и межколониальные потоки не требуют команды.',
    command: null,
    roleChange: false,
  };
}
