import { AUTOSAVE_SLOT_ID } from './AutoSaveController';
import { AUTOSAVE_SNAPSHOT_SLOT_ID, type SaveManager } from './SaveManager';
import type { SaveEnvelope } from './types';

export interface CampaignAuthoritySwitchOptions {
  readonly manager: SaveManager;
  readonly quiesceOldWriter: () => Promise<void>;
}

export interface CampaignSwitchGate {
  readonly active: boolean;
  run<T>(operation: () => Promise<T>): Promise<T>;
}

export class CampaignSwitchInProgressError extends Error {
  constructor() {
    super('Переключение кампании уже выполняется.');
    this.name = 'CampaignSwitchInProgressError';
  }
}

export function createCampaignSwitchGate(): CampaignSwitchGate {
  let active = false;
  return {
    get active() { return active; },
    async run<T>(operation: () => Promise<T>): Promise<T> {
      if (active) throw new CampaignSwitchInProgressError();
      active = true;
      try {
        return await operation();
      } finally {
        active = false;
      }
    },
  };
}

export async function resetCampaignAuthority(
  options: CampaignAuthoritySwitchOptions,
): Promise<void> {
  await options.quiesceOldWriter();
  await options.manager.delete(AUTOSAVE_SNAPSHOT_SLOT_ID);
  await options.manager.delete(AUTOSAVE_SLOT_ID);
}

export async function activateManualCampaign(
  slotId: string,
  options: CampaignAuthoritySwitchOptions,
): Promise<SaveEnvelope> {
  const loaded = await options.manager.load(slotId);
  if (loaded.status !== 'loaded') {
    throw new Error(`Save slot ${slotId} failed validation: ${loaded.status}.`);
  }
  await options.quiesceOldWriter();
  await options.manager.delete(AUTOSAVE_SNAPSHOT_SLOT_ID);
  return options.manager.save(
    AUTOSAVE_SLOT_ID,
    loaded.save.state,
    loaded.save.runtimeMetadata,
  );
}
