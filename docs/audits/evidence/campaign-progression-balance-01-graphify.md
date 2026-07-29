# CAMPAIGN-PROGRESSION-BALANCE-01 — Graphify evidence

**Status:** VERIFIED  
**Graph source:** final green PR #132 head `67cca4da2c401d2d9f5573e8c463dbbb570204d5`  
**Workflow:** `30488370908`  
**Artifact:** `graphify-audit-output` · digest `sha256:ce271f381f6cbf5591cb77475462703427465b56aa6a054fdc439ed112e10894`

Only documentation changed between the graph head and the audit baseline, so the graph matches current `src` and pre-audit `tests`.

## Corpus

```text
2,550 nodes
8,349 edges
107 communities
100% extracted nodes
```

## High-impact abstractions

| Node | Connections | Audit implication |
|---|---:|---|
| `GameState` | 231 | progression identity must be deterministic state, not an untracked UI/global constant |
| `createInitialGameState()` | 135 | default profile, migration and replay creation have broad test/runtime impact |
| `executeCommand()` | 94 | all player/bot progression actions converge through shared command validation |
| `getFactionMechanicalRoles()` | 70 | buildings/research/ships/defences and bot priorities depend on one role registry |
| `GameCommand` | 65 | no new privileged balance command path is justified |
| `getUnitDefinition()` | 63 | unit profile selection affects fleets, production, combat and reports |
| `PlanetState` | 61 | economy, queues, capacities and levels are tightly coupled |
| `ResourceCost` | 51 | costs are consumed across economy, UI, bots, missions and tests |

## Relevant communities

Graph communities confirm that progression is not isolated to catalog constants:

- economy/planet accrual and starting-state creation;
- UI development gateways and command application;
- faction mechanical catalog registry and `CampaignSettings`;
- bot economy planning and building affordability;
- research effects and intelligence/fleet consumers;
- fleet travel, rewards, combat/debris and mission reports;
- persistence validation and migrations;
- application bootstrap and new-game setup;
- HUD capacity/warning presentation;
- command/Commander progression.

## Hidden coupling requiring explicit handling

### Static catalog construction

Current building, research, ship and defence catalogs are materialized globally per faction. Their definitions contain max levels, requirements, base costs and base seconds. A campaign-specific progression profile cannot be implemented only inside one calculator while UI and bots continue reading static legacy definitions.

The implementation must provide profile-aware definition lookup or profile-resolved catalogs consistently to:

- command validators;
- player UI/view models;
- bot planners;
- queue creation;
- summaries and estimates;
- tests and audit gates.

### Persistence and replay

`CampaignSettings` is connected to state creation, save validation, migration, setup and runtime bootstrap. A progression profile changes deterministic command outcomes, therefore it belongs in immutable campaign identity and checksum/replay inputs.

Existing schema-v15 saves cannot silently inherit compressed values without altering old replay/save semantics. The accepted design requires schema v16 with explicit profile migration.

### Bots and campaign convergence

Graph paths show bot planners call shared building/research/unit commands. This preserves fairness, but the fixed planner priorities do not guarantee reaching colonization, planet-destroyer or eventual endgame milestones. Profile-aware values alone are insufficient; bots require deterministic phase-aware priorities while still using ordinary commands.

### UI and diagnostics

The same definition values appear in development cards, queue estimates, requirement messages, HUD capacities and system/save campaign identity. Profile identity and resolved values must be visible and testable; no UI-local division or display-only override is allowed.

## Complexity decision

The batch is **heavy** because it changes deterministic campaign identity and crosses:

- schema/save migration;
- static catalog resolution;
- all progression command validators;
- economy and rewards;
- player and bot consumers;
- UI estimates and setup/save presentation;
- replay/checksum expectations;
- full campaign-duration gates.

Per repository batch-sizing rules, heavy work is authorized as exactly **two implementation PRs**.

## Graphify limitations

Graphify establishes relationships, not balance correctness. Numeric targets come from the source-importing audit measurement tests and must later be verified through deterministic headless campaign gates and Browser E2E.
