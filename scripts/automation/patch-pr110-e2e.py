from pathlib import Path

path = Path('src/ui/spaceMapNavigation.ts')
content = path.read_text(encoding='utf-8')
content = content.replace(
    "  routeForDirectCoordinate,\n  routeForGalaxyPage,",
    "  routeForDirectCoordinate,\n  routeForGalaxyPage,\n  routeForParent,",
)
anchor = """  window.addEventListener(SPACE_MAP_SELECTION_EVENT, onSelection);
  return {
"""
replacement = """  window.addEventListener(SPACE_MAP_SELECTION_EVENT, onSelection);
  const onGlobalKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || navigation.snapshot.route.level === 'universe') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    latestSelection = null;
    navigation.navigate(routeForParent(navigation.snapshot.route));
  };
  window.addEventListener('keydown', onGlobalKeyDown, { capture: true });
  return {
"""
if anchor not in content:
    raise RuntimeError('Space Map mount anchor not found for E2E keyboard patch.')
content = content.replace(anchor, replacement)
content = content.replace(
    "      window.removeEventListener(SPACE_MAP_SELECTION_EVENT, onSelection);\n    },",
    "      window.removeEventListener(SPACE_MAP_SELECTION_EVENT, onSelection);\n      window.removeEventListener('keydown', onGlobalKeyDown, { capture: true });\n    },",
)
path.write_text(content, encoding='utf-8')
print('Patched PR110 global Escape navigation parity.')
