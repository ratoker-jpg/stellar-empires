export interface GameClock {
  readonly startedAt: string;
  readonly elapsedSeconds: number;
}

export interface GameState {
  readonly schemaVersion: 1;
  readonly seed: number;
  readonly clock: GameClock;
  readonly empires: readonly string[];
}
