# M9-RELEASE-CANDIDATE — archived audit batch

**Roadmap milestone:** M9 / Release 1.0  
**Complexity:** medium  
**Audit PR:** #167  
**Audit squash:** `f7e14fda42a135f70c0ad95ada7d3080d472176b`  
**Audit baseline:** `a6b225fe38c1c320244fc54929534e49029d4026` (PR #166 squash / fresh `main`)  
**Runtime:** schema v19 / save format v6 unchanged  
**Target release:** 1.0.0  
**Closure PR:** #171 `RELEASE-1.0-CLOSURE`

## Accepted implementation chain

| PR | Work item | Merge state |
|---|---|---|
| #168 | `RELEASE-ONBOARDING-TRUTH` | merged → `bd6f0302ef55f0d8f68c6fa619ecd1e07540aa9a` |
| #169 | `RELEASE-PRODUCTION-BROWSER` | merged → `6b37ffc7d439889f3bdf21f7f1c6abaca6f4ec3f` |
| #170 | `RELEASE-PACKAGING-METADATA` | merged → `1221bfe19cc11f836db7fe7e5720f778419c2dd9` |
| #171 | `RELEASE-1.0-CLOSURE` | final closure; generated squash is recorded after merge only if canonical status needs it |

No fifth M9 implementation PR is authorized.

## Delivered contract

M9 hardens the mechanically complete local browser campaign into a technically honest 1.0 release without redesigning gameplay.

- New-game copy now describes the implemented persisted victory/defeat path and gives compact economy → research/fleet → Solar War/Gates orientation.
- The existing broad dev-server Browser E2E remains intact.
- A dedicated production-build Browser smoke serves the actual `dist` under `/stellar-empires/`, starts a real fresh campaign without state injection, proves asset decoding/ready state, performs manual save/load, navigates and survives reload.
- The production smoke asserts the package-derived build version.
- `package.json` is the product version authority; #170 established `1.0.0-rc.1` and #171 advances it to `1.0.0` with synchronized root lock metadata.
- CI, Browser and Pages automation use Node 24.
- README describes the actual schema v19/save v6, three mechanical factions, autonomous bot/endgame parity and public Pages state.
- M9 adds no gameplay mechanics, schema/save migration, arbitrary balance retune, backend/cloud/multiplayer path or license terms.

## Combined closure evidence

#171 adds no production mechanic. Its acceptance is the composition of the permanent repository gates on one exact final head:

1. asset audit, lint, typecheck, all unit/integration/audit tests and production build;
2. deterministic compressed progression;
3. campaign catch-up performance within `<15 s` one-day and `<30 s` seven-day budgets;
4. the existing Browser E2E suite;
5. the dedicated production-base Browser smoke under `/stellar-empires/`;
6. Graphify;
7. reviews = 0, unresolved review threads = 0 and mergeability true.

The #171 exact head must pass these gates before Ready/squash merge. The generated squash SHA cannot be self-recorded by the closure PR; actual GitHub state remains authoritative until an optional permitted docs-only post-release record captures it.

## Divergence

One release blocker was exposed during #169 production smoke: existing faction showcase WebP placeholder bindings returned success responses but were not browser-decodable images. #169 rebound those showcase URLs to already-existing valid generated faction identity PNG assets and added focused asset assertions. This remained inside the accepted production-browser release-proof scope and introduced no new art or gameplay behavior.

No other material divergence from the accepted M9 contract is recorded.

## Release boundary

After #171 exact-head gates pass and it squash-merges, technical Release 1.0 is complete on the generated fresh `main`, subject to successful post-merge Pages deployment verification.

There is no authorized fifth M9 implementation PR. If generated #171 merge or Pages evidence needs to be written into canonical docs, only the explicitly permitted tiny docs-only record may follow. Any further product implementation requires a new Audit from the then-current fresh `main`.
