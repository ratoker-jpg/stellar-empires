# Handoff — navigation usability audit

## Baseline

- repository: `ratoker-jpg/stellar-empires`;
- audit branch: `agent/audit-navigation-usability-01`;
- exact baseline: post-PR #124 `main` at `cdd112c544ce8d37af17e938867d4588bedcf152`;
- runtime baseline: PR #123 `aa1dc67ed874c75aa69af30ce9ced58169793c30`;
- canonical campaign contract: `docs/25a-local-campaign-world-speed-and-offline-progression.md`;
- audit PR: #125;
- next implementation after merge: #126 only.

## Accepted batch

```text
#126 NAV-IA-PRIMARY-SHELL
→ #127 NAV-CONTEXT-ROUTE-MODEL
→ #128 NAV-CROSS-DOMAIN-FLOWS
→ #129 NAV-USABILITY-GATE
```

## Required startup reading for #126

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/audits/contracts/navigation-usability-01-prs.md`
6. `docs/audits/contracts/navigation-usability-01-route-context.md`
7. `docs/audits/evidence/navigation-usability-01-code-and-flow.md`
8. `docs/changes/pr125-navigation-usability-audit.md`
9. `docs/25a-local-campaign-world-speed-and-offline-progression.md`
10. `docs/17-continuation-guide.md`
11. `docs/project-status.json`
12. `docs/roadmap-pr-index.json`
13. current `main` and latest merged PRs.

## #126 boundary

Implement only the visible information architecture and primary shell grouping:

- group core gameplay, information/history and utility;
- promote Operations to core gameplay;
- label the Space family for the complete Universe hierarchy;
- reduce Ranking/System competition with core actions;
- preserve route-family compatibility and keyboard order;
- keep route memory/cross-domain flow implementation for #127–#128.

Do not change gameplay, commands, save schema, world speed, offline progression, balance, alliances or endgame.

## Stop rule

After #126 merges, continue only with #127 from fresh merged `main`. Do not start Audit #130 until #129 closes and archives `NAVIGATION-USABILITY-01`.
