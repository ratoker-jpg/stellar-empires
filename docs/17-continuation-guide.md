# Continuation guide

## Current handoff

Release 1.0 remains closed. Runtime baseline remains schema v19 / save format v6.

Current exact `main` / starting main for the active Audit:

`e974c09e7779b4cf3bbc6d0279b8d35f177a29e6`

That is merged PR #185.

## Previous batch — complete

```text
POST-1.0-STRATEGIC-FEEDBACK-TRUTH
Audit #182 → b09887489db7754f0c0b2672649db9283b879732
PR1 #183  → 83a4942c35aac8d7f0b02f7730f0646c171c98b5
PR2 #184  → 691078ab9ce5b0ab48e7aa69e71fe72322528af0
PR3 #185  → e974c09e7779b4cf3bbc6d0279b8d35f177a29e6
```

Archive: `docs/audits/completed/post-1.0-strategic-feedback-truth.md`.

There is no PR4 and Audit #182 is not reusable implementation authorization.

## Only active work

```text
POST-1.0-NEXT-PRODUCT-3
Audit PR #186
branch audit/post-1.0-next-product-3
starting main e974c09e7779b4cf3bbc6d0279b8d35f177a29e6
kind docs-only Audit
implementationAuthorized = false
```

The binding current Audit contract is `docs/audits/current-batch-audit.md`.

## Fresh Audit result

Pinned Graphify 0.8.38 exact-runtime-tree evidence: 464 files, 3,639 nodes, 12,757 edges, 145 communities, 100% extraction.

The fresh source/UI/test sweep did **not** justify reopening the recently closed Arena/combat feedback/ranking/endgame/UI/bot truth gaps.

The strongest current player-facing gap is replayable campaign lifecycle:

1. real browser `createFreshGame()` always uses hard-coded seed source `stellar-empires-m1`;
2. the seed materially determines generated universe/neutral/PvE/world-event variation;
3. valid autosave or its recovery snapshot prevents normal new-game selection;
4. reserved autosave/snapshot have no delete/reset action in player UI;
5. terminal campaigns intentionally freeze forever;
6. no normal in-game action starts the next campaign.

## Proposed batch — not authorized

`POST-1.0-REPLAYABLE-CAMPAIGN-LIFECYCLE`

Exactly one implementation work item:

`POST-1.0-PR1-REPLAYABLE-CAMPAIGN-LIFECYCLE`

Why one PR:

- restart without seed variation is incomplete replayability;
- seed variation without a reachable restart remains inaccessible after autosave;
- both traverse the same new-game/bootstrap/save/browser boundary;
- schema/save does not need an intermediate migration checkpoint;
- one PR is a coherent review/revert unit.

## Fixed implementation decisions if Audit is accepted

- campaign seed is a visible/reusable uint32 numeric value;
- the chosen numeric value becomes the existing persisted `GameState.seed` directly;
- existing string seed-source semantics stay compatible for tests/fixtures;
- a suggested real-browser seed may come from Web Crypto only before GameState creation;
- wallclock-derived seeds are forbidden;
- E2E uses explicit deterministic seeds;
- `System → Saves → Новая партия` requires confirmation;
- clear recovery snapshot before primary autosave;
- preserve manual/user-named save slots;
- route through existing bootstrap/new-game selector;
- schema v19 / save v6 / migration none;
- permanent Organic Terminal/performance/determinism gates remain mandatory.

Critical UNKNOWNs:

```text
criticalUnknownsResolved = true
criticalUnknowns = []
```

## Research / reject boundary

- achievements/meta progression: RESEARCH;
- moving-object trajectories: RESEARCH;
- more bot differentiation: RESEARCH;
- bot `difficulty`: dead metadata, no current player-facing contract;
- Bank/credit system: REJECT without authoritative semantics; evidence-gated producer field is not permission to invent credit gameplay.

## Required reading for continuation

1. `AGENTS.md`;
2. `docs/28-audit-first-autonomous-delivery-protocol.md`;
3. `docs/audits/current-batch-audit.md`;
4. `docs/audits/current-execution-state.md`;
5. `docs/audits/batch-history.md`;
6. `docs/audits/completed/post-1.0-strategic-feedback-truth.md`;
7. `docs/project-status.json`;
8. `docs/roadmap-pr-index.json`;
9. `docs/16-execution-roadmap.md`;
10. `docs/29-post-1.0-nemexia-reference-roadmap.md`;
11. actual GitHub `main`, Audit #186, review threads and exact workflow state.

## Current stop rule

Finish Audit #186 exact-head CI + Graphify + Browser/Pages, review loop and Ready transition, then STOP.

**Do not merge #186. Do not create an implementation branch. Do not start PR1.**
