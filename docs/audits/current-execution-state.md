# Current execution state

**State:** PR3 / final batch closure staged for controller review  
**Updated:** 2026-08-24  
**Batch:** `POST-1.0-STRATEGIC-FEEDBACK-TRUTH`  
**Accepted Audit:** #182 — MERGED at `b09887489db7754f0c0b2672649db9283b879732`  
**PR1:** #183 — MERGED at `83a4942c35aac8d7f0b02f7730f0646c171c98b5`  
**PR2:** #184 — MERGED at `691078ab9ce5b0ab48e7aa69e71fe72322528af0`  
**Active PR:** #185 `fix: make combat ranking victories truthful`  
**Branch:** `agent/post-1.0-combat-ranking-truth`  
**Work item:** `POST-1.0-PR3-COMBAT-RANKING-TRUTH`  
**Exact starting main:** `691078ab9ce5b0ab48e7aa69e71fe72322528af0`  
**Runtime:** schema v19 / save format v6 / migration none

## Regression-first evidence

RED commit: `3e64edea741c80bfda6d5966db42ef45470cf5a3`.

CI #2269 reached the real test suite with assets, lint and typecheck green. The targeted ranking regression failed exactly because the existing metric counted two successful non-combat operations plus one Arena victory as three victories:

```text
expected 1
received 3
```

Failing test: `counts only combat victories when successful operations and Arena history are mixed`.

## PR3 implementation truth

Runtime implementation head before closure docs:

`280b9e9c1e6605ced9837e845bb2d430c315406d`

The ranking producer still derives from `createUnifiedMissionReports()`; no second Arena or Solar War history path was added.

A report counts as one combat victory for an empire only when:

- `kind === 'battle'`, the empire is primary, and `outcome === 'success'`; or
- `kind === 'battle'`, the empire is secondary, and the primary outcome is `failure`; or
- `kind === 'solar-war'`, the empire is primary, and `outcome === 'success'`.

Therefore normal PvP attacker wins, defender wins, pirate/PvE battle wins, Arena victories and Solar War victories count. Expedition success, space-object success, intelligence/system/world-event results, battle draws/failures for the losing side, Arena draw/defeat/withdrawal and Solar War draw/defeat do not count.

Canonical report IDs are consumed once through a deterministic `Set`, preventing duplicate report identity from inflating the score. Existing ranking ordering remains score descending then empire ID. The existing score weight remains exactly `victories * 500`.

Player-facing wording is now explicit: `Боевые победы` and `боев. побед`.

## Targeted acceptance

`src/ui/commandRanking.test.ts` proves:

- successful expedition and space-object operations do not inflate victories;
- Arena victory counts once;
- Arena draw/defeat/withdrawn do not count;
- PvP attacker victory increments attacker only;
- PvP defender victory increments defender only;
- pirate combat victory counts, including legacy battle-mode inference;
- Solar War victory counts while draw/defeat do not;
- duplicate canonical report ID counts at most once;
- event history order does not affect victories or score;
- one combat victory changes the existing score component by exactly 500;
- real schema-v19/save-v6 round trip preserves derived victories and score;
- existing deterministic ranking behavior remains green.

`tests/e2e/combatFeedback.spec.ts` checks the real `#/ranking` route and the explicit `Боевые победы` label/count while retaining PR2 combat-feedback assertions.

## Runtime-head gates before closure docs

Exact runtime head `280b9e9c1e6605ced9837e845bb2d430c315406d`:

- CI #2270 — SUCCESS: assets, lint, typecheck, full tests, build, compressed progression, campaign performance, Organic Obelisk, Organic Fresh Game → Terminal, terminal save/load + partition determinism and bounded faction matrix all green;
- Graphify #1401 — SUCCESS with repository-pinned Graphify 0.8.38;
- Browser E2E #1500 — SUCCESS;
- production Pages smoke in #1500 — SUCCESS.

## Batch closure

The accepted Audit #182 is preserved verbatim at:

`docs/audits/completed/post-1.0-strategic-feedback-truth.md`

The closing chain is:

```text
#182 audit → #183 PR1 → #184 PR2 → #185 PR3/closure
```

#185 has no merge SHA yet and none is invented. The batch is closure-staged now and becomes complete only after controller-approved merge of #185. There is no PR4. After merge, the only permitted successor is a fresh docs-only Audit from fresh `main`.

## Exact next action

This closure-doc commit changes the head. Require fresh exact-head CI + Graphify + Browser E2E + production Pages smoke, then inspect review threads/reviews/comments, verify live `main` remains `691078ab9ce5b0ab48e7aa69e71fe72322528af0`, require `mergeable=true`, finalize the PR body, mark #185 Ready, verify the same head again, and STOP for controller review.

**Do not merge #185. Do not create PR4 or the next Audit before controller handling.**
