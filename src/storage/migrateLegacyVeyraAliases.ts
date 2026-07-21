import { refreshPlanetEconomy } from '../simulation/economy/planetEconomy';
import { getResearchCatalogForFaction } from '../simulation/factions/factionMechanicalCatalogRegistry';
import { calculateResearchEffects } from '../simulation/research/progression';
import type { EmpireResearchState } from '../simulation/research/types';
import type { GameState } from '../simulation/types';

export const LEGACY_AEGIS_TO_VEYRA_IDS: Readonly<Record<string, string>> = {
  'building.aegis.command': 'building.veyra.swarm-heart',
  'building.aegis.metal-extractor': 'building.veyra.alloy-bloom',
  'building.aegis.crystal-refinery': 'building.veyra.crystal-grove',
  'building.aegis.gas-extractor': 'building.veyra.vapor-root',
  'building.aegis.power-plant': 'building.veyra.solar-membrane',
  'building.aegis.research-lab': 'building.veyra.memory-pod',
  'building.aegis.shipyard': 'building.veyra.living-dock',
  'building.aegis.sensor-array': 'building.veyra.pulse-canopy',
  'building.aegis.orbital-depot': 'building.veyra.spore-vault',
  'building.aegis.civic-core': 'building.veyra.nest-cluster',
  'building.aegis.tactical-academy': 'building.veyra.hunter-node',
  'building.aegis.defense-foundry': 'building.veyra.carapace-forge',
  'technology.aegis.construction': 'technology.veyra.adaptive-growth',
  'technology.aegis.energy': 'technology.veyra.photosynthetic-grid',
  'technology.aegis.sensors': 'technology.veyra.echo-sense',
  'technology.aegis.propulsion': 'technology.veyra.living-thrust',
  'technology.aegis.armor': 'technology.veyra.carapace-weave',
  'technology.aegis.weapons': 'technology.veyra.predator-instinct',
  'technology.aegis.colonization': 'technology.veyra.brood-seeding',
  'technology.aegis.logistics': 'technology.veyra.mycelial-logistics',
  'technology.aegis.shield-harmonics': 'technology.veyra.regenerative-shells',
  'technology.aegis.battle-network': 'technology.veyra.swarm-mind',
  'ship.aegis.scout': 'ship.veyra.wisp',
  'ship.aegis.cargo': 'ship.veyra.tendril',
  'ship.aegis.fighter': 'ship.veyra.sting',
  'ship.aegis.frigate': 'ship.veyra.shellwing',
  'ship.aegis.colony': 'ship.veyra.brood-ark',
  'ship.aegis.recycler': 'ship.veyra.devourer',
  'ship.aegis.corvette': 'ship.veyra.dart',
  'ship.aegis.cruiser': 'ship.veyra.manta',
  'ship.aegis.carrier': 'ship.veyra.hive-carrier',
  'ship.aegis.dreadnought': 'ship.veyra.leviathan',
  'defense.aegis.gun-battery': 'defense.veyra.thorn-spire',
  'defense.aegis.missile-battery': 'defense.veyra.spore-mortar',
  'defense.aegis.shield-generator': 'defense.veyra.living-veil',
  'defense.aegis.point-defense': 'defense.veyra.snapper-node',
  'defense.aegis.fortress-array': 'defense.veyra.hive-bastion',
};

function mapMechanicalIds<T>(value: T): T {
  if (typeof value === 'string') {
    return (LEGACY_AEGIS_TO_VEYRA_IDS[value] ?? value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => mapMechanicalIds(item)) as T;
  }
  if (typeof value !== 'object' || value === null) return value;

  const mapped: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    mapped[LEGACY_AEGIS_TO_VEYRA_IDS[key] ?? key] = mapMechanicalIds(nested);
  }
  return mapped as T;
}

function hasVeyraContext(
  value: unknown,
  empireIds: ReadonlySet<string>,
  planetIds: ReadonlySet<string>,
  fleetIds: ReadonlySet<string>,
): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => hasVeyraContext(item, empireIds, planetIds, fleetIds));
  }
  if (typeof value !== 'object' || value === null) return false;

  for (const [key, nested] of Object.entries(value)) {
    if (
      typeof nested === 'string' &&
      ((key.toLowerCase().includes('empireid') && empireIds.has(nested)) ||
        (key.toLowerCase().includes('planetid') && planetIds.has(nested)) ||
        (key.toLowerCase().includes('fleetid') && fleetIds.has(nested)))
    ) {
      return true;
    }
    if (hasVeyraContext(nested, empireIds, planetIds, fleetIds)) return true;
  }
  return false;
}

function veyraEnergyOutput(
  research: readonly EmpireResearchState[],
  empireId: string,
): number {
  const empireResearch = research.find((entry) => entry.empireId === empireId);
  return empireResearch === undefined
    ? 0
    : calculateResearchEffects(
        empireResearch,
        getResearchCatalogForFaction('veyra'),
      ).energyOutputPercent;
}

export function migrateLegacyVeyraAliases(state: GameState): GameState {
  const veyraPlanets = state.planets.filter((planet) => planet.factionId === 'veyra');
  if (veyraPlanets.length === 0) return state;

  const veyraEmpireIds = new Set(veyraPlanets.map((planet) => planet.ownerEmpireId));
  const veyraPlanetIds = new Set(veyraPlanets.flatMap((planet) => [planet.id, planet.galaxyPlanetId]));
  const veyraFleetIds = new Set(
    state.fleets
      .filter((fleet) => veyraEmpireIds.has(fleet.empireId))
      .map((fleet) => fleet.id),
  );

  const migrateContextual = <T>(value: T): T =>
    hasVeyraContext(value, veyraEmpireIds, veyraPlanetIds, veyraFleetIds)
      ? mapMechanicalIds(value)
      : value;
  const research = state.research.map((entry) =>
    veyraEmpireIds.has(entry.empireId) ? mapMechanicalIds(entry) : entry,
  );
  const planets = state.planets.map((planet) => {
    if (planet.factionId !== 'veyra') return planet;
    const mapped = mapMechanicalIds(planet);
    return {
      ...mapped,
      economy: refreshPlanetEconomy(
        mapped.economy,
        mapped.buildings,
        veyraEnergyOutput(research, mapped.ownerEmpireId),
        mapped.specializationId,
      ),
    };
  });

  return {
    ...state,
    planets,
    research,
    shipUpgrades: state.shipUpgrades.map((upgrades) =>
      veyraEmpireIds.has(upgrades.empireId) ? mapMechanicalIds(upgrades) : upgrades,
    ),
    fleets: state.fleets.map((fleet) =>
      veyraEmpireIds.has(fleet.empireId) ? mapMechanicalIds(fleet) : fleet,
    ),
    intelligence: state.intelligence.map((intelligence) => ({
      ...intelligence,
      observations: intelligence.observations.map((observation) =>
        veyraPlanetIds.has(observation.targetPlanetId)
          ? mapMechanicalIds(observation)
          : observation,
      ),
    })),
    pendingEvents: state.pendingEvents.map(migrateContextual),
    commandLog: state.commandLog.map(migrateContextual),
    eventLog: state.eventLog.map(migrateContextual),
  };
}
