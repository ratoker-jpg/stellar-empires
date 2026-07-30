from pathlib import Path


def replace(path: str, old: str, new: str, expected: int | None = 1) -> None:
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    count = text.count(old)
    if expected is not None and count != expected:
        raise RuntimeError(f'{path}: expected {expected} matches, found {count}: {old!r}')
    if count == 0:
        raise RuntimeError(f'{path}: pattern not found: {old!r}')
    file.write_text(text.replace(old, new), encoding='utf-8')


replace(
    'src/ui/industryZoneViewModel.ts',
    "import { getFactionMechanicalRoles } from '../simulation/factions/factionMechanicalRoles';",
    "import type { ProgressionProfileId } from '../simulation/campaign/settings';\nimport { getFactionMechanicalRoles } from '../simulation/factions/factionMechanicalRoles';",
)
replace(
    'src/ui/industryZoneViewModel.ts',
    'export function createIndustryZoneViewModel(planet: PlanetState): IndustryZoneViewModel {',
    "export function createIndustryZoneViewModel(\n  planet: PlanetState,\n  profileId: ProgressionProfileId,\n): IndustryZoneViewModel {",
)
replace(
    'src/ui/industryZoneViewModel.ts',
    'buildings: createBuildingCardViewModels(planet).filter(',
    'buildings: createBuildingCardViewModels(planet, profileId).filter(',
)

replace(
    'src/ui/militaryZoneViewModel.ts',
    "import { getFactionMechanicalRoles } from '../simulation/factions/factionMechanicalRoles';",
    "import type { ProgressionProfileId } from '../simulation/campaign/settings';\nimport { getFactionMechanicalRoles } from '../simulation/factions/factionMechanicalRoles';",
)
replace(
    'src/ui/militaryZoneViewModel.ts',
    'export function createMilitaryZoneViewModel(planet: PlanetState): MilitaryZoneViewModel {',
    "export function createMilitaryZoneViewModel(\n  planet: PlanetState,\n  profileId: ProgressionProfileId,\n): MilitaryZoneViewModel {",
)
replace(
    'src/ui/militaryZoneViewModel.ts',
    'buildings: createBuildingCardViewModels(planet).filter(',
    'buildings: createBuildingCardViewModels(planet, profileId).filter(',
)

replace(
    'src/ui/planetScreen.ts',
    'return createBuildingCardViewModels(planet).filter((candidate) => candidate.zoneId === zoneId);',
    "return createBuildingCardViewModels(\n    planet,\n    requireState().campaignSettings.progressionProfile,\n  ).filter((candidate) => candidate.zoneId === zoneId);",
)
replace(
    'src/ui/planetScreen.ts',
    'const view = createIndustryZoneViewModel(planet);',
    'const view = createIndustryZoneViewModel(planet, requireState().campaignSettings.progressionProfile);',
)
replace(
    'src/ui/planetScreen.ts',
    'const view = createMilitaryZoneViewModel(planet);',
    'const view = createMilitaryZoneViewModel(planet, requireState().campaignSettings.progressionProfile);',
)

for old, new in [
    ('calculateBuildingCost(definition, level)', "calculateBuildingCost('legacy-v1', definition, level)"),
    ('calculateBuildSeconds(definition, level)', "calculateBuildSeconds('legacy-v1', definition, level)"),
    ('calculateResearchCost(definition, level)', "calculateResearchCost('legacy-v1', definition, level)"),
    ('calculateResearchSeconds(definition, level)', "calculateResearchSeconds('legacy-v1', definition, level)"),
]:
    replace('tests/audit/campaignProgressionBaseline.test.ts', old, new, expected=2)
replace(
    'tests/audit/campaignProgressionBaseline.test.ts',
    'stateSchema: 15,',
    'stateSchema: 16,',
)

replace(
    'tests/simulation/buildingQueue.test.ts',
    'calculateBuildingCost(definition, 2)',
    "calculateBuildingCost('compressed-v1', definition, 2)",
)
replace(
    'tests/simulation/buildingQueue.test.ts',
    'calculateBuildSeconds(definition, 2)',
    "calculateBuildSeconds('compressed-v1', definition, 2)",
)
replace(
    'tests/simulation/researchQueue.test.ts',
    'calculateResearchCost(getConstructionDefinition(), 1)',
    "calculateResearchCost('compressed-v1', getConstructionDefinition(), 1)",
)

for path in [
    'tests/simulation/synodNativeCatalog.test.ts',
    'tests/simulation/veyraNativeCatalog.test.ts',
]:
    replace(
        path,
        'const cards = createBuildingCardViewModels(planet);',
        'const cards = createBuildingCardViewModels(planet, state.campaignSettings.progressionProfile);',
    )

replace(
    'tests/ui/planetViewModel.test.ts',
    'createBuildingCardViewModels(planet)',
    "createBuildingCardViewModels(planet, 'compressed-v1')",
    expected=2,
)
replace(
    'tests/ui/planetViewModel.test.ts',
    'createBuildingCardViewModels(getPlayerPlanet(queued.value))',
    "createBuildingCardViewModels(\n      getPlayerPlanet(queued.value),\n      queued.value.campaignSettings.progressionProfile,\n    )",
)
replace(
    'tests/ui/planetViewModel.test.ts',
    'createBuildingCardViewModels(prepared)',
    "createBuildingCardViewModels(prepared, 'compressed-v1')",
)
