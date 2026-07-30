from pathlib import Path


def replace(path: str, old: str, new: str, expected: int = 1) -> None:
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    count = text.count(old)
    if count != expected:
        raise RuntimeError(f'{path}: expected {expected} matches, found {count}: {old!r}')
    file.write_text(text.replace(old, new), encoding='utf-8')


replace(
    'src/simulation/combat/planetDemolition.ts',
    "function getCurrentBuildingLevel(\n  buildings: readonly PlanetBuildingState[],\n  buildingId: string,\n): number {\n  const canonicalBuildingId = resolveCanonicalBuildingId(buildingId);\n  return buildings.find(\n    (building) => resolveCanonicalBuildingId(building.buildingId) === canonicalBuildingId,\n  )?.level ?? 0;\n}\n\n",
    '',
)

replace(
    'src/simulation/pve/expeditions.ts',
    "import type { PlanetState } from '../planet/types';",
    "import type { PlanetState } from '../planet/types';\nimport { scaleProgressionReward } from '../progression/economyProfile';",
)
replace(
    'src/simulation/pve/expeditions.ts',
    "  const reward = (base: { readonly metal: number; readonly crystal: number; readonly gas: number }) =>\n    scalePveReward(base, rewardMultiplierPermille);",
    "  const reward = (base: { readonly metal: number; readonly crystal: number; readonly gas: number }) =>\n    scalePveReward(\n      scaleProgressionReward(state.campaignSettings.progressionProfile, base),\n      rewardMultiplierPermille,\n    );",
)

replace(
    'src/simulation/pve/spaceObjects.ts',
    "import type { FactionId, PlanetState } from '../planet/types';",
    "import type { FactionId, PlanetState } from '../planet/types';\nimport { scaleProgressionReward } from '../progression/economyProfile';",
)
replace(
    'src/simulation/pve/spaceObjects.ts',
    "  const reward =\n    object.kind === 'asteroid'\n      ? {\n          metal: Math.floor(depletion * 0.7),\n          crystal: depletion - Math.floor(depletion * 0.7),\n          gas: 0,\n          exoticMatter: 0,\n        }\n      : object.kind === 'gas-cloud'\n        ? { metal: 0, crystal: 0, gas: depletion, exoticMatter: 0 }\n        : { metal: 0, crystal: 0, gas: 0, exoticMatter: depletion };",
    "  const baseReward =\n    object.kind === 'asteroid'\n      ? {\n          metal: Math.floor(depletion * 0.7),\n          crystal: depletion - Math.floor(depletion * 0.7),\n          gas: 0,\n          exoticMatter: 0,\n        }\n      : object.kind === 'gas-cloud'\n        ? { metal: 0, crystal: 0, gas: depletion, exoticMatter: 0 }\n        : { metal: 0, crystal: 0, gas: 0, exoticMatter: depletion };\n  const resourceReward = scaleProgressionReward(\n    state.campaignSettings.progressionProfile,\n    { metal: baseReward.metal, crystal: baseReward.crystal, gas: baseReward.gas },\n  );\n  const reward = { ...resourceReward, exoticMatter: baseReward.exoticMatter };",
)
