import { describe, expect, it } from 'vitest';
import { createEmptyCatchUpSummary } from '../../src/simulation/campaign/catchUpSummary';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeCommand } from '../../src/simulation/reducer';
import { AutoSaveController } from '../../src/storage/AutoSaveController';
import { InMemorySaveRepository } from '../../src/storage/InMemorySaveRepository';
import { createCampaignRuntimeMetadata } from '../../src/storage/runtimeMetadata';
import type { SaveEnvelope } from '../../src/storage/types';

const START = '2026-07-29T00:00:00.000Z';
const NEXT = '2026-07-29T00:00:01.000Z';

class DeferredFirstPutRepository extends InMemorySaveRepository {
  readonly started: Promise<void>;
  #resolveStarted!: () => void;
  #release!: () => void;
  #block = true;

  constructor() {
    super();
    this.started = new Promise((resolve) => { this.#resolveStarted = resolve; });
  }

  release(): void {
    this.#release();
  }

  override async put(save: SaveEnvelope): Promise<void> {
    if (this.#block && save.slotId === 'autosave') {
      this.#block = false;
      this.#resolveStarted();
      await new Promise<void>((resolve) => { this.#release = resolve; });
    }
    await super.put(save);
  }
}

class FailOnceRepository extends InMemorySaveRepository {
  #failed = false;

  override async put(save: SaveEnvelope): Promise<void> {
    if (!this.#failed && save.slotId === 'autosave') {
      this.#failed = true;
      throw new Error('DISK_FULL');
    }
    await super.put(save);
  }
}

describe('autosave clock staging', () => {
  it('writes the latest staged state with the matching processed cursor', async () => {
    const repository = new InMemorySaveRepository();
    const initial = createInitialGameState('autosave-clock-staging');
    const advanced = executeCommand(initial, { type: 'ADVANCE_TIME', seconds: 1 });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) return;

    const controller = new AutoSaveController(repository, {
      delayMs: 60_000,
      now: () => NEXT,
      runtimeMetadata: createCampaignRuntimeMetadata(START),
    });
    controller.request(initial, createCampaignRuntimeMetadata(START));
    controller.stage(advanced.value, createCampaignRuntimeMetadata(NEXT));
    await controller.flush();

    const stored = await repository.get('autosave');
    expect(stored?.state.clock.elapsedSeconds).toBe(1);
    expect(stored?.runtimeMetadata.lastActiveAtReal).toBe(NEXT);
  });

  it('does not let an older in-flight write roll back a newer staged cursor', async () => {
    const repository = new DeferredFirstPutRepository();
    const initial = createInitialGameState('autosave-clock-race');
    const advanced = executeCommand(initial, { type: 'ADVANCE_TIME', seconds: 1 });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) return;

    const controller = new AutoSaveController(repository, {
      delayMs: 60_000,
      now: () => NEXT,
      runtimeMetadata: createCampaignRuntimeMetadata(START),
    });
    controller.request(initial, createCampaignRuntimeMetadata(START));
    const firstFlush = controller.flush();
    await repository.started;
    controller.stage(advanced.value, createCampaignRuntimeMetadata(NEXT));
    repository.release();
    await firstFlush;
    await controller.flush();

    const stored = await repository.get('autosave');
    expect(stored?.state.clock.elapsedSeconds).toBe(1);
    expect(stored?.runtimeMetadata.lastActiveAtReal).toBe(NEXT);
    expect(controller.getRuntimeMetadata()?.lastActiveAtReal).toBe(NEXT);
  });

  it('rejects a failed durable summary acknowledgement and retries the same revision', async () => {
    const repository = new FailOnceRepository();
    const state = createInitialGameState('autosave-summary-ack');
    const withSummary = {
      ...createCampaignRuntimeMetadata(START),
      pendingReturnSummary: createEmptyCatchUpSummary(),
    };
    const withoutSummary = createCampaignRuntimeMetadata(START);
    const controller = new AutoSaveController(repository, {
      delayMs: 60_000,
      now: () => NEXT,
      runtimeMetadata: withSummary,
    });

    controller.setRuntimeMetadata(withoutSummary);
    controller.request(state, withoutSummary);
    await expect(controller.flush()).rejects.toThrow('DISK_FULL');
    await controller.flush();

    expect((await repository.get('autosave'))?.runtimeMetadata.pendingReturnSummary).toBeUndefined();
  });
});
