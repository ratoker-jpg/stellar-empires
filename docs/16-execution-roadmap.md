# Execution Roadmap Stellar Empires — current entrypoint

**Status:** Release 1.0 closed; `POST-1.0-STRATEGIC-FEEDBACK-TRUTH` final PR #185 closure staged  
**Updated:** 2026-08-24  
**Verified current main / exact PR3 starting main:** `691078ab9ce5b0ab48e7aa69e71fe72322528af0`  
**Last merged PR:** #184 `feat: unify combat reports and tactical feedback`  
**Active PR:** #185 `fix: make combat ranking victories truthful`  
**Runtime:** schema v19 / save format v6 / migration none

## Authoritative files

```text
AGENTS.md
docs/28-audit-first-autonomous-delivery-protocol.md
docs/audits/current-batch-audit.md
docs/audits/current-execution-state.md
docs/audits/batch-history.md
docs/audits/completed/post-1.0-strategic-feedback-truth.md
docs/project-status.json
docs/roadmap-pr-index.json
docs/17-continuation-guide.md
```

Actual GitHub state wins over recorded prose.

## Current audited chain

`POST-1.0-STRATEGIC-FEEDBACK-TRUTH` was authorized by Audit #182 as exactly three implementation PRs:

```text
Audit #182 → b09887489db7754f0c0b2672649db9283b879732
PR1 #183  → 83a4942c35aac8d7f0b02f7730f0646c171c98b5
PR2 #184  → 691078ab9ce5b0ab48e7aa69e71fe72322528af0
PR3 #185  → active final implementation/closure PR; squash SHA unknown until merge
```

There is no PR4.

The accepted Audit contract is archived verbatim at:

`docs/audits/completed/post-1.0-strategic-feedback-truth.md`

## Delivered product truth

### PR1 — Arena combat identity

New Arena entries persist a full stable fleet-identity resolution seed while legacy active entries without it retain the exact old compatibility fallback. No schema/save bump or migration was needed.

### PR2 — unified combat feedback

Arena is part of canonical unified reports as `battle/pve`; normal combat, Arena and Solar War persist immutable resolution-time tactical feedback without reconstructing historical enemy/current command state.

### PR3 — combat ranking truth

The ranking metric is now explicitly `Боевые победы` and consumes only canonical unified reports. It counts:

- primary success for `battle` reports;
- secondary victory for `battle` reports where primary outcome is failure;
- primary success for `solar-war` reports.

It excludes generic expedition/space-object success and all non-winning Arena/Solar War outcomes. Duplicate report IDs count at most once. The existing `500` score weight per combat victory and deterministic score/rank ordering are unchanged.

## Closure boundary

PR #185 stages the batch closure documents. The batch becomes GitHub-complete only after controller-approved merge of #185; its future squash SHA is intentionally not guessed.

After #185 merges:

1. resolve the resulting fresh `main`;
2. reconcile #185 generated squash SHA in the next permitted control-plane record;
3. begin only a fresh docs-only product Audit;
4. do not continue directly into any implementation or implied PR4.

Research-only candidates remain research until a fresh Audit selects and authorizes a coherent batch:

- achievements / extra score layers;
- moving-object trajectories;
- Bank/credit semantics;
- additional bot differentiation.

## Current delivery sequence

```text
PR3 runtime implementation
→ runtime-head CI / Graphify / Browser / Pages green
→ stage Audit archive + batch closure control plane
→ fresh exact-head CI / Graphify / Browser / Pages
→ unresolved threads = 0 + mergeable + main unchanged
→ mark #185 Ready
→ STOP for controller review
```

**Do not merge #185. Do not create PR4. Do not start the next Audit before controller merge.**
