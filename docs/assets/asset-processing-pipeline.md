# Asset processing pipeline

**Status:** accepted foundation after PR #99  
**Source boundary:** `assets/source/**` and temporary `public/assets/universe/**` intake  
**Generated runtime boundary:** `public/assets/generated/**`

## Purpose

The repository previously stored approved source PNG files and mechanical provenance paths, but most complete-catalog entries still resolved through unrelated compatibility atlases. PR #99 introduces one reproducible path from source master to optimized runtime derivative.

## Commands

```bash
npm run assets:audit
npm run assets:check
npm run assets:process
npm run assets:atlas
```

- `assets:audit` scans the source and public asset trees, computes SHA-256, dimensions, alpha bounds, transfer size, estimated RGBA decode size, semantic ID and family, then rewrites the committed JSON manifest and Markdown report.
- `assets:check` rebuilds the audit in memory and fails when the committed manifest is stale, counts change unexpectedly, semantic IDs collide, source paths leak into production code or generated-runtime budgets are exceeded.
- `assets:process` consumes `assets/manifests/runtime-processing-plan.json` and creates deterministic PNG/WebP derivatives only under `public/assets/generated`.
- `assets:atlas` consumes `assets/manifests/runtime-atlas-plan.json` and creates deterministic atlases plus frame metadata.

## Contracts

### Source assets

Source files preserve provenance and maximum useful detail. They are not imported by application code. The currently oversized Universe pack remains classified as `source-intake` even though PR #97 placed it under `public/`; PR #105 will move runtime consumption to processed derivatives.

### Semantic IDs

Mechanical IDs and Universe IDs are stable contracts. Filenames may be corrected or reorganized behind manifests without changing saves or UI state.

Examples:

```text
building.aegis.metal-production-1.png -> source filename only
building.aegis.metal-bot-1          -> canonical runtime mechanical ID mapped in PR #100

active-sun.variant-01.png            -> source filename
universe.sun.active-01               -> stable semantic asset ID
```

The building filename-to-mechanical-ID mapping is intentionally deferred to PR #100 because the approved source slugs and canonical simulation slugs differ.

### Reproducibility

Generated JSON contains no wall-clock timestamp. Files are sorted by repository path, checksums use SHA-256, processing plans are explicit and image output settings are fixed. A clean checkout with the same source files must reproduce the same audit and runtime derivatives.

## Runtime budgets

The machine-readable config defines initial hard limits for generated assets:

- 48 MiB total compressed transfer;
- 192 MiB estimated decoded RGBA memory;
- 512 generated textures;
- 4,194,304 pixels in one generated texture.

These are pipeline safety limits, not permission to eagerly load every texture. Later PRs must define screen-level loading and residency budgets.

## Alpha QA

The audit records non-transparent alpha bounds for raster images. Every implementation PR must also provide contact sheets on dark and light backgrounds for the family it processes. Alpha bounds do not replace visual inspection; they make accidental opaque canvases, extreme empty margins and clipped content measurable.

## Adding a derivative

1. Add an entry to `runtime-processing-plan.json` with stable semantic ID, source path, output path, target dimensions and format.
2. Run `npm run assets:process`.
3. Run `npm run assets:audit` because the generated runtime tree changed.
4. Update `docs/asset-prompts/master-runtime-asset-backlog.md`.
5. Run `npm run check`.

## Atlas rule

Atlases are allowed only when they reduce requests without creating a permanently resident oversized texture. Every atlas frame is explicit. Automatic packing without committed frame metadata is not accepted because it creates unstable runtime coordinates.
