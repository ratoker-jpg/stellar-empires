import type { GameState } from '../simulation/types';

export const SAVE_FORMAT_VERSION = 1 as const;

export interface SaveEnvelope {
  readonly formatVersion: typeof SAVE_FORMAT_VERSION;
  readonly slotId: string;
  readonly savedAt: string;
  readonly checksum: string;
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
