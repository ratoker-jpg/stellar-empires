# User-supplied asset intake

**Status:** provenance and inventory validated; binary Git publication pending  
**Date:** 2026-07-21

## Packs

Two original/generated packs supplied specifically for Stellar Empires were inspected locally:

| Pack | Files | Uncompressed bytes | Contents |
|---|---:|---:|---|
| starter asset pack | 54 | 51,659,961 | faction identity, stars, planets, asteroids, pirates, shared starter ships/buildings, galaxy/system backgrounds |
| faction delivery v1 | 108 | 109,719,800 | 39 faction ships, 54 faction building sheets, 3 terrain backgrounds, 9 UI skins and previews/notes |
| **Total** | **162** | **161,379,761** | — |

Largest individual file: 3,494,229 bytes. All locally generated SHA-256 values matched the inspected files.

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

## Publication blocker

The connected GitHub write API accepts UTF-8 content and explicit blob bytes, but does not accept a mounted local binary path. This documentation PR records the validated intake honestly; binary publication must be performed by a local Git client/Codex session with the supplied archives.
