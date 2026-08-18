import type { GameState } from '../simulation/types';
import {
  AUTOSAVE_SNAPSHOT_SLOT_ID,
  SaveManager,
} from './SaveManager';
import { createSaveEnvelope } from './saveFormat';
import {
  createCampaignRuntimeMetadata,
  isCampaignRuntimeMetadata,
  prepareActiveSaveRuntimeMetadata,
} from './runtimeMetadata';
import type { CampaignRuntimeMetadata, SaveRepository } from './types';

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
  readonly runtimeMetadata?: CampaignRuntimeMetadata;
  readonly onStatus?: (status: AutoSaveStatus) => void;
}

interface PendingAutoSave {
  readonly state: GameState;
  readonly runtimeMetadata: CampaignRuntimeMetadata | undefined;
  readonly revision: number;
}

export class AutoSaveController {
  readonly #repository: SaveRepository;
  readonly #saveManager: SaveManager;
  readonly #slotId: string;
  readonly #snapshotSlotId: string | undefined;
  readonly #delayMs: number;
  readonly #now: () => string;
  readonly #onStatus: (status: AutoSaveStatus) => void;
  #runtimeMetadata: CampaignRuntimeMetadata | undefined;
  #pendingSave: PendingAutoSave | undefined;
  #nextRevision = 0;
  #timer: ReturnType<typeof setTimeout> | undefined;
  #writeChain: Promise<void> = Promise.resolve();
  #activeWrite: Promise<void> | undefined;
  #propagateFlushFailure = false;
  #lastImmediateTerminalState: GameState | undefined;
  #disposed = false;

  constructor(repository: SaveRepository, options: AutoSaveControllerOptions = {}) {
    this.#repository = repository;
    this.#slotId = options.slotId ?? AUTOSAVE_SLOT_ID;
    this.#snapshotSlotId = options.snapshotSlotId === false
      ? undefined
      : (options.snapshotSlotId ?? AUTOSAVE_SNAPSHOT_SLOT_ID);
    this.#delayMs = options.delayMs ?? 250;
    this.#now = options.now ?? (() => new Date().toISOString());
    this.#runtimeMetadata = options.runtimeMetadata;
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

  getRuntimeMetadata(): CampaignRuntimeMetadata | undefined {
    return this.#runtimeMetadata;
  }

  setRuntimeMetadata(runtimeMetadata: CampaignRuntimeMetadata): void {
    if (this.#disposed) return;
    if (!isCampaignRuntimeMetadata(runtimeMetadata)) {
      throw new Error('Campaign runtime metadata is invalid.');
    }
    if (
      this.#runtimeMetadata?.pendingReturnSummary !== undefined &&
      runtimeMetadata.pendingReturnSummary === undefined
    ) {
      this.#propagateFlushFailure = true;
    }
    this.#runtimeMetadata = runtimeMetadata;
  }

  stage(state: GameState, runtimeMetadata?: CampaignRuntimeMetadata): void {
    if (this.#disposed) return;
    if (runtimeMetadata !== undefined) this.setRuntimeMetadata(runtimeMetadata);
    this.#pendingSave = {
      state,
      runtimeMetadata: runtimeMetadata ?? this.#runtimeMetadata,
      revision: this.#nextRevision += 1,
    };
  }

  request(state: GameState, runtimeMetadata?: CampaignRuntimeMetadata): void {
    if (this.#disposed) return;
    this.stage(state, runtimeMetadata);
    this.#onStatus({ phase: 'pending' });
    if (this.#timer !== undefined) clearTimeout(this.#timer);
    const terminalRequiresImmediateFlush = state.campaignResult?.status === 'terminal' &&
      this.#lastImmediateTerminalState !== state;
    if (terminalRequiresImmediateFlush) {
      this.#lastImmediateTerminalState = state;
      this.#timer = undefined;
      void this.flush().catch(() => undefined);
      return;
    }
    this.#timer = setTimeout(() => {
      this.#timer = undefined;
      void this.flush().catch(() => undefined);
    }, this.#delayMs);
  }

  async flush(): Promise<void> {
    await this.flushInternal(this.#propagateFlushFailure);
  }

  async flushOrThrow(): Promise<void> {
    await this.flushInternal(true);
  }

  async dispose(): Promise<void> {
    if (this.#disposed) {
      await this.#writeChain;
      return;
    }
    this.#disposed = true;
    await this.flushInternal(false);
    await this.#writeChain;
    this.#onStatus({ phase: 'idle' });
  }

  private readPendingSave(): PendingAutoSave | undefined {
    return this.#pendingSave;
  }

  private async flushInternal(rejectOnError: boolean): Promise<void> {
    if (this.#timer !== undefined) {
      clearTimeout(this.#timer);
      this.#timer = undefined;
    }
    const pending = this.#pendingSave;
    this.#pendingSave = undefined;
    if (pending === undefined) {
      const activeWrite = this.#activeWrite;
      if (activeWrite === undefined) {
        await this.#writeChain;
        return;
      }
      try {
        await activeWrite;
      } catch (error: unknown) {
        if (rejectOnError) throw error;
      }
      return;
    }

    const savedAt = this.#now();
    const currentRuntimeMetadata = pending.runtimeMetadata ??
      createCampaignRuntimeMetadata(savedAt);
    const nextRuntimeMetadata = prepareActiveSaveRuntimeMetadata(
      currentRuntimeMetadata,
    );
    const envelope = createSaveEnvelope(
      this.#slotId,
      pending.state,
      savedAt,
      nextRuntimeMetadata,
    );
    this.#onStatus({ phase: 'saving' });

    const write = this.#writeChain.then(async () => {
      if (this.#snapshotSlotId !== undefined) {
        await this.#saveManager.snapshot(this.#slotId, this.#snapshotSlotId);
      }
      await this.#repository.put(envelope);
    });
    this.#activeWrite = write;
    this.#writeChain = write.catch(() => undefined);

    let failure: unknown;
    try {
      await write;
      const newerPending = this.readPendingSave();
      if (newerPending === undefined || newerPending.revision <= pending.revision) {
        this.#runtimeMetadata = nextRuntimeMetadata;
      }
      if (nextRuntimeMetadata.pendingReturnSummary === undefined) {
        this.#propagateFlushFailure = false;
      }
      this.#onStatus({ phase: 'saved', savedAt });
    } catch (error: unknown) {
      failure = error;
      const newerPending = this.readPendingSave();
      if (newerPending === undefined || newerPending.revision <= pending.revision) {
        this.#pendingSave = {
          state: pending.state,
          runtimeMetadata: nextRuntimeMetadata,
          revision: pending.revision,
        };
      }
      this.#onStatus({ phase: 'error', error });
    } finally {
      if (this.#activeWrite === write) this.#activeWrite = undefined;
    }

    const nextPending = this.readPendingSave();
    if (nextPending !== undefined && !this.#disposed) {
      this.request(nextPending.state, nextPending.runtimeMetadata);
    }
    if (failure !== undefined && rejectOnError) throw failure;
  }
}
