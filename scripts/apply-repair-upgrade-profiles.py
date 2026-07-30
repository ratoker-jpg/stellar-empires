from pathlib import Path


def replace(path: str, old: str, new: str, expected: int = 1) -> None:
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    count = text.count(old)
    if count != expected:
        raise RuntimeError(f'{path}: expected {expected} matches, found {count}: {old!r}')
    file.write_text(text.replace(old, new), encoding='utf-8')


replace(
    'src/simulation/defense/planetaryDefense.ts',
    "import { appendCommandHistory } from '../history/stateHistory';",
    "import type { ProgressionProfileId } from '../campaign/settings';\nimport { appendCommandHistory } from '../history/stateHistory';",
)
replace(
    'src/simulation/defense/planetaryDefense.ts',
    "import type { PlanetState } from '../planet/types';",
    "import type { PlanetState } from '../planet/types';\nimport { scaleRepairCost, scaleRepairSeconds } from '../progression/profileScaling';",
)
replace(
    'src/simulation/defense/planetaryDefense.ts',
    "export function calculateDefenseRepairCost(\n  definition: UnitDefinition,\n  quantity: number,\n): { readonly metal: number; readonly crystal: number; readonly gas: number } {\n  const repairPermille = getRepairCostPermille(definition);\n  return {\n    metal: Math.ceil((definition.baseCost.metal * quantity * repairPermille) / 1_000),\n    crystal: Math.ceil((definition.baseCost.crystal * quantity * repairPermille) / 1_000),\n    gas: Math.ceil((definition.baseCost.gas * quantity * repairPermille) / 1_000),\n  };\n}",
    "export function calculateDefenseRepairCost(\n  definition: UnitDefinition,\n  quantity: number,\n  profileId: ProgressionProfileId,\n): { readonly metal: number; readonly crystal: number; readonly gas: number } {\n  const repairPermille = getRepairCostPermille(definition);\n  return scaleRepairCost(profileId, {\n    metal: Math.ceil((definition.baseCost.metal * quantity * repairPermille) / 1_000),\n    crystal: Math.ceil((definition.baseCost.crystal * quantity * repairPermille) / 1_000),\n    gas: Math.ceil((definition.baseCost.gas * quantity * repairPermille) / 1_000),\n  });\n}",
)
replace(
    'src/simulation/defense/planetaryDefense.ts',
    "export function calculateDefenseRepairSeconds(\n  definition: UnitDefinition,\n  quantity: number,\n): number {\n  return Math.max(\n    30,\n    Math.ceil((definition.baseSeconds * quantity * getRepairTimePermille(definition)) / 1_000),\n  );\n}",
    "export function calculateDefenseRepairSeconds(\n  definition: UnitDefinition,\n  quantity: number,\n  profileId: ProgressionProfileId,\n): number {\n  return scaleRepairSeconds(\n    profileId,\n    Math.max(\n      30,\n      Math.ceil((definition.baseSeconds * quantity * getRepairTimePermille(definition)) / 1_000),\n    ),\n  );\n}",
)
replace(
    'src/simulation/defense/planetaryDefense.ts',
    'const cost = calculateDefenseRepairCost(definition, command.quantity);',
    'const cost = calculateDefenseRepairCost(\n    definition,\n    command.quantity,\n    state.campaignSettings.progressionProfile,\n  );',
)
replace(
    'src/simulation/defense/planetaryDefense.ts',
    'calculateDefenseRepairSeconds(definition, command.quantity);',
    'calculateDefenseRepairSeconds(\n      definition,\n      command.quantity,\n      state.campaignSettings.progressionProfile,\n    );',
)
replace(
    'src/ui/productionScreen.ts',
    'const repairCost = calculateDefenseRepairCost(definition, repairAmount);',
    'const repairCost = calculateDefenseRepairCost(\n            definition,\n            repairAmount,\n            state.campaignSettings.progressionProfile,\n          );',
)
replace(
    'src/ui/productionScreen.ts',
    'const repairSeconds = calculateDefenseRepairSeconds(definition, repairAmount);',
    'const repairSeconds = calculateDefenseRepairSeconds(\n            definition,\n            repairAmount,\n            state.campaignSettings.progressionProfile,\n          );',
)

