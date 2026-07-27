from pathlib import Path

path = Path('src/game/scenes/SpaceMapScene.ts')
content = path.read_text(encoding='utf-8')
old = '  #unsubscribeNavigation?: () => void;'
if old not in content:
    raise RuntimeError('Expected optional unsubscribe field not found.')
path.write_text(
    content.replace(old, '  #unsubscribeNavigation: (() => void) | undefined;'),
    encoding='utf-8',
)
print('Patched PR109 exact-optional unsubscribe type.')
