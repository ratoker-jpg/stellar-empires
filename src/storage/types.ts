import type { ResourceCost } from '../simulation/economy/types';
import type { GameState } from '../simulation/types';

export const SAVE_FORMAT_VERSION = 3 as const;

export interface CampaignCatchUpSummary {
  readonly absence: {
    readonly realDurationSeconds: number;
    readonly gameDurationSeconds: number;
  };
  readonly resources: {
    readonly producedByPlanetAndResource: Readonly<Record<string, ResourceCost>>;
    readonly lostByPlanetAndResource: Readonly<Record<string, ResourceCost>>;
  };
  readonly completions: {
    readonly buildings: number;
    readonly research: number;
    readonly ships: number;
    readonly defenses: number;
    readonly repairs: number;
    readonly upgrades: number;
  };
  readonly fleets: {
    readonly departures: number;
    readonly arrivals: number;
    readonly returns: number;
  };
  readonly combat: {
    readonly battles: number;
    readonly attacksOnPlayer: number;
    readonly victories: number;
    readonly defeats: number;
    readonly colonyDamageOrLoss: number;
  };
  readonly bots: {
    readonly decisions: number;
    readonly acceptedCommands: number;
  };
  readonly world: {
    readonly expeditions: number;
    readonly spaceObjects: number;
    readonly logisticsTransfers: number;
    readonly worldEvents: number;
  };
  readonly result: {
    readonly status: 'unknown' | 'ongoing' | 'victory' | 'defeat';
  };
}

export interface PendingCatchUpMetadata {
  readonly targetAtReal: string;
  readonly remainingRealDurationMilliseconds: number;
  readonly gameTimeFractionNumerator: number;
  readonly accumulatedSummary: CampaignCatchUpSummary;
}

export interface CampaignRuntimeMetadata {
  readonly lastActiveAtReal: string;
  readonly lastCatchUpRealDurationSeconds: number;
  readonly lastCatchUpGameDurationSeconds: number;
  readonly pendingCatchUp?: PendingCatchUpMetadata;
  readonly pendingReturnSummary?: CampaignCatchUpSummary;
}

export interface SaveEnvelope {
  readonly formatVersion: typeof SAVE_FORMAT_VERSION;
  readonly slotId: string;
  readonly savedAt: string;
  readonly checksum: string;
  readonly runtimeMetadata: CampaignRuntimeMetadata;
  readonly state: GameState;
}

export interface SaveRepository {
  put(save: SaveEnvelope): Promise<void>;
  get(slotId: string): Promise<SaveEnvelope | undefined>;
  list(): Promise<readonly SaveEnvelope[]>;
  delete(slotId: string): Promise<void>;
}

export type SaveParseResult =
  | { readonly ok: true; readonly value: SaveEnvelope }
  | {
      readonly ok: false;
      readonly code: string;
      readonly message: string;
      readonly details?: unknown;
    };
