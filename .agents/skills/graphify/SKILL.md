---
name: graphify
description: Use for Stellar Empires codebase architecture, relationships, consumers, dependency paths and audit preparation. Query an existing graph before broad rereading; build or update the graph autonomously when it is missing or stale.
---

# Graphify — Stellar Empires project skill

## Required behavior

For questions about repository architecture, data flow, file relationships, call sites or feature consumers:

1. check for `graphify-out/graph.json`;
2. when it exists and matches the current baseline, use `graphify query`, `graphify path` or `graphify explain` first;
3. when it is absent or stale, run the repository-owned automation through `scripts/graphify-audit.sh`;
4. verify graph findings against current source, tests, GitHub history and canonical project documents;
5. record important paths and limitations in the active Audit PR.

## Repository runner

```bash
bash scripts/graphify-audit.sh code
```

The runner:

- installs the version pinned in `.graphify-version` without owner involvement;
- validates this committed project-scoped skill;
- builds a directed code-only graph for `src` and `tests` without an external model key;
- writes `graphify-out/graph.json` and `graphify-out/GRAPH_REPORT.md`;
- fails when installation or graph generation is incomplete.

## Audit use

Every dedicated Audit PR must use Graphify as one evidence source for:

- important modules and hubs;
- import and call paths;
- domain-to-UI consumers;
- player and bot consumers;
- tests covering the target surface;
- hidden coupling that changes batch complexity.

Graphify is not authoritative over current code, tests or accepted documents. Mark claims as `VERIFIED`, `INFERRED` or `UNKNOWN` under `docs/28-audit-first-autonomous-delivery-protocol.md`.

## Owner-effort rule

Never instruct the repository owner to install Graphify, run the script, download artifacts or refresh the graph. The assistant and GitHub Actions own those steps.
