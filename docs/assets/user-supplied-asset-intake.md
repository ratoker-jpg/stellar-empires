# User-supplied asset intake

**Status:** provenance, dimensions, byte sizes and SHA-256 validated; verified source binaries committed; runtime connection deferred
**Date:** 2026-07-21

## Packs

Two original/generated packs supplied specifically for Stellar Empires were inspected locally:

| Pack | Files | Uncompressed bytes | Contents |
|---|---:|---:|---|
| starter asset pack | 54 | 51,659,961 | faction identity, stars, planets, asteroids, pirates, shared starter ships/buildings, galaxy/system backgrounds |
| faction delivery v1 | 108 | 109,719,800 | 39 faction ships, 54 faction building sheets, 3 terrain backgrounds, 9 UI skins and previews/notes |
| **Total** | **162** | **161,379,761** | — |

Largest individual file: 3,494,229 bytes. All locally generated SHA-256 values matched the inspected files.

## Registered inventory

- `user-supplied-asset-inventory.json` registers pack totals and normalized target directories.
- `user-supplied-asset-inventory/*.tsv` records every source path, byte size, SHA-256 and image dimensions.
- `tools/import_user_asset_packs.py` extracts only registered files and refuses unexpected, missing, oversized or hash-mismatched members.

Validated local import command:

```powershell
py tools\import_user_asset_packs.py --clean `
  --starter "D:\Downloads\stellar_empires_starter_asset_pack-fixed(1).zip" `
  --faction "D:\Downloads\stellar_empires_faction_assets_delivery_v1(1).zip"
```

Expected result:

```text
PASS starter: 54 files, 51659961 bytes
PASS faction-delivery-v1: 108 files, 109719800 bytes
PASS total: 162 files, 161379761 bytes
```

## Provenance

Embedded notes describe the packs as synthetic/generated project material without third-party logos, characters or game-specific copied UI. The material is suitable for project source intake, subject to the repository's originality rules.

## Source versus runtime

- source files belong under `assets/source/`;
- existing compact WebP atlases and SVG fallbacks remain the production contract;
- no source PNG is considered runtime-connected automatically;
- runtime integration creates optimized derivatives, stable IDs/URLs and tests;
- previews are never loaded by production.

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

The verified source binaries are committed under `assets/source/starter/` and `assets/source/faction-delivery-v1/`: 162 files and 161,379,761 uncompressed bytes. They remain source-only material; no runtime URL, atlas, Phaser scene, UI or gameplay connection is introduced by this intake.
