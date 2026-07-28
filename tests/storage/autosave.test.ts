import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeCommand } from '../../src/simulation/reducer';
import { AutoSaveController } from '../../src/storage/AutoSaveController';
import { InMemorySaveRepository } from '../../src/storage/InMemorySaveRepository';
import { loadAutosave } from '../../src/storage/loadAutosave';
import { createCampaignRuntimeMetadata } from '../../src/storage/runtimeMetadata';
import { createSaveEnvelope } from '../../src/storage/saveFormat';

describe('runtime autosave', () => {
  it('coalesces pending changes while preserving the last processed real-time cursor', async () => {
    const repository = new InMemorySaveRepository();
    const initial = createInitialGameState('autosave-coalesce');
    const advanced = executeCommand(initial, { type: 'ADVANCE_TIME', seconds: 600 });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) return;

    const statuses: string[] = [];
    const runtimeMetadata = createCampaignRuntimeMetadata('2026-07-18T23:00:00.000Z');
    const controller = new AutoSaveController(repository, {
      delayMs: 60_000,
      now: () => '2026-07-19T00:00:00.000Z',
      runtimeMetadata,
      onStatus: (status) => statuses.push(status.phase),
    });
    controller.request(initial);
    controller.request(advanced.value);
    await controller.flush();

    const stored = await repository.get('autosave');
    expect(stored?.state.clock.elapsedSeconds).toBe(600);
    expect(stored?.savedAt).toBe('2026-07-19T00:00:00.000Z');
    expect(stored?.runtimeMetadata).toEqual(runtimeMetadata);
    expect(controller.getRuntimeMetadata()).toEqual(runtimeMetadata);
    expect(statuses).toEqual(['pending', 'pending', 'saving', 'saved']);
  });

  it('does not overwrite a pending catch-up cursor during a normal flush', async () => {
    const repository = new InMemorySaveRepository();
    const state = createInitialGameState('autosave-pending-catchup');
    const runtimeMetadata = {
      ...createCampaignRuntimeMetadata('2026-07-19T00:00:00.000Z'),
      pendingCatchUp: {
        targetAtReal: '2026-07-20T00:00:00.000Z',
        remainingRealDurationMilliseconds: 86_400_000,
        gameTimeFractionNumerator: 0,
        accumulatedSummary: {
          absence: { realDurationSeconds: 0, gameDurationSeconds: 0 },
          resources: { producedByPlanetAndResource: {}, lostByPlanetAndResource: {} },
          completions: { buildings: 0, research: 0, ships: 0, defenses: 0, repairs: 0, upgrades: 0 },
          fleets: { departures: 0, arrivals: 0, returns: 0 },
          combat: { battles: 0, attacksOnPlayer: 0, victories: 0, defeats: 0, colonyDamageOrLoss: 0 },
          bots: { decisions: 0, acceptedCommands: 0 },
          world: { expeditions: 0, spaceObjects: 0, logisticsTransfers: 0, worldEvents: 0 },
          result: { status: 'unknown' as const },
        },
      },
    };
    const controller = new AutoSaveController(repository, {
      delayMs: 60_000,
      now: () => '2026-07-21T00:00:00.000Z',
      runtimeMetadata,
    });
    controller.request(state);
    await controller.flush();
    expect((await repository.get('autosave'))?.runtimeMetadata).toEqual(runtimeMetadata);
  });

  it('rotates the previous valid autosave into a snapshot with its cursor', async () => {
    const repository = new InMemorySaveRepository();
    const initial = createInitialGameState('autosave-snapshot');
    const initialMetadata = createCampaignRuntimeMetadata('2026-07-19T00:00:00.000Z');
    await repository.put(createSaveEnvelope(
      'autosave',
      initial,
      '2026-07-19T00:00:00.000Z',
      initialMetadata,
    ));
    const advanced = executeCommand(initial, { type: 'ADVANCE_TIME', seconds: 900 });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) return;

    const controller = new AutoSaveController(repository, {
      delayMs: 60_000,
      now: () => '2026-07-19T00:15:00.000Z',
      runtimeMetadata: initialMetadata,
    });
    controller.request(advanced.value);
    await controller.flush();

    expect((await repository.get('autosave'))?.state.clock.elapsedSeconds).toBe(900);
    const snapshot = await repository.get('autosave.snapshot');
    expect(snapshot?.state.clock.elapsedSeconds).toBe(0);
    expect(snapshot?.runtimeMetadata).toEqual(initialMetadata);
  });

  it('restores a checksum-validated autosave with runtime metadata', async () => {
    const repository = new InMemorySaveRepository();
    const state = createInitialGameState('autosave-restore');
    const runtimeMetadata = createCampaignRuntimeMetadata('2026-07-19T00:01:00.000Z');
    await repository.put(createSaveEnvelope(
      'autosave',
      state,
      '2026-07-19T00:01:00.000Z',
      runtimeMetadata,
    ));

    await expect(loadAutosave(repository)).resolves.toEqual({
      status: 'loaded',
      state,
      savedAt: '2026-07-19T00:01:00.000Z',
      runtimeMetadata,
      source: 'primary',
    });
  });

  it('recovers a corrupted autosave from the last valid snapshot without replacing its cursor', async () => {
    const repository = new InMemorySaveRepository();
    const state = createInitialGameState('autosave-recovery');
    const primary = createSaveEnvelope('autosave', state, '2026-07-19T00:02:00.000Z');
    await repository.put({ ...primary, checksum: 'corrupted' });
    const snapshotMetadata = createCampaignRuntimeMetadata('2026-07-19T00:01:00.000Z');
    await repository.put(createSaveEnvelope(
      'autosave.snapshot',
      state,
      '2026-07-19T00:01:00.000Z',
      snapshotMetadata,
    ));

    const restored = await loadAutosave(repository);
    expect(restored).toMatchObject({
      status: 'loaded',
      source: 'snapshot',
      state,
      runtimeMetadata: snapshotMetadata,
    });
    expect((await repository.get('autosave'))?.checksum).not.toBe('corrupted');
    expect((await repository.get('autosave'))?.runtimeMetadata).toEqual(snapshotMetadata);
  });

  it('does not restore corrupted autosave data without a valid snapshot', async () => {
    const repository = new InMemorySaveRepository();
    const state = createInitialGameState('autosave-corrupt');
    const envelope = createSaveEnvelope('autosave', state, '2026-07-19T00:02:00.000Z');
    await repository.put({ ...envelope, checksum: 'corrupted' });
    await expect(loadAutosave(repository)).resolves.toMatchObject({
      status: 'invalid',
      code: 'CHECKSUM_MISMATCH',
    });
  });

  it('reports a missing autosave without creating one', async () => {
    const repository = new InMemorySaveRepository();
    await expect(loadAutosave(repository)).resolves.toEqual({ status: 'missing' });
    await expect(repository.list()).resolves.toEqual([]);
  });
});
