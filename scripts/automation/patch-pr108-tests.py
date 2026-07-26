from pathlib import Path

path = Path('tests/simulation/unitCatalog.test.ts')
content = path.read_text(encoding='utf-8')
old = 'expect(state.schemaVersion).toBe(13);'
if old not in content:
    raise RuntimeError('Expected schema-v13 assertion not found in unitCatalog test.')
path.write_text(content.replace(old, 'expect(state.schemaVersion).toBe(14);'), encoding='utf-8')
print('Patched PR108 schema-v14 unit catalog assertion.')
