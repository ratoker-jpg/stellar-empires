import type { GameState } from '../simulation/types';

export const LEGACY_AEGIS_TO_SYNOD_IDS: Readonly<Record<string, string>> = {
  'building.aegis.command': 'building.synod.concord-nexus',
  'building.aegis.metal-extractor': 'building.synod.matter-weave',
  'building.aegis.crystal-refinery': 'building.synod.prism-refinery',
  'building.aegis.gas-extractor': 'building.synod.flux-well',
  'building.aegis.power-plant': 'building.synod.resonant-core',
  'building.aegis.research-lab': 'building.synod.cognition-vault',
  'building.aegis.shipyard': 'building.synod.lattice-yard',
  'building.aegis.sensor-array': 'building.synod.deep-array',
  'building.aegis.orbital-depot': 'building.synod.relay-archive',
  'building.aegis.civic-core': 'building.synod.concord-habitat',
  'building.aegis.tactical-academy': 'building.synod.precision-forum',
  'building.aegis.defense-foundry': 'building.synod.shield-foundry',
  'technology.aegis.construction': 'technology.synod.distributed-construction',
  'technology.aegis.energy': 'technology.synod.harmonic-grid',
  'technology.aegis.sensors': 'technology.synod.deep-sight',
  'technology.aegis.propulsion': 'technology.synod.vector-folding',
  'technology.aegis.armor': 'technology.synod.coherent-shields',
  'technology.aegis.weapons': 'technology.synod.precision-fire',
  'technology.aegis.colonization': 'technology.synod.seed-consensus',
  'technology.aegis.logistics': 'technology.synod.relay-logistics',
  'technology.aegis.shield-harmonics': 'technology.synod.predictive-screening',
  'technology.aegis.battle-network': 'technology.synod.chorus-command',
  'ship.aegis.scout': 'ship.synod.whisper',
  'ship.aegis.cargo': 'ship.synod.thread-carrier',
  'ship.aegis.fighter': 'ship.synod.lancet',
  'ship.aegis.frigate': 'ship.synod.ward-frigate',
  'ship.aegis.colony': 'ship.synod.seed-ark',
  'ship.aegis.recycler': 'ship.synod.salvage-mind',
  'ship.aegis.corvette': 'ship.synod.phase-corvette',
  'ship.aegis.cruiser': 'ship.synod.chorus-cruiser',
  'ship.aegis.carrier': 'ship.synod.relay-carrier',
  'ship.aegis.dreadnought': 'ship.synod.oracle-dreadnought',
  'defense.aegis.gun-battery': 'defense.synod.lance-node',
  'defense.aegis.missile-battery': 'defense.synod.arc-silo',
  'defense.aegis.shield-generator': 'defense.synod.harmonic-screen',
  'defense.aegis.point-defense': 'defense.synod.predictive-intercept',
  'defense.aegis.fortress-array': 'defense.synod.concord-bastion',
};

function mapMechanicalIds<T>(value: T): T {
  if (typeof value === 'string') {
    return (LEGACY_AEGIS_TO_SYNOD_IDS[value] ?? value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => mapMechanicalIds(item)) as T;
  }
  if (typeof value !== 'object' || value === null) return value;

  const mapped: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    mapped[LEGACY_AEGIS_TO_SYNOD_IDS[key] ?? key] = mapMechanicalIds(nested);
  }
  return mapped as T;
}

function hasSynodContext(
  value: unknown,
  empireIds: ReadonlySet<string>,
  planetIds: ReadonlySet<string>,
  fleetIds: ReadonlySet<string>,
): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => hasSynodContext(item, empireIds, planetIds, fleetIds));
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
    if (hasSynodContext(nested, empireIds, planetIds, fleetIds)) return true;
  }
  return false;
}

export function migrateLegacySynodAliases(state: GameState): GameState {
  const synodPlanets = state.planets.filter((planet) => planet.factionId === 'synod');
  if (synodPlanets.length === 0) return state;

  const synodEmpireIds = new Set(synodPlanets.map((planet) => planet.ownerEmpireId));
  const synodPlanetIds = new Set(synodPlanets.flatMap((planet) => [planet.id, planet.galaxyPlanetId]));
  const synodFleetIds = new Set(
    state.fleets
      .filter((fleet) => synodEmpireIds.has(fleet.empireId))
      .map((fleet) => fleet.id),
  );

  const migrateContextual = <T>(value: T): T =>
    hasSynodContext(value, synodEmpireIds, synodPlanetIds, synodFleetIds)
      ? mapMechanicalIds(value)
      : value;

  return {
    ...state,
    planets: state.planets.map((planet) =>
      planet.factionId === 'synod' ? mapMechanicalIds(planet) : planet,
    ),
    research: state.research.map((research) =>
      synodEmpireIds.has(research.empireId) ? mapMechanicalIds(research) : research,
    ),
    shipUpgrades: state.shipUpgrades.map((upgrades) =>
      synodEmpireIds.has(upgrades.empireId) ? mapMechanicalIds(upgrades) : upgrades,
    ),
    fleets: state.fleets.map((fleet) =>
      synodEmpireIds.has(fleet.empireId) ? mapMechanicalIds(fleet) : fleet,
    ),
    intelligence: state.intelligence.map((intelligence) => ({
      ...intelligence,
      observations: intelligence.observations.map((observation) =>
        synodPlanetIds.has(observation.targetPlanetId)
          ? mapMechanicalIds(observation)
          : observation,
      ),
    })),
    pendingEvents: state.pendingEvents.map(migrateContextual),
    commandLog: state.commandLog.map(migrateContextual),
    eventLog: state.eventLog.map(migrateContextual),
  };
}
