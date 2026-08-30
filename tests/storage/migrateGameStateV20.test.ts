import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { createStateChecksum } from '../../src/simulation/checksum';
import { DEFAULT_BOT_PROFILES } from '../../src/simulation/bots/profiles';
import type { GameState } from '../../src/simulation/types';
import {
  createCampaignRuntimeMetadata,
} from '../../src/storage/runtimeMetadata';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

const SAVE_TIME = '2026-07-30T09:00:00.000Z';

/** Builds a genuine schema-v19 envelope: v20-only fields stripped, legacy layout. */
function createLegacyV19Save(seedSource: string): string {
  const current = createInitialGameState(seedSource);
  const {
    campaignSettings: { botEmpireCount: _botEmpireCount, ...legacySettings },
    universe: { homePlanets: _homePlanets, ...legacyUniverse },
    botAutomation: { profiles: _profiles, ...legacyAutomation },
    ...legacyShell
  } = current as GameState & {
    campaignSettings: Record<string, unknown>;
    universe: Record<string, unknown>;
    botAutomation: Record<string, unknown>;
  };
  const legacyState = {
    ...legacyShell,
    schemaVersion: 19,
    campaignSettings: legacySettings,
    universe: legacyUniverse,
    botAutomation: legacyAutomation,
  };
  const envelope = {
    formatVersion: 6,
    slotId: 'v19-legacy',
    savedAt: SAVE_TIME,
    runtimeMetadata: createCampaignRuntimeMetadata(SAVE_TIME),
    state: legacyState,
  };
  return JSON.stringify({
    ...envelope,
    checksum: createStateChecksum(envelope),
  });
}

describe('migrateGameStateV20 (schema v19 -> v20)', () => {
  it('keeps migrated saves on their three-bot layout and stamps the v20 fields', () => {
    const parsed = parseSaveJson(createLegacyV19Save('v20-migration'));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const state = parsed.value.state;
    expect(state.schemaVersion).toBe(20);
    expect(state.empires).toEqual(['player', 'aegis-bot', 'synod-bot', 'veyra-bot']);
    expect(state.campaignSettings.botEmpireCount).toBe(3);
    expect(state.universe.homePlanets).toEqual([
      { coordinate: { galaxy: 1, solarSystem: 1, position: 1 }, empireId: 'player' },
      { coordinate: { galaxy: 1, solarSystem: 2, position: 1 }, empireId: 'aegis-bot' },
      { coordinate: { galaxy: 1, solarSystem: 3, position: 1 }, empireId: 'synod-bot' },
      { coordinate: { galaxy: 1, solarSystem: 4, position: 1 }, empireId: 'veyra-bot' },
    ]);
    expect(state.botAutomation.profiles).toEqual(DEFAULT_BOT_PROFILES);
    expect(state.planets.filter((planet) => planet.id.startsWith('colony-')).every((planet) =>
      planet.ownerEmpireId === null || state.empires.includes(planet.ownerEmpireId))).toBe(true);
  });

  it('is idempotent: re-parsing a migrated v20 save yields the same state', () => {
    const first = parseSaveJson(createLegacyV19Save('v20-idempotent'));
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const resaved = createSaveEnvelope('v20-idempotent', first.value.state, SAVE_TIME);
    const second = parseSaveJson(serializeSave(resaved));
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.state).toEqual(first.value.state);
  });

  it('re-stamps v20 fields deterministically when they are missing from a v20 state', () => {
    const fresh = createInitialGameState('v20-self-heal');
    const stripped = {
      ...fresh,
      universe: {
        ...fresh.universe,
        homePlanets: [],
      },
    };
    const save = createSaveEnvelope('v20-self-heal', stripped, SAVE_TIME);
    const parsed = parseSaveJson(serializeSave(save));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.state.universe.homePlanets).toEqual(fresh.universe.homePlanets);
    expect(parsed.value.state.campaignSettings.botEmpireCount).toBe(3);
  });
});
