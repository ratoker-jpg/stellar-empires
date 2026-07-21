import { describe, expect, it } from 'vitest';
import {
  getBuildingPresentationRole,
  getBuildingSheetFrame,
  getBuildingSheetUrl,
  getDefensePresentationArtUrl,
  getZoneTerrainUrl,
} from './planetIndustryRuntimeAssets';

describe('planet industry runtime assets', () => {
  it('maps shared mechanical ids to faction-specific source art', () => {
    expect(getBuildingSheetUrl('synod', 'building.aegis.shipyard')).toContain('synod_shipyard_sheet.png');
    expect(getBuildingSheetUrl('veyra', 'building.aegis.research-lab')).toContain('veyra_research_lab_sheet.png');
    expect(getDefensePresentationArtUrl('aegis', 'defense.aegis.missile-battery')).toContain('aegis_missile_battery_sheet.png');
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
    expect(getBuildingSheetFrame(20, 20)).toBe(3);
  });
});
