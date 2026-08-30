import { describe, expect, it } from 'vitest';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  SOLAR_SYSTEM_POSITION_COUNT,
  calculateCoordinateDistance,
  parsePlanetCoordinate,
  planetIdForCoordinate,
} from '../../src/simulation/space/coordinates';
import {
  UNIVERSE_TOPOLOGY_PRESETS,
  createUniverseModel,
  materializeSolarSystem,
  selectDeterministicSpaceCoordinate,
} from '../../src/simulation/universe/model';

describe('Universe spatial model', () => {
  it('defines the approved compact topology presets behind exactly 20 slots', () => {
    expect(UNIVERSE_TOPOLOGY_PRESETS).toEqual({
      test: { id: 'test', galaxyCount: 2, systemsPerGalaxy: 9 },
      campaign: { id: 'campaign', galaxyCount: 6, systemsPerGalaxy: 27 },
      fidelity: { id: 'fidelity', galaxyCount: 15, systemsPerGalaxy: 81 },
    });
    for (const presetId of ['test', 'campaign', 'fidelity'] as const) {
      const universe = createUniverseModel(42, presetId);
      expect(universe.slots).toHaveLength(20);
      expect(universe.galaxies).toHaveLength(
        UNIVERSE_TOPOLOGY_PRESETS[presetId].galaxyCount,
      );
      expect(universe.galaxies.every(
        (galaxy) => galaxy.systemCount === UNIVERSE_TOPOLOGY_PRESETS[presetId].systemsPerGalaxy,
      )).toBe(true);
    }
  });

  it('materializes exactly 24 stable positions without storing empty slots in GameState', () => {
    const universe = createUniverseModel(123, 'campaign');
    const first = materializeSolarSystem(universe, 1, 1);
    const second = materializeSolarSystem(universe, 1, 1);
    expect(first).toEqual(second);
    expect(first.positions).toHaveLength(SOLAR_SYSTEM_POSITION_COUNT);
    expect(first.positions.map((position) => position.coordinate.position)).toEqual(
      Array.from({ length: 24 }, (_, index) => index + 1),
    );
    const state = createInitialGameState('compact-save', 'aegis', 'fidelity');
    expect('positions' in state.universe).toBe(false);
    expect(JSON.stringify(state).length).toBeLessThan(1_500_000);
  });

  it('preserves legacy first-galaxy IDs and resolves them as SpaceCoordinates', () => {
    const coordinate = { galaxy: 1, solarSystem: 7, position: 24 } as const;
    expect(planetIdForCoordinate(coordinate)).toBe('system-7-planet-24');
    expect(parsePlanetCoordinate('colony-system-7-planet-24')).toEqual(coordinate);
  });

  it('uses the same deterministic selector for players and bots', () => {
    const universe = createUniverseModel(99, 'campaign');
    const player = selectDeterministicSpaceCoordinate(universe, 'player', 'colonize');
    const playerAgain = selectDeterministicSpaceCoordinate(universe, 'player', 'colonize');
    const bot = selectDeterministicSpaceCoordinate(universe, 'aegis-bot', 'colonize');
    expect(playerAgain).toEqual(player);
    expect(bot).toMatchObject({ galaxy: expect.any(Number), solarSystem: expect.any(Number) });
    expect(calculateCoordinateDistance(player, player)).toBe(0);
  });

  it('keeps initial-state checksum deterministic for every preset', () => {
    for (const presetId of ['test', 'campaign', 'fidelity'] as const) {
      const first = createInitialGameState('preset-checksum', 'aegis', presetId);
      const second = createInitialGameState('preset-checksum', 'aegis', presetId);
      expect(createStateChecksum(first)).toBe(createStateChecksum(second));
      expect(first.schemaVersion).toBe(20);
      expect(first.campaignSettings.scenarioPreset).toBe(presetId);
    }
  });
});
