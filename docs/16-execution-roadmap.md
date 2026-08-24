# Execution Roadmap Stellar Empires — current entrypoint

**Status:** Release 1.0 closed; fresh docs-only Audit #186 active  
**Updated:** 2026-08-24  
**Verified current main / exact Audit starting main:** `e974c09e7779b4cf3bbc6d0279b8d35f177a29e6`  
**Last merged PR:** #185 `fix: make combat ranking victories truthful`  
**Active PR:** #186 `docs: audit next post-1.0 product batch`  
**Runtime:** schema v19 / save format v6  
**Implementation authorized:** false

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

Actual GitHub state wins over prose.

## Completed boundary

`POST-1.0-STRATEGIC-FEEDBACK-TRUTH` is complete:

```text
Audit #182 → b09887489db7754f0c0b2672649db9283b879732
PR1 #183  → 83a4942c35aac8d7f0b02f7730f0646c171c98b5
PR2 #184  → 691078ab9ce5b0ab48e7aa69e71fe72322528af0
PR3 #185  → e974c09e7779b4cf3bbc6d0279b8d35f177a29e6
```

There is no PR4. Audit #182 is archived at `docs/audits/completed/post-1.0-strategic-feedback-truth.md` and is no longer successor implementation authorization.

## Current entrypoint

Only docs-only Audit #186 is active:

`POST-1.0-NEXT-PRODUCT-3`

Branch:

`audit/post-1.0-next-product-3`

Starting main:

`e974c09e7779b4cf3bbc6d0279b8d35f177a29e6`

The Audit used pinned Graphify 0.8.38 plus direct source/tests/UI instead of replaying old backlog.

## Fresh decision

The strongest current product gap is one coherent replayability/lifecycle problem:

- the only real fresh-game bootstrap uses hard-coded seed source `stellar-empires-m1`, while seed controls generated universe/neutral/PvE/world-event variation;
- a valid autosave or recovery snapshot is always restored, reserved autosaves are non-deletable in UI, terminal state freezes permanently, and there is no normal in-game “Новая партия” path.

Proposed successor batch, **not authorized until controller-approved Audit #186 merge**:

`POST-1.0-REPLAYABLE-CAMPAIGN-LIFECYCLE`

Exactly one proposed implementation PR:

`POST-1.0-PR1-REPLAYABLE-CAMPAIGN-LIFECYCLE`

One PR is intentional: restart + seed variation are one player-facing outcome through one bootstrap/persistence/browser data flow. Splitting them would produce incomplete intermediate products and no real dependency checkpoint.

## Proposed player contract

If Audit #186 is accepted later, the one implementation PR should:

- expose an explicit/reusable uint32 campaign seed in new-game UI;
- suggest a different seed without wallclock input (Web Crypto is allowed only before state creation; tests use explicit fixed seeds);
- use the selected numeric seed directly as existing persisted `GameState.seed`;
- provide confirmed `System → Saves → Новая партия` lifecycle;
- clear recovery snapshot before primary autosave so old campaign cannot be silently recovered;
- preserve every manual/user-named save slot;
- route back through the existing bootstrap/new-game selector;
- preserve schema v19 / save v6 / migration none and all permanent terminal/performance gates.

## Research / rejected items

Not current implementation:

- achievements/meta progression — RESEARCH;
- moving-object trajectories — RESEARCH;
- more bot differentiation — RESEARCH;
- `BotDifficulty` semantics — internal dead metadata without current player promise;
- Bank/credit gameplay — REJECT without authoritative semantics; do not invent a subsystem for the evidence-gated producer field.

Recently closed Arena/report/tactical/ranking/endgame/bot/UI truth gaps remain closed unless new evidence appears.

## Current delivery sequence

```text
fresh main e974c09...
→ docs-only Audit #186
→ exact-tree Graphify + direct-source product sweep
→ one-PR replayable-campaign proposal
→ final docs/control-plane
→ fresh exact-head CI + Graphify + Browser/Pages
→ unresolved threads = 0 + mergeable + main unchanged
→ mark #186 Ready
→ STOP for controller review
```

**Do not merge #186. Do not create the implementation branch. Do not start PR1.**
