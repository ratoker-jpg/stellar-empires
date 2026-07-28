import { describe, expect, it } from 'vitest';
import { createCampaignSettings } from '../../src/simulation/campaign/settings';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { replayCommands } from '../../src/simulation/replay';
import { createSaveEnvelope, parseSaveJson, serializeSave } from '../../src/storage/saveFormat';
import { migrateGameStateV14 } from '../../src/storage/migrateGameStateV14';
import { migrateGameStateV15 } from '../../src/storage/migrateGameStateV15';
import { createSchemaV13MigrationFixture } from '../fixtures/gameStateV13Fixture';

const MIGRATION_TIME = '2026-07-27T00:00:00.000Z';

describe('schema v14 and v15 migration', () => {
  it('migrates the committed v13 fixture to v14 deterministically', () => {
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

  it('adds immutable x1 campaign settings using the envelope timestamp', () => {
    const migrated = migrateGameStateV15(createSchemaV13MigrationFixture(), MIGRATION_TIME);
    expect(migrated).toBeDefined();
    if (migrated === undefined) return;

    expect(migrated.schemaVersion).toBe(15);
    expect(migrated.campaignSettings).toEqual(createCampaignSettings({
      scenarioPreset: migrated.universe.presetId,
      worldSpeed: 1,
      createdAtReal: MIGRATION_TIME,
    }));

    const save = createSaveEnvelope('v13-fixture', migrated, MIGRATION_TIME);
    expect(parseSaveJson(serializeSave(save))).toEqual({ ok: true, value: save });
  });

  it('keeps explicit replay settings and checksum stable under schema v15', () => {
    const settings = createCampaignSettings({
      scenarioPreset: 'test',
      worldSpeed: 5,
      createdAtReal: '2026-07-28T00:00:00.000Z',
    });
    const commands = [
      { type: 'ADVANCE_TIME' as const, seconds: 120 },
      { type: 'ADVANCE_TIME' as const, seconds: 30 },
    ];
    const first = replayCommands({
      seedSource: 'schema-v15-replay',
      faction: 'synod',
      campaignSettings: settings,
    }, commands);
    const second = replayCommands({
      seedSource: 'schema-v15-replay',
      faction: 'synod',
      campaignSettings: settings,
    }, commands);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    const direct = createInitialGameState('schema-v15-replay', {
      playerFaction: 'synod',
      campaignSettings: settings,
    });
    expect(first.value.clock.elapsedSeconds).toBe(150);
    expect(first.value.schemaVersion).toBe(15);
    expect(first.value.campaignSettings).toEqual(settings);
    expect(createStateChecksum(first.value)).toBe(createStateChecksum(second.value));
    expect(createStateChecksum(first.value)).not.toBe(createStateChecksum(direct));
  });
});
