import type { ResourceId } from '../economy/types';

export interface MarketTrade {
  readonly id: string;
  readonly empireId: string;
  readonly planetId: string;
  readonly giveResourceId: ResourceId;
  readonly receiveResourceId: ResourceId;
  readonly giveAmount: number;
  readonly receiveAmount: number;
  readonly feeAmount: number;
  readonly priceImpactPermille: number;
  readonly executedAt: number;
}

export interface MarketState {
  readonly reserves: Readonly<Record<ResourceId, number>>;
  readonly feePermille: number;
  readonly maxPriceImpactPermille: number;
  readonly nextTradeSequence: number;
  readonly trades: readonly MarketTrade[];
}

export interface MarketQuote {
  readonly giveResourceId: ResourceId;
  readonly receiveResourceId: ResourceId;
  readonly giveAmount: number;
  readonly receiveAmount: number;
  readonly feeAmount: number;
  readonly priceImpactPermille: number;
  readonly accepted: boolean;
  readonly rejectionCode?: 'INVALID_PAIR' | 'INVALID_AMOUNT' | 'INSUFFICIENT_LIQUIDITY' | 'PRICE_IMPACT_LIMIT';
}
