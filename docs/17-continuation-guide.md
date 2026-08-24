# Continuation guide

## Current handoff

Release 1.0 remains closed. Runtime remains schema v19 / save format v6 / migration none.

Current exact `main` / starting main for the active closure PR:

`691078ab9ce5b0ab48e7aa69e71fe72322528af0`

That is merged PR #184.

## Active work

```text
POST-1.0-STRATEGIC-FEEDBACK-TRUTH
Audit #182 → merged b09887489db7754f0c0b2672649db9283b879732
PR1 #183  → merged 83a4942c35aac8d7f0b02f7730f0646c171c98b5
PR2 #184  → merged 691078ab9ce5b0ab48e7aa69e71fe72322528af0
PR3 #185  → active final implementation/closure PR
branch agent/post-1.0-combat-ranking-truth
work item POST-1.0-PR3-COMBAT-RANKING-TRUTH
```

There is no PR4.

The full accepted Audit #182 contract is preserved at:

`docs/audits/completed/post-1.0-strategic-feedback-truth.md`

`docs/audits/current-batch-audit.md` is now the compact closure boundary rather than a reusable implementation authorization.

## Completed product outcome staged by #185

The batch closes three direct-source combat truth gaps:

1. Arena full stable fleet identity is persisted for new entries without changing legacy active-entry outcomes.
2. Arena joins canonical unified reports and real combat persists resolution-time tactical context without current-state reconstruction.
3. Ranking now means combat victories only and is labelled `Боевые победы`.

PR3 victory semantics are canonical-report based:

- `battle` primary success counts;
- `battle` secondary side counts when primary outcome is failure;
- `solar-war` primary success counts;
- expedition and space-object success do not count;
- Arena draw/defeat/withdrawn do not count;
- Solar War draw/defeat do not count;
- the same report ID counts at most once;
- score weight remains 500 per combat victory;
- deterministic ranking ordering is unchanged.

PR3 regression-first RED: `3e64edea741c80bfda6d5966db42ef45470cf5a3`, where two successful non-combat operations plus one Arena victory incorrectly produced `3` instead of `1`.

Runtime implementation head before closure docs: `280b9e9c1e6605ced9837e845bb2d430c315406d`.

Runtime-head gates were green before closure synchronization: CI #2270, Graphify #1401, Browser #1500 and production Pages smoke #1500.

## Closure semantics

#185 contains the archive/control-plane work required by the autonomous delivery protocol. The batch is **closure-staged**, not yet merged-complete. The generated #185 squash SHA must remain unknown until the controller merges the PR.

After controller-approved merge of #185:

- treat `POST-1.0-STRATEGIC-FEEDBACK-TRUTH` as complete;
- resolve the new exact `main` and record the generated #185 squash SHA in the next permitted record;
- start only a fresh docs-only Audit from that fresh main;
- do not create a PR4 or directly continue implementation from Audit #182.

## Required reading for the next session

1. `AGENTS.md`;
2. `docs/28-audit-first-autonomous-delivery-protocol.md`;
3. `docs/audits/current-batch-audit.md`;
4. `docs/audits/current-execution-state.md`;
5. `docs/audits/batch-history.md`;
6. `docs/audits/completed/post-1.0-strategic-feedback-truth.md`;
7. `docs/project-status.json`;
8. `docs/roadmap-pr-index.json`;
9. `docs/16-execution-roadmap.md`;
10. actual GitHub `main`, PR #185, review threads and exact workflow state.

## Current stop rule

Finish #185 exact-head gates, review loop and Ready transition, then STOP for controller review.

**Do not merge #185. Do not create PR4. Do not start the next Audit before controller merge.**
