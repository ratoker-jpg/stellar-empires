from pathlib import Path

path = Path('tests/simulation/simulationBoundary.test.ts')
content = path.read_text(encoding='utf-8')
content = content.replace(
    r'''/from ['\"]phaser['\"]|from ['\"]\.\.\/game\//''',
    r'''/from ['"]phaser['"]|from ['"]\.\.\/game\//''',
)
path.write_text(content, encoding='utf-8')
print('Patched PR108 simulation boundary lint issue.')
