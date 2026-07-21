# AI Continuation Guide

**Status:** Accepted  
**Updated:** 2026-07-21  
**Baseline:** merged PR #83

## Repository

```text
Repository: ratoker-jpg/stellar-empires
Default branch: main
Pages: https://ratoker-jpg.github.io/stellar-empires/
```

GitHub history and current `main` override stale prose, prior chat memory and abandoned branches.

## Required startup reading

1. `AGENTS.md`
2. this document
3. `docs/project-status.json`
4. `docs/16-execution-roadmap.md`
5. `docs/20-full-project-audit.md`
6. `docs/19-faction-catalog-id-policy.md`
7. `docs/21-native-synod-catalog.md`
8. `docs/22-native-veyra-catalog.md`
9. `docs/23-bot-simulation-time-contract.md`
10. `docs/24-long-session-history-retention.md`
11. `docs/handoffs/2026-07-21-post-audit-handoff.md`
12. mechanics reference when changing game rules
13. asset intake when changing art/runtime assets
14. latest merged PRs and actual `main`

## Confirmed baseline

```text
#81 — Add the native Veyra mechanical catalog
merge SHA: a90c6e7a346f81562e18763a3716d3fa6feae466

#82 — Stabilize bot simulation time and deterministic catch-up
merge SHA: c7c1c1724bc8e5e472d12da017e1b2c3cc694390

#83 — Bound long-session state histories deterministically
merge SHA: f71e641ed201423e2b2e9fd39b58dda692580458
```

The next runtime branch must start from current `main` after the post-merge status updates.

## Delivered runtime through PR #83

- deterministic schema-v13 simulation, event queue, replay and checksum;
- IndexedDB autosave, slots, import/export, recovery and migrations;
- seeded galaxy, fog-aware intelligence and multi-colony management;
- planet economy, stability, storage, specialization and three zones;
- building, research, unit, defense-repair and ship-upgrade queues;
- fleets with deploy, transport, scout, attack, recycle, colonize, expedition and space-object missions;
- combat v2, reports, debris, planetary-defense damage and repair;
- logistics routes, market, pirates, expeditions, objects and world events;
- autonomous honest bots running normal commands through a Worker;
- three faction identities, runtime visual registries and new-game selection;
- operations presentation, local ranking and accessibility runtime;
- per-hull upgrades, formations, target priorities and role-based class skills;
- command progression, battle experience and flagship appointments;
- explicit faction catalog manifest, stable mechanical IDs and dependency validation;
- full native Aegis, Synod and Veyra catalogs, each with 12 buildings, 10 technologies, 10 ships and 5 defenses;
- central registry-backed building, research and unit resolution;
- faction-aware starting colonies, economy, research effects, facilities, combat, upgrades, bots and UI;
- role-based scout, recycle, colonize, expedition and strategic-object requirements;
- deterministic migration of alias-era Synod and Veyra states from Aegis IDs to native faction IDs;
- native faction runtime assets with documented faction-only technology fallbacks;
- canonical bot cadence stored in `GameState` and persisted through save/load;
- stable scheduled-time ordering and bounded catch-up of overdue bot decisions;
- atomic Worker result adoption with stale-response rejection;
- bounded retained windows for commands, executed events, market trades, world-event history and intelligence history;
- monotonic command indices after command-log compaction;
- deterministic migration of oversized schema-v13 saves while pending gameplay state remains intact;
- full-state-checksum Worker staleness protection after command-log saturation.

## Delivered documentation through PR #83

- canonical full-project audit in `docs/20-full-project-audit.md`;
- stabilization risks and P0–P3 backlog;
- 1.0 readiness criteria;
- faction mechanical ID and migration policy;
- post-audit continuation handoff;
- native Synod contract in `docs/21-native-synod-catalog.md`;
- native Veyra contract in `docs/22-native-veyra-catalog.md`;
- bot time contract in `docs/23-bot-simulation-time-contract.md`;
- long-session history retention contract in `docs/24-long-session-history-retention.md`;
- machine-readable project status synchronized with merged PR #83.

## Current truth and limitations

- Aegis, Synod and Veyra are native and complete at the current prototype catalog depth.
- Common simulation, mission, bot and UI systems resolve faction content through the registry or mechanical roles.
- Remaining Aegis IDs in neutral pirate content are intentional because pirate planets explicitly use `factionId: aegis`.
- Bot decision cadence is canonical, serialized and catches up every overdue interval under a bounded Worker budget.
- Historical diagnostic/report collections have explicit deterministic retained windows; pending and active gameplay state is not compacted.
- complete victory/defeat, a headless balance harness and browser E2E persistence coverage are missing.
- diplomacy, coalitions, strategic stars and final endgame are missing.
- bots do not yet plan command doctrine or diplomacy.
- exotic matter has no complete spending loop.
- captured Nemexia HTML, CSS, screens and assets remain excluded from runtime and source control.

## Active six-PR stabilization route

1. **#81 — native Veyra catalog** — merged.
2. **#82 — canonical bot simulation time and deterministic catch-up** — merged.
3. **#83 — long-session state/log budgets and deterministic compaction** — merged.
4. **#84 — temporary complete victory and defeat loop**.
5. **#85 — headless balance and full-match simulation harness**.
6. **#86 — browser E2E smoke and persistence baseline**.

Do not insert diplomacy into this batch. Stabilization acceptance from `docs/20-full-project-audit.md` takes priority over metagame expansion.

## PR #84 acceptance boundary

The temporary complete match loop is delivered only when:

- terminal match state is part of canonical `GameState`, checksum and save/load migration;
- defeat is determined by deterministic empire viability rules based on existing owned planets, fleets, queues and recoverable assets;
- victory is declared only when one non-neutral playable empire remains viable;
- neutral pirate ownership does not count as a competing playable empire;
- terminal state is resolved after normal commands and due events without browser-only logic;
- player and bots can no longer mutate the simulation after the match becomes terminal, except for explicitly safe inspection/save operations outside the reducer;
- UI presents a clear victory or defeat result and final ranking/summary using existing presentation architecture;
- replay and save/load preserve the same terminal outcome;
- regression tests cover player victory, player defeat, non-terminal recovery cases, pirate exclusion and deterministic replay;
- lint, typecheck, full Vitest and production build are green.

PR #84 is a temporary playable-slice ending. It must not add diplomacy, coalitions, strategic stars, final lore/endgame, balance harness infrastructure or browser E2E tooling.

## PR #83 verification record

PR #83 passed:

- lint;
- TypeScript typecheck;
- complete Vitest suite including multi-day retention and oversized-save migration coverage;
- production build;
- final GitHub CI run #437;
- final diff review with no temporary workflow, payload chunk, lockfile, diagnostic log or unrelated file.

## Invariants

- no `Math.random()` or system clock in simulation decisions;
- UI never owns canonical game state;
- bots and player use the same commands;
- bots cannot read hidden state;
- events execute once;
- resources cannot become negative;
- fleets cannot exist in two locations;
- incompatible state changes require migration and fixtures;
- mechanical IDs follow `kind.faction.slug`;
- source assets are not runtime assets until registered and tested;
- only original or clearly licensed assets enter runtime;
- external mechanics research is reference-only.

## Workflow

Fresh branch from current `main` → focused implementation → tests/docs → PR → CI → diff review → squash merge → status update → continue the authorized batch.

Do not stack a new runtime branch on an open or abandoned branch.
