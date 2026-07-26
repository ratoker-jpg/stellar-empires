# Execution Roadmap Stellar Empires — current entrypoint

**Status:** Superseded by roadmap v5  
**Updated:** 2026-07-26  
**Current baseline:** merged PR #97  
**Release target:** 1.0

## Authoritative roadmap

The active execution plan is:

```text
docs/27-playable-game-roadmap-v5.md
```

The permanent asset-generation and replacement register is:

```text
docs/asset-prompts/master-runtime-asset-backlog.md
```

The exact next-PR handoff is:

```text
docs/handoffs/2026-07-26-playable-roadmap-handoff.md
```

## Why v4 was superseded

The earlier roadmap ended at the complete-catalog gate and expected Universe navigation immediately after PR #95. Since then:

- PR #95 completed the ordinary and Commander catalogs;
- PR #96 added full mechanics and navigation evidence references;
- PR #97 added 90 Universe source assets;
- the source/runtime asset gap was confirmed as the immediate blocker;
- the full remaining product scope is much larger than one Universe PR and requires explicit gates through Release 1.0.

Roadmap v5 therefore starts with asset processing and integration, then delivers spatial navigation, the confirmed game shell, ordinary mechanics, PvE/meta, bot parity, alliances/endgame, balance and release readiness.

## Historical value of this file

Previous revisions of `docs/16-execution-roadmap.md` remain available in Git history. They are not authoritative for PR numbering or current implementation order.

## Non-negotiable rules

- every implementation PR starts from fresh `main`;
- lint, typecheck, full tests and production build are mandatory;
- player and bots use the same simulation commands;
- source PNGs require processing, manifests and QA before runtime use;
- procedural and CSS placeholders must be registered in the master asset backlog;
- stable mechanical IDs and save compatibility survive all visual refactors;
- `docs/25-solar-war-obelisks-gates-and-progression.md` remains authoritative for the project-specific endgame;
- confirmed Nemexia references define systemic depth and navigation flow, not permission to copy third-party HTML, CSS, prose or art.
