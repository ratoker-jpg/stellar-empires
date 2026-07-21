import { afterEach, describe, expect, it } from 'vitest';
import { bindFactionRuntimeAssets } from './bindFactionRuntimeAssets';
import { SYNOD_MECHANICAL_ASSETS, VEYRA_MECHANICAL_ASSETS } from './factionMechanicalAssets';

afterEach(() => bindFactionRuntimeAssets('aegis'));

describe('bindFactionRuntimeAssets', () => {
  it('binds native Synod mechanical entries to Synod atlases', () => {
    bindFactionRuntimeAssets('synod');

    expect(SYNOD_MECHANICAL_ASSETS.find((asset) => asset.category === 'building')?.atlasUrl)
      .toMatch(/synod\/p1\/buildings-atlas\.webp$/);
    expect(SYNOD_MECHANICAL_ASSETS.find((asset) => asset.category === 'ship')?.atlasUrl)
      .toMatch(/synod\/p1\/ships-atlas\.webp$/);
    expect(SYNOD_MECHANICAL_ASSETS.find((asset) => asset.category === 'defense')?.atlasUrl)
      .toMatch(/synod\/p1\/defenses-atlas\.webp$/);
  });

  it('keeps the documented Synod technology fallback on Synod artwork', () => {
    bindFactionRuntimeAssets('synod');
    expect(SYNOD_MECHANICAL_ASSETS.find((asset) => asset.category === 'technology')?.atlasUrl)
      .toMatch(/synod\/p1\/buildings-atlas\.webp$/);
  });

  it('binds native Veyra mechanical entries to Veyra atlases', () => {
    bindFactionRuntimeAssets('veyra');

    expect(VEYRA_MECHANICAL_ASSETS.find((asset) => asset.category === 'building')?.atlasUrl)
      .toMatch(/veyra\/p1\/buildings-atlas\.webp$/);
    expect(VEYRA_MECHANICAL_ASSETS.find((asset) => asset.category === 'ship')?.atlasUrl)
      .toMatch(/veyra\/p1\/ships-atlas\.webp$/);
    expect(VEYRA_MECHANICAL_ASSETS.find((asset) => asset.category === 'defense')?.atlasUrl)
      .toMatch(/veyra\/p1\/defenses-atlas\.webp$/);
  });

  it('keeps the documented Veyra technology fallback on Veyra artwork', () => {
    bindFactionRuntimeAssets('veyra');
    expect(VEYRA_MECHANICAL_ASSETS.find((asset) => asset.category === 'technology')?.atlasUrl)
      .toMatch(/veyra\/p1\/buildings-atlas\.webp$/);
  });
});
