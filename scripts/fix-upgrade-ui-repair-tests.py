from pathlib import Path


def replace(path: str, old: str, new: str, expected: int = 1) -> None:
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    count = text.count(old)
    if count != expected:
        raise RuntimeError(f'{path}: expected {expected} matches, found {count}: {old!r}')
    file.write_text(text.replace(old, new), encoding='utf-8')


replace(
    'src/ui/shipUpgradesScreen.ts',
    "import type { GameCommand, GameState } from '../simulation/types';",
    "import { getShipUpgradeMaxLevel } from '../simulation/progression/profileScaling';\nimport type { GameCommand, GameState } from '../simulation/types';",
)
replace(
    'src/ui/shipUpgradesScreen.ts',
    '  SHIP_UPGRADE_MAX_LEVEL,\n',
    '',
)
replace(
    'src/ui/shipUpgradesScreen.ts',
    "      const current = getShipUpgradeLevels(state.shipUpgrades, 'player', selectedUnit)[selectedTrack];\n      const cost = calculateShipUpgradeCost(selectedUnit, selectedTrack, current + 1);\n      quote.textContent = current >= SHIP_UPGRADE_MAX_LEVEL\n        ? `Максимальный уровень ${SHIP_UPGRADE_MAX_LEVEL}`",
    "      const current = getShipUpgradeLevels(state.shipUpgrades, 'player', selectedUnit)[selectedTrack];\n      const maxLevel = getShipUpgradeMaxLevel(state.campaignSettings.progressionProfile);\n      const cost = calculateShipUpgradeCost(\n        selectedUnit,\n        selectedTrack,\n        current + 1,\n        state.campaignSettings.progressionProfile,\n      );\n      quote.textContent = current >= maxLevel\n        ? `Максимальный уровень ${maxLevel}`",
)
replace(
    'tests/simulation/completeDefenseCatalog.test.ts',
    'calculateDefenseRepairCost(shield, 2)',
    "calculateDefenseRepairCost(shield, 2, 'legacy-v1')",
)
replace(
    'tests/simulation/completeDefenseCatalog.test.ts',
    'calculateDefenseRepairSeconds(shield, 2)',
    "calculateDefenseRepairSeconds(shield, 2, 'legacy-v1')",
)
