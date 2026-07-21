from pathlib import Path

replacements = {
    'tests/simulation/botFleetMissionPlanner.test.ts': {
        "'technology.aegis.colonization': 1": "'technology.veyra.brood-seeding': 1",
        "ships: { 'ship.aegis.colony': 1 }": "ships: { 'ship.veyra.brood-ark': 1 }",
    },
    'tests/simulation/botResearchProductionPlanner.test.ts': {
        "empireId === 'synod-bot' ? '.synod.' : '.aegis.'": "empireId === 'synod-bot' ? '.synod.' : '.veyra.'",
    },
    'tests/simulation/botThreatRecoveryPlanner.test.ts': {
        "unitId: 'ship.aegis.fighter'": "unitId: 'ship.veyra.sting'",
    },
}

for filename, mapping in replacements.items():
    path = Path(filename)
    text = path.read_text(encoding='utf-8')
    for old, new in mapping.items():
        count = text.count(old)
        expected = 2 if filename.endswith('botResearchProductionPlanner.test.ts') else 1
        if count != expected:
            raise RuntimeError(f'{filename}: expected {expected} matches for {old!r}, got {count}')
        text = text.replace(old, new)
    path.write_text(text, encoding='utf-8')

print('PR81 native Veyra test fixtures updated')
