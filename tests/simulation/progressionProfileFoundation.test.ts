import { describe, expect, it } from 'vitest';
import { createCampaignSettings } from '../../src/simulation/campaign/settings';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getCompleteBuildingIds } from '../../src/simulation/planet/completeBuildingCatalog';
import {
  getBuildingMaxLevelById,
  getResearchMaxLevelById,
} from '../../src/simulation/progression/profile';
import { getCompleteResearchId } from '../../src/simulation/research/completeResearchCatalog';
import { executeCommand } from '../../src/simulation/reducer';
import { migrateGameStateV16 } from '../../src/storage/migrateGameStateV16';

const SAVED_AT = '2026-07-30T12:00:00.000Z';
const FACTIONS = ['aegis', 'synod', 'veyra'] as const;

describe('progression profile foundation', () => {
  it('defaults new campaigns to compressed-v1 and includes profile identity in checksum', () => {
    const compressed = createInitialGameState('profile-checksum');
    const legacy = createInitialGameState('profile-checksum', {
      campaignSettings: createCampaignSettings({ progressionProfile: 'legacy-v1' }),
    });

    expect(compressed.schemaVersion).toBe(18);
    expect(compressed.campaignSettings.progressionProfile).toBe('compressed-v1');
    expect(legacy.campaignSettings.progressionProfile).toBe('legacy-v1');
    expect(createStateChecksum(compressed)).not.toBe(createStateChecksum(legacy));
  });

  it('migrates schema v15 campaigns to legacy-v1 without changing queued work', () => {
    const initial = createInitialGameState('profile-queue-migration', {
      campaignSettings: createCampaignSettings({
        progressionProfile: 'legacy-v1',
        createdAtReal: SAVED_AT,
      }),
    });
    const planet = initial.planets.find((candidate) => candidate.ownerEmpireId === 'player');
    expect(planet).toBeDefined();
    if (planet === undefined) return;

    const queued = executeCommand(initial, {
      type: 'QUEUE_BUILDING',
      empireId: 'player',
      planetId: planet.id,
      buildingId: getCompleteBuildingIds('aegis').metalPrimary,
    });
    expect(queued.ok).toBe(true);
    if (!queued.ok) return;

    const queuedItem = queued.value.planets.find((candidate) => candidate.id === planet.id)?.buildQueue[0];
    expect(queuedItem).toBeDefined();
    if (queuedItem === undefined) return;

    const { progressionProfile: _profile, ...legacySettings } = queued.value.campaignSettings;
    const {
      pveMeta: _pveMeta,
      endgameParticipation: _endgameParticipation,
      ...legacyWithoutCurrentDomains
    } = queued.value;
    const legacyState = {
      ...legacyWithoutCurrentDomains,
      schemaVersion: 15,
      campaignSettings: legacySettings,
    };
    const migrated = migrateGameStateV16(legacyState, SAVED_AT);

    expect(migrated?.campaignSettings.progressionProfile).toBe('legacy-v1');
    expect(migrated?.planets.find((candidate) => candidate.id === planet.id)?.buildQueue[0])
      .toEqual(queuedItem);
  });

  it('applies compressed caps by semantic role across all factions', () => {
    expect(
      FACTIONS.map((faction) =>
        getBuildingMaxLevelById(
          'compressed-v1',
          getCompleteBuildingIds(faction).shipyard,
        ),
      ),
    ).toEqual([8, 8, 8]);
    expect(
      FACTIONS.map((faction) =>
        getResearchMaxLevelById(
          'compressed-v1',
          getCompleteResearchId(faction, 'physics'),
        ),
      ),
    ).toEqual([6, 6, 6]);
    expect(
      FACTIONS.map((faction) =>
        getResearchMaxLevelById(
          'compressed-v1',
          getCompleteResearchId(faction, 'parallel-universes'),
        ),
      ),
    ).toEqual([3, 3, 3]);
  });
});
