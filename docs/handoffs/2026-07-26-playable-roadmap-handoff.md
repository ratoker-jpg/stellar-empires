# PR #98 handoff — roadmap to a complete playable game

**Baseline:** merged PR #97 (`9d0cf6c542db2e4468080595d76c1ea5ad2f549a`)  
**PR type:** documentation only  
**Next implementation PR:** #99 — asset processing foundation and repository audit

## Canonical reading order after PR #98

1. `AGENTS.md`
2. `docs/17-continuation-guide.md`
3. `docs/project-status.json`
4. `docs/27-playable-game-roadmap-v5.md`
5. `docs/asset-prompts/master-runtime-asset-backlog.md`
6. `docs/25-solar-war-obelisks-gates-and-progression.md`
7. `docs/26-universe-galaxy-solar-system-navigation-contract.md`
8. `docs/research/nemexia-final-complete-game-concept-2026-07-26.md`
9. `docs/research/nemexia-navigation-and-ui-reference-2026-07-26.md`
10. latest merged GitHub PRs and actual `main`

## Current truth

- PR #96 merged the full mechanics and navigation research references.
- PR #97 merged 90 Universe PNG assets.
- The complete mechanical catalogs are delivered: 24 buildings, 22 technologies, 13 ships and 9 defences per faction, plus 13 shared Commander Ships.
- Mechanical/source bindings exist, but many final source images are still not used as optimized runtime art.
- PR #97 Universe assets are oversized and have filename-contract mismatches; they must be processed before runtime use.
- Universe/Galaxy/Solar-system runtime navigation is not yet delivered.
- Alliances, solar war, final Gates and complete victory are not yet delivered.

## PR #99 boundary

PR #99 must only establish the production asset pipeline and audit.

Required outcomes:

- complete source/runtime asset inventory;
- checksums, dimensions, alpha bounds and stable IDs;
- deterministic resize/optimization/atlas scripts;
- explicit transfer and decoded-memory budgets;
- PR #97 Universe asset size/name audit;
- contact sheets and dark/light alpha QA;
- no direct source-PNG loading in runtime;
- CI validation;
- update both roadmap and master asset backlog.

PR #99 must not implement Universe navigation or redesign gameplay mechanics.
