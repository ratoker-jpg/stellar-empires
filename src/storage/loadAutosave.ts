import type { GameState } from '../simulation/types';
import { AUTOSAVE_SLOT_ID } from './AutoSaveController';
import {
  AUTOSAVE_SNAPSHOT_SLOT_ID,
  SaveManager,
} from './SaveManager';
import type { SaveRepository } from './types';

export type AutosaveLoadResult =
  | { readonly status: 'missing' }
  | {
      readonly status: 'loaded';
      readonly state: GameState;
      readonly savedAt: string;
      readonly source: 'primary' | 'snapshot';
    }
  | { readonly status: 'invalid'; readonly code: string; readonly message: string };

export async function loadAutosave(
  repository: SaveRepository,
  slotId = AUTOSAVE_SLOT_ID,
  snapshotSlotId = AUTOSAVE_SNAPSHOT_SLOT_ID,
): Promise<AutosaveLoadResult> {
  const manager = new SaveManager(repository);
  const recovery = await manager.recover(slotId, snapshotSlotId);

  if (recovery.status === 'primary') {
    return {
      status: 'loaded',
      state: recovery.save.state,
      savedAt: recovery.save.savedAt,
      source: 'primary',
    };
  }

  if (recovery.status === 'recovered') {
    return {
      status: 'loaded',
      state: recovery.save.state,
      savedAt: recovery.save.savedAt,
      source: 'snapshot',
    };
  }

  if (recovery.primary.status === 'missing' && recovery.snapshot.status === 'missing') {
    return { status: 'missing' };
  }

  const failure =
    recovery.primary.status === 'invalid' ? recovery.primary : recovery.snapshot;

  if (failure.status === 'invalid') {
    return {
      status: 'invalid',
      code: failure.code,
      message: failure.message,
    };
  }

  return {
    status: 'invalid',
    code: 'AUTOSAVE_RECOVERY_FAILED',
    message: 'No valid autosave or snapshot could be restored.',
  };
}
