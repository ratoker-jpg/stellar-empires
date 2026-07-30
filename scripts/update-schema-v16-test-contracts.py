from pathlib import Path


def replace(path: str, old: str, new: str, expected: int = 1) -> None:
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    count = text.count(old)
    if count != expected:
        raise RuntimeError(f'{path}: expected {expected} matches, found {count}: {old!r}')
    file.write_text(text.replace(old, new), encoding='utf-8')


replace(
    'tests/integration/ordinaryMissionIntelligenceLoop.test.ts',
    'schemaVersion: 15,',
    'schemaVersion: 16,',
)
replace(
    'tests/storage/saveFormat.test.ts',
    'expect(parsed.value.state.schemaVersion).toBe(15);',
    'expect(parsed.value.state.schemaVersion).toBe(16);',
    expected=2,
)
replace(
    'tests/storage/saveFormat.test.ts',
    'worldSpeed: 1,\n      createdAtReal: SAVE_TIME,',
    "worldSpeed: 1,\n      progressionProfile: 'legacy-v1',\n      createdAtReal: SAVE_TIME,",
)
replace(
    'tests/simulation/espionageCounterintelligence.test.ts',
    'expect(parsed.value.state.schemaVersion).toBe(15);',
    'expect(parsed.value.state.schemaVersion).toBe(16);',
)
replace(
    'tests/simulation/unitCatalog.test.ts',
    'expect(state.schemaVersion).toBe(15);',
    'expect(state.schemaVersion).toBe(16);',
)
replace(
    'tests/simulation/universeSpatialModel.test.ts',
    'expect(first.schemaVersion).toBe(15);',
    'expect(first.schemaVersion).toBe(16);',
)
