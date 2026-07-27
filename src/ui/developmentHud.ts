import type { GameState } from '../simulation/types';

export interface DevelopmentHudOptions {
  readonly getState: () => GameState;
  readonly getActivePlanetId: () => string;
}

export interface DevelopmentHudMount {
  refresh(): void;
  dispose(): void;
}

const NUMBER_FORMAT = new Intl.NumberFormat('ru-RU');

function formatWorldTime(seconds: number): string {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const remainingSeconds = seconds % 60;
  const clock = [hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
  return days === 0 ? clock : `${NUMBER_FORMAT.format(days)}д ${clock}`;
}

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`Persistent HUD element is missing: ${selector}`);
  return element;
}

export function mountDevelopmentHud(options: DevelopmentHudOptions): DevelopmentHudMount {
  const selector = requireElement<HTMLSelectElement>('#hud-planet-selector');
  const coordinate = requireElement<HTMLElement>('#hud-active-coordinate');
  const worldTime = requireElement<HTMLElement>('#hud-world-time');

  const refresh = (): void => {
    const state = options.getState();
    const playerPlanets = state.planets.filter((planet) => planet.ownerEmpireId === 'player');
    const active = playerPlanets.find((planet) => planet.id === options.getActivePlanetId())
      ?? playerPlanets[0];
    selector.replaceChildren(
      ...playerPlanets.map((planet) => {
        const option = document.createElement('option');
        option.value = planet.id;
        option.textContent = planet.name;
        return option;
      }),
    );
    if (active === undefined) {
      selector.disabled = true;
      coordinate.textContent = '—';
    } else {
      selector.disabled = false;
      selector.value = active.id;
      coordinate.textContent = `${active.systemId}:${active.position}`;
    }
    worldTime.textContent = formatWorldTime(state.clock.elapsedSeconds);
  };

  refresh();
  return {
    refresh,
    dispose: () => selector.replaceChildren(),
  };
}
