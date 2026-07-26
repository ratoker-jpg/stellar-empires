import { describe, expect, it } from 'vitest';
import {
  getBuildingPresentationRole,
  getBuildingSheetFrame,
  getBuildingSheetUrl,
  getDefensePresentationArtUrl,
  getZoneTerrainUrl,
} from './planetIndustryRuntimeAssets';

describe('planet industry runtime assets', () => {
  it('maps complete building ids to generated faction-specific art', () => {
    expect(getBuildingSheetUrl('synod', 'building.synod.shipyard')).toContain('/assets/generated/catalog/buildings/synod/shipyard.webp');
    expect(getBuildingSheetUrl('veyra', 'building.veyra.experimental-center')).toContain('/assets/generated/catalog/buildings/veyra/experimental-center.webp');
    expect(getDefensePresentationArtUrl('aegis', 'defense.aegis.plasma-turret')).toContain('/assets/generated/catalog/defenses/aegis/plasma-turret.webp');
  });

  it('maps all zone terrain backgrounds', () => {
    expect(getZoneTerrainUrl('resource')).toContain('resource-terrain.png');
    expect(getZoneTerrainUrl('industry')).toContain('industry-terrain.png');
    expect(getZoneTerrainUrl('military')).toContain('military-terrain.png');
  });

  it('derives stable roles and four visual stages', () => {
    expect(getBuildingPresentationRole('building.aegis.sensor-array')).toBe('sensor-array');
    expect(getBuildingPresentationRole('building.aegis.unknown')).toBe('command');
    expect(getBuildingSheetFrame(0, 20)).toBe(0);
    expect(getBuildingSheetFrame(20, 20)).toBe(0);
  });
});
