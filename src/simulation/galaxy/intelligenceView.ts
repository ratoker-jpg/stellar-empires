import { getEmpireIntelligence } from '../intelligence/intelligenceState';
import type { IntelObservation, IntelPlanetSnapshot } from '../intelligence/types';
import type { GameState } from '../types';
import type { PlanetBiome, StarClass } from './types';

export type GalaxyIntelVisibility = 'owned' | 'current' | 'stale' | 'contact' | 'unclaimed';
export type GalaxyOwnerFilter = 'all' | 'self' | 'foreign' | 'unclaimed';

export interface GalaxyIntelPlanet {
  readonly galaxyPlanetId: string;
  readonly colonyId: string | null;
  readonly systemId: string;
  readonly systemName: string;
  readonly systemX: number;
  readonly systemY: number;
  readonly starClass: StarClass;
  readonly position: number;
  readonly biome: PlanetBiome;
  readonly size: number;
  readonly visibility: GalaxyIntelVisibility;
  readonly displayName: string;
  readonly ownerEmpireId: string | null;
  readonly factionId: IntelPlanetSnapshot['factionId'] | null;
  readonly observedAt: number | null;
  readonly expiresAt: number | null;
  readonly resources: IntelPlanetSnapshot['resources'] | null;
  readonly buildings: Readonly<Record<string, number>> | null;
  readonly defenses: Readonly<Record<string, number>> | null;
  readonly fleets: IntelPlanetSnapshot['stationedFleets'] | null;
}

export interface GalaxyIntelQuery {
  readonly search?: string;
  readonly owner?: GalaxyOwnerFilter;
  readonly visibility?: GalaxyIntelVisibility | 'all';
  readonly biome?: PlanetBiome | 'all';
  readonly minimumSize?: number;
}

export interface GalaxyIntelSummary {
  readonly totalPositions: number;
  readonly owned: number;
  readonly current: number;
  readonly stale: number;
  readonly contacts: number;
  readonly unclaimed: number;
}

function latestObservations(
  state: GameState,
  empireId: string,
): ReadonlyMap<string, IntelObservation> {
  const intelligence = getEmpireIntelligence(state.intelligence, empireId);
  const result = new Map<string, IntelObservation>();
  const sorted = [...(intelligence?.observations ?? [])].sort(
    (left, right) => right.observedAt - left.observedAt || left.id.localeCompare(right.id),
  );
  for (const observation of sorted) {
    const planet = state.planets.find((candidate) => candidate.id === observation.targetPlanetId);
    if (planet !== undefined && !result.has(planet.galaxyPlanetId)) {
      result.set(planet.galaxyPlanetId, observation);
    }
  }
  return result;
}

