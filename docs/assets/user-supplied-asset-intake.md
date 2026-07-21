# User-supplied asset intake

**Status:** provenance, dimensions, byte sizes and SHA-256 validated; verified source library committed; runtime connection remains partial and deferred for this pack
**Date:** 2026-07-21

## Packs

Three original/generated packs supplied specifically for Stellar Empires were inspected locally:

| Pack | Files | Uncompressed bytes | Contents |
|---|---:|---:|---|
| starter asset pack | 54 | 51,659,961 | faction identity, stars, planets, asteroids, pirates, shared starter ships/buildings, galaxy/system backgrounds |
| faction delivery v1 | 108 | 109,719,800 | 39 faction ships, 54 faction building sheets, 3 terrain backgrounds, 9 UI skins and previews/notes |
| generated factions v1 | 10 | 12,466,966 | 9 faction hero/emblem/card alternatives and one preview-only contact sheet |
| **Total** | **172** | **173,846,727** | — |

Largest individual file: 3,494,229 bytes. All locally generated SHA-256 values matched the inspected files.

## Registered inventory

- `user-supplied-asset-inventory.json` registers pack totals and normalized target directories.
- `user-supplied-asset-inventory/*.tsv` records every source path, byte size, SHA-256, image dimensions, format, role and duplicate relationship.
- `tools/import_user_asset_packs.py` extracts only registered files and refuses unexpected, missing, oversized or hash-mismatched members.

Validated local import command:

```powershell
py tools\import_user_asset_packs.py `
  --starter "D:\Downloads\stellar_empires_starter_asset_pack-fixed(1).zip" `
  --faction "D:\Downloads\stellar_empires_faction_assets_delivery_v1(1).zip" `
  --generated-factions "C:\Users\Den\Documents\New project\stellar_empires_generated_assets.zip"
```

Expected result:

```text
PASS starter: 54 files, 51659961 bytes
PASS faction-delivery-v1: 108 files, 109719800 bytes
PASS generated-factions-v1: 10 files, 12466966 bytes
PASS total: 172 files, 173846727 bytes
```

## Provenance

Embedded notes describe the packs as synthetic/generated project material without third-party logos, characters or game-specific copied UI. The material is suitable for project source intake, subject to the repository's originality rules.

## Source versus runtime

- source files belong under `assets/source/`;
- existing compact WebP atlases and SVG fallbacks remain the production contract;
- no source PNG is considered runtime-connected automatically;
- runtime integration creates optimized derivatives, stable IDs/URLs and tests;
- previews are never loaded by production.

The `generated-factions-v1` archive is SHA-256 `7ca08964d12cd0c3a4a42c88b2ed111d10e81f8a29dbbc55c8e17523546fa75f`. Its nine faction-named files intentionally share names with starter material but have different SHA-256 values, so they are preserved as distinct files in the new source pack; there are no byte-identical duplicates. `previews/faction_contact_sheet.png` is explicitly `preview-only`.

## Planned runtime integration

- **#67:** galaxy/system backgrounds, stars, planets, asteroids, pirates and fleet/galaxy ship art;
- **#68:** building sheets and production/defense presentation;
- **#70:** faction polish and a decision on raster UI skins versus CSS Design System;
- faction-specific mechanical catalogs remain a separate gameplay layer.

## Explicit exclusions

Never import:

- live Nemexia HTML;
- account screenshots;
- downloaded `static.nemexia.com` files;
- account names, coordinates, tokens or session data;
- recorder/scanner output.

## Publication status

The verified source library is committed under `assets/source/starter/`, `assets/source/faction-delivery-v1/` and `assets/source/generated-factions-v1/`: 172 files and 173,846,727 uncompressed bytes. Existing compact WebP/SVG runtime assets remain partially connected independently; the generated source packs, including the new `generated-factions-v1` assets, have no runtime URL, atlas, Phaser scene, UI or gameplay connection. A future explicit registry/derivative PR is still required.
