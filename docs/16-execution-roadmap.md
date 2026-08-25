# Execution Roadmap Stellar Empires — current entrypoint

**Status:** Release 1.0 closed; PR #187 runtime complete / batch closure staged  
**Updated:** 2026-08-25  
**Verified current main / PR #187 starting main:** `de5e37f4ac69bbcf8707267272fe03a1e2c3b7ba`  
**Last merged PR:** #186 `docs: audit next post-1.0 product batch`  
**Active PR:** #187 `feat: add safe replayable campaign lifecycle`  
**Runtime:** schema v19 / save format v6 / migration none  
**Implementation authorized:** true for the single Audit #186 work item; implementation now complete

## Accepted Audit boundary

```text
Audit #186 → de5e37f4ac69bbcf8707267272fe03a1e2c3b7ba
accepted batch → POST-1.0-REPLAYABLE-CAMPAIGN-LIFECYCLE
implementation count → 1
```

The accepted Audit contract is archived verbatim at:

`docs/audits/completed/post-1.0-replayable-campaign-lifecycle.md`

Only implementation work item:

`POST-1.0-PR1-REPLAYABLE-CAMPAIGN-LIFECYCLE` → PR #187.

There is no PR2.

## Delivered lifecycle

#187 delivers one coherent `System / Saves → persistence authority → bootstrap` lifecycle:

- exact uint32 player campaign seed;
- real seed picker plus Web Crypto reroll/suggestion;
- legacy string seed compatibility;
- deterministic same-seed reproduction and different-seed generated-world evidence;
- New Campaign cancel/confirm;
- old autosave writer quiescence before reserved authority mutation;
- snapshot-before-primary deletion ordering;
- manual save survival across reset;
- safe manual Load with stale snapshot removal before primary replacement;
- one shared single-flight campaign-switch gate around the complete main-level authority transaction/reload path;
- concurrent Load/New Campaign attempts are rejected before a second persistence/recovery/reload sequence starts;
- manual Load validation/activation failures are player-visible through the save-manager status path, do not reload or mutate authority, and re-enable the action control;
- storage-only Import with explicit manual destination;
- rejection of reserved Import destinations;
- imported campaign activation only through subsequent safe Load;
- deterministic focused E2E real-picker seam without changing default E2E fixture behavior;
- protection against old campaign resurrection;
- save-manager stale-render race protection;
- focused Browser campaign lifecycle coverage including a real recovery snapshot and stale-manual-slot failure UX.

## Campaign authority rules

Actual campaign switches are single-flight. The gate is acquired before the main-level lifecycle callback; a concurrent second switch is rejected before it can enter quiescence, persistence mutation, failure recovery, or reload.

The accepted switch follows:

```text
validate target/intent
→ block old autosave producers
→ drain/quiesce/dispose old writer
→ authoritative persistence switch
→ reload/bootstrap
```

New Campaign:

```text
quiesce A
→ delete autosave.snapshot
→ delete autosave
→ reload
→ fresh-game picker/bootstrap
```

Manual Load:

```text
validate B
→ quiesce A
→ delete stale autosave.snapshot(A)
→ write B primary
→ preserve manual B
→ reload
→ B wins recovery
```

A missing/invalid manual target fails before quiescence. Save Manager catches that rejection, reports it visibly and re-enables `Загрузить`; current authority and document remain unchanged.

Import:

```text
require explicit non-reserved manual target
→ write manual slot only
→ primary/snapshot/current campaign unchanged
→ no quiesce
→ no reload
→ activation only through later Load
```

## Regression-first and Browser evidence

Historical RED:

- commit `e1b402442b437d581bb10b59782332a47a354b82`;
- CI #2300.

Exact pre-closure runtime head:

`5e60bd7998e031b04b67826caae6e7103c6d7f3b`

Controller-verified pre-closure gates:

- CI #2314 — SUCCESS;
- Graphify #1443 — SUCCESS;
- Browser E2E #1544 — SUCCESS;
- production Pages smoke #1544 — SUCCESS.

Focused lifecycle acceptance additionally covers controlled concurrent switch attempts in both orders and the real Browser case where a valid rendered manual slot disappears before Load. The latter produces a visible error without reload, authority replacement or unhandled page error.

These runs are not final evidence after later implementation/control-plane commits.

## Current delivery sequence

```text
main de5e37f...
→ Audit #186 merged/accepted
→ PR #187 runtime implementation complete
→ strengthened Browser acceptance
→ post-Ready P2 single-flight + Load error handling fix
→ final closure docs/control-plane commit
→ fresh exact-head CI + Graphify + Browser + production smoke
→ review threads/reviews/comments clean
→ mergeable + main/head stable
→ final PR body
→ Ready
→ post-Ready exact-head recheck
→ STOP
```

The batch is closure STAGED while #187 is unmerged. It becomes `POST-1.0-REPLAYABLE-CAMPAIGN-LIFECYCLE → COMPLETE` only after controller-approved squash merge of #187. Do not invent the generated #187 squash SHA.

After controller merge, the only permitted next category is a fresh docs-only Audit from fresh `main`.

**Do not merge #187. Do not create PR2. Do not start the next Audit.**
