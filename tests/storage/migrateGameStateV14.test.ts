import { describe, expect, it } from 'vitest';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { replayCommands } from '../../src/simulation/replay';
import { createSchemaV13MigrationFixture } from '../fixtures/gameStateV13Fixture';
import { createSaveEnvelope, parseSaveJson, serializeSave } from '../../src/storage/saveFormat';
import { migrateGameStateV14 } from '../../src/storage/migrateGameStateV14';

describe('schema v14 migration', () => {
  it('migrates the committed v13 fixture deterministically and preserves old references', () => {
    const fixture = createSchemaV13MigrationFixture();
    const first = migrateGameStateV14(fixture);
    const second = migrateGameStateV14(structuredClone(fixture));
    expect(first).toBeDefined();
    expect(second).toEqual(first);
    expect(first?.schemaVersion).toBe(14);
    expect(first?.universe.slots).toHaveLength(20);
    expect(first?.galaxy.systems.some((system) => system.id === 'system-12')).toBe(true);
    expect(first?.planets.every((planet) => planet.coordinate.position === planet.position)).toBe(true);
    expect(first?.spaceObjects.every((object) => object.coordinate !== undefined)).toBe(true);
  });

  it('round-trips export/import and retains the migrated checksum', () => {
    const migrated = migrateGameStateV14(createSchemaV13MigrationFixture());
    expect(migrated).toBeDefined();
    if (migrated === undefined) return;
    const save = createSaveEnvelope('v13-fixture', migrated, '2026-07-27T00:00:00.000Z');
    const parsed = parseSaveJson(serializeSave(save));
    expect(parsed).toEqual({ ok: true, value: save });
    if (parsed.ok) expect(parsed.value.checksum).toBe(createStateChecksum(migrated));
  });

  it('keeps replay/checksum stable under schema v14', () => {
    const replay = replayCommands('schema-v14-replay', [
      { type: 'ADVANCE_TIME', seconds: 120 },
      { type: 'ADVANCE_TIME', seconds: 30 },
    ]);
    expect(replay.ok).toBe(true);
    if (!replay.ok) return;
    const direct = createInitialGameState('schema-v14-replay');
    expect(replay.value.clock.elapsedSeconds).toBe(150);
    expect(replay.value.schemaVersion).toBe(14);
    expect(createStateChecksum(replay.value)).not.toBe(createStateChecksum(direct));
  });
});
