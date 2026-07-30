import { describe, expect, it } from 'vitest';
import { getAllBotProgressionPhases } from '../../src/simulation/bots/progressionPhase';
import { advanceCampaignTime } from '../../src/simulation/campaign/time';
import { createCampaignSettings } from '../../src/simulation/campaign/settings';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import type { GameState } from '../../src/simulation/types';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

function advance(state: GameState, seconds: number): GameState {
  const result = advanceCampaignTime(state, seconds, { operationBudget: 100_000 });
  expect(result.complete).toBe(true);
  if (!result.complete) throw new Error('Campaign advance did not complete.');
  return result.state;
}

function createState(): GameState {
  return createInitialGameState('compressed-partition-equivalence', {
    playerFaction: 'synod',
    campaignSettings: createCampaignSettings({
      scenarioPreset: 'campaign',
      worldSpeed: 2,
      progressionProfile: 'compressed-v1',
      createdAtReal: '2026-07-30T00:00:00.000Z',
    }),
  });
}

describe('compressed progression partition equivalence', () => {
  it('preserves state, profile and phases across direct, chunked and save-loaded time', () => {
    const initial = createState();
    const direct = advance(initial, 7_200);
    const midpoint = advance(initial, 3_600);
    const chunked = advance(midpoint, 3_600);
    const envelope = createSaveEnvelope(
      'compressed-partition',
      midpoint,
      '2026-07-30T01:00:00.000Z',
    );
    const parsed = parseSaveJson(serializeSave(envelope));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error(parsed.message);
    const resumed = advance(parsed.value.state, 3_600);

    expect(direct.campaignSettings.progressionProfile).toBe('compressed-v1');
    expect(chunked.campaignSettings).toEqual(direct.campaignSettings);
    expect(resumed.campaignSettings).toEqual(direct.campaignSettings);
    expect(createStateChecksum(chunked)).toBe(createStateChecksum(direct));
    expect(createStateChecksum(resumed)).toBe(createStateChecksum(direct));
    expect(getAllBotProgressionPhases(chunked)).toEqual(getAllBotProgressionPhases(direct));
    expect(getAllBotProgressionPhases(resumed)).toEqual(getAllBotProgressionPhases(direct));
  }, 30_000);
});
