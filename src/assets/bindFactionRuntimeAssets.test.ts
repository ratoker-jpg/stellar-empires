import { afterEach, describe, expect, it } from 'vitest';
import { AEGIS_VERTICAL_SLICE_ASSETS } from './aegisVerticalSliceAssets';
import { bindFactionRuntimeAssets } from './bindFactionRuntimeAssets';

afterEach(() => bindFactionRuntimeAssets('aegis'));

describe('bindFactionRuntimeAssets', () => {
  it('redirects generated categories to the selected faction', () => {
    bindFactionRuntimeAssets('synod');

    expect(AEGIS_VERTICAL_SLICE_ASSETS.find((asset) => asset.category === 'building')?.atlasUrl)
      .toMatch(/synod\/p1\/buildings-atlas\.webp$/);
    expect(AEGIS_VERTICAL_SLICE_ASSETS.find((asset) => asset.category === 'ship')?.atlasUrl)
      .toMatch(/synod\/p1\/ships-atlas\.webp$/);
    expect(AEGIS_VERTICAL_SLICE_ASSETS.find((asset) => asset.category === 'defense')?.atlasUrl)
      .toMatch(/synod\/p1\/defenses-atlas\.webp$/);
  });

  it('keeps technology and effect assets on their explicit fallback', () => {
    bindFactionRuntimeAssets('veyra');

    expect(AEGIS_VERTICAL_SLICE_ASSETS.find((asset) => asset.category === 'technology')?.atlasUrl)
      .toMatch(/aegis\/p1\/technologies-atlas\.svg$/);
    expect(AEGIS_VERTICAL_SLICE_ASSETS.find((asset) => asset.category === 'effect')?.atlasUrl)
      .toMatch(/aegis\/p1\/effects-atlas\.svg$/);
  });
});
