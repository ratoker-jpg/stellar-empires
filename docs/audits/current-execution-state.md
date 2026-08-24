# Current execution state

**State:** PR2 complete-for-controller-review  
**Updated:** 2026-08-24  
**Accepted Audit:** #182 `docs: audit next post-1.0 product batch` — MERGED  
**Audit squash:** `b09887489db7754f0c0b2672649db9283b879732`  
**PR1:** #183 `fix: preserve full Arena combat identity` — MERGED  
**PR1 squash / exact PR2 starting main:** `83a4942c35aac8d7f0b02f7730f0646c171c98b5`  
**Active implementation PR:** #184 `feat: unify combat reports and tactical feedback`  
**Branch:** `agent/post-1.0-unified-combat-feedback`  
**Work item:** `POST-1.0-PR2-UNIFIED-COMBAT-FEEDBACK`  
**Runtime:** schema v19 / save format v6 / migration none

## Current batch

Batch: `POST-1.0-STRATEGIC-FEEDBACK-TRUTH`.

Ordered state:

1. `POST-1.0-PR1-ARENA-COMBAT-IDENTITY-TRUTH` — #183 MERGED at `83a4942c35aac8d7f0b02f7730f0646c171c98b5`;
2. `POST-1.0-PR2-UNIFIED-COMBAT-FEEDBACK` — #184 active / complete-for-controller-review;
3. `POST-1.0-PR3-COMBAT-RANKING-TRUTH` — pending / NOT STARTED.

The batch is not closed. PR3 must not start before controller handling of PR2.

## PR2 implementation truth

Regression-first RED commit:

`c23f39db6863562f9ebd4ffdd8903126f0b1e5ba`

The baseline tests exposed two accepted gaps:

- persisted Arena history was missing from `createUnifiedMissionReports()`;
- historical tactical context could not remain resolution-time truth after later doctrine/flagship changes.

`CombatTacticalSnapshot` is optional persisted report context with exactly:

- `doctrineId`;
- `commandLevel`;
- `isFlagship`;
- `formation`;
- `targetPriority`;
- `commanderId`.

Snapshot points:

- normal attack: immediately before battle resolution in `resolveAttackMission()`, for attacker and defender when command state exists;
- Solar War: immediately before battle resolution in `resolveEntry()`, for the player participant;
- Arena: immediately before battle resolution in `applyArenaResolutionEvent()`, for the player entry.

Historical report rendering consumes only the persisted snapshot. It does not reconstruct doctrine, Admiral level, flagship, formation, priority or commander from current mutable command state.

Legacy compatibility:

- old `BattleReport` values without tactical snapshots remain valid and render “Тактический контекст: не зафиксирован.”;
- old `ArenaResult` values without `tacticalSnapshot` remain valid;
- malformed snapshots fail normalization rather than being partially guessed;
- Solar War legacy battle reports without snapshots remain valid.

Arena is now synthesized exactly once by `createUnifiedMissionReports()` as canonical `kind='battle'`, `mode='pve'`. Victory/draw/defeat/withdrawn map to success/draw/failure/failure. Rewards, own losses and enemy losses flow through the same canonical summaries and `compareEmpirePvePvp()` aggregation. Ordering stays deterministic by `resolvedAt` descending, then `id`.

Both report UI consumers render the same player tactical feedback:

- `src/ui/missionReportsPanel.ts`;
- `src/ui/reportsWorkspace.ts`.

Privacy boundary: player-visible report feedback selects only the player's persisted tactical snapshot. It does not expose a hidden enemy-current-state reconstruction.

PR1 Arena `resolutionSeed` semantics are unchanged. Ranking semantics are unchanged and remain reserved for PR3.

A real save round-trip exposed `CHECKSUM_MISMATCH` because `resolveAttackMission()` emitted the optional `demolition` field with value `undefined`, while JSON serialization omitted that property. The fix preserves the existing optional-field contract by omitting `demolition` from the in-memory report when no demolition report exists. No checksum algorithm, schema or save version changed.

Runtime implementation head before this control-plane commit:

`545283603f7fd7de33edc409117152e3efc32081`

Runtime-head evidence is fully green:

- CI #2266 — asset audit, lint, typecheck, full tests and build SUCCESS;
- compressed progression SUCCESS;
- campaign catch-up performance SUCCESS;
- Organic Obelisk SUCCESS;
- Organic Fresh Game → Terminal SUCCESS;
- terminal save/load + partition determinism SUCCESS;
- bounded organic faction matrix SUCCESS;
- Graphify #1398 with repository-pinned `graphifyy==0.8.38` SUCCESS;
- Browser E2E #1496 SUCCESS;
- production Pages smoke job in Browser #1496 SUCCESS.

Save/load evidence includes real schema v19 / save format v6 round trips for normal battle, Arena and Solar War tactical snapshots, plus legacy values without snapshots. Migration remains none.

Because this control-plane commit changes the exact head, fresh exact-head CI, Graphify, Browser E2E and production smoke are required again before #184 is marked Ready.

## Scope boundary

PR2 changes combat feedback/report truth only.

Unchanged:

- PR1 Arena `resolutionSeed`;
- combat formulas and RNG;
- ranking victory semantics and score;
- Arena/Solar War balance;
- schema v19;
- save format v6;
- migration state (`none`);
- PR3.

## Next action

Require fresh exact-head CI + Graphify + Browser E2E + production Pages smoke after this control-plane commit. Then inspect review threads/reviews/comments, re-check live `main`, require `mergeable=true`, update the PR body with final evidence, mark #184 Ready, verify the Ready state against the same exact head, and STOP for controller review.

**Do not merge #184. Do not create or start PR3.**
