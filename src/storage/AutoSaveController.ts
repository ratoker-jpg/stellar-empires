import type { GameState } from '../simulation/types';
import {
  AUTOSAVE_SNAPSHOT_SLOT_ID,
  SaveManager,
} from './SaveManager';
import { createSaveEnvelope } from './saveFormat';
import type { SaveRepository } from './types';

export const AUTOSAVE_SLOT_ID = 'autosave' as const;

export type AutoSavePhase = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export interface AutoSaveStatus {
  readonly phase: AutoSavePhase;
  readonly savedAt?: string;
  readonly error?: unknown;
}

export interface AutoSaveControllerOptions {
  readonly slotId?: string;
  readonly snapshotSlotId?: string | false;
  readonly delayMs?: number;
  readonly now?: () => string;
  readonly onStatus?: (status: AutoSaveStatus) => void;
}

export class AutoSaveController {
  readonly #repository: SaveRepository;
  readonly #saveManager: SaveManager;
  readonly #slotId: string;
  readonly #snapshotSlotId: string | undefined;
  readonly #delayMs: number;
  readonly #now: () => string;
  readonly #onStatus: (status: AutoSaveStatus) => void;
  #pendingState: GameState | undefined;
  #timer: ReturnType<typeof setTimeout> | undefined;
  #writeChain: Promise<void> = Promise.resolve();
  #disposed = false;

  constructor(repository: SaveRepository, options: AutoSaveControllerOptions = {}) {
    this.#repository = repository;
    this.#slotId = options.slotId ?? AUTOSAVE_SLOT_ID;
    this.#snapshotSlotId =
      options.snapshotSlotId === false
        ? undefined
        : (options.snapshotSlotId ?? AUTOSAVE_SNAPSHOT_SLOT_ID);
    this.#delayMs = options.delayMs ?? 250;
    this.#now = options.now ?? (() => new Date().toISOString());
    this.#onStatus = options.onStatus ?? (() => undefined);
    this.#saveManager = new SaveManager(repository, { now: this.#now });

    if (this.#slotId.trim().length === 0) {
      throw new Error('Autosave slot id must not be empty.');
    }

    if (this.#snapshotSlotId !== undefined && this.#snapshotSlotId.trim().length === 0) {
      throw new Error('Autosave snapshot slot id must not be empty.');
    }

    if (!Number.isInteger(this.#delayMs) || this.#delayMs < 0) {
      throw new Error('Autosave delay must be a non-negative integer.');
    }
  }

  request(state: GameState): void {
    if (this.#disposed) {
      return;
    }

    this.#pendingState = state;
    this.#onStatus({ phase: 'pending' });

    if (this.#timer !== undefined) {
      clearTimeout(this.#timer);
    }

    this.#timer = setTimeout(() => {
      this.#timer = undefined;
      void this.flush();
    }, this.#delayMs);
  }

  async flush(): Promise<void> {
    if (this.#timer !== undefined) {
      clearTimeout(this.#timer);
      this.#timer = undefined;
    }

    const state = this.#pendingState;
    this.#pendingState = undefined;

    if (state === undefined) {
      await this.#writeChain;
      return;
    }

    const savedAt = this.#now();
    const envelope = createSaveEnvelope(this.#slotId, state, savedAt);
    this.#onStatus({ phase: 'saving' });

    const write = this.#writeChain.then(async () => {
      if (this.#snapshotSlotId !== undefined) {
        await this.#saveManager.snapshot(this.#slotId, this.#snapshotSlotId);
      }
      await this.#repository.put(envelope);
    });
    this.#writeChain = write.catch(() => undefined);

    try {
      await write;
      this.#onStatus({ phase: 'saved', savedAt });
    } catch (error: unknown) {
      this.#onStatus({ phase: 'error', error });
    }

    if (this.#pendingState !== undefined && !this.#disposed) {
      this.request(this.#pendingState);
    }
  }

  async dispose(): Promise<void> {
    if (this.#disposed) {
      await this.#writeChain;
      return;
    }

    this.#disposed = true;
    await this.flush();
    await this.#writeChain;
    this.#onStatus({ phase: 'idle' });
  }
}
