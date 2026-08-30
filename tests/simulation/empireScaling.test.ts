import { describe, expect, it } from 'vitest';
import {
  createInitialGameState,
} from '../../src/simulation/createInitialGameState';
import {
  createCampaignSettings,
  PROTOTYPE_BOT_EMPIRE_COUNT,
} from '../../src/simulation/campaign/settings';
import { createStateChecksum } from '../../src/simulation/checksum';
import { advanceCampaignTime } from '../../src/simulation/campaign/time';
import { selectPlanetDescriptor } from '../../src/simulation/universe/model';
import type { GameState } from '../../src/simulation/types';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

function prototypeCampaign(seedSource: string): GameState {
  return createInitialGameState(seedSource, {
    campaignSettings: createCampaignSettings({ botEmpireCount: PROTOTYPE_BOT_EMPIRE_COUNT }),
  });
}

describe('NEM-01 universe and empire scaling', () => {
  it('creates fresh prototype campaigns with 1 player and 100 generated bot empires', () => {
    const state = prototypeCampaign('nemexia-scale');
    expect(state.schemaVersion).toBe(20);
    expect(state.campaignSettings.botEmpireCount).toBe(100);
    expect(state.empires).toHaveLength(101);
    expect(state.empires[0]).toBe('player');
    expect(state.empires[1]).toBe('bot-01');
    expect(state.empires.at(-1)).toBe('bot-100');
    for (const collection of [
      state.research,
      state.shipUpgrades,
      state.commanders,
      state.intelligence,
      state.strategicResources,
      state.pveMeta?.reputations ?? [],
    ]) {
      expect(collection).toHaveLength(state.empires.length);
    }
    // Every empire entry is represented exactly once in each per-empire collection.
    for (const collection of [state.research, state.shipUpgrades, state.commanders, state.intelligence]) {
      expect(new Set(collection.map((entry) => entry.empireId))).toEqual(new Set(state.empires));
    }
  });

  it('assigns one deterministic home per system with the player rooted at galaxy 1 system 1', () => {
    const state = prototypeCampaign('home-layout');
    const homes = state.universe.homePlanets;
    expect(homes).toHaveLength(101);

    const playerHome = homes.find((home) => home.empireId === 'player');
    expect(playerHome?.coordinate).toEqual({ galaxy: 1, solarSystem: 1, position: 1 });

    const systemKeys = new Set(
      homes.map((home) => `${home.coordinate.galaxy}:${home.coordinate.solarSystem}`),
    );
    expect(systemKeys.size).toBe(101);
    expect(new Set(homes.map((home) => home.empireId))).toEqual(new Set(state.empires));

    // Lazy resolution and the stored assignment agree on ownership.
    for (const home of homes) {
      const descriptor = selectPlanetDescriptor(state.universe, home.coordinate);
      expect(descriptor?.ownerEmpireId).toBe(home.empireId);
    }
  });

  it('materializes a full colony for every home world across all preset galaxies', () => {
    const state = prototypeCampaign('colony-materialization');
    const coloniesByOwner = new Map<string, number>();
    for (const home of state.universe.homePlanets) {
      const colony = state.planets.find(
        (planet) =>
          planet.ownerEmpireId === home.empireId &&
          planet.coordinate.galaxy === home.coordinate.galaxy &&
          planet.coordinate.solarSystem === home.coordinate.solarSystem &&
          planet.coordinate.position === home.coordinate.position,
      );
      expect(colony).toBeDefined();
      coloniesByOwner.set(home.empireId, (coloniesByOwner.get(home.empireId) ?? 0) + 1);
    }
    expect(coloniesByOwner.size).toBe(101);
    // Homes outside galaxy 1 exist even though only galaxy 1 is fully materialized.
    expect(state.planets.some((planet) => planet.coordinate.galaxy > 1)).toBe(true);
  });

  it('keeps fresh creation, save/load and replay deterministic at 100 bots', () => {
    const first = prototypeCampaign('determinism-100');
    const second = prototypeCampaign('determinism-100');
    expect(createStateChecksum(first)).toBe(createStateChecksum(second));

    // Two full 100-bot decision rounds inside one bounded catch-up call;
    // the multi-hour organic budget gates land with NEM-02.
    let advanced = first;
    for (let iteration = 0; iteration < 8; iteration += 1) {
      const result = advanceCampaignTime(advanced, 240);
      advanced = result.state;
      if (result.complete) break;
    }
    expect(advanced.clock.elapsedSeconds).toBe(240);

    const save = createSaveEnvelope('nem-01-roundtrip', advanced, '2026-07-30T12:00:00.000Z');
    const parsed = parseSaveJson(serializeSave(save));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.state).toEqual(advanced);

    // Replaying the same catch-up from a fresh deterministic state reproduces
    // the exact checksum, including all 100 bot decisions.
    let replayed = second;
    for (let iteration = 0; iteration < 8; iteration += 1) {
      const result = advanceCampaignTime(replayed, 240);
      replayed = result.state;
      if (result.complete) break;
    }
    expect(createStateChecksum(replayed)).toBe(createStateChecksum(advanced));
  });

  it('rejects bot empire counts outside the supported range and worlds that cannot host them', () => {
    expect(() => createCampaignSettings({ botEmpireCount: 0 })).toThrow();
    expect(() => createCampaignSettings({ botEmpireCount: 101 })).toThrow();
    expect(() => createCampaignSettings({ botEmpireCount: 1.5 })).toThrow();
    expect(() => createInitialGameState('too-many-bots', {
      campaignSettings: createCampaignSettings({
        scenarioPreset: 'test',
        botEmpireCount: PROTOTYPE_BOT_EMPIRE_COUNT,
      }),
    })).toThrow(/cannot host/);
  });

  it('keeps the default factory on the historical three-bot legacy layout', () => {
    const state = createInitialGameState('legacy-default');
    expect(state.campaignSettings.botEmpireCount).toBe(3);
    expect(state.empires).toEqual(['player', 'aegis-bot', 'synod-bot', 'veyra-bot']);
    expect(state.universe.homePlanets).toEqual([
      { coordinate: { galaxy: 1, solarSystem: 1, position: 1 }, empireId: 'player' },
      { coordinate: { galaxy: 1, solarSystem: 2, position: 1 }, empireId: 'aegis-bot' },
      { coordinate: { galaxy: 1, solarSystem: 3, position: 1 }, empireId: 'synod-bot' },
      { coordinate: { galaxy: 1, solarSystem: 4, position: 1 }, empireId: 'veyra-bot' },
    ]);
    expect(state.botAutomation.profiles?.map((profile) => profile.empireId)).toEqual([
      'aegis-bot',
      'synod-bot',
      'veyra-bot',
    ]);
  });
});
