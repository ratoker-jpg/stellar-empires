# Continuation guide

## Current handoff

`main` is at the merged UI-parity Audit PR #196:

`175e52c8b2b8752c1f9a272261867d1c0b213513`

The authorized implementation branch is `feat/ui-parity-04-assets-qa`. It contains the complete local Nemexia-inspired UI-parity batch and is now being delivered remotely at the owner's request.

## Current delivery

```text
NEMEXIA-PROTO-UI-PARITY
baseline main 175e52c8b2b8752c1f9a272261867d1c0b213513 (PR #196)
branch feat/ui-parity-04-assets-qa
status: publish branch, open implementation PR, await checks, then merge
```

The implementation keeps formulas, state transitions and persistence unchanged. It rebuilds command navigation, the planet command centre, map context panels and the visual treatment of the primary routes using Stellar-owned assets only. The Nemexia saved pages at `D:\\Xuina\\WHAT\\saved_pages` remain visual and interaction references only; they do not authorize copying external code, branding or images.

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

Every real campaign switch first acquires the shared main-level single-flight gate. While it is active, a second Load/New Campaign attempt is rejected before it can start its own quiescence, persistence mutation, recovery path or reload.

The active switch then makes the old writer inert:

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

If a manual slot becomes missing/invalid after render but before click, Load fails before quiescence. Save Manager catches the rejection, shows a player-visible error through the existing status path, re-enables the Load control, and leaves authority/document unchanged without an unhandled rejection.

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

## Focused acceptance

Controlled unit/storage barriers prove both concurrent orders:

```text
Load B starts → New Campaign attempted
New Campaign starts → Load B attempted
```

In each case exactly one switch transaction is active, the second attempt starts no persistence operation, snapshot/primary writes do not interleave, and only one reload intent is produced.

Focused Browser `tests/e2e/campaignLifecycle.spec.ts` proves the complete binding lifecycle against real app/storage behavior:

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
- manual-import, manual-b and manual-survivor remain manual slots;
- deleting a valid rendered manual slot before Load produces a player-visible error, no reload/authority replacement, a re-enabled Load button, and no page-level unhandled error.

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

These are historical pre-closure runs. Any later implementation/control-plane commit requires fresh exact-head gates before Ready.

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

Complete and merge the docs-only FULL-VISUAL-NAVIGATION-REDESIGN Audit after its checks pass. Do not start either implementation item before that merge. After the Audit merge, create UI-01 from the resulting fresh `main`, then UI-02 only after UI-01 is accepted and its combined state is validated.
