import { describe, expect, it, vi } from 'vitest';
import { GameApplicationController } from '../../src/runtime/GameApplicationController';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';

function firstPlayerPlanetId() {
  const state = createInitialGameState('application-controller', 'aegis');
  return {
    state,
    planetId: state.planets.find((planet) => planet.ownerEmpireId === 'player')!.id,
  };
}

describe('GameApplicationController', () => {
  it('commits one accepted command through one transition and one subscriber update', () => {
    const { state } = firstPlayerPlanetId();
    const onTransition = vi.fn();
    const writeStatus = vi.fn();
    const controller = new GameApplicationController(state, { onTransition, writeStatus });
    const listener = vi.fn();
    controller.subscribe(listener);
    listener.mockClear();

    expect(controller.execute({ type: 'ADVANCE_TIME', seconds: 60 }, 'Время изменено')).toBe(true);

    expect(controller.getState().clock.elapsedSeconds).toBe(state.clock.elapsedSeconds + 60);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(onTransition).toHaveBeenCalledTimes(1);
    expect(onTransition.mock.calls[0]?.[0].source).toBe('command');
    expect(writeStatus).toHaveBeenCalledWith('Время изменено');
  });

  it('keeps rejected commands outside transition effects', () => {
    const { state } = firstPlayerPlanetId();
    const onTransition = vi.fn();
    const writeStatus = vi.fn();
    const controller = new GameApplicationController(state, { onTransition, writeStatus });

    expect(controller.execute({ type: 'ADVANCE_TIME', seconds: -1 }, 'Невозможно')).toBe(false);
    expect(controller.getState()).toBe(state);
    expect(onTransition).not.toHaveBeenCalled();
    expect(writeStatus).toHaveBeenCalledWith(expect.stringMatching(/^Отклонено · /));
  });

  it('owns active-planet presentation context without changing GameState', () => {
    const { state, planetId } = firstPlayerPlanetId();
    const controller = new GameApplicationController(state);
    expect(controller.getActivePlanetId()).toBe(planetId);
    expect(controller.selectActivePlanet('missing', false)).toBe(false);
    expect(controller.getState()).toBe(state);
  });

  it('applies bot state once without redispatching a command', () => {
    const { state } = firstPlayerPlanetId();
    const onTransition = vi.fn();
    const controller = new GameApplicationController(state, { onTransition });
    const next = { ...state, clock: { ...state.clock, elapsedSeconds: state.clock.elapsedSeconds + 10 } };

    controller.applyState(next, 'bot', 'Боты обновлены');

    expect(controller.getState()).toBe(next);
    expect(onTransition).toHaveBeenCalledTimes(1);
    expect(onTransition.mock.calls[0]?.[0].source).toBe('bot');
  });
});
