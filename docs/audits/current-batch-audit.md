# Current audit boundary

**Batch:** `M9-RELEASE-CANDIDATE` / accepted Audit #167  
**Audit status:** accepted and merged; final implementation closure active  
**Updated:** 2026-08-20  
**Audit baseline / #166 squash:** `a6b225fe38c1c320244fc54929534e49029d4026`  
**Accepted Audit squash:** `f7e14fda42a135f70c0ad95ada7d3080d472176b`  
**Current fresh main / #170 squash:** `1221bfe19cc11f836db7fe7e5720f778419c2dd9`  
**Runtime target:** schema v19 / save format v6 unchanged  
**Release target:** `1.0.0`  
**Critical unknowns:** 0  
**Complexity:** medium

## Binding authority

The accepted M9 implementation contract is:

- `docs/audits/contracts/m9-release-candidate.md`;
- `docs/audits/evidence/m9-release-candidate.md`;
- `docs/audits/current-execution-state.md`;
- actual GitHub `main`, PR and workflow state when newer than prose.

## Accepted implementation sequence

```text
#168 RELEASE-ONBOARDING-TRUTH       merged → bd6f0302ef55f0d8f68c6fa619ecd1e07540aa9a
→ #169 RELEASE-PRODUCTION-BROWSER  merged → 6b37ffc7d439889f3bdf21f7f1c6abaca6f4ec3f
→ #170 RELEASE-PACKAGING-METADATA  merged → 1221bfe19cc11f836db7fe7e5720f778419c2dd9
→ #171 RELEASE-1.0-CLOSURE          active
```

No fifth M9 implementation PR is authorized.

## Verified closure baseline

The first three M9 implementation items are merged and established the required release surface:

- new-game onboarding truth matches the implemented terminal campaign and gives concise first-run orientation;
- the existing broad Browser suite is supplemented by a dedicated production-build smoke under `/stellar-empires/` using a real fresh campaign, save/load, navigation and reload;
- `package.json` is the product-version authority, the RC is `1.0.0-rc.1`, the production badge derives from package metadata and automated release workflows use Node 24;
- README describes schema v19/save v6, three mechanical factions, autonomous bot/endgame parity and the public Pages deployment;
- no M9 work changed GameState schema, save format, campaign mechanics or accepted performance budgets.

## #171 authorized scope

`RELEASE-1.0-CLOSURE` is closure-only:

- advance package-authoritative version from `1.0.0-rc.1` to `1.0.0` and keep root lock metadata synchronized;
- add no gameplay mechanic or save migration;
- archive the accepted M9 batch under `docs/audits/completed/m9-release-candidate.md`;
- update batch history, project status, roadmap index, continuation guide, canonical roadmap and README final status wording;
- run the combined release gates on one exact final head.

## Final acceptance

One exact #171 head must pass:

- asset audit;
- lint;
- typecheck;
- all unit/integration/audit tests;
- build;
- compressed progression;
- campaign performance `<15 s` one-day and `<30 s` seven-day;
- existing Browser E2E;
- production-base Browser smoke;
- Graphify;
- reviews = 0 and unresolved review threads = 0;
- mergeable = true.

Then mark #171 Ready and squash-merge with expected-head protection. Verify generated fresh `main` and the post-merge Pages deployment.

## Hard boundaries

M9 does not authorize new mechanics, currencies/catalogs/factions, schema/save migration, arbitrary balance retuning, post-victory sandbox, tutorial persistence, broad redesign, backend/cloud/multiplayer work or license selection on behalf of the owner.

A tiny docs-only post-release record is permitted only if the generated #171 squash SHA and post-merge Pages evidence need to be written back into canonical status. It may not add implementation.
