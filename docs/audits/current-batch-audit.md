# NEMEXIA-PROTO-SIM-SCALING — current batch audit

**State:** fresh docs-only Audit for Phase 1 of `docs/30-nemexia-full-prototype-program.md`
**Complexity:** heavy; maximum two implementation PRs
**Audit baseline:** main at 2ccb9ab59f1795a63fd8cccdc52f7af0f2a108d3 (PR #192 merge)
**Program plan:** `docs/30-nemexia-full-prototype-program.md` (PR #190)
**Scope:** simulation scale only — 100 autonomous bot empires on the existing rules; no new gameplay behaviour

## Verified baseline and reconciliation

- **VERIFIED:** PR #192 is merged (squash SHA 2ccb9ab59f1795a63fd8cccdc52f7af0f2a108d3); local main is fast-forwarded to the same commit. UI-01 (#191) and UI-02 (#192) close the FULL-VISUAL-NAVIGATION-REDESIGN batch, archived at `docs/audits/completed/full-visual-navigation-redesign.md`.
- **VERIFIED:** the simulation currently creates exactly three bot empires (`aegis-bot`, `synod-bot`, `veyra-bot`) in `createInitialGameState.ts`; profiles are hard-coded and `botAutomation.nextDecisionAtByEmpire` is keyed per existing empire only.
- **VERIFIED:** the universe preset `campaign` materializes galaxy 1 only (6 systems × 27 bodies) while `fidelity` describes 15×81; the reducer, ranking, reports and PvE viewers branch on the three fixed bot empire ids in multiple places.
- **VERIFIED:** bots execute synchronously inside `advanceCampaignTime` (`campaign/time.ts`) with a 32-decision budget per run; the `BotAutomationController` + `botScheduler.worker.ts` path exists but is not wired into `main.ts`.
- **VERIFIED:** save v6 / schema v19; migration chain ends at v19; checksum/replay gates cover the current state shape.
- **VERIFIED:** the campaign-time performance test exists (`tests/simulation/campaignTimePerformance.test.ts`) and is excluded from the default CI test run.
- **DECISION:** the offline Nemexia prototype requires 1 player + 100 bot empires (`docs/30` G-1) before any personality work. Scale lands first, behaviour diversification second (Phase 2).

## Work items

### NEM-01-UNIVERSE-EMPIRE-SCALING

**Purpose and player-visible outcome:** a fresh campaign starts with 1 player empire and 100 autonomous bot empires distributed deterministically across the materialized universe; existing v19 saves keep loading unchanged with their historical three-bot world.

**Expected paths:** `src/simulation/types.ts`, `src/simulation/createInitialGameState.ts`, `src/simulation/universe/model.ts`, `src/simulation/galaxy/generateGalaxy.ts`, `src/storage/migrateGameStateV20.ts` (new), `src/storage/saveFormat.ts`, reducer/ranking/reports/PvE viewer branches keyed on fixed bot ids, `tests/simulation/*` fixtures.

**Contract:**

- schema v20 adds `campaignSettings.botEmpireCount` (uint32, default 3 for migrated saves, 100 for fresh prototype campaigns);
- deterministic, seed-derived generation of 100 bot empires and their home worlds (deterministic sparsification of the preset; all preset galaxies materialized);
- every fixed `empireId` branch (createInitialGameState, universe model, generateGalaxy, reducer, ranking, reports, pveOperationsPlannerLegacy viewer remap) becomes data-driven over `state.empires`;
- migration v19→v20 keeps old saves on their three-bot layout and stamps `botEmpireCount = 3`;
- checksum, replay and save-format gates updated; save v6 format versioning rules preserved.

**Acceptance gate:** `npm run check` green including migration tests; a fresh v20 campaign with 100 bots loads, saves, reloads and replays deterministically; v19 fixtures still pass.

### NEM-02-BOT-SCHEDULER-BATCHING-PERF

**Purpose and player-visible outcome:** the campaign tick and catch-up stay inside their budgets with 101 empires; the player does not feel the 100 bots.

**Expected paths:** `src/simulation/bots/scheduler.ts` (or the current scheduler module set), `src/simulation/campaign/time.ts`, `src/simulation/intelligence/*`, `src/simulation/pve/pveOperationsView.ts`, `tests/audit/*`, CI workflow.

**Contract:**

- batched bot decisions (K=16 profiles per operation per `docs/30` D-3) with stable dedup keys and index/cache optimizations per D-4;
- history/scaling limits for bot-generated reports and intelligence so save size stays bounded;
- duplicate summary paths deduplicated;
- performance gates in CI: organic fresh→terminal with 100 bots, catch-up 7d × worldSpeed 10 within 2 minutes, save-size guard ≤ 8 MB.

**Acceptance gate:** the 100-bot organic gate is green in CI; catch-up and save-size gates green; `npm run check` and the full Browser E2E suite green; no formula, combat or personality changes.

## Required validation

- `npm run check` (assets:check, lint, typecheck, vitest, build) including the performance test locally;
- new/updated migration, scheduler, checksum and performance tests;
- full Browser E2E suite plus production Pages smoke on the exact final implementation head.

## Explicit non-goals

- no bot personality generation, traits, memory or diplomacy (Phase 2+);
- no new player-facing content, UI redesigns or alliance mechanics;
- no changes to combat formulas, economy curves or save-authority semantics beyond the v20 fields.

## Batch decision

Heavy two-PR batch executed strictly in order NEM-01 → NEM-02. A material scope change requires a replacement audit before implementation expands.
