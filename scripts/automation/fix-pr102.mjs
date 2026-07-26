import { readFile, writeFile, rm } from 'node:fs/promises';

const runtimePath = 'src/assets/runtimeMechanicalAssets.ts';
let runtime = await readFile(runtimePath, 'utf8');
runtime = runtime.replace(
  '  const generated = RUNTIME_ASSET_MANIFEST[runtimeSemanticId];',
  "  const manifest = RUNTIME_ASSET_MANIFEST as Readonly<Record<string, { readonly outputPath: string; readonly width: number; readonly height: number }>>;\n  const generated = manifest[runtimeSemanticId];",
);
await writeFile(runtimePath, runtime);

const atlasPath = 'src/assets/factionAtlasSelection.ts';
let atlas = await readFile(atlasPath, 'utf8');
atlas = atlas.replace(
  "    case 'ship':\n      return assets.shipsAtlasUrl;",
  "    case 'ship':\n    case 'commander':\n      return assets.shipsAtlasUrl;",
);
await writeFile(atlasPath, atlas);
await rm('scripts/automation/fix-pr102.mjs', { force: true });
