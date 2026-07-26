import type { FactionId } from '../planet/types';
import { getCompleteShipIds } from './completeShipCatalog';

const LEGACY_SHIP_ALIASES_BY_FACTION: Readonly<Record<FactionId, Readonly<Record<string, string>>>> = {
  aegis: (() => {
    const ships = getCompleteShipIds('aegis');
    return {
      'ship.aegis.cargo': ships.smallTransport,
      'ship.aegis.fighter': ships.lightFighter,
      'ship.aegis.frigate': ships.lineBattleship,
      'ship.aegis.colony': ships.colonizer,
      'ship.aegis.corvette': ships.interceptor,
      'ship.aegis.carrier': ships.largeTransport,
      'ship.aegis.dreadnought': ships.heavyAssault,
    };
  })(),
  synod: (() => {
    const ships = getCompleteShipIds('synod');
    return {
      'ship.synod.whisper': ships.spyProbe,
      'ship.synod.thread-carrier': ships.smallTransport,
      'ship.synod.lancet': ships.lightFighter,
      'ship.synod.ward-frigate': ships.lineBattleship,
      'ship.synod.seed-ark': ships.colonizer,
      'ship.synod.salvage-mind': ships.recycler,
      'ship.synod.phase-corvette': ships.interceptor,
      'ship.synod.chorus-cruiser': ships.lineBattleship,
      'ship.synod.relay-carrier': ships.largeTransport,
      'ship.synod.oracle-dreadnought': ships.heavyAssault,
    };
  })(),
  veyra: (() => {
    const ships = getCompleteShipIds('veyra');
    return {
      'ship.veyra.wisp': ships.spyProbe,
      'ship.veyra.tendril': ships.smallTransport,
      'ship.veyra.sting': ships.lightFighter,
      'ship.veyra.shellwing': ships.lineBattleship,
      'ship.veyra.brood-ark': ships.colonizer,
      'ship.veyra.devourer': ships.recycler,
      'ship.veyra.dart': ships.interceptor,
      'ship.veyra.manta': ships.lineBattleship,
      'ship.veyra.hive-carrier': ships.largeTransport,
      'ship.veyra.leviathan': ships.heavyAssault,
    };
  })(),
};

export const LEGACY_UNIT_ALIASES: Readonly<Record<string, string>> = Object.assign(
  {},
  ...Object.values(LEGACY_SHIP_ALIASES_BY_FACTION),
);

export function resolveCanonicalUnitId(unitId: string): string {
  return LEGACY_UNIT_ALIASES[unitId] ?? unitId;
}

export function getLegacyUnitIdsForCanonical(unitId: string): readonly string[] {
  return Object.entries(LEGACY_UNIT_ALIASES)
    .filter(([, canonicalId]) => canonicalId === unitId)
    .map(([legacyId]) => legacyId);
}
