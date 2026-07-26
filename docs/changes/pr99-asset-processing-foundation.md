# PR #99 — Asset processing foundation and repository audit

## Delivered

- deterministic audit of source, intake, existing runtime and generated runtime assets;
- SHA-256, dimensions, format, channels, alpha flag, alpha bounds, transfer bytes and decoded-memory estimate per file;
- stable semantic IDs for complete catalogs and all 90 Universe intake files;
- machine-readable family targets and hard runtime budgets;
- deterministic PNG/WebP derivative processor;
- deterministic explicit-frame atlas builder;
- CI validation preventing stale manifests, duplicate IDs, unexpected intake changes, provenance-path imports and budget violations;
- generated JSON inventory and human-readable audit report;
- focused tests for pipeline configuration and committed intake counts.

## Final audit result

- **472** repository asset files are tracked by the committed audit;
- all **174** approved catalog source files and all **90** Universe intake files pass strict inspection with dimensions and checksums;
- `public/assets/factions/aegis/background.webp` is an older invalid runtime file with a WebP extension but unsupported content; the audit records the inspection error instead of silently ignoring the file;
- three pre-existing modules still load historical source assets directly and are held in a closed legacy allowlist. Any additional direct source reference fails CI. These entries are retired during the catalog and Universe integration PRs.

## Validation

The final implementation passed:

```text
npm run assets:audit
npm run assets:check
npm run lint
npm run typecheck
npm run test
npm run build
```

## Boundary

PR #99 does not replace gameplay art. It creates the only supported route for PR #100 onward to produce and register optimized derivatives.

## Important finding

`public/assets/universe` remains source intake, not production runtime. The manifest gives every file a stable semantic ID despite filename-contract differences. PR #105 will generate and register contracted derivatives.
