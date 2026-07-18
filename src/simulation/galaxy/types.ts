export type StarClass = 'blue' | 'white' | 'yellow' | 'orange' | 'red';

export type PlanetBiome =
  | 'terran'
  | 'desert'
  | 'ice'
  | 'volcanic'
  | 'toxic'
  | 'barren'
  | 'gas';

export interface PlanetModel {
  readonly id: string;
  readonly position: number;
  readonly biome: PlanetBiome;
  readonly size: number;
  readonly ownerEmpireId: string | null;
}

export interface StarSystemModel {
  readonly id: string;
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly starClass: StarClass;
  readonly planets: readonly PlanetModel[];
}

export interface GalaxyModel {
  readonly width: number;
  readonly height: number;
  readonly systems: readonly StarSystemModel[];
}

export interface GalaxyGenerationConfig {
  readonly systemCount: number;
  readonly positionsPerSystem: number;
  readonly width: number;
  readonly height: number;
}
