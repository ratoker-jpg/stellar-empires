from pathlib import Path


def patch(path: str, old: str, new: str) -> None:
    target = Path(path)
    content = target.read_text(encoding='utf-8')
    if old not in content:
        raise RuntimeError(f'Expected text not found in {path}: {old[:100]!r}')
    target.write_text(content.replace(old, new), encoding='utf-8')


patch(
    'src/simulation/bots/perception.ts',
    """    foreignPlanets: [...latestByPlanet.values()].map((observation) => ({
      planetId: observation.targetPlanetId,
      coordinate: observation.coordinate ?? observation.snapshot.coordinate,
      snapshot: structuredClone(observation.snapshot),
      observedAt: observation.observedAt,
      expiresAt: observation.expiresAt,
      ageSeconds: Math.max(0, state.clock.elapsedSeconds - observation.observedAt),
      freshness:
        observation.expiresAt > state.clock.elapsedSeconds ? 'current' : 'stale',
    })),""",
    """    foreignPlanets: [...latestByPlanet.values()].map((observation) => {
      const coordinate = observation.coordinate ?? observation.snapshot.coordinate;
      return {
        planetId: observation.targetPlanetId,
        ...(coordinate === undefined ? {} : { coordinate }),
        snapshot: structuredClone(observation.snapshot),
        observedAt: observation.observedAt,
        expiresAt: observation.expiresAt,
        ageSeconds: Math.max(0, state.clock.elapsedSeconds - observation.observedAt),
        freshness:
          observation.expiresAt > state.clock.elapsedSeconds ? 'current' : 'stale',
      };
    }),""",
)
patch(
    'src/simulation/bots/perception.ts',
    """      .map((field) => ({
        planetId: field.planetId,
        coordinate: field.coordinate,
        metal: field.metal,
        crystal: field.crystal,
      }))""",
    """      .map((field) => ({
        planetId: field.planetId,
        ...(field.coordinate === undefined ? {} : { coordinate: field.coordinate }),
        metal: field.metal,
        crystal: field.crystal,
      }))""",
)
patch(
    'src/simulation/combat/debris.ts',
    """        id: `debris-${planetId}`,
        planetId,
        coordinate,
        metal: amount.metal,""",
    """        id: `debris-${planetId}`,
        planetId,
        ...(coordinate === undefined ? {} : { coordinate }),
        metal: amount.metal,""",
)
patch(
    'src/simulation/fleets/flightCalculations.ts',
    """  if (fleet.location.type !== 'planet') {
    throw new Error('Only a stationed fleet can estimate a new flight.');
  }
  const origin = planets.find((planet) => planet.id === fleet.location.planetId);""",
    """  const location = fleet.location;
  if (location.type !== 'planet') {
    throw new Error('Only a stationed fleet can estimate a new flight.');
  }
  const origin = planets.find((planet) => planet.id === location.planetId);""",
)
# The same source fragment occurs in both estimate functions; replace() above changes both occurrences.
fixture = Path('tests/fixtures/gameStateV13Fixture.ts')
content = fixture.read_text(encoding='utf-8')
content = content.replace("import type { GameState } from '../../src/simulation/types';\n\n", '')
content = content.replace(
    "  } satisfies Omit<GameState, 'schemaVersion' | 'universe'> & { readonly schemaVersion: 13 };",
    '  };',
)
fixture.write_text(content, encoding='utf-8')

print('Patched PR108 exact-optional, union narrowing and legacy fixture types.')
