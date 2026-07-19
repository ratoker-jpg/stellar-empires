import type { ResourceId } from '../economy/types';
import type { PlanetState } from '../planet/types';
import type { CommandLogEntry, CommandResult, GameCommand, GameState } from '../types';
import type { MarketQuote, MarketState, MarketTrade } from './types';

const RESOURCE_IDS: readonly ResourceId[] = ['metal', 'crystal', 'gas'];
const INITIAL_RESERVE = 50_000;
const MAX_HISTORY = 50;

export function createInitialMarketState(): MarketState {
  return {
    reserves: { metal: INITIAL_RESERVE, crystal: INITIAL_RESERVE, gas: INITIAL_RESERVE },
    feePermille: 15,
    maxPriceImpactPermille: 250,
    nextTradeSequence: 0,
    trades: [],
  };
}

function isResourceId(value: unknown): value is ResourceId {
  return RESOURCE_IDS.includes(value as ResourceId);
}

export function quoteMarketSwap(
  market: MarketState,
  giveResourceId: ResourceId,
  receiveResourceId: ResourceId,
  giveAmount: number,
): MarketQuote {
  if (giveResourceId === receiveResourceId) {
    return {
      giveResourceId,
      receiveResourceId,
      giveAmount,
      receiveAmount: 0,
      feeAmount: 0,
      priceImpactPermille: 0,
      accepted: false,
      rejectionCode: 'INVALID_PAIR',
    };
  }
  if (!Number.isInteger(giveAmount) || giveAmount <= 0) {
    return {
      giveResourceId,
      receiveResourceId,
      giveAmount,
      receiveAmount: 0,
      feeAmount: 0,
      priceImpactPermille: 0,
      accepted: false,
      rejectionCode: 'INVALID_AMOUNT',
    };
  }

  const giveReserve = market.reserves[giveResourceId];
  const receiveReserve = market.reserves[receiveResourceId];
  const feeAmount = Math.max(1, Math.floor((giveAmount * market.feePermille) / 1_000));
  const effectiveInput = giveAmount - feeAmount;
  if (effectiveInput <= 0 || receiveReserve <= 1) {
    return {
      giveResourceId,
      receiveResourceId,
      giveAmount,
      receiveAmount: 0,
      feeAmount,
      priceImpactPermille: 1_000,
      accepted: false,
      rejectionCode: 'INSUFFICIENT_LIQUIDITY',
    };
  }

  const invariant = giveReserve * receiveReserve;
  const receiveAmount = Math.max(
    0,
    receiveReserve - Math.ceil(invariant / (giveReserve + effectiveInput)),
  );
  const spotOutput = Math.floor((effectiveInput * receiveReserve) / giveReserve);
  const priceImpactPermille =
    spotOutput <= 0
      ? 1_000
      : Math.max(0, 1_000 - Math.floor((receiveAmount * 1_000) / spotOutput));
  const rejectionCode =
    receiveAmount <= 0 || receiveAmount >= receiveReserve
      ? 'INSUFFICIENT_LIQUIDITY'
      : priceImpactPermille > market.maxPriceImpactPermille
        ? 'PRICE_IMPACT_LIMIT'
        : undefined;

  const baseQuote = {
    giveResourceId,
    receiveResourceId,
    giveAmount,
    receiveAmount,
    feeAmount,
    priceImpactPermille,
  } as const;
  return rejectionCode === undefined
    ? { ...baseQuote, accepted: true }
    : { ...baseQuote, accepted: false, rejectionCode };
}

function appendCommand(state: GameState, command: GameCommand): readonly CommandLogEntry[] {
  return [...state.commandLog, { index: state.commandLog.length, command }];
}

function replacePlanet(
  planets: readonly PlanetState[],
  replacement: PlanetState,
): readonly PlanetState[] {
  return planets.map((planet) => (planet.id === replacement.id ? replacement : planet));
}

export function executeMarketSwap(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'MARKET_SWAP' }>,
): CommandResult<GameState> {
  if (!isResourceId(command.giveResourceId) || !isResourceId(command.receiveResourceId)) {
    return { ok: false, code: 'INVALID_MARKET_RESOURCE', message: 'Market resource is invalid.' };
  }
  const planet = state.planets.find((candidate) => candidate.id === command.planetId);
  if (planet === undefined || planet.ownerEmpireId !== command.empireId) {
    return { ok: false, code: 'MARKET_PLANET_UNAVAILABLE', message: 'Trade planet is unavailable.' };
  }
  const quote = quoteMarketSwap(
    state.market,
    command.giveResourceId,
    command.receiveResourceId,
    command.giveAmount,
  );
  if (!quote.accepted) {
    return {
      ok: false,
      code: quote.rejectionCode ?? 'MARKET_QUOTE_REJECTED',
      message: 'The market rejected the swap.',
      details: quote,
    };
  }
  const giveStock = planet.economy.resources[command.giveResourceId];
  const receiveStock = planet.economy.resources[command.receiveResourceId];
  if (giveStock.amount < command.giveAmount) {
    return { ok: false, code: 'INSUFFICIENT_RESOURCES', message: 'The planet cannot fund this trade.' };
  }
  if (receiveStock.capacity - receiveStock.amount < quote.receiveAmount) {
    return { ok: false, code: 'MARKET_TARGET_STORAGE_FULL', message: 'The target resource storage cannot accept the trade.' };
  }

  const updatedPlanet: PlanetState = {
    ...planet,
    economy: {
      ...planet.economy,
      resources: {
        ...planet.economy.resources,
        [command.giveResourceId]: {
          ...giveStock,
          amount: giveStock.amount - command.giveAmount,
        },
        [command.receiveResourceId]: {
          ...receiveStock,
          amount: receiveStock.amount + quote.receiveAmount,
        },
      },
    },
  };
  const trade: MarketTrade = {
    id: `trade-${state.market.nextTradeSequence}`,
    empireId: command.empireId,
    planetId: planet.id,
    giveResourceId: command.giveResourceId,
    receiveResourceId: command.receiveResourceId,
    giveAmount: command.giveAmount,
    receiveAmount: quote.receiveAmount,
    feeAmount: quote.feeAmount,
    priceImpactPermille: quote.priceImpactPermille,
    executedAt: state.clock.elapsedSeconds,
  };
  const market: MarketState = {
    ...state.market,
    reserves: {
      ...state.market.reserves,
      [command.giveResourceId]:
        state.market.reserves[command.giveResourceId] + command.giveAmount,
      [command.receiveResourceId]:
        state.market.reserves[command.receiveResourceId] - quote.receiveAmount,
    },
    nextTradeSequence: state.market.nextTradeSequence + 1,
    trades: [...state.market.trades, trade].slice(-MAX_HISTORY),
  };
  return {
    ok: true,
    value: {
      ...state,
      planets: replacePlanet(state.planets, updatedPlanet),
      market,
      commandLog: appendCommand(state, command),
    },
  };
}