export function createGalaxyIntelligenceView(
  state: GameState,
  empireId: string,
): readonly GalaxyIntelPlanet[] {
  const observations = latestObservations(state, empireId);
  return state.galaxy.systems
    .flatMap((system) =>
      system.planets.map((planet): GalaxyIntelPlanet => {
        const colony = state.planets.find(
          (candidate) => candidate.galaxyPlanetId === planet.id,
        );
        if (colony === undefined) {
          return {
            galaxyPlanetId: planet.id,
            colonyId: null,
            systemId: system.id,
            systemName: system.name,
            systemX: system.x,
            systemY: system.y,
            starClass: system.starClass,
            position: planet.position,
            biome: planet.biome,
            size: planet.size,
            visibility: 'unclaimed',
            displayName: `${system.name} · позиция ${planet.position}`,
            ownerEmpireId: null,
            factionId: null,
            observedAt: null,
            expiresAt: null,
            resources: null,
            buildings: null,
            defenses: null,
            fleets: null,
          };
        }

        if (colony.ownerEmpireId === empireId) {
          return {
            galaxyPlanetId: planet.id,
            colonyId: colony.id,
            systemId: system.id,
            systemName: system.name,
            systemX: system.x,
            systemY: system.y,
            starClass: system.starClass,
            position: planet.position,
            biome: planet.biome,
            size: planet.size,
            visibility: 'owned',
            displayName: colony.name,
            ownerEmpireId: empireId,
            factionId: colony.factionId,
            observedAt: state.clock.elapsedSeconds,
            expiresAt: null,
            resources: {
              metal: colony.economy.resources.metal.amount,
              crystal: colony.economy.resources.crystal.amount,
              gas: colony.economy.resources.gas.amount,
              energyProduced: colony.economy.energy.produced,
              energyConsumed: colony.economy.energy.consumed,
            },
            buildings: Object.fromEntries(
              colony.buildings.map((building) => [building.buildingId, building.level]),
            ),
            defenses: { ...colony.inventory.defenses },
            fleets: state.fleets
              .filter(
                (fleet) =>
                  fleet.empireId === empireId &&
                  fleet.status === 'stationed' &&
                  fleet.location.type === 'planet' &&
                  fleet.location.planetId === colony.id,
              )
              .map((fleet) => ({ fleetId: fleet.id, ships: { ...fleet.ships } })),
          };
        }

        const observation = observations.get(planet.id);
        if (observation === undefined) {
          return {
            galaxyPlanetId: planet.id,
            colonyId: colony.id,
            systemId: system.id,
            systemName: system.name,
            systemX: system.x,
            systemY: system.y,
            starClass: system.starClass,
            position: planet.position,
            biome: planet.biome,
            size: planet.size,
            visibility: 'contact',
            displayName: `${system.name} · неизвестный контакт`,
            ownerEmpireId: null,
            factionId: null,
            observedAt: null,
            expiresAt: null,
            resources: null,
            buildings: null,
            defenses: null,
            fleets: null,
          };
        }

        const current = observation.expiresAt > state.clock.elapsedSeconds;
        return {
          galaxyPlanetId: planet.id,
          colonyId: colony.id,
          systemId: system.id,
          systemName: system.name,
          systemX: system.x,
          systemY: system.y,
          starClass: system.starClass,
          position: planet.position,
          biome: planet.biome,
          size: planet.size,
          visibility: current ? 'current' : 'stale',
          displayName: observation.snapshot.name,
          ownerEmpireId: observation.snapshot.ownerEmpireId,
          factionId: observation.snapshot.factionId,
          observedAt: observation.observedAt,
          expiresAt: observation.expiresAt,
          resources: observation.snapshot.resources ?? null,
          buildings: observation.snapshot.buildings ?? null,
          defenses: observation.snapshot.defenses ?? null,
          fleets: observation.snapshot.stationedFleets ?? null,
        };
      }),
    )
    .sort(
      (left, right) =>
        left.systemName.localeCompare(right.systemName) || left.position - right.position,
    );
}

export function filterGalaxyIntelligence(
  planets: readonly GalaxyIntelPlanet[],
  query: GalaxyIntelQuery,
): readonly GalaxyIntelPlanet[] {
  const search = query.search?.trim().toLocaleLowerCase('ru-RU') ?? '';
  const owner = query.owner ?? 'all';
  const visibility = query.visibility ?? 'all';
  const biome = query.biome ?? 'all';
  const minimumSize = query.minimumSize ?? 0;
  return planets.filter((planet) => {
    if (search.length > 0) {
      const haystack = `${planet.displayName} ${planet.systemName} ${planet.systemId} ${planet.galaxyPlanetId}`
        .toLocaleLowerCase('ru-RU');
      if (!haystack.includes(search)) return false;
    }
    if (visibility !== 'all' && planet.visibility !== visibility) return false;
    if (biome !== 'all' && planet.biome !== biome) return false;
    if (planet.size < minimumSize) return false;
    if (owner === 'self' && planet.visibility !== 'owned') return false;
    if (
      owner === 'foreign' &&
      !['current', 'stale', 'contact'].includes(planet.visibility)
    ) {
      return false;
    }
    if (owner === 'unclaimed' && planet.visibility !== 'unclaimed') return false;
    return true;
  });
}

export function summarizeGalaxyIntelligence(
  planets: readonly GalaxyIntelPlanet[],
): GalaxyIntelSummary {
  return {
    totalPositions: planets.length,
    owned: planets.filter((planet) => planet.visibility === 'owned').length,
    current: planets.filter((planet) => planet.visibility === 'current').length,
    stale: planets.filter((planet) => planet.visibility === 'stale').length,
    contacts: planets.filter((planet) => planet.visibility === 'contact').length,
    unclaimed: planets.filter((planet) => planet.visibility === 'unclaimed').length,
  };
}
