import type { ProgressionProfileId, WorldSpeed } from '../simulation/campaign/settings';
import type { GameState } from '../simulation/types';
import { AUTOSAVE_SLOT_ID } from './AutoSaveController';
import { createSaveEnvelope, parseSaveJson, serializeSave } from './saveFormat';
import { createCampaignRuntimeMetadata } from './runtimeMetadata';
import type {
  CampaignRuntimeMetadata,
  SaveEnvelope,
  SaveRepository,
} from './types';

export const AUTOSAVE_SNAPSHOT_SLOT_ID = 'autosave.snapshot' as const;

export function isReservedSaveSlot(slotId: string): boolean {
  return slotId === AUTOSAVE_SLOT_ID || slotId === AUTOSAVE_SNAPSHOT_SLOT_ID;
}

export interface SaveSlotSummary {
  readonly slotId: string;
  readonly savedAt: string;
  readonly checksum: string;
  readonly elapsedSeconds: number;
  readonly scenarioPreset?: GameState['campaignSettings']['scenarioPreset'];
  readonly worldSpeed?: WorldSpeed;
  readonly progressionProfile?: ProgressionProfileId;
  readonly lastActiveAtReal?: string;
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

  async save(
    slotId: string,
    state: GameState,
    runtimeMetadata?: CampaignRuntimeMetadata,
  ): Promise<SaveEnvelope> {
    const savedAt = this.#now();
    const save = createSaveEnvelope(
      slotId,
      state,
      savedAt,
      runtimeMetadata ?? createCampaignRuntimeMetadata(savedAt),
    );
    await this.#repository.put(save);
    return save;
  }

  async load(slotId: string): Promise<LoadManagedSaveResult> {
    const stored = await this.#repository.get(slotId);
    if (stored === undefined) return { status: 'missing', slotId };
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
        scenarioPreset: result.save.state.campaignSettings.scenarioPreset,
        worldSpeed: result.save.state.campaignSettings.worldSpeed,
        progressionProfile: result.save.state.campaignSettings.progressionProfile,
        lastActiveAtReal: result.save.runtimeMetadata.lastActiveAtReal,
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
    const slotId = targetSlotId?.trim() ?? '';
    if (slotId.length === 0) {
      throw new Error('Import requires an explicit manual target slot.');
    }
    if (isReservedSaveSlot(slotId)) {
      throw new Error(`Import target ${slotId} is reserved for autosave authority.`);
    }
    const parsed = parseSaveJson(json);
    if (!parsed.ok) throw new Error(`${parsed.code}: ${parsed.message}`);
    const imported = createSaveEnvelope(
      slotId,
      parsed.value.state,
      this.#now(),
      parsed.value.runtimeMetadata,
    );
    await this.#repository.put(imported);
    return imported;
  }

  async snapshot(
    sourceSlotId: string,
    snapshotSlotId: string = AUTOSAVE_SNAPSHOT_SLOT_ID,
  ): Promise<SaveEnvelope | undefined> {
    const source = await this.load(sourceSlotId);
    if (source.status !== 'loaded') return undefined;
    const snapshot = createSaveEnvelope(
      snapshotSlotId,
      source.save.state,
      source.save.savedAt,
      source.save.runtimeMetadata,
    );
    await this.#repository.put(snapshot);
    return snapshot;
  }

  async recover(
    primarySlotId: string,
    snapshotSlotId: string = AUTOSAVE_SNAPSHOT_SLOT_ID,
  ): Promise<RecoveryResult> {
    const primary = await this.load(primarySlotId);
    if (primary.status === 'loaded') return { status: 'primary', save: primary.save };
    const snapshot = await this.load(snapshotSlotId);
    if (snapshot.status !== 'loaded') return { status: 'failed', primary, snapshot };
    const recovered = createSaveEnvelope(
      primarySlotId,
      snapshot.save.state,
      this.#now(),
      snapshot.save.runtimeMetadata,
    );
    await this.#repository.put(recovered);
    return { status: 'recovered', save: recovered, snapshot: snapshot.save };
  }
}
