import { afterEach, describe, expect, it } from 'vitest';
import { AEGIS_VERTICAL_SLICE_ASSETS } from './aegisVerticalSliceAssets';
import { bindFactionRuntimeAssets } from './bindFactionRuntimeAssets';
import { SYNOD_MECHANICAL_ASSETS } from './factionMechanicalAssets';

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

  it('keeps Veyra alias technology and effect assets on their explicit fallback', () => {
    bindFactionRuntimeAssets('veyra');

    expect(AEGIS_VERTICAL_SLICE_ASSETS.find((asset) => asset.category === 'technology')?.atlasUrl)
      .toMatch(/aegis\/p1\/technologies-atlas\.svg$/);
    expect(AEGIS_VERTICAL_SLICE_ASSETS.find((asset) => asset.category === 'effect')?.atlasUrl)
      .toMatch(/aegis\/p1\/effects-atlas\.svg$/);
  });
});
