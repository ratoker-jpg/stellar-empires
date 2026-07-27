# PR #111 — audit the coherent game shell batch

## Type

Documentation and status-only Audit PR. No runtime implementation.

## Baseline

Merged PR #110, SHA `8e9e848b0725c52263ff7e310bc9d899a81554c4`.

## Decision

The next product batch is `COHERENT-UI-SHELL-01`, a medium four-PR presentation package:

```text
#112 UI-SHELL-RUNTIME-ROUTER
→ #113 UI-SHELL-DEVELOPMENT-WORKSPACES
→ #114 UI-SHELL-FLEET-OPERATIONS-WORKSPACES
→ #115 UI-SHELL-COMMAND-SYSTEM-GATE
```

The audit intentionally schedules the coherent shell before alliances, solar war or additional mechanics.

## Verified reasons

- `src/main.ts::bootstrap()` directly calls 26 UI mount/apply functions;
- unrelated screens currently execute accepted commands through Planet presentation state;
- at least sixteen primary screens are top-level dialog/workspace dialogs;
- eight feature modules insert primary navigation buttons dynamically;
- several implemented primary screens still correspond to disabled static HUD buttons;
- only Space Map has canonical browser URL/history restoration;
- no save-schema change or new gameplay command is required.

## Contract written

- `docs/audits/current-batch-audit.md`;
- `docs/audits/contracts/coherent-ui-shell-01-prs.md`;
- `docs/audits/contracts/coherent-ui-shell-01-route-layout.md`;
- `docs/audits/evidence/coherent-ui-shell-01-graphify.md`.

## Status reconciliation

This PR also updates:

- project status;
- execution state;
- continuation guide;
- permanent batch history;
- roadmap PR index;
- execution-roadmap entrypoint;
- canonical roadmap v5 milestone status.

Stale future PR reservations are removed. M2 Navigable Universe is recorded as completed by #110. M3 Coherent Full UI Shell is recorded as Audit #111 with planned implementation #112–#115.

## Scope boundaries

Not included:

- runtime code changes;
- schema or migration changes;
- gameplay commands or balance changes;
- alliances/diplomacy;
- solar war, Obelisks, Gates or victory;
- framework migration;
- complete mobile redesign;
- copied Nemexia HTML, CSS, prose, branding or assets.

## Acceptance

- documentation/status-only diff;
- critical unknowns: zero;
- CI passes;
- fresh Graphify passes;
- no generated Graphify output or temporary diagnostics in the diff;
- merge before PR #112 starts.
