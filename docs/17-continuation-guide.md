# Continuation guide

## Current handoff

Release 1.0 remains closed. Persistence remains schema v19 / save format v6 / migration none.

Current exact live `main` / starting main for PR #187:

`de5e37f4ac69bbcf8707267272fe03a1e2c3b7ba`

Audit #186 is merged and accepted at that SHA. Its accepted contract is archived verbatim at:

`docs/audits/completed/post-1.0-replayable-campaign-lifecycle.md`

## Only active work

```text
POST-1.0-REPLAYABLE-CAMPAIGN-LIFECYCLE
POST-1.0-PR1-REPLAYABLE-CAMPAIGN-LIFECYCLE
PR #187
branch agent/post-1.0-replayable-campaign-lifecycle
kind implementation-closure
runtime implementation complete
closure staged / pending controller merge
```

There is no PR2.

## Delivered authority lifecycle

### Seed / fresh game

- player-facing seed is uint32 `0..4294967295`;
- numeric seed is persisted exactly as `GameState.seed`;
- legacy string source compatibility remains;
- real picker offers seed input and Web Crypto reroll/suggestion before state creation;
- tests use explicit fixed seeds;
- same seed + same faction/settings reproduces deterministic initial-world evidence;
- different seed changes deterministic generated-world evidence;
- no wallclock/`Date.now()`/`Math.random()` simulation seed.

### Safe campaign switches

Every actual campaign switch first makes the old writer inert:

```text
validate target/intent
→ block old-page autosave producers
→ drain pending/active work with failure propagation
→ dispose/quiesce old AutoSaveController
→ authoritative persistence switch
→ reload/bootstrap
```

New Campaign:

```text
confirm
→ quiesce A
→ delete autosave.snapshot
→ delete autosave
→ reload
→ missing authority reaches real fresh-game path
```

Manual `Загрузить`:

```text
validate/load manual B
→ quiesce A
→ delete stale autosave.snapshot(A)
→ write B state + runtimeMetadata as primary autosave
→ preserve manual B
→ reload
→ primary B wins recovery
```

Old campaign A cannot be written again after successful quiescence. Failed quiescence mutates no reserved authority; stale snapshot deletion precedes primary replacement.

## Import is STORAGE ONLY

Player Import requires an explicit non-empty manual target and rejects:

- `autosave`;
- `autosave.snapshot`.

Payload `slotId` never grants player-facing destination authority.

```text
Import JSON
→ explicit manual target
→ write manual slot only
→ primary/snapshot unchanged
→ current campaign unchanged
→ no writer quiescence
→ no reload
```

An imported campaign becomes active only when the user later presses `Загрузить`, which uses the safe quiesced manual-activation path.

## Focused Browser acceptance

`tests/e2e/campaignLifecycle.spec.ts` now proves the complete binding lifecycle against real app/storage behavior:

- actual picker reached through the narrow deterministic E2E seam;
- fixed seed is honored;
- same seed later reproduces the same deterministic galaxy evidence;
- different seed produces different galaxy evidence;
- manual saves survive New Campaign reset;
- New Campaign cancel preserves A and confirm removes reserved A authority before real reload;
- a real page lifecycle/autosave path creates a non-null `autosave.snapshot` containing A;
- Import leaves current A, primary A and snapshot A unchanged and does not reload;
- Import writes distinct B only to `manual-import`;
- `Загрузить manual-import` is the point that performs real reload and activates B;
- after Load/reload, primary and any recreated snapshot are B, never stale A;
- manual-import, manual-b and manual-survivor remain manual slots.

## Regression and pre-closure evidence

Historical RED:

```text
e1b402442b437d581bb10b59782332a47a354b82
CI #2300
```

Pre-closure runtime head:

`5e60bd7998e031b04b67826caae6e7103c6d7f3b`

Controller-verified on that head:

- CI #2314 — SUCCESS;
- Graphify #1443 — SUCCESS;
- Browser E2E #1544 — SUCCESS;
- production Pages smoke #1544 — SUCCESS.

These are historical pre-closure runs. The closure docs/control-plane commit requires fresh exact-head gates before Ready.

## Required continuation reading

1. `AGENTS.md`;
2. `docs/28-audit-first-autonomous-delivery-protocol.md`;
3. `docs/audits/current-batch-audit.md`;
4. `docs/audits/current-execution-state.md`;
5. `docs/audits/batch-history.md`;
6. `docs/audits/completed/post-1.0-replayable-campaign-lifecycle.md`;
7. `docs/project-status.json`;
8. `docs/roadmap-pr-index.json`;
9. `docs/16-execution-roadmap.md`;
10. actual GitHub main / PR #187 / workflows / threads / reviews / comments.

## Current stop rule

Finish only #187 closure: fresh exact-head CI + Graphify + Browser E2E + production smoke, review/comment loop, mergeability/main/head check, final PR body, Ready, post-Ready recheck, STOP.

The batch becomes COMPLETE only after controller merges #187; the generated squash SHA is unknown until then. After that controller merge, the next authorized category is a fresh docs-only Audit from fresh `main`.

**Do not merge #187. Do not create PR2. Do not start the next Audit.**
