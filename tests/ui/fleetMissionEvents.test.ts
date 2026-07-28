import { describe, expect, it } from 'vitest';
import {
  clearPreparedFleetMissionTarget,
  readPreparedFleetMissionTarget,
  writePreparedFleetMissionTarget,
} from '../../src/ui/fleetMissionEvents';

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };
}

describe('prepared fleet mission target', () => {
  it('round-trips typed target preparation outside GameState', () => {
    const storage = memoryStorage();
    const prepared = writePreparedFleetMissionTarget({
      targetId: 'planet-target',
      label: 'Вражеская колония',
      mission: 'scout',
      source: 'space-map',
      sourceRouteHash: '#/space/solar/1/2/3',
      sourcePlanetId: 'planet-player',
    }, storage);

    expect(prepared).toEqual({
      version: 1,
      targetId: 'planet-target',
      label: 'Вражеская колония',
      mission: 'scout',
      source: 'space-map',
      sourceRouteHash: '#/space/solar/1/2/3',
      sourcePlanetId: 'planet-player',
    });
    expect(readPreparedFleetMissionTarget(storage)).toEqual(prepared);
    clearPreparedFleetMissionTarget(storage);
    expect(readPreparedFleetMissionTarget(storage)).toBeNull();
  });

  it('rejects corrupt or incomplete session context', () => {
    const storage = memoryStorage();
    storage.setItem('stellar-empires:prepared-fleet-target:v1', '{broken');
    expect(readPreparedFleetMissionTarget(storage)).toBeNull();

    storage.setItem('stellar-empires:prepared-fleet-target:v1', JSON.stringify({
      version: 1,
      targetId: '',
      label: 'missing target',
      mission: 'scout',
    }));
    expect(readPreparedFleetMissionTarget(storage)).toBeNull();
  });
});
