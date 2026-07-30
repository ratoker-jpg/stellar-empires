from pathlib import Path


def replace(path: str, old: str, new: str, expected: int = 1) -> None:
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    count = text.count(old)
    if count != expected:
        raise RuntimeError(f'{path}: expected {expected} matches, found {count}: {old!r}')
    file.write_text(text.replace(old, new), encoding='utf-8')


replace(
    'src/simulation/colonization/colonization.ts',
    "import { createInitialPlanetDefenseState } from '../defense/types';",
    "import type { ProgressionProfileId } from '../campaign/settings';\nimport { createInitialPlanetDefenseState } from '../defense/types';",
)
replace(
    'src/simulation/colonization/colonization.ts',
    "  factionId: FactionId = 'aegis',\n  colonyId = `colony-${location.planet.id}`,",
    "  factionId: FactionId,\n  progressionProfile: ProgressionProfileId,\n  colonyId = `colony-${location.planet.id}`,",
)
replace(
    'src/simulation/colonization/colonization.ts',
    "economy: createPlanetEconomy(buildings, 0, 'balanced'),",
    "economy: createPlanetEconomy(progressionProfile, buildings, 0, 'balanced'),",
)
replace(
    'src/simulation/colonization/colonization.ts',
    "    factionId,\n    `colony-${location.planet.id}-${state.nextEventSequence}`,",
    "    factionId,\n    state.campaignSettings.progressionProfile,\n    `colony-${location.planet.id}-${state.nextEventSequence}`,",
)

replace(
    'src/simulation/combat/planetDemolition.ts',
    '        economy: refreshPlanetEconomy(\n          input.target.economy,',
    '        economy: refreshPlanetEconomy(\n          input.state.campaignSettings.progressionProfile,\n          input.target.economy,',
)

replace(
    'src/simulation/planet/buildingProgression.ts',
    'export function completeBuilding(\n  planet: PlanetState,',
    'export function completeBuilding(\n  profileId: ProgressionProfileId,\n  planet: PlanetState,',
)
replace(
    'src/simulation/planet/buildingProgression.ts',
    '  const economy = refreshPlanetEconomy(\n    planet.economy,',
    '  const economy = refreshPlanetEconomy(\n    profileId,\n    planet.economy,',
)

replace(
    'src/simulation/planet/specializationCommands.ts',
    '    economy: refreshPlanetEconomy(\n      owned.value.economy,',
    '    economy: refreshPlanetEconomy(\n      state.campaignSettings.progressionProfile,\n      owned.value.economy,',
)

replace(
    'src/simulation/pve/neutralForces.ts',
    "const economy = createPlanetEconomy(buildings, 0, 'military');",
    "const economy = createPlanetEconomy('legacy-v1', buildings, 0, 'military');",
)

replace(
    'src/simulation/reducer.ts',
    '      completeBuilding(planet, payload.buildingId, payload.targetLevel, payload.queueItemId),',
    '      completeBuilding(\n        state.campaignSettings.progressionProfile,\n        planet,\n        payload.buildingId,\n        payload.targetLevel,\n        payload.queueItemId,\n      ),',
)
replace(
    'src/simulation/reducer.ts',
    '    planets: accrueAllPlanetEconomies(state.planets, seconds, getEnergyOutputByEmpire(state)),',
    '    planets: accrueAllPlanetEconomies(\n      state.campaignSettings.progressionProfile,\n      state.planets,\n      seconds,\n      getEnergyOutputByEmpire(state),\n    ),',
)

replace(
    'src/storage/migrateGameState.ts',
    'if (!isRecord(value) || !isRecord(value.resources)) return createPlanetEconomy(buildings, 0, specializationId);',
    "if (!isRecord(value) || !isRecord(value.resources)) return createPlanetEconomy('legacy-v1', buildings, 0, specializationId);",
)
replace(
    'src/storage/migrateGameState.ts',
    'return refreshPlanetEconomy(value as unknown as PlanetEconomyState, buildings, 0, specializationId);',
    "return refreshPlanetEconomy('legacy-v1', value as unknown as PlanetEconomyState, buildings, 0, specializationId);",
)

for path in [
    'src/storage/migrateLegacySynodAliases.ts',
    'src/storage/migrateLegacyVeyraAliases.ts',
]:
    replace(
        path,
        '      economy: refreshPlanetEconomy(\n        mapped.economy,',
        '      economy: refreshPlanetEconomy(\n        state.campaignSettings.progressionProfile,\n        mapped.economy,',
    )

replace(
    'tests/simulation/economy.test.ts',
    "import { createInitialGameState } from '../../src/simulation/createInitialGameState';",
    "import { createCampaignSettings } from '../../src/simulation/campaign/settings';\nimport { createInitialGameState } from '../../src/simulation/createInitialGameState';",
)
replace(
    'tests/simulation/economy.test.ts',
    '  const state = createInitialGameState(seed);',
    "  const state = createInitialGameState(seed, {\n    campaignSettings: createCampaignSettings({ progressionProfile: 'legacy-v1' }),\n  });",
)
replace(
    'tests/simulation/economy.test.ts',
    'const economy = createPlanetEconomy([',
    "const economy = createPlanetEconomy('legacy-v1', [",
)
replace(
    'tests/simulation/economy.test.ts',
    'const updated = accruePlanetEconomy(nearlyFull, 86_400);',
    "const updated = accruePlanetEconomy('legacy-v1', nearlyFull, 86_400);",
)
for path in [
    'tests/simulation/researchQueue.test.ts',
    'tests/simulation/unitProduction.test.ts',
]:
    replace(
        path,
        'economy: refreshPlanetEconomy(planet.economy, buildings),',
        'economy: refreshPlanetEconomy(\n          state.campaignSettings.progressionProfile,\n          planet.economy,\n          buildings,\n        ),',
    )
