from pathlib import Path


def replace(path: str, old: str, new: str, expected: int = 1) -> None:
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    count = text.count(old)
    if count != expected:
        raise RuntimeError(f'{path}: expected {expected} matches, found {count}: {old!r}')
    file.write_text(text.replace(old, new), encoding='utf-8')


for old, new in [
    ("calculateBuildingCost('legacy-v1', definition, level)", "calculateBuildingCost(definition, level, 'legacy-v1')"),
    ("calculateBuildSeconds('legacy-v1', definition, level)", "calculateBuildSeconds(definition, level, 'legacy-v1')"),
    ("calculateResearchCost('legacy-v1', definition, level)", "calculateResearchCost(definition, level, 'legacy-v1')"),
    ("calculateResearchSeconds('legacy-v1', definition, level)", "calculateResearchSeconds(definition, level, 'legacy-v1')"),
]:
    replace('tests/audit/campaignProgressionBaseline.test.ts', old, new, expected=2)

replace(
    'tests/simulation/buildingQueue.test.ts',
    "calculateBuildingCost('compressed-v1', definition, 2)",
    "calculateBuildingCost(definition, 2, 'compressed-v1')",
)
replace(
    'tests/simulation/buildingQueue.test.ts',
    "calculateBuildSeconds('compressed-v1', definition, 2)",
    "calculateBuildSeconds(definition, 2, 'compressed-v1')",
)
replace(
    'tests/simulation/researchQueue.test.ts',
    "calculateResearchCost('compressed-v1', getConstructionDefinition(), 1)",
    "calculateResearchCost(getConstructionDefinition(), 1, 'compressed-v1')",
)
replace(
    'tests/ui/industryZoneViewModel.test.ts',
    'const view = createIndustryZoneViewModel(planet);',
    'const view = createIndustryZoneViewModel(planet, state.campaignSettings.progressionProfile);',
)
replace(
    'tests/ui/militaryZoneViewModel.test.ts',
    'const view = createMilitaryZoneViewModel(planet);',
    'const view = createMilitaryZoneViewModel(planet, state.campaignSettings.progressionProfile);',
)
