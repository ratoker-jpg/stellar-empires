import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import type { GameState } from '../../src/simulation/types';
import { AutoSaveController } from '../../src/storage/AutoSaveController';
import { InMemorySaveRepository } from '../../src/storage/InMemorySaveRepository';
import { createCampaignRuntimeMetadata } from '../../src/storage/runtimeMetadata';

function terminalState(seed = 'terminal-autosave'): GameState {
  const state = createInitialGameState(seed);
  const host = state.planets.find((planet) => planet.ownerEmpireId === 'player');
  if (host === undefined) throw new Error('Player host missing.');
  return {
    ...state,
    campaignResult: {
      status: 'terminal',
      winningParticipationKind: 'solo',
      winningParticipationId: 'player',
      winningEmpireIds: ['player'],
      ownerEmpireId: 'player',
      hostPlanetId: host.id,
      terminalAt: state.clock.elapsedSeconds,
      reason: 'final-gate-stabilized',
    },
  };
}

describe('terminal autosave checkpoint', () => {
  it('starts a durable terminal write immediately instead of waiting for the debounce window', async () => {
    const repository = new InMemorySaveRepository();
    const state = terminalState();
    const runtimeMetadata = createCampaignRuntimeMetadata('2026-08-18T00:00:00.000Z');
    const phases: string[] = [];
    const controller = new AutoSaveController(repository, {
      delayMs: 60_000,
      runtimeMetadata,
      now: () => '2026-08-18T00:00:01.000Z',
      onStatus: (status) => phases.push(status.phase),
    });

    controller.request(state, runtimeMetadata);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const stored = await repository.get('autosave');
    expect(stored?.state).toEqual(state);
    expect(stored?.runtimeMetadata?.lastActiveAtReal).toBe(runtimeMetadata.lastActiveAtReal);
    expect(phases).toEqual(['pending', 'saving', 'saved']);
    await controller.dispose();
  });
});
