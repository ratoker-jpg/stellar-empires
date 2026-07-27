import { describe, expect, it } from 'vitest';
import {
  SpaceMapTextureLease,
  type SpaceMapTextureAdapter,
} from '../../src/game/spaceMapTextureLease';
import type { RuntimeSpaceMapAsset } from '../../src/assets/spaceMapAssets';

class DeferredAdapter implements SpaceMapTextureAdapter {
  public readonly loaded = new Set<string>();
  public readonly removed: string[] = [];
  public readonly pending: Array<() => void> = [];

  public has(textureKey: string): boolean { return this.loaded.has(textureKey); }
  public load(assets: readonly RuntimeSpaceMapAsset[]): Promise<void> {
    return new Promise((resolve) => {
      this.pending.push(() => {
        assets.forEach((asset) => this.loaded.add(asset.textureKey));
        resolve();
      });
    });
  }
  public remove(textureKey: string): void {
    this.loaded.delete(textureKey);
    this.removed.push(textureKey);
  }
}

describe('Space Map texture lease', () => {
  it('rejects stale asynchronous loading and releases obsolete view groups', async () => {
    const adapter = new DeferredAdapter();
    const lease = new SpaceMapTextureLease(adapter);
    const universe = lease.transition('universe');
    const galaxy = lease.transition('galaxy');
    adapter.pending[0]?.();
    const stale = await universe;
    expect(stale.stale).toBe(true);
    adapter.pending[1]?.();
    const current = await galaxy;
    expect(current.stale).toBe(false);
    expect(adapter.removed.length).toBeGreaterThan(0);
    expect(current.assets.every((asset) => adapter.loaded.has(asset.textureKey))).toBe(true);
  });
});
