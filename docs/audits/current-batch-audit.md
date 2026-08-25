# POST-1.0-REPLAYABLE-CAMPAIGN-LIFECYCLE — batch closure staging

**State:** only implementation PR #187 / closure staged for controller review  
**Accepted Audit:** #186 — MERGED at `de5e37f4ac69bbcf8707267272fe03a1e2c3b7ba`  
**Archive:** `docs/audits/completed/post-1.0-replayable-campaign-lifecycle.md`  
**Runtime:** schema v19 / save format v6 / migration none

The complete accepted Audit #186 contract is preserved verbatim at the archive path above. This current entrypoint records the delivered implementation boundary and the pending controller merge; it does not rewrite the accepted Audit contract.

## Delivered chain

```text
Audit #186 → de5e37f4ac69bbcf8707267272fe03a1e2c3b7ba
PR1 #187  → current implementation + closure PR; generated squash SHA unknown until controller merge
```

`POST-1.0-PR1-REPLAYABLE-CAMPAIGN-LIFECYCLE` is the only implementation PR authorized by Audit #186. There is no PR2.

## Delivered outcome

#187 implements one coherent campaign lifecycle:

- exact player-facing uint32 campaign seed persisted without re-hashing;
- real new-game seed picker with Web Crypto reroll/suggestion, while legacy string seed sources remain compatible;
- deterministic same-seed reproduction and different-seed world evidence;
- confirmed New Campaign flow with old autosave writer quiescence before reserved authority deletion;
- `autosave.snapshot` deletion before primary `autosave` deletion during New Campaign;
- manual save preservation across reset;
- safe manual Load that validates the target, quiesces the old writer, removes stale snapshot authority, writes the selected campaign as primary, then reloads;
- storage-only Import requiring an explicit non-reserved manual target;
- rejection of `autosave` and `autosave.snapshot` as Import destinations;
- imported campaign activation only through the later safe Load path;
- deterministic interactive-new-game E2E seam while default E2E fixture bootstrap remains unchanged;
- protection against old campaign resurrection across reload/page lifecycle;
- save-manager stale-render race protection;
- focused Browser lifecycle coverage including a real non-null recovery snapshot and Import → `manual-import` → Load activation.

Persistence remains schema v19 / save format v6 / migration none.

## Regression-first evidence

Historical RED commit:

`e1b402442b437d581bb10b59782332a47a354b82`

Historical RED CI: **#2300**.

That semantic RED exposed the hard-coded ordinary fresh-game seed, New Campaign resurrection, unsafe manual activation, reserved-slot Import authority bypass, and the E2E real-picker bypass. Assets/lint/typecheck reached green before the intentional lifecycle assertions failed.

## Pre-closure runtime evidence

Exact pre-closure runtime head:

`5e60bd7998e031b04b67826caae6e7103c6d7f3b`

Controller-verified on that head:

- CI #2314 — SUCCESS;
- Graphify #1443 — SUCCESS;
- Browser E2E #1544 — SUCCESS;
- production Pages smoke #1544 — SUCCESS.

These runs are historical pre-closure evidence only. The closure docs commit changes the exact head, so fresh exact-head gates are required before Ready.

## Closure semantics

- #187 is the first, only, and final implementation PR in `POST-1.0-REPLAYABLE-CAMPAIGN-LIFECYCLE`.
- Runtime implementation is complete; this repository state stages batch closure for controller review.
- The batch becomes COMPLETE only after controller-approved squash merge of #187.
- Do not invent the future #187 generated squash SHA. It remains unknown until controller merge.
- There is no PR2.
- No successor implementation is authorized by this closure.
- After #187 merges, the only permitted next work category is a fresh docs-only Audit created from the resulting fresh `main`.

**Do not merge #187 autonomously. Do not create PR2. Do not start the next Audit before controller merge.**
