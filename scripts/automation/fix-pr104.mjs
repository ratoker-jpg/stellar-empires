import { readFile, writeFile, rm } from 'node:fs/promises';

const galaxyTestPath = 'src/assets/galaxyFleetRuntimeAssets.test.ts';
let galaxyTest = await readFile(galaxyTestPath, 'utf8');
galaxyTest = galaxyTest.replace(
  "    expect(getFleetShipArtUrl('veyra', 'ship.aegis.recycler')).toContain(\n      'veyra_recycler_ship.png',\n    );",
  "    expect(getFleetShipArtUrl('veyra', 'ship.aegis.recycler')).toContain(\n      '/assets/generated/catalog/ships/aegis/recycler.webp',\n    );",
);
await writeFile(galaxyTestPath, galaxyTest);

const manifestTestPath = 'tests/assets/completeMechanicalAssetManifest.test.ts';
let manifestTest = await readFile(manifestTestPath, 'utf8');
manifestTest = manifestTest.replace(
  "  it('uses current runtime assets as deterministic compatibility fallbacks', () => {\n    const resolution = resolveCompleteMechanicalAsset('ship.aegis.scout');\n    expect(resolution.source).toBe('current-runtime-fallback');\n    expect(resolution.asset?.id).toBe('ship.aegis.scout');\n  });",
  "  it('uses generated runtime assets for complete ordinary ships', () => {\n    const resolution = resolveCompleteMechanicalAsset('ship.aegis.scout');\n    expect(resolution.source).toBe('complete-manifest');\n    expect(resolution.asset?.id).toBe('ship.aegis.scout');\n    expect(resolution.asset?.layout).toBe('image');\n    expect(resolution.asset?.atlasUrl).toContain(\n      '/assets/generated/catalog/ships/aegis/scout.webp',\n    );\n  });",
);
await writeFile(manifestTestPath, manifestTest);

const catalogTestPath = 'tests/simulation/completeShipCatalog.test.ts';
let catalogTest = await readFile(catalogTestPath, 'utf8');
catalogTest = catalogTest.replace(
  "  it.each(FACTIONS)('binds every %s ship to a source asset and runtime fallback', (factionId) => {\n    for (const ship of COMPLETE_SHIP_CATALOGS[factionId]) {\n      const resolution = resolveCompleteMechanicalAsset(ship.assetId);\n      expect(resolution.source).toBe('current-runtime-fallback');\n      expect(resolution.asset?.id).toBe(ship.id);\n      expect(resolution.provenancePath).toBe(\n        `assets/source/New assets/ship/${factionId}/${ship.id}.png`,\n      );\n    }\n  });",
  "  it.each(FACTIONS)('binds every %s ship to generated runtime art and source provenance', (factionId) => {\n    for (const ship of COMPLETE_SHIP_CATALOGS[factionId]) {\n      const resolution = resolveCompleteMechanicalAsset(ship.assetId);\n      expect(resolution.source).toBe('complete-manifest');\n      expect(resolution.asset?.id).toBe(ship.id);\n      expect(resolution.asset?.layout).toBe('image');\n      expect(resolution.asset?.atlasUrl).toContain(\n        `/assets/generated/catalog/ships/${factionId}/`,\n      );\n      expect(resolution.provenancePath).toBe(\n        `assets/source/New assets/ship/${factionId}/${ship.id}.png`,\n      );\n    }\n  });",
);
await writeFile(catalogTestPath, catalogTest);

await rm('scripts/automation/fix-pr104.mjs', { force: true });
