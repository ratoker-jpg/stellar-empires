import type { PlanetBiome, StarClass } from '../simulation/galaxy/types';
import type { FactionId } from '../simulation/planet/types';
import { getUnitDefinition } from '../simulation/units/catalog';
import { getUnitDefinition } from '../simulation/units/catalog';

export interface RuntimeImageAsset {
  readonly key: string;
  readonly url: string;
}

export type FleetShipPresentationRole =
  | 'scout'
  | 'cargo'
  | 'fighter'
  | 'frigate'
  | 'colony'
  | 'recycler';

export const GALAXY_BACKGROUND_ASSET: RuntimeImageAsset = {
  key: 'background.galaxy.production',
  url: new URL(
    '../../assets/source/starter/backgrounds/galaxy_background.png',
    import.meta.url,
  ).href,
};

export const STAR_RUNTIME_ASSETS: Readonly<Record<StarClass, RuntimeImageAsset>> = {
  blue: {
    key: 'star.production.blue',
    url: new URL('../../assets/source/starter/stars/star_blue.png', import.meta.url).href,
  },
  white: {
    key: 'star.production.white',
    url: new URL('../../assets/source/starter/stars/star_white.png', import.meta.url).href,
  },
  yellow: {
    key: 'star.production.yellow',
    url: new URL('../../assets/source/starter/stars/star_yellow.png', import.meta.url).href,
  },
  orange: {
    key: 'star.production.orange',
    url: new URL('../../assets/source/starter/stars/star_orange.png', import.meta.url).href,
  },
  red: {
    key: 'star.production.red',
    url: new URL('../../assets/source/starter/stars/star_red.png', import.meta.url).href,
  },
};

export const PLANET_RUNTIME_ASSETS: Readonly<Record<PlanetBiome, RuntimeImageAsset>> = {
  terran: {
    key: 'planet.production.terran',
    url: new URL('../../assets/source/starter/planets/planet_terran.png', import.meta.url).href,
  },
  desert: {
    key: 'planet.production.desert',
    url: new URL('../../assets/source/starter/planets/planet_desert.png', import.meta.url).href,
  },
  ice: {
    key: 'planet.production.ice',
    url: new URL('../../assets/source/starter/planets/planet_ice.png', import.meta.url).href,
  },
  volcanic: {
    key: 'planet.production.volcanic',
    url: new URL('../../assets/source/starter/planets/planet_volcanic.png', import.meta.url).href,
  },
  toxic: {
    key: 'planet.production.toxic',
    url: new URL('../../assets/source/starter/planets/planet_toxic.png', import.meta.url).href,
  },
  barren: {
    key: 'planet.production.barren',
    url: new URL(
      '../../assets/source/starter/planets/planet_barren_rocky.png',
      import.meta.url,
    ).href,
  },
  gas: {
    key: 'planet.production.gas',
    url: new URL(
      '../../assets/source/starter/planets/planet_gas_giant.png',
      import.meta.url,
    ).href,
  },
};

export const SPACE_OBJECT_RUNTIME_ASSETS = {
  asteroid: {
    key: 'space-object.production.asteroid',
    url: new URL(
      '../../assets/source/starter/asteroids/asteroid_common_01.png',
      import.meta.url,
    ).href,
  },
  gasCloud: {
    key: 'space-object.production.gas-cloud',
    url: new URL(
      '../../assets/source/starter/asteroids/asteroid_gas_01.png',
      import.meta.url,
    ).href,
  },
  anomaly: {
    key: 'space-object.production.anomaly',
    url: new URL(
      '../../assets/source/starter/asteroids/asteroid_metal_02.png',
      import.meta.url,
    ).href,
  },
  pirateOutpost: {
    key: 'space-object.production.pirate-outpost',
    url: new URL(
      '../../assets/source/starter/pirates/pirate_outpost.png',
      import.meta.url,
    ).href,
  },
  pirateBase: {
    key: 'space-object.production.pirate-base',
    url: new URL(
      '../../assets/source/starter/pirates/pirate_base.png',
      import.meta.url,
    ).href,
  },
} as const satisfies Readonly<Record<string, RuntimeImageAsset>>;

const SHIP_ART_BY_FACTION: Readonly<
  Record<FactionId, Readonly<Record<FleetShipPresentationRole, string>>>
