# M9-RELEASE-CANDIDATE — archived audit batch

**Roadmap milestone:** M9 / Release 1.0  
**Complexity:** medium  
**Audit PR:** #167  
**Audit squash:** `f7e14fda42a135f70c0ad95ada7d3080d472176b`  
**Audit baseline:** `a6b225fe38c1c320244fc54929534e49029d4026` (PR #166 squash / fresh `main`)  
**Runtime:** schema v19 / save format v6 unchanged  
**Release:** 1.0.0 closed  
**Closure PR:** #171 `RELEASE-1.0-CLOSURE`  
**Closure squash:** `1f7298a602062837ec6bb8e3778d408ada26051c`

## Accepted implementation chain

| PR | Work item | Merge state |
|---|---|---|
| #168 | `RELEASE-ONBOARDING-TRUTH` | merged → `bd6f0302ef55f0d8f68c6fa619ecd1e07540aa9a` |
| #169 | `RELEASE-PRODUCTION-BROWSER` | merged → `6b37ffc7d439889f3bdf21f7f1c6abaca6f4ec3f` |
| #170 | `RELEASE-PACKAGING-METADATA` | merged → `1221bfe19cc11f836db7fe7e5720f778419c2dd9` |
| #171 | `RELEASE-1.0-CLOSURE` | merged → `1f7298a602062837ec6bb8e3778d408ada26051c` |

No fifth M9 implementation PR is authorized.

## Delivered contract

M9 hardened the mechanically complete local browser campaign into the technical Release 1.0 without redesigning gameplay.

- New-game copy describes the implemented persisted victory/defeat path and gives compact economy → research/fleet → Solar War/Gates orientation.
- The existing broad dev-server Browser E2E remains intact.
- A dedicated production-build Browser smoke serves the actual `dist` under `/stellar-empires/`, starts a real fresh campaign without state injection, proves asset decoding/ready state, performs manual save/load, navigates and survives reload.
- The production smoke asserts the package-derived build version.
- `package.json` is the product version authority; #170 established `1.0.0-rc.1` and #171 advanced it to `1.0.0` with synchronized root lock metadata.
- CI, Browser and Pages automation use Node 24.
- README describes the actual schema v19/save v6, three mechanical factions, autonomous bot/endgame parity and public Pages state.
- M9 added no gameplay mechanics, schema/save migration, arbitrary balance retune, backend/cloud/multiplayer path or license terms.

## Closure record

PR #171 merged and generated fresh Release 1.0 `main`:

`1f7298a602062837ec6bb8e3778d408ada26051c`

The closure PR was contractually required to pass the repository's exact-head release gate composition before merge: asset audit, lint, typecheck, unit/integration/audit tests, build, compressed progression, permanent one-day/seven-day performance budgets, Browser E2E, production-base Browser smoke, Graphify, reviews/threads and mergeability.

This archive records the generated squash SHA only. It does not invent a post-merge Pages run or other evidence that is not present in this docs-only follow-up; the next Audit must re-check the current production/browser baseline directly.

## Divergence

One release blocker was exposed during #169 production smoke: existing faction showcase WebP placeholder bindings returned success responses but were not browser-decodable images. #169 rebound those showcase URLs to already-existing valid generated faction identity PNG assets and added focused asset assertions. This remained inside the accepted production-browser release-proof scope and introduced no new art or gameplay behavior.

No other material divergence from the accepted M9 contract is recorded.

## Release boundary

M9 and technical Release 1.0 are closed. Any further product implementation requires a new Audit from fresh `main`.

The next authorized product work is the docs-only `POST-1.0-NEMEXIA-PARITY-AUDIT` defined by `docs/29-post-1.0-nemexia-reference-roadmap.md`.
