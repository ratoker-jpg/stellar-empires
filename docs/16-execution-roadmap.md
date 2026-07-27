# Execution Roadmap Stellar Empires — current entrypoint

**Status:** roadmap v5 active; Audit PR #111 defines the current implementation batch  
**Updated:** 2026-07-27  
**Current baseline:** merged PR #110, SHA `8e9e848b0725c52263ff7e310bc9d899a81554c4`  
**Release target:** 1.0

## Authoritative roadmap

The product roadmap remains:

```text
docs/27-playable-game-roadmap-v5.md
```

The active audit-first implementation contract is:

```text
docs/audits/current-batch-audit.md
docs/audits/contracts/coherent-ui-shell-01-prs.md
docs/audits/contracts/coherent-ui-shell-01-route-layout.md
```

The machine-readable PR sequence is:

```text
docs/roadmap-pr-index.json
```

The permanent asset-generation and replacement register is:

```text
docs/asset-prompts/master-runtime-asset-backlog.md
```

## Reconciled delivered state

Since the original roadmap-v5 baseline after PR #97:

- PR #101–#105 completed catalog runtime-art integration;
- PR #106 audited the Universe-navigation batch;
- PR #107 processed and registered the Universe source pack;
- PR #108 delivered schema v14 and canonical spatial coordinates;
- PR #109 delivered Universe → Galaxy → Solar-system routes and views;
- PR #110 delivered action gates, mission target handoff, report backlinks, semantic overlays and Browser E2E.

The former roadmap milestone numbering is historical planning, not a reservation of exact PR numbers. GitHub history and the current accepted audit always override stale future numbers.

## Current audited sequence

Audit PR #111 defines medium batch `COHERENT-UI-SHELL-01`:

```text
#111 Audit COHERENT-UI-SHELL-01
→ #112 UI-SHELL-RUNTIME-ROUTER
→ #113 UI-SHELL-DEVELOPMENT-WORKSPACES
→ #114 UI-SHELL-FLEET-OPERATIONS-WORKSPACES
→ #115 UI-SHELL-COMMAND-SYSTEM-GATE
```

Implementation must not begin before #111 merges. Each implementation PR starts from fresh merged `main` and contains only its recorded work item.

## Why the coherent shell is next

The simulation and feature screens are broad enough, but the presentation is still fragmented:

- `src/main.ts` manually mounts many independent screens;
- unrelated screens depend on Planet presentation state to execute commands;
- several primary domains are modal-only;
- feature modules insert navigation buttons dynamically;
- some implemented primary screens still have disabled static HUD buttons;
- only Space Map has canonical browser URL/history restoration.

Adding alliances, solar war or more ordinary mechanics before this shell would increase navigation debt and reduce testability of the full player loop.

## Work intentionally deferred

The current batch does not include:

- alliances or diplomacy;
- solar attack/support/destruction/rebuilding;
- Solar Crystals, Obelisks or Gates;
- victory/defeat;
- new missions, combat rules or balance changes;
- schema migration;
- full mobile redesign;
- framework migration.

These require later dedicated Audit PRs.

## Non-negotiable rules

- every implementation PR starts from fresh `main`;
- every coherent batch begins with an accepted Audit PR;
- lint, typecheck, full tests, production build, Browser E2E and Graphify are mandatory;
- player and bots use the same simulation commands;
- route and presentation state stay outside `GameState` and saves;
- simulation remains independent from DOM and Phaser;
- source PNGs require processing, manifests and QA before runtime use;
- procedural and CSS placeholders stay registered in the master asset backlog;
- stable mechanical IDs and save compatibility survive presentation refactors;
- `docs/25-solar-war-obelisks-gates-and-progression.md` remains authoritative for future project-specific endgame;
- confirmed Nemexia references define systemic depth and information architecture, not permission to copy third-party HTML, CSS, prose or art.
