# Current execution state

**Updated:** 2026-08-22  
**Safe to continue:** controller review / merge decision only after final exact-head gates  
**Phase:** `POST-1.0-PR3-ADVERTISED-EFFECT-TRUTH` final handoff  
**Runtime:** schema v19 / save format v6 unchanged  
**Migration:** none  
**Release:** 1.0.0 closed

| Field | Current value |
|---|---|
| Accepted Audit authority | #173 `POST-1.0-NEMEXIA-PARITY-AUDIT` — merged |
| Completed PR1 | #174 `POST-1.0-PR1-ORGANIC-LATE-GAME-CLOSURE` — merged at `200456244d3a7efcbb197f7734a97adf622fad76` |
| Completed PR2 | #175 `POST-1.0-PR2-COMBAT-IDENTITY-DOCTRINE` — merged at `415a3aa814d759d1f76a986003ad7e9d06e0e8fa` |
| Exact PR3 starting `main` | `415a3aa814d759d1f76a986003ad7e9d06e0e8fa` |
| Active implementation PR | #176 `POST-1.0-PR3-ADVERTISED-EFFECT-TRUTH` |
| Implementation branch | `agent/post-1.0-advertised-effect-truth` |
| PR3 state | implementation + focused evidence complete; final exact-head validation / controller review |
| Target state schema | 19 — unchanged |
| Target save format | 6 — unchanged |
| Migration | none |
| PR4 | not started; intentionally later |

## PR3 truth decisions

Accepted principle: **CONSUMER-OR-REMOVE**. An advertised/aggregated effect must have a deterministic coherent Stellar consumer or stop being represented as an active effect.

Fresh source plus repository-pinned Graphify verification on the merged PR2 tree confirmed the Audit findings:

| Effect | Fresh evidence | PR3 decision |
|---|---|---|
| `salvageEfficiencyPercent` | Scrapyard produced/aggregated it; `collectDebris()` consumes debris amounts and cargo capacity, with no building-operational-summary path | **REMOVE active truth** — removed from building operational types, Scrapyard catalog operations and summary aggregation |
| `marketEfficiencyPercent` | Trade Center produced/aggregated it; `quoteMarketSwap()` / `executeMarketSwap()` use fee/reserve/price-impact calculations with no building-operational-summary path | **REMOVE active truth** — removed from building operational types, Trade Center catalog operations and summary aggregation |
| `ecologyCapacity` / `ECOLOGY_CAPACITY` | Ecology research advertised and aggregated capacity, but no operational consumer exists in the audited planet/economy/colonization paths | **REMOVE active truth** — removed effect type/summary aggregation; Ecology remains a research/progression item with truthful copy that claims no separate gameplay bonus |
| `bankCreditEfficiencyPercent` | Bank producer remains present; fresh Graphify/source verification still found no established credit/loan consumer and Audit classifies it UNKNOWN | **UNKNOWN / UNTOUCHED** — no credit subsystem or speculative formula introduced |

No replacement gameplay formulas were added. Debris collection, market swap/quote, economy and colonization calculations were not redesigned.

## Regression-first evidence

The first PR3 commit was test-only:

`3009c86d63c123a6d1183f4d4516fa02d4c87418`

CI #2129 failed on the expected pre-fix truth assertions:

- Scrapyard / Trade Center still exposed producer-only operational effects for all three factions;
- Ecology still advertised `ECOLOGY_CAPACITY` for all three factions;
- Bank UNKNOWN/untouched assertions already passed.

After the runtime truth cleanup, Ecology and Bank assertions passed immediately. A follow-up test-only correction changed the removed-building assertion to handle `operations === undefined`; that was a matcher issue, not a runtime defect.

## Graphify evidence

The merged PR2 `main` and PR #175 exact head share tree `acca53839ff1f273d3d23e5d1b56a4b57c882587`, so exact-head Graphify #1278 was a valid fresh baseline before PR3 changes.

PR3 runtime head `08c6b8253d9ae2dc159b33adeb3b396349c6d1f0` then passed Graphify #1289. Its generated graph retains the real `collectDebris()`, `quoteMarketSwap()`, `executeMarketSwap()` and `calculateBuildingOperationalSummary()` nodes while no longer containing the removed salvage/market/ecology active-effect identifiers.

## Runtime validation before final control-plane commit

Runtime head `08c6b8253d9ae2dc159b33adeb3b396349c6d1f0` has already proven:

- asset audit — SUCCESS;
- lint — SUCCESS;
- typecheck — SUCCESS;
- full unit/integration test step — SUCCESS;
- build — SUCCESS;
- market regressions — SUCCESS;
- debris regressions — SUCCESS;
- relevant building/research catalog regressions — SUCCESS;
- organic Fresh Game → Terminal — SUCCESS;
- compressed progression — SUCCESS;
- organic Obelisk evidence — SUCCESS;
- campaign catch-up performance — SUCCESS;
- Graphify #1289 — SUCCESS.

The final docs/control-plane commit changes the exact PR head, so fresh exact-head CI, Graphify and Browser E2E including production Pages smoke are mandatory before PR #176 is marked Ready for review.

## Scope boundaries preserved

PR3 intentionally does **not** add or change:

- Bank credit/loan mechanics;
- a scrap-processing economy;
- an ozone/ecology subsystem;
- market/economy redesign;
- new resources;
- Nemexia formula guesses;
- combat or PR2 identity/doctrine behavior;
- PR1 campaign progression behavior;
- PR4 npm/axe/snapshot quality-gate work;
- schema/save format/migrations;
- unrelated cleanup.

## Material divergence

None. The fresh consumer investigation confirmed the accepted Audit classifications. Salvage, market and Ecology use the Audit-authorized remove/reword path; Bank remains explicitly UNKNOWN and untouched.

## Controller handoff

PR #176 is the only active implementation PR. Do not merge it autonomously and do not start PR4 from this handoff.

Before controller handoff is complete, require on the final exact PR head:

- CI completed SUCCESS, including organic terminal, save/load + partition determinism, bounded faction matrix, campaign performance and build gates;
- Graphify completed SUCCESS;
- Browser E2E completed SUCCESS, including production Pages smoke;
- unresolved review threads = 0;
- `mergeable=true`;
- PR marked Ready for review.
