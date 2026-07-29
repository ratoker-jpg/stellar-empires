import { executeCommand } from '../simulation/reducer';
import type { GameCommand, GameState } from '../simulation/types';

export type ApplicationTransitionSource =
  | 'command'
  | 'planet-compatibility'
  | 'bot'
  | 'clock'
  | 'restore';

export interface ApplicationSnapshot {
  readonly state: GameState;
  readonly activePlanetId: string;
}

export interface ApplicationTransition {
  readonly previousState: GameState;
  readonly state: GameState;
  readonly source: ApplicationTransitionSource;
  readonly message: string;
}

export interface GameApplicationControllerOptions {
  readonly writeStatus?: (message: string) => void;
  readonly onTransition?: (transition: ApplicationTransition) => void;
}

export interface GameApplicationCommandBridge {
  readonly getState: () => GameState;
  readonly getActivePlanetId: () => string;
  readonly execute: (command: GameCommand, successMessage: string) => boolean;
}

function firstPlayerPlanetId(state: GameState): string {
  const planet = state.planets.find((candidate) => candidate.ownerEmpireId === 'player');
  if (planet === undefined) throw new Error('Player planet is missing from the current game state.');
  return planet.id;
}

function normalizeActivePlanetId(state: GameState, requested: string | undefined): string {
  return state.planets.some(
    (planet) => planet.id === requested && planet.ownerEmpireId === 'player',
  )
    ? requested as string
    : firstPlayerPlanetId(state);
}

export class GameApplicationController {
  readonly #options: GameApplicationControllerOptions;
  readonly #listeners = new Set<(snapshot: ApplicationSnapshot) => void>();
  #state: GameState;
  #activePlanetId: string;
  #disposed = false;

  public constructor(initialState: GameState, options: GameApplicationControllerOptions = {}) {
    this.#state = initialState;
    this.#activePlanetId = firstPlayerPlanetId(initialState);
    this.#options = options;
  }

  public get snapshot(): ApplicationSnapshot {
    return { state: this.#state, activePlanetId: this.#activePlanetId };
  }

  public getState(): GameState {
    return this.#state;
  }

  public getActivePlanetId(): string {
    return this.#activePlanetId;
  }

  public subscribe(listener: (snapshot: ApplicationSnapshot) => void): () => void {
    this.assertActive();
    this.#listeners.add(listener);
    listener(this.snapshot);
    return () => this.#listeners.delete(listener);
  }

  public execute(command: GameCommand, successMessage: string): boolean {
    this.assertActive();
    const result = executeCommand(this.#state, command);
    if (!result.ok) {
      this.#options.writeStatus?.(`Отклонено · ${result.code}`);
      return false;
    }
    this.commitState(result.value, 'command', successMessage);
    return true;
  }

  public applyState(
    state: GameState,
    source: Exclude<ApplicationTransitionSource, 'command'>,
    message: string,
  ): void {
    this.assertActive();
    this.commitState(state, source, message);
  }

  public selectActivePlanet(planetId: string, writeStatus = true): boolean {
    this.assertActive();
    const planet = this.#state.planets.find(
      (candidate) => candidate.id === planetId && candidate.ownerEmpireId === 'player',
    );
    if (planet === undefined) {
      if (writeStatus) this.#options.writeStatus?.('Колония недоступна');
      return false;
    }
    if (planet.id === this.#activePlanetId) return true;
    this.#activePlanetId = planet.id;
    if (writeStatus) this.#options.writeStatus?.(`Активная колония · ${planet.name}`);
    this.emit();
    return true;
  }

  public createCommandBridge(): GameApplicationCommandBridge {
    return {
      getState: () => this.getState(),
      getActivePlanetId: () => this.getActivePlanetId(),
      execute: (command, successMessage) => this.execute(command, successMessage),
    };
  }

  public dispose(): void {
    this.#disposed = true;
    this.#listeners.clear();
  }

  private commitState(
    state: GameState,
    source: ApplicationTransitionSource,
    message: string,
  ): void {
    const previousState = this.#state;
    this.#state = state;
    this.#activePlanetId = normalizeActivePlanetId(state, this.#activePlanetId);
    this.emit();
    this.#options.writeStatus?.(message);
    this.#options.onTransition?.({ previousState, state, source, message });
  }

  private emit(): void {
    const snapshot = this.snapshot;
    for (const listener of this.#listeners) listener(snapshot);
  }

  private assertActive(): void {
    if (this.#disposed) throw new Error('GameApplicationController is disposed.');
  }
}
