import { describe, expect, it } from 'vitest';
import { resolveCompleteMechanicalAsset } from '../../src/assets/completeMechanicalAssetManifest';
import { findFleetShipByRole } from '../../src/simulation/colonization/colonization';
import { getShipAbilityBonusMaps } from '../../src/simulation/combat/shipAbilities';
import {
  getFactionMechanicalCatalog,
  validateFactionMechanicalCatalog,
} from '../../src/simulation/factions/factionMechanicalCatalogRegistry';
import {
  COMPLETE_SHIP_CATALOGS,
  getCompleteShipIds,
} from '../../src/simulation/units/completeShipCatalog';
import { resolveCanonicalUnitId } from '../../src/simulation/units/unitAliases';
import { validateUnitCatalog } from '../../src/simulation/units/validateUnitCatalog';

const FACTIONS = ['aegis', 'synod', 'veyra'] as const;

describe('complete ordinary ship catalogs', () => {
  it.each(FACTIONS)('registers 13 reachable ship classes for %s', (factionId) => {
    const ships = COMPLETE_SHIP_CATALOGS[factionId];
    const catalog = getFactionMechanicalCatalog(factionId);
    const classes = new Set(ships.map((definition) => definition.shipClass));

    expect(ships).toHaveLength(13);
    expect(classes.size).toBe(13);
    expect(ships.every((definition) => definition.kind === 'ship')).toBe(true);
    expect(ships.every((definition) => definition.ability !== undefined)).toBe(true);
    expect(validateFactionMechanicalCatalog(catalog)).toEqual([]);
    expect(validateUnitCatalog(ships, catalog.buildings, catalog.research)).toEqual([]);
  });

  it.each(FACTIONS)('binds every %s ship to a source asset and runtime fallback', (factionId) => {
    for (const ship of COMPLETE_SHIP_CATALOGS[factionId]) {
      const resolution = resolveCompleteMechanicalAsset(ship.assetId);
      expect(resolution.source).toBe('current-runtime-fallback');
      expect(resolution.asset?.id).toBe(ship.id);
      expect(resolution.provenancePath).toBe(
        `assets/source/New assets/ship/${factionId}/${ship.id}.png`,
      );
    }
  });

  it('keeps legacy ship ids readable while new commands resolve canonical definitions', () => {
    expect(resolveCanonicalUnitId('ship.aegis.cargo')).toBe('ship.aegis.transporter');
    expect(resolveCanonicalUnitId('ship.synod.oracle-dreadnought')).toBe('ship.synod.goliath');
    expect(resolveCanonicalUnitId('ship.veyra.wisp')).toBe('ship.veyra.nox-mind');
  });

  it('covers scout, transport, colonize and recycle mission roles', () => {
    const ships = getCompleteShipIds('aegis');
    expect(findFleetShipByRole({ [ships.lightFighter]: 1 }, 'scout')).toBe(ships.lightFighter);
    expect(findFleetShipByRole({ [ships.spyProbe]: 1 }, 'scout')).toBe(ships.spyProbe);
    expect(findFleetShipByRole({ [ships.smallTransport]: 1 }, 'transport')).toBe(ships.smallTransport);
    expect(findFleetShipByRole({ [ships.colonizer]: 1 }, 'colonizer')).toBe(ships.colonizer);
    expect(findFleetShipByRole({ [ships.recycler]: 1 }, 'recycler')).toBe(ships.recycler);
  });

  it('applies faction-specific heavy and support ability bonuses deterministically', () => {
    const synod = getCompleteShipIds('synod');
    const bonuses = getShipAbilityBonusMaps({
      [synod.goliath ?? synod.heavyAssault]: 2,
      [synod.supportShip]: 4,
      [synod.lightFighter]: 5,
    });

    expect(bonuses.weapon[synod.heavyAssault]).toBeGreaterThan(0);
    expect(bonuses.armor[synod.lightFighter]).toBeGreaterThan(0);
    expect(getShipAbilityBonusMaps({
      [synod.heavyAssault]: 2,
      [synod.supportShip]: 4,
      [synod.lightFighter]: 5,
    })).toEqual(bonuses);
  });

  it.each(FACTIONS)('keeps the %s energy satellite stationary', (factionId) => {
    const satellite = COMPLETE_SHIP_CATALOGS[factionId].find(
      (definition) => definition.shipClass === 'energy-satellite',
    );
    expect(satellite).toMatchObject({ stationary: true, stats: { speed: 0 } });
  });
});
