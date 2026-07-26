import { createInitialGameState } from '../../src/simulation/createInitialGameState';
export function createSchemaV13MigrationFixture(): unknown {
  const current = createInitialGameState('schema-v13-universe-fixture', 'aegis', 'campaign');
  const {
    universe: _universe,
    ...withoutUniverse
  } = current;
  return {
    ...withoutUniverse,
    schemaVersion: 13,
    galaxy: {
      ...withoutUniverse.galaxy,
      systems: withoutUniverse.galaxy.systems.slice(0, 12).map((system) => ({
        id: system.id,
        name: system.name,
        x: system.x,
        y: system.y,
        starClass: system.starClass,
        planets: system.planets.map(({ coordinate: _coordinate, ...planet }) => planet),
      })),
    },
    planets: withoutUniverse.planets.map(({ coordinate: _coordinate, ...planet }) => planet),
    intelligence: withoutUniverse.intelligence.map((state) => ({
      ...state,
      observations: state.observations.map(({ coordinate: _coordinate, snapshot, ...observation }) => ({
        ...observation,
        snapshot: (({ coordinate: _snapshotCoordinate, ...rest }) => rest)(snapshot),
      })),
      alerts: state.alerts.map(({ coordinate: _coordinate, ...alert }) => alert),
    })),
    debrisFields: withoutUniverse.debrisFields.map(({ coordinate: _coordinate, ...field }) => field),
    spaceObjects: withoutUniverse.spaceObjects.map(({ coordinate: _coordinate, ...object }) => object),
  };
}