replace(
    'src/simulation/upgrades/shipUpgrades.ts',
    "import { appendCommandHistory } from '../history/stateHistory';",
    "import type { ProgressionProfileId } from '../campaign/settings';\nimport { appendCommandHistory } from '../history/stateHistory';",
)
replace(
    'src/simulation/upgrades/shipUpgrades.ts',
    "import type { PlanetState } from '../planet/types';",
    "import type { PlanetState } from '../planet/types';\nimport {\n  getShipUpgradeMaxLevel,\n  scaleShipUpgradeCost,\n  scaleShipUpgradeSeconds,\n} from '../progression/profileScaling';",
)
replace(
    'src/simulation/upgrades/shipUpgrades.ts',
    "export function calculateShipUpgradeCost(\n  unitId: string,\n  track: ShipUpgradeTrack,\n  targetLevel: number,\n): ResourceCost | undefined {",
    "export function calculateShipUpgradeCost(\n  unitId: string,\n  track: ShipUpgradeTrack,\n  targetLevel: number,\n  profileId: ProgressionProfileId,\n): ResourceCost | undefined {",
)
replace(
    'src/simulation/upgrades/shipUpgrades.ts',
    "  return {\n    metal: Math.max(1, Math.ceil((definition.baseCost.metal * factor) / 1_000)),\n    crystal: Math.max(1, Math.ceil((definition.baseCost.crystal * factor) / 1_000)),\n    gas: Math.max(0, Math.ceil((definition.baseCost.gas * factor) / 1_000)),\n  };",
    "  return scaleShipUpgradeCost(profileId, {\n    metal: Math.max(1, Math.ceil((definition.baseCost.metal * factor) / 1_000)),\n    crystal: Math.max(1, Math.ceil((definition.baseCost.crystal * factor) / 1_000)),\n    gas: Math.max(0, Math.ceil((definition.baseCost.gas * factor) / 1_000)),\n  });",
)
replace(
    'src/simulation/upgrades/shipUpgrades.ts',
    'export function calculateShipUpgradeSeconds(unitId: string, targetLevel: number): number {',
    'export function calculateShipUpgradeSeconds(\n  unitId: string,\n  targetLevel: number,\n  profileId: ProgressionProfileId,\n): number {',
)
replace(
    'src/simulation/upgrades/shipUpgrades.ts',
    'return Math.max(60, Math.ceil(definition.baseSeconds * (0.55 + targetLevel * 0.25)));',
    'return scaleShipUpgradeSeconds(\n    profileId,\n    Math.max(60, Math.ceil(definition.baseSeconds * (0.55 + targetLevel * 0.25))),\n  );',
)
replace(
    'src/simulation/upgrades/shipUpgrades.ts',
    'if (targetLevel > SHIP_UPGRADE_MAX_LEVEL) {',
    'if (targetLevel > getShipUpgradeMaxLevel(state.campaignSettings.progressionProfile)) {',
)
replace(
    'src/simulation/upgrades/shipUpgrades.ts',
    'const cost = calculateShipUpgradeCost(command.unitId, command.track, targetLevel);',
    'const cost = calculateShipUpgradeCost(\n    command.unitId,\n    command.track,\n    targetLevel,\n    state.campaignSettings.progressionProfile,\n  );',
)
replace(
    'src/simulation/upgrades/shipUpgrades.ts',
    'state.clock.elapsedSeconds + calculateShipUpgradeSeconds(command.unitId, targetLevel),',
    'state.clock.elapsedSeconds + calculateShipUpgradeSeconds(\n        command.unitId,\n        targetLevel,\n        state.campaignSettings.progressionProfile,\n      ),',
)
