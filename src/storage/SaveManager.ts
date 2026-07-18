import type { GameState } from '../simulation/types';
import { createSaveEnvelope, parseSaveJson, serializeSave } from './saveFormat';
import type { SaveEnvelope, SaveRepository } from './types';

export const AUTOSAVE_SNAPSHOT_SLOT_ID = 'autosave.snapshot' as const;

export interface SaveSlotSummary {
  readonly slotId: string;
  readonly savedAt: string;
  readonly checksum: string;
  readonly elapsedSeconds: number;
  readonly valid: boolean;
  readonly errorCode?: string;
}

export type LoadManagedSaveResult =
  | { readonly status: 'loaded'; readonly save: SaveEnvelope }
  | { readonly status: 'missing'; readonly slotId: string }
  | {
      readonly status: 'invalid';
      readonly slotId: string;
      readonly code: string;
      readonly message: string;
    };

export type RecoveryResult =
  | { readonly status: 'primary'; readonly save: SaveEnvelope }
  | { readonly status: 'recovered'; readonly save: SaveEnvelope; readonly snapshot: SaveEnvelope }
  | {
      readonly status: 'failed';
      readonly primary: LoadManagedSaveResult;
      readonly snapshot: LoadManagedSaveResult;
    };

export interface SaveManagerOptions {
  readonly now?: () => string;
}

function validateStoredSave(stored: SaveEnvelope): LoadManagedSaveResult {
  const parsed = parseSaveJson(JSON.stringify(stored));

  if (!parsed.ok) {
    return {
      status: 'invalid',
      slotId: stored.slotId,
      code: parsed.code,
      message: parsed.message,
    };
  }

  return { status: 'loaded', save: parsed.value };
}

export class SaveManager {
  readonly #repository: SaveRepository;
  readonly #now: () => string;

  constructor(repository: SaveRepository, options: SaveManagerOptions = {}) {
    this.#repository = repository;
    this.#now = options.now ?? (() => new Date().toISOString());
  }

  async save(slotId: string, state: GameState): Promise<SaveEnvelope> {
    const save = createSaveEnvelope(slotId, state, this.#now());
    await this.#repository.put(save);
    return save;
  }

  async load(slotId: string): Promise<LoadManagedSaveResult> {
    const stored = await this.#repository.get(slotId);

    if (stored === undefined) {
      return { status: 'missing', slotId };
    }

    const result = validateStoredSave(stored);

    if (result.status === 'loaded' && result.save !== stored) {
      await this.#repository.put(result.save);
    }

    return result;
  }

  async list(): Promise<readonly SaveSlotSummary[]> {
    const stored = await this.#repository.list();
    const summaries = stored.map((save): SaveSlotSummary => {
      const result = validateStoredSave(save);

      if (result.status !== 'loaded') {
        return {
          slotId: save.slotId,
          savedAt: save.savedAt,
          checksum: save.checksum,
          elapsedSeconds: 0,
          valid: false,
          errorCode: result.status === 'invalid' ? result.code : 'MISSING_SAVE',
        };
      }

      return {
        slotId: result.save.slotId,
        savedAt: result.save.savedAt,
        checksum: result.save.checksum,
        elapsedSeconds: result.save.state.clock.elapsedSeconds,
        valid: true,
      };
    });

    return summaries.sort((left, right) => {
      const byTime = right.savedAt.localeCompare(left.savedAt);
      return byTime === 0 ? left.slotId.localeCompare(right.slotId) : byTime;
    });
  }

  async delete(slotId: string): Promise<void> {
    await this.#repository.delete(slotId);
  }

  async export(slotId: string): Promise<string> {
    const result = await this.load(slotId);

    if (result.status !== 'loaded') {
      throw new Error(`Cannot export save slot ${slotId}: ${result.status}.`);
    }

    return serializeSave(result.save);
  }

  async import(json: string, targetSlotId?: string): Promise<SaveEnvelope> {
    const parsed = parseSaveJson(json);

    if (!parsed.ok) {
      throw new Error(`${parsed.code}: ${parsed.message}`);
    }

    const slotId = targetSlotId?.trim() || parsed.value.slotId;
    const imported = createSaveEnvelope(slotId, parsed.value.state, this.#now());
    await this.#repository.put(imported);
    return imported;
  }

  async snapshot(
    sourceSlotId: string,
    snapshotSlotId = AUTOSAVE_SNAPSHOT_SLOT_ID,
  ): Promise<SaveEnvelope | undefined> {
    const source = await this.load(sourceSlotId);

    if (source.status !== 'loaded') {
      return undefined;
    }

    const snapshot = createSaveEnvelope(
      snapshotSlotId,
      source.save.state,
      source.save.savedAt,
    );
    await this.#repository.put(snapshot);
    return snapshot;
  }

  async recover(
    primarySlotId: string,
    snapshotSlotId = AUTOSAVE_SNAPSHOT_SLOT_ID,
  ): Promise<RecoveryResult> {
    const primary = await this.load(primarySlotId);

    if (primary.status === 'loaded') {
      return { status: 'primary', save: primary.save };
    }

    const snapshot = await this.load(snapshotSlotId);

    if (snapshot.status !== 'loaded') {
      return { status: 'failed', primary, snapshot };
    }

    const recovered = createSaveEnvelope(
      primarySlotId,
      snapshot.save.state,
      this.#now(),
    );
    await this.#repository.put(recovered);

    return { status: 'recovered', save: recovered, snapshot: snapshot.save };
  }
}
