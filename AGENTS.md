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
- create follow-up pull requests required by the accepted roadmap.

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

## Delivery rules

- Use a dedicated branch for each substantial task.
- Keep pull requests focused and explain scope, validation, risks, and intentional omissions.
- Update documentation in the same pull request when architecture, mechanics, data formats, or roadmap decisions change.
- Prefer squash merge unless preserving separate commits has a concrete benefit.
- Do not perform irreversible actions when a reversible alternative exists.

## Delivery batches

Normal autonomous work is organized into sequential batches of at least four pull requests.

For each batch, the agent should:

1. define 4–6 focused changes that advance one roadmap goal;
2. create, validate, and merge each pull request sequentially;
3. start every dependent branch from the latest merged `main`;
4. fix CI, test, type, lint, and build failures without asking the owner to intervene;
5. continue until at least four pull requests are merged or a genuine external or safety blocker is reached.

Ordinary code defects are not blockers. A batch may stop early only for missing secrets or permissions, unavailable infrastructure, licensing constraints, data-loss risk, paid-service requirements, or another action outside the authority granted above.

The detailed workflow is defined in `docs/14-delivery-batches.md`.
