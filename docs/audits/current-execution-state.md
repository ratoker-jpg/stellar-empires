# Current execution state

**State:** NEMEXIA-PROTO-SIM-SCALING in progress — NEM-01 merged, NEM-02 next
**Updated:** 2026-08-30
**Batch:** NEMEXIA-PROTO-SIM-SCALING (Phase 1 of `docs/30-nemexia-full-prototype-program.md`)
**Audit baseline:** main at 7ad1046dfad7a34b712354765b6f9ebbcd41ed9e (PR #194 merge)
**Closed batch:** FULL-VISUAL-NAVIGATION-REDESIGN — Audit #188, UI-01 #191 (4718358b), UI-02 #192 (2ccb9ab5), archived at `docs/audits/completed/full-visual-navigation-redesign.md`
**Active work items:** NEM-01-UNIVERSE-EMPIRE-SCALING (merged, PR #194), then NEM-02-BOT-SCHEDULER-BATCHING-PERF (heavy, max two implementation PRs, strict order)

## Last completed atomic action

- Verified GitHub PR #194 (NEM-01-UNIVERSE-EMPIRE-SCALING) as MERGED with squash SHA 7ad1046dfad7a34b712354765b6f9ebbcd41ed9e.
- Verified the PR #194 merge head at 10/10 green checks, including the four organic terminal gates (RUN_ORGANIC_TERMINAL_SCENARIO=1), campaign catch-up performance, Playwright E2E and the production Pages smoke.
- Reconciled `docs/project-status.json` (statusVersion 103), `docs/roadmap-pr-index.json` (indexVersion 38) and this execution-state file: NEM-01 recorded as merged, batch advanced to NEM-02, stale PR #187 sequence entry corrected to merged (0894ac4b).

## Last successful validation

- PR #194 checks: 10/10 green (CI, Browser E2E, Graphify audit, production Pages smoke, all four organic terminal scenarios).
- Local `npm run check` green at the NEM-01 head: 784+ unit tests including the new NEM-01 suites (100-empire world creation, deterministic bot identity `bot-NN`, v19→v20 migration chain, campaign settings with optional `botEmpireCount`).
- Local perf suite within budget at the NEM-01 head; all four organic gates reproduced green locally with `RUN_ORGANIC_TERMINAL_SCENARIO=1` before push.
- Local Playwright batches green, including the hardened `navigationUsability` checksum capture.

## Current divergence and correction

Two corrections landed with or immediately after NEM-01:

1. **Bot home system identity (blocking, fixed in PR #194):** the initial planet-state builder passed `system.name` ("Astra 02") where `system.id` ("system-2") was required. Colony lists in the bot logistics planner are ordered by `systemId.localeCompare`, so the wrong key silently reordered specialization roles and desynchronized the deterministic organic terminal scenarios from main. After the fix the organic replay is bit-identical to main.
2. **Pre-existing navigationUsability flake (hardened in PR #194):** the spec pinned the autosave checksum of the very first frame, while migration re-normalization on the establishing reload clamps the E2E gas-fixture capacity. The checksum is now captured after the establishing reload; confirmed stable 6/6. A separate `universeNavigation` flake (~50% on plain main, unrelated to NEM-01) remains known and unaddressed.

## Exact next action

From fresh main (≥ 7ad1046d), create NEM-02-BOT-SCHEDULER-BATCHING-PERF as the second and final implementation PR of the NEMEXIA-PROTO-SIM-SCALING batch, citing Audit PR #193 and the stable work-item ID in its PR body. Scope per `docs/30`: scheduler batching/decision-quota hardening so the 101-empire world keeps interactive tick budgets without changing v20 semantics. After it merges, the batch closes through a fresh closure/archive PR.
