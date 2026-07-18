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
- create follow-up pull requests required by the accepted roadmap;
- choose whether a normal delivery batch contains six, seven, or eight sequential pull requests under the rules below.

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
2. `docs/17-continuation-guide.md`;
3. `docs/project-status.json`;
4. `docs/16-execution-roadmap.md`;
5. `docs/roadmap-pr-index.json`;
6. the latest merged pull requests after the `lastMergedPr` recorded in `docs/project-status.json`.

The agent must reconcile the recorded project status with actual `main` and GitHub PR history before starting work. When they disagree, actual merged GitHub state wins and the status documents must be corrected in the next safe change.

## Delivery rules

- Use a dedicated branch for each substantial task.
- Keep pull requests focused and explain scope, validation, risks, and intentional omissions.
- Update documentation in the same pull request when architecture, mechanics, data formats, or roadmap decisions change.
- Prefer squash merge unless preserving separate commits has a concrete benefit.
- Do not perform irreversible actions when a reversible alternative exists.
- Create every dependent branch from the latest merged `main`.
- Do not claim background or asynchronous work. A requested delivery batch must be executed in the active session until completed or genuinely blocked.

## Delivery batch size

The standard autonomous delivery batch is **six sequential pull requests**.

The agent should normally:

1. select six focused roadmap items that form one coherent product step;
2. create, validate, and merge them sequentially;
3. start each dependent branch from the latest merged `main`;
4. fix CI, type, lint, test, and build failures without asking the owner to intervene;
5. update continuation/status documents at the end of the batch.

The agent may autonomously extend a batch to **seven or eight pull requests** without asking for permission when all of the following are true:

- the additional roadmap items are direct continuations of the same product step;
- the dependencies are already clear after the sixth PR;
- `main` and CI are stable;
- each additional PR remains independently reviewable;
- there is no unresolved architecture, data-loss, licensing, or external-service question;
- extending the batch reduces handoff overhead without creating an oversized or mixed PR.

The agent should prefer eight over six only when the extra two PRs are low-risk continuations, not merely because more roadmap items exist.

A normal batch must not stop at four or five PR merely because an old minimum was reached. It may stop below six only when:

- the current roadmap phase genuinely ends with fewer items;
- the owner explicitly requests a smaller batch;
- a genuine external or safety blocker is reached.

Ordinary code defects are not blockers. Missing secrets or permissions, unavailable infrastructure, licensing constraints, data-loss risk, paid-service requirements, or another action outside the granted authority are blockers.

## Handoff and continuation requirements

After every merged PR, update `docs/project-status.json` when the next PR number, active batch, milestone, or material project state changed.

At the end of every batch, update `docs/17-continuation-guide.md` or its linked status section with:

- the last merged PR and merge SHA;
- the next roadmap PR;
- the completed product state;
- known limitations and unresolved risks;
- the next standard six-PR batch;
- optional seventh and eighth PRs, if they are already safe extensions.

A new AI session must be able to continue from repository files and GitHub history without relying on private conversation memory.

The detailed workflow is defined in `docs/14-delivery-batches.md`.