> = {
  aegis: {
    scout: new URL(
      '../../assets/source/faction-delivery-v1/ships/aegis_scout_ship.png',
      import.meta.url,
    ).href,
    cargo: new URL(
      '../../assets/source/faction-delivery-v1/ships/aegis_cargo_ship.png',
      import.meta.url,
    ).href,
    fighter: new URL(
      '../../assets/source/faction-delivery-v1/ships/aegis_fighter_ship.png',
      import.meta.url,
    ).href,
    frigate: new URL(
      '../../assets/source/faction-delivery-v1/ships/aegis_frigate_ship.png',
      import.meta.url,
    ).href,
    colony: new URL(
      '../../assets/source/faction-delivery-v1/ships/aegis_colony_ship.png',
      import.meta.url,
    ).href,
    recycler: new URL(
      '../../assets/source/faction-delivery-v1/ships/aegis_recycler_ship.png',
      import.meta.url,
    ).href,
  },
  synod: {
    scout: new URL(
      '../../assets/source/faction-delivery-v1/ships/synod_scout_ship.png',
      import.meta.url,
    ).href,
    cargo: new URL(
      '../../assets/source/faction-delivery-v1/ships/synod_cargo_ship.png',
      import.meta.url,
    ).href,
    fighter: new URL(
      '../../assets/source/faction-delivery-v1/ships/synod_fighter_ship.png',
      import.meta.url,
    ).href,
    frigate: new URL(
      '../../assets/source/faction-delivery-v1/ships/synod_frigate_ship.png',
      import.meta.url,
    ).href,
    colony: new URL(
      '../../assets/source/faction-delivery-v1/ships/synod_colony_ship.png',
      import.meta.url,
    ).href,
    recycler: new URL(
      '../../assets/source/faction-delivery-v1/ships/synod_recycler_ship.png',
      import.meta.url,
    ).href,
  },
  veyra: {
    scout: new URL(
      '../../assets/source/faction-delivery-v1/ships/veyra_scout_ship.png',
      import.meta.url,
    ).href,
    cargo: new URL(
      '../../assets/source/faction-delivery-v1/ships/veyra_cargo_ship.png',
      import.meta.url,
    ).href,
    fighter: new URL(
      '../../assets/source/faction-delivery-v1/ships/veyra_fighter_ship.png',
      import.meta.url,
    ).href,
    frigate: new URL(
      '../../assets/source/faction-delivery-v1/ships/veyra_frigate_ship.png',
      import.meta.url,
    ).href,
    colony: new URL(
      '../../assets/source/faction-delivery-v1/ships/veyra_colony_ship.png',
      import.meta.url,
    ).href,
    recycler: new URL(
      '../../assets/source/faction-delivery-v1/ships/veyra_recycler_ship.png',
      import.meta.url,
    ).href,
  },
};

export const MAP_SHIP_RUNTIME_ASSETS: Readonly<Record<FactionId, RuntimeImageAsset>> = {
  aegis: { key: 'ship-map.production.aegis', url: SHIP_ART_BY_FACTION.aegis.scout },
  synod: { key: 'ship-map.production.synod', url: SHIP_ART_BY_FACTION.synod.scout },
  veyra: { key: 'ship-map.production.veyra', url: SHIP_ART_BY_FACTION.veyra.scout },
};

export const GALAXY_SCENE_IMAGE_ASSETS: readonly RuntimeImageAsset[] = [
  GALAXY_BACKGROUND_ASSET,
  ...Object.values(STAR_RUNTIME_ASSETS),
  ...Object.values(PLANET_RUNTIME_ASSETS),
  ...Object.values(SPACE_OBJECT_RUNTIME_ASSETS),
  ...Object.values(MAP_SHIP_RUNTIME_ASSETS),
];

export function getStarRuntimeAsset(starClass: StarClass): RuntimeImageAsset {
  return STAR_RUNTIME_ASSETS[starClass];
}

export function getPlanetRuntimeAsset(biome: PlanetBiome): RuntimeImageAsset {
  return PLANET_RUNTIME_ASSETS[biome];
}

export function getPlanetArtUrl(biome: PlanetBiome): string {
  return PLANET_RUNTIME_ASSETS[biome].url;
}

export function getFleetShipPresentationRole(unitId: string): FleetShipPresentationRole {
  switch (getUnitDefinition(unitId)?.role) {
    case 'scout': return 'scout';
    case 'transport': return 'cargo';
    case 'frigate': return 'frigate';
    case 'colonizer': return 'colony';
    case 'recycler': return 'recycler';
    default: return 'fighter';
  }
}

export function getFleetShipArtUrl(factionId: FactionId, unitId: string): string {
  return SHIP_ART_BY_FACTION[factionId][getFleetShipPresentationRole(unitId)];
}
