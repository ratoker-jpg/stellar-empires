from pathlib import Path

path = Path('src/ui/spaceMapNavigation.ts')
content = path.read_text(encoding='utf-8')
content = content.replace(
    'function requireElement<T extends HTMLElement>(selector: string): T {',
    'function requireElement<T extends Element>(selector: string): T {',
)
content = content.replace(
    "  overlay.hidden = route.level !== 'solar-system';\n  if (route.level !== 'solar-system') return;",
    "  if (route.level !== 'solar-system') {\n    overlay.setAttribute('hidden', '');\n    return;\n  }\n  overlay.removeAttribute('hidden');",
)
content = content.replace(
    "  const onPrevious = (): void => navigation.navigate(routeForGalaxyPage(navigation.snapshot.route, getState().universe, -1));\n  const onNext = (): void => navigation.navigate(routeForGalaxyPage(navigation.snapshot.route, getState().universe, 1));",
    "  const onPrevious = (): void => {\n    navigation.navigate(routeForGalaxyPage(navigation.snapshot.route, getState().universe, -1));\n  };\n  const onNext = (): void => {\n    navigation.navigate(routeForGalaxyPage(navigation.snapshot.route, getState().universe, 1));\n  };",
)
path.write_text(content, encoding='utf-8')
print('Patched PR110 SVG and handler TypeScript issues.')
