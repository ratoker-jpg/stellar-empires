import { describe, expect, it } from 'vitest';
import {
  createCampaignSettings,
  LEGACY_PROGRESSION_PROFILE_ID,
} from '../../src/simulation/campaign/settings';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { replayCommands } from '../../src/simulation/replay';
import { parseSaveJson } from '../../src/storage/saveFormat';
import { migrateGameStateV14 } from '../../src/storage/migrateGameStateV14';
import { migrateGameStateV15 } from '../../src/storage/migrateGameStateV15';
import { migrateGameStateV16 } from '../../src/storage/migrateGameStateV16';
import { createCampaignRuntimeMetadata } from '../../src/storage/runtimeMetadata';
import { createSchemaV13MigrationFixture } from '../fixtures/gameStateV13Fixture';

const MIGRATION_TIME = '2026-07-27T00:00:00.000Z';

describe('schema v14 through v19 migration', () => {
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

  it('preserves the schema-v15 legacy shell, upgrades it to v16 and imports it as v19/v6', () => {
    const legacy = migrateGameStateV15(createSchemaV13MigrationFixture(), MIGRATION_TIME);
    expect(legacy).toBeDefined();
    if (legacy === undefined) return;

    expect(legacy.schemaVersion).toBe(15);
    expect(legacy.campaignSettings).toEqual({
      scenarioPreset: legacy.universe.presetId,
      worldSpeed: 1,
      offlineProgression: true,
      createdAtReal: MIGRATION_TIME,
    });

    const migrated = migrateGameStateV16(legacy, MIGRATION_TIME);
    expect(migrated).toBeDefined();
    if (migrated === undefined) return;
    expect(migrated.schemaVersion).toBe(16);
    expect(migrated.campaignSettings).toEqual(createCampaignSettings({
      scenarioPreset: migrated.universe.presetId,
      worldSpeed: 1,
      progressionProfile: LEGACY_PROGRESSION_PROFILE_ID,
      createdAtReal: MIGRATION_TIME,
    }));

    const runtimeMetadata = createCampaignRuntimeMetadata(MIGRATION_TIME);
    const legacyEnvelope = {
      formatVersion: 3 as const,
      slotId: 'v13-fixture',
      savedAt: MIGRATION_TIME,
      runtimeMetadata,
      state: migrated,
    };
    const parsed = parseSaveJson(JSON.stringify({
      ...legacyEnvelope,
      checksum: createStateChecksum(legacyEnvelope),
    }));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.formatVersion).toBe(6);
      expect(parsed.value.state.schemaVersion).toBe(19);
      expect(parsed.value.state.pveMeta?.reputations.every((entry) => entry.reputation === 0)).toBe(true);
      expect(parsed.value.state.endgameParticipation?.participants.every(
        (entry) => entry.allianceId === null && entry.soloEligible,
      )).toBe(true);
      expect(parsed.value.state.endgameFinalObjects?.activeProjects).toEqual([]);
      expect(parsed.value.state.campaignResult).toEqual({ status: 'ongoing' });
    }
  });

  it('keeps explicit replay settings and checksum stable under schema v19', () => {
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
      seedSource: 'schema-v19-replay',
      faction: 'synod',
      campaignSettings: settings,
    }, commands);
    const second = replayCommands({
      seedSource: 'schema-v19-replay',
      faction: 'synod',
      campaignSettings: settings,
    }, commands);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    const direct = createInitialGameState('schema-v19-replay', {
      playerFaction: 'synod',
      campaignSettings: settings,
    });
    expect(first.value.clock.elapsedSeconds).toBe(150);
    expect(first.value.schemaVersion).toBe(19);
    expect(first.value.campaignSettings).toEqual(settings);
    expect(createStateChecksum(first.value)).toBe(createStateChecksum(second.value));
    expect(createStateChecksum(first.value)).not.toBe(createStateChecksum(direct));
  });
});
