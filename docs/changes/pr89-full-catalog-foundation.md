# PR #89 — Complete catalog integration foundation

## Runtime

- mechanical IDs now support the explicit `shared` namespace and `commander` kind;
- added the canonical target manifest for 24 buildings, 22 technologies, 13 ships, 9 defences and 13 Commander Ships;
- added stable role lists for every target catalog category;
- faction manifests now expose target catalog version and rollout stage;
- catalog registry reports current-versus-target completeness without treating unfinished categories as delivered;
- validators reject duplicate, malformed, cross-namespace, broken dependency and over-target catalogs;
- added a manifest-driven complete mechanical asset resolver with current runtime fallback and source-provenance separation;
- no save schema change is required because the new rollout metadata is static registry state, not serialized campaign state.

## Compatibility

Current native catalogs remain unchanged and playable:

- 12 buildings per faction;
- 10 technologies per faction;
- 10 ordinary ships per faction;
- 5 defences per faction;
- no separate Commander Ships yet.

The following PRs populate the target catalogs sequentially rather than introducing placeholders in this foundation PR.

## Project control

- closed obsolete placeholder PR #84 without merge;
- roadmap v4 prioritizes complete ordinary gameplay before Universe, alliances or endgame;
- project status now tracks PR #89–#94 as the active batch.

## Validation

Required gate:

- lint;
- TypeScript typecheck;
- full Vitest suite;
- production build.
