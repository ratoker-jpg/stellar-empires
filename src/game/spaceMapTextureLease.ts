import {
  getSpaceMapTextureGroup,
  type RuntimeSpaceMapAsset,
  type SolarSystemTextureSelection,
  type SpaceMapLevel,
} from '../assets/spaceMapAssets';

export interface SpaceMapTextureAdapter {
  has(textureKey: string): boolean;
  load(assets: readonly RuntimeSpaceMapAsset[]): Promise<void>;
  remove(textureKey: string): void;
}

export interface SpaceMapTextureTransitionResult {
  readonly stale: boolean;
  readonly epoch: number;
  readonly assets: readonly RuntimeSpaceMapAsset[];
}

export class SpaceMapTextureLease {
  readonly #adapter: SpaceMapTextureAdapter;
  #epoch = 0;
  #activeKeys = new Set<string>();

  public constructor(adapter: SpaceMapTextureAdapter) {
    this.#adapter = adapter;
  }

  public async transition(
    level: SpaceMapLevel,
    selection?: SolarSystemTextureSelection,
  ): Promise<SpaceMapTextureTransitionResult> {
    const epoch = ++this.#epoch;
    const assets = selection === undefined
      ? getSpaceMapTextureGroup(level)
      : getSpaceMapTextureGroup(level, selection);
    const targetKeys = new Set(assets.map((asset) => asset.textureKey));
    const missing = assets.filter((asset) => !this.#adapter.has(asset.textureKey));
    await this.#adapter.load(missing);
    if (epoch !== this.#epoch) {
      for (const asset of missing) {
        if (!this.#activeKeys.has(asset.textureKey)) this.#adapter.remove(asset.textureKey);
      }
      return { stale: true, epoch, assets };
    }
    for (const key of this.#activeKeys) {
      if (!targetKeys.has(key)) this.#adapter.remove(key);
    }
    this.#activeKeys = targetKeys;
    return { stale: false, epoch, assets };
  }

  public releaseAll(): void {
    this.#epoch += 1;
    for (const key of this.#activeKeys) this.#adapter.remove(key);
    this.#activeKeys.clear();
  }
}
