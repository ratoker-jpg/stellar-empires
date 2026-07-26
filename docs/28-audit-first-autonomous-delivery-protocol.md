# Audit-first autonomous delivery protocol

**Status:** authoritative project workflow  
**Applies from:** PR #100  
**Owner effort required:** none for normal repository delivery

## 1. Purpose

Implementation work must no longer begin with broad exploration inside each PR. Every coherent implementation batch starts with a dedicated Audit PR that studies the complete affected surface and writes an implementation contract for the following PRs.

The required sequence is:

```text
fresh main
→ Audit PR
→ implementation PRs from the accepted audit
→ batch closure
→ next Audit PR
```

The Audit PR is a separate planning and evidence step. It is not counted as one of the implementation PRs in the batch.

## 2. Batch size by complexity

The audit determines batch size from implementation complexity, coupling and risk.

| Complexity | Normal implementation count | Use when |
|---|---:|---|
| Heavy | 1–2 PRs | schema or save migration, broad architecture replacement, high-risk simulation changes, large cross-domain work |
| Medium | 4 PRs | normal feature family with clear boundaries and several connected consumers |
| Light | 6 PRs | small, repetitive, low-risk continuations using the same established pattern |

Rules:

- four implementation PRs are the default;
- a heavy audit must not authorize more than two implementation PRs;
- a light six-PR batch is allowed only when all six use the same understood architecture and remain independently reviewable;
- mixed-complexity work is split into separate audits;
- the audit may reduce the batch when investigation reveals hidden coupling or risk;
- the assistant must not enlarge a batch merely to increase throughput.

## 3. Audit PR requirements

An Audit PR changes documentation, project-scoped analysis tooling and status entrypoints only. It does not implement the audited gameplay feature.

Before writing the audit, the assistant must reconcile:

1. current `main` and recent merged PRs;
2. `AGENTS.md` and continuation/status documents;
3. authoritative gameplay and UI contracts;
4. Graphify code graph when available;
5. GitHub code search for consumers and call sites;
6. asset manifests and runtime resolvers;
7. save schema, migrations and deterministic state;
8. player commands and bot consumers;
9. UI screens, view models and navigation;
10. tests, CI, performance and browser constraints.

Every implementation item in the audit must contain:

- stable work-item ID;
- purpose and player-visible outcome;
- verified current state;
- exact repository paths expected to change;
- important existing functions, types and registries;
- dependency and data-flow map;
- asset IDs, source paths and runtime destinations where applicable;
- player, bot, UI and reporting consumers;
- persistence and migration impact;
- deterministic and performance constraints;
- required unit, integration, headless and browser checks;
- risks and explicit non-goals;
- ordered implementation steps;
- acceptance gate;
- unresolved questions, each with a concrete verification method.

The audit must distinguish:

```text
VERIFIED       — confirmed from current code, tests or authoritative documents
INFERRED       — supported by evidence but not directly encoded
UNKNOWN        — not yet established; must not be presented as fact
DECISION       — explicit project choice made for the batch
```

Critical UNKNOWN items must be resolved before the Audit PR merges. Non-critical UNKNOWN items may remain only when the audit states why they do not block implementation.

## 4. Required audit files

### Current batch contract

```text
docs/audits/current-batch-audit.md
```

This is the single current implementation contract. A new Audit PR replaces its contents only after preserving the completed version under:

```text
docs/audits/completed/<batch-id>.md
```

### Current execution state

```text
docs/audits/current-execution-state.md
```

This is a compact recovery log. It must always state:

- batch ID and audit PR;
- active work-item and PR;
- base and head SHA when known;
- last completed atomic action;
- last successful validation;
- exact next action;
- blockers or divergence;
- whether the process is safe to continue.

It is updated after every merged implementation PR and before stopping because of a blocker.

### Permanent batch history

```text
docs/audits/batch-history.md
```

One row per audited batch records the audit PR, implementation PRs, merge SHAs, outcome and archived audit path.

## 5. Implementation rules after the audit

Each implementation PR must start from the latest merged `main` and cite its Audit PR and work-item ID.

The implementation must follow the recorded file map and dependency order. Broad project rediscovery is not repeated inside every PR. Additional investigation is allowed only when:

- current code differs from the audit baseline;
- a recorded assumption proves false;
- CI reveals an unrecorded dependency;
- a data-loss, save-compatibility, security, licensing or performance risk appears.

When implementation diverges from the audit:

1. stop expanding the change;
2. record the divergence in `current-execution-state.md`;
3. determine whether the audit can be safely amended in the current PR;
4. create a replacement Audit PR when the implementation contract is materially wrong.

Do not silently redesign the feature during implementation.

## 6. Batch closure

The last implementation PR in a batch must additionally:

- validate the combined outcome of all PRs in the batch;
- verify all acceptance gates from the audit;
- archive `current-batch-audit.md` under `docs/audits/completed/`;
- append the batch to `batch-history.md`;
- update project status and continuation instructions;
- identify the next Audit PR, not the next un-audited implementation.

## 7. Autonomous operation and no user setup

The repository owner is not required to:

- install Graphify, Node, Python or other tools;
- run commands locally;
- clone, pull or push the repository;
- create branches or PRs;
- download and re-upload generated files;
- retry CI;
- mark routine PRs ready;
- merge routine PRs.

The assistant owns normal setup, analysis, branches, commits, PRs, validation and merging within the permissions in `AGENTS.md`.

Ask the owner only for a genuinely unresolved product decision, missing legal permission, unavailable secret/credential, paid-service approval, destructive action or external action that repository automation cannot perform.

## 8. Graphify policy

Graphify is a project analysis accelerator, not the sole source of truth.

Pinned version:

```text
graphifyy==0.8.38
```

Project-scoped skill files live under:

```text
.agents/skills/graphify/
```

The repository workflow installs the Python package in an isolated CI environment. No local owner installation is required.

Audit workflow:

1. install the pinned Graphify package;
2. verify the CLI and project skill;
3. use an existing `graphify-out/graph.json` through `graphify query`, `path` and `explain` before broad file reading;
4. otherwise build or update the graph for the relevant audit scope;
5. combine Graphify results with direct source inspection and authoritative documents;
6. record graph limitations and unsupported files in the audit.

Graphify output may support an audit, but it may not override current code, tests, GitHub history or canonical project documents.

## 9. Stall and stop rule

Ordinary code, lint, type, test or build failures are defects to fix, not reasons to abandon the batch.

The assistant stops the active process when:

- the same external workflow remains queued or on the same step across three checks without observable progress;
- required repository permission or infrastructure is unavailable;
- a secret, legal permission or paid service is required;
- continuing risks data loss, save corruption or an irreversible action;
- the audit is materially invalid and safe implementation is no longer possible.

Before stopping, update `current-execution-state.md` with the exact state, evidence, failed attempts and next safe action. Do not start the next PR after a genuine stall.

## 10. Stable work-item IDs

Roadmap work is referenced by stable IDs rather than relying only on future PR numbers.

Examples:

```text
ASSET-BUILDINGS
ASSET-TECHNOLOGIES
ASSET-SHIPS
ASSET-DEFENSE-COMMANDERS
UNIVERSE-FOUNDATION
UNIVERSE-GALAXY
```

Actual PR numbers are recorded in the current audit, execution state and project status. Inserting Audit PRs must not invalidate the conceptual roadmap.
