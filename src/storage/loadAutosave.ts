import type { GameState } from '../simulation/types';
import { AUTOSAVE_SLOT_ID } from './AutoSaveController';
import { parseSaveJson } from './saveFormat';
import type { SaveRepository } from './types';

export type AutosaveLoadResult =
  | { readonly status: 'missing' }
  | { readonly status: 'loaded'; readonly state: GameState; readonly savedAt: string }
  | { readonly status: 'invalid'; readonly code: string; readonly message: string };

export async function loadAutosave(
  repository: SaveRepository,
  slotId = AUTOSAVE_SLOT_ID,
): Promise<AutosaveLoadResult> {
  const stored = await repository.get(slotId);

  if (stored === undefined) {
    return { status: 'missing' };
  }

  const parsed = parseSaveJson(JSON.stringify(stored));

  if (!parsed.ok) {
    return {
      status: 'invalid',
      code: parsed.code,
      message: parsed.message,
    };
  }

  if (parsed.value.slotId !== slotId) {
    return {
      status: 'invalid',
      code: 'AUTOSAVE_SLOT_MISMATCH',
      message: 'Stored autosave belongs to another slot.',
    };
  }

  if (parsed.value !== stored) {
    await repository.put(parsed.value);
  }

  return {
    status: 'loaded',
    state: parsed.value.state,
    savedAt: parsed.value.savedAt,
  };
}
