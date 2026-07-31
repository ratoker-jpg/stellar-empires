import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import type { LogisticsRoute } from '../../src/simulation/logistics/types';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

const SAVE_TIME = '2026-07-31T18:00:00.000Z';

function createDuplicateRouteSave() {
  const initial = createInitialGameState('legacy-duplicate-logistics');
  const origin = initial.planets.find((planet) => planet.ownerEmpireId === 'player');
  if (origin === undefined) throw new Error('Player planet missing.');
  const target = {
    ...origin,
    id: 'legacy-route-target',
    galaxyPlanetId: 'legacy-route-galaxy-target',
    name: 'Legacy route target',
  };
  const base: Omit<LogisticsRoute, 'id' | 'status' | 'amountPerTrip' | 'priority'> = {
    empireId: 'player',
    originPlanetId: origin.id,
    targetPlanetId: target.id,
    resourceId: 'metal',
    originReserve: 50,
    intervalSeconds: 600,
    nextDepartureAt: 600,
    consecutiveMisses: 2,
    lastResult: { executedAt: 0, code: 'origin-reserve', amount: 0 },
  };
  const routes: readonly LogisticsRoute[] = [
    {
      ...base,
      id: 'legacy-z',
      status: 'active',
      amountPerTrip: 999,
      priority: 1,
    },
    {
      ...base,
      id: 'logistics-12',
      status: 'paused',
      amountPerTrip: 120,
      priority: 2,
    },
    {
      ...base,
      id: 'logistics-3',
      status: 'active',
      amountPerTrip: 300,
      priority: 3,
    },
    {
      ...base,
      id: 'legacy-b',
      resourceId: 'crystal',
      status: 'paused',
      amountPerTrip: 200,
      priority: 1,
    },
    {
      ...base,
      id: 'legacy-a',
      resourceId: 'crystal',
      status: 'active',
      amountPerTrip: 400,
      priority: 3,
    },
  ];
  const state = {
    ...initial,
    planets: [...initial.planets, target],
    logisticsRoutes: routes,
  };
  return createSaveEnvelope('legacy-duplicate-routes', state, SAVE_TIME);
}

describe('legacy logistics route normalization', () => {
  it('repairs active and paused duplicates after integrity validation', () => {
    const save = createDuplicateRouteSave();
    const parsed = parseSaveJson(serializeSave(save));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.value.state.logisticsRoutes).toHaveLength(2);
    expect(parsed.value.state.logisticsRoutes[0]).toEqual(
      save.state.logisticsRoutes.find((route) => route.id === 'logistics-3'),
    );
    expect(parsed.value.state.logisticsRoutes[1]).toEqual(
      save.state.logisticsRoutes.find((route) => route.id === 'legacy-a'),
    );

    const roundTrip = parseSaveJson(serializeSave(parsed.value));
    expect(roundTrip).toEqual({ ok: true, value: parsed.value });
  });

  it('rejects route tampering before duplicate repair can run', () => {
    const save = createDuplicateRouteSave();
    const tampered = {
      ...save,
      state: {
        ...save.state,
        logisticsRoutes: save.state.logisticsRoutes.map((route, index) =>
          index === 0 ? { ...route, amountPerTrip: route.amountPerTrip + 1 } : route,
        ),
      },
    };

    expect(parseSaveJson(JSON.stringify(tampered))).toMatchObject({
      ok: false,
      code: 'CHECKSUM_MISMATCH',
    });
  });
});
