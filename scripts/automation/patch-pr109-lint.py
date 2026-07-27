from pathlib import Path

path = Path('tests/ui/spaceMapViewModel.test.ts')
content = path.read_text(encoding='utf-8')
content = content.replace("expect(serialized).not.toContain(`\\\"${key}\\\"`);", "expect(serialized).not.toContain(`\"${key}\"`);")
path.write_text(content, encoding='utf-8')
print('Patched PR109 view-model lint issue.')
