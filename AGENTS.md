# AGENTS.md

## Project authority

The repository owner authorizes the AI agent to manage the normal GitHub delivery workflow for this project without requesting approval for every step.

The agent may:

- create working branches;
- add and modify project files;
- commit changes;
- open and update pull requests;
- mark pull requests ready for review;
- merge pull requests into `main` after available checks pass and no known blocking issue remains;
- create follow-up pull requests required by the accepted roadmap and audit contract;
- choose the implementation batch size under the audit-first complexity rules below.

## Safety boundaries

The agent must not, without separate explicit approval:

- delete the repository;
- delete or force-rewrite `main`;
- force-push protected or shared branches;
- bypass or disable checks to force a merge;
- merge known broken, conflicting, or data-destructive changes;
- expose secrets, personal data, or assets with unclear rights;
- change repository visibility;
- create paid infrastructure or enable paid third-party services.

Documentation-only and initial infrastructure pull requests may be merged after diff review when automated checks do not yet exist.

## Source-of-truth order for every new AI session

Before planning or changing code, read these files in order:

1. `AGENTS.md`;
2. `docs/28-audit-first-autonomous-delivery-protocol.md`;
3. `docs/audits/current-execution-state.md`;
4. `docs/audits/current-batch-audit.md`;
5. `docs/17-continuation-guide.md`;
6. `docs/project-status.json`;
7. `docs/16-execution-roadmap.md`;
8. `docs/roadmap-pr-index.json`;
9. the latest merged pull requests after the `lastMergedPr` recorded in `docs/project-status.json`.

The agent must reconcile the recorded project status with actual `main` and GitHub PR history before starting work. When they disagree, actual merged GitHub state wins and the status documents must be corrected in the next safe change.

## Delivery rules

- Use a dedicated branch for each substantial task.
- Keep pull requests focused and explain scope, validation, risks, and intentional omissions.
- Update documentation in the same pull request when architecture, mechanics, data formats, audit decisions or roadmap decisions change.
- Prefer squash merge unless preserving separate commits has a concrete benefit.
- Do not perform irreversible actions when a reversible alternative exists.
- Create every dependent branch from the latest merged `main`.
- Do not claim background or asynchronous work. A requested delivery batch must be executed in the active session until completed or genuinely blocked.
- The repository owner performs no normal local setup, command execution, CI retry, branch management or routine merging.

## Audit-first delivery batches

Every coherent implementation batch requires a dedicated Audit PR before implementation begins.

The Audit PR:

- is separate from the implementation count;
- studies the complete affected code, asset, UI, bot, persistence, test and documentation surface;
- writes the verified contract to `docs/audits/current-batch-audit.md`;
- updates `docs/audits/current-execution-state.md`;
- must merge before the first implementation PR starts.

Implementation batch size is determined by the audit:

- **heavy:** one or two implementation PRs maximum;
- **medium:** four implementation PRs by default;
- **light:** six implementation PRs when the pattern is repetitive and low risk.

Mixed-complexity work must be split into separate audits. Do not expand a batch merely because more roadmap work exists.

Each implementation PR must cite its Audit PR and stable work-item ID. Broad architecture discovery should not be repeated inside every PR. Material divergence from the audit must be recorded before the implementation expands.

The last implementation PR in a batch must validate the combined outcome, archive the audit under `docs/audits/completed/`, update `docs/audits/batch-history.md`, project status and continuation instructions.

The detailed workflow is authoritative in `docs/28-audit-first-autonomous-delivery-protocol.md`.

## Graphify

The project-scoped Graphify skill is stored under `.agents/skills/graphify/` and the pinned CLI version is defined by the repository Graphify workflow.

The agent must:

- install and run Graphify itself through repository automation or its execution environment;
- never require the repository owner to install or refresh it locally;
- query an existing `graphify-out/graph.json` before broad file reading when the graph covers the current baseline;
- rebuild or incrementally update the relevant graph during Audit PR preparation;
- verify Graphify findings against current source, tests, GitHub history and canonical documents.

## Stall rule

Ordinary code, lint, type, test and build failures must be fixed by the agent.

Stop the active process only for a genuine external or safety blocker, or when the same external workflow remains on the same state across three checks without observable progress. Before stopping, update `docs/audits/current-execution-state.md` with the exact evidence and next safe action. Do not start the next PR after a genuine stall.

## Handoff and continuation requirements

After every merged PR, update `docs/project-status.json` and `docs/audits/current-execution-state.md` when the next PR number, active batch, milestone or material project state changed.

At the end of every audited batch, update `docs/17-continuation-guide.md` or its linked status section with:

- the last merged PR and merge SHA;
- the next Audit PR;
- the completed product state;
- known limitations and unresolved risks;
- the archived audit path;
- the next proposed complexity-sized implementation batch.

A new AI session must be able to continue from repository files and GitHub history without relying on private conversation memory.
