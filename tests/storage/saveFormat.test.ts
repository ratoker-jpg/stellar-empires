import { describe, expect, it } from 'vitest';
import {
  createCampaignSettings,
  WORLD_SPEED_PRESETS,
} from '../../src/simulation/campaign/settings';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  createEmptyCatchUpSummary,
  createCampaignRuntimeMetadata,
} from '../../src/storage/runtimeMetadata';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

const SAVE_TIME = '2026-07-18T12:00:00.000Z';

describe('save format', () => {
  it.each(WORLD_SPEED_PRESETS)('round-trips schema v17 at world speed x%s', (worldSpeed) => {
    const settings = createCampaignSettings({
      scenarioPreset: 'test',
      worldSpeed,
      createdAtReal: '2026-07-18T10:00:00.000Z',
    });
    const state = createInitialGameState(`save-round-trip-${worldSpeed}`, {
      playerFaction: 'veyra',
      campaignSettings: settings,
    });
    const runtimeMetadata = createCampaignRuntimeMetadata(SAVE_TIME);
    const save = createSaveEnvelope('slot-1', state, SAVE_TIME, runtimeMetadata);
    expect(parseSaveJson(serializeSave(save))).toEqual({ ok: true, value: save });
  });

  it('migrates a schema-v8 save to schema v17 with x1 and envelope creation time', () => {
    const current = createInitialGameState('legacy-save');
    const {
      campaignSettings: _campaignSettings,
      debrisFields: _debrisFields,
      logisticsRoutes: _logisticsRoutes,
      market: _market,
      shipUpgrades: _shipUpgrades,
      commanders: _commanders,
      pveMeta: _pveMeta,
      ...withoutNewCollections
    } = current;
    const legacyState = {
      ...withoutNewCollections,
      schemaVersion: 8,
      planets: withoutNewCollections.planets.map(
        ({ specializationId: _specializationId, developmentTemplateId: _templateId, ...planet }) => planet,
      ),
    };
    const legacySave = {
      formatVersion: 2,
      slotId: 'legacy-slot',
      savedAt: SAVE_TIME,
      checksum: createStateChecksum(legacyState),
      state: legacyState,
    };
    const parsed = parseSaveJson(JSON.stringify(legacySave));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.value.formatVersion).toBe(4);
    expect(parsed.value.state.schemaVersion).toBe(17);
    expect(parsed.value.state.campaignSettings).toEqual(createCampaignSettings({
      scenarioPreset: parsed.value.state.universe.presetId,
      worldSpeed: 1,
      progressionProfile: 'legacy-v1',
      createdAtReal: SAVE_TIME,
    }));
    expect(parsed.value.runtimeMetadata).toEqual(createCampaignRuntimeMetadata(SAVE_TIME));
    expect(parsed.value.state.debrisFields).toEqual([]);
    expect(parsed.value.state.logisticsRoutes).toEqual([]);
    expect(parsed.value.state.market.reserves).toEqual({
      metal: 50_000,
      crystal: 50_000,
      gas: 50_000,
    });
    expect(parsed.value.state.market.trades).toEqual([]);
    expect(parsed.value.state.shipUpgrades).toHaveLength(parsed.value.state.empires.length);
    expect(parsed.value.state.shipUpgrades.every((entry) => entry.queue.length === 0)).toBe(true);
    expect(parsed.value.state.commanders).toHaveLength(parsed.value.state.empires.length);
    expect(parsed.value.state.planets[0]?.specializationId).toBe('balanced');
    expect(parsed.value.state.planets[0]?.developmentTemplateId).toBe('balanced');
    expect(parsed.value.state.pveMeta?.reputations.every((entry) => entry.reputation === 0)).toBe(true);
    expect(parsed.value.state.pveMeta?.activeArenaEntries).toEqual([]);
  });

  it('round-trips an active ship-upgrade queue', () => {
    const current = createInitialGameState('upgrade-save');
    const state = {
      ...current,
      shipUpgrades: current.shipUpgrades.map((entry) =>
        entry.empireId === 'player'
          ? {
              ...entry,
              levels: {
                'ship.aegis.fighter': { weapons: 2, armor: 1, cargo: 0 },
              },
              queue: [
                {
                  id: 'ship-upgrade-1',
                  unitId: 'ship.aegis.fighter',
                  track: 'weapons' as const,
                  targetLevel: 3,
                  planetId: current.planets[0]!.id,
                  startedAt: 10,
                  completesAt: 100,
                  cost: { metal: 200, crystal: 100, gas: 20 },
                },
              ],
            }
          : entry,
      ),
    };
    const save = createSaveEnvelope('upgrade', state, SAVE_TIME);
    expect(parseSaveJson(serializeSave(save))).toEqual({ ok: true, value: save });
  });

  it('round-trips active debris and recycling missions', () => {
    const current = createInitialGameState('debris-save');
    const state = {
      ...current,
      debrisFields: [
        {
          id: 'debris-p1',
          planetId: current.planets[0]!.id,
          metal: 500,
          crystal: 250,
          createdAt: 100,
          coordinate: current.planets[0]!.coordinate,
        },
      ],
      fleets: [
        {
          id: 'recycler-1',
          empireId: 'player',
          originPlanetId: current.planets[0]!.id,
          location: { type: 'planet' as const, planetId: current.planets[0]!.id },
          status: 'stationed' as const,
          ships: { 'ship.aegis.recycler': 1 },
          cargo: { metal: 0, crystal: 0, gas: 0 },
          speed: 8,
          cargoCapacity: 800,
          mission: { kind: 'recycle' as const, targetPlanetId: current.planets[0]!.id },
        },
      ],
    };
    const save = createSaveEnvelope('debris', state, SAVE_TIME);
    expect(parseSaveJson(serializeSave(save))).toEqual({ ok: true, value: save });
  });

  it('round-trips an active colonization expedition', () => {
    const current = createInitialGameState('colonization-save');
    const target = current.galaxy.systems
      .flatMap((system) => system.planets)
      .find((planet) => planet.ownerEmpireId === null && planet.biome !== 'gas');
    expect(target).toBeDefined();
    if (target === undefined) return;
    const origin = current.planets.find((planet) => planet.ownerEmpireId === 'player');
    expect(origin).toBeDefined();
    if (origin === undefined) return;

    const state = {
      ...current,
      fleets: [
        {
          id: 'colonizer-1',
          empireId: 'player',
          originPlanetId: origin.id,
          location: {
            type: 'transit' as const,
            fromPlanetId: origin.id,
            toPlanetId: target.id,
            departedAt: 10,
            arrivesAt: 100,
          },
          status: 'outbound' as const,
          ships: { 'ship.aegis.colony': 1 },
          cargo: { metal: 200, crystal: 100, gas: 50 },
          speed: 6,
          cargoCapacity: 500,
          mission: { kind: 'colonize' as const, targetPlanetId: target.id },
        },
      ],
    };
    const save = createSaveEnvelope('colonization', state, SAVE_TIME);
    expect(parseSaveJson(serializeSave(save))).toEqual({ ok: true, value: save });
  });

  it('adds a null mission and campaign settings to older fleet saves', () => {
    const current = createInitialGameState('fleet-migration');
    const olderFleet = {
      id: 'fleet-1',
      empireId: 'player',
      originPlanetId: current.planets[0]!.id,
      location: { type: 'planet', planetId: current.planets[0]!.id },
      status: 'stationed',
      ships: { 'ship.aegis.scout': 1 },
      cargo: { metal: 0, crystal: 0, gas: 0 },
      speed: 14,
      cargoCapacity: 20,
    };
    const {
      campaignSettings: _campaignSettings,
      shipUpgrades: _shipUpgrades,
      commanders: _commanders,
      pveMeta: _pveMeta,
      ...legacyBase
    } = current;
    const legacyState = { ...legacyBase, schemaVersion: 6, fleets: [olderFleet] };
    const legacySave = {
      formatVersion: 2,
      slotId: 'fleet-v6',
      savedAt: SAVE_TIME,
      checksum: createStateChecksum(legacyState),
      state: legacyState,
    };
    const parsed = parseSaveJson(JSON.stringify(legacySave));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.state.fleets[0]?.mission).toBeNull();
      expect(parsed.value.state.schemaVersion).toBe(17);
      expect(parsed.value.state.campaignSettings.worldSpeed).toBe(1);
    }
  });

  it('adds a serializable bot schedule to schema-v13 saves', () => {
    const current = createInitialGameState('bot-automation-migration');
    const advanced = {
      ...current,
      clock: { ...current.clock, elapsedSeconds: 1_800 },
    };
    const {
      campaignSettings: _campaignSettings,
      botAutomation: _botAutomation,
      pveMeta: _pveMeta,
      ...legacyBase
    } = advanced;
    const legacyState = { ...legacyBase, schemaVersion: 13 };
    const legacySave = {
      formatVersion: 2,
      slotId: 'bot-automation-v13',
      savedAt: '2026-07-21T16:00:00.000Z',
      checksum: createStateChecksum(legacyState),
      state: legacyState,
    };
    const parsed = parseSaveJson(JSON.stringify(legacySave));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.state.botAutomation.nextDecisionAtByEmpire).toEqual({
        'aegis-bot': 1_800,
        'synod-bot': 1_800,
        'veyra-bot': 1_800,
      });
    }
  });

  it('adds default command profiles to schema-v13 saves', () => {
    const current = createInitialGameState('command-migration');
    const {
      campaignSettings: _campaignSettings,
      commanders: _commanders,
      pveMeta: _pveMeta,
      ...legacyBase
    } = current;
    const legacyState = { ...legacyBase, schemaVersion: 13 };
    const legacySave = {
      formatVersion: 2,
      slotId: 'command-v13',
      savedAt: SAVE_TIME,
      checksum: createStateChecksum(legacyState),
      state: legacyState,
    };
    const parsed = parseSaveJson(JSON.stringify(legacySave));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.state.commanders).toHaveLength(parsed.value.state.empires.length);
      expect(parsed.value.state.commanders.every((entry) => entry.doctrineId === 'adaptive')).toBe(true);
    }
  });

  it('rejects state and runtime metadata tampering', () => {
    expect(parseSaveJson('{invalid')).toMatchObject({ ok: false, code: 'INVALID_JSON' });
    const state = createInitialGameState('checksum');
    const runtimeMetadata = {
      ...createCampaignRuntimeMetadata(SAVE_TIME),
      pendingReturnSummary: createEmptyCatchUpSummary(),
    };
    const save = createSaveEnvelope('slot-1', state, SAVE_TIME, runtimeMetadata);
    const stateTampered = {
      ...save,
      state: { ...save.state, clock: { ...save.state.clock, elapsedSeconds: 999 } },
    };
    expect(parseSaveJson(JSON.stringify(stateTampered))).toMatchObject({
      ok: false,
      code: 'CHECKSUM_MISMATCH',
    });
    const metadataTampered = {
      ...save,
      runtimeMetadata: {
        ...save.runtimeMetadata,
        lastActiveAtReal: '2026-07-18T13:00:00.000Z',
      },
    };
    expect(parseSaveJson(JSON.stringify(metadataTampered))).toMatchObject({
      ok: false,
      code: 'CHECKSUM_MISMATCH',
    });
  });
});
