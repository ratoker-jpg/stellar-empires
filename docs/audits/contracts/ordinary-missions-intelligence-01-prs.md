# ORDINARY-MISSIONS-INTELLIGENCE-01 — implementation PR contract

**Audit PR:** #116  
**Baseline:** `da1b3c943107ab13a003d5eb9bb084a229bdb51c`  
**Complexity:** medium  
**Implementation count:** four

## Shared invariants

- Start every PR from latest merged `main`.
- Cite Audit #116 and the stable work-item ID.
- No new mission enum value, schema version or migration.
- Existing reducer and commands remain authoritative.
- Player and bots use the same mission-rule result and intelligence limits.
- Specialized Expedition/Space Object commands stay separate.
- No destruction, alliances, solar war or endgame work.

## #117 — MISSION-RULES-REGISTRY

### Purpose

Replace duplicated mission availability with one pure registry/selector used by command validation, Fleet UI and bots.

### Expected paths

Primary:

```text
src/simulation/fleets/missionRules.ts                 new
src/simulation/fleets/flightCommands.ts
src/simulation/fleets/flightCalculations.ts
src/simulation/fleets/types.ts                        type-only if needed
src/simulation/factions/factionResearchEffects.ts
src/simulation/galaxy/intelligenceView.ts
src/ui/fleetOperationsWorkspace.ts
src/ui/fleetComposerViewModel.ts
src/ui/shellContextPanel.ts
```

Tests/docs:

```text
tests/simulation/missionRules.test.ts                 new
tests/simulation/fleets.test.ts
tests/ui/fleetComposerViewModel.test.ts
tests/e2e/appShellOperations.spec.ts
docs/changes/pr117-mission-rules-registry.md
```

### Required API shape

Naming may vary, but the boundary must expose equivalents of:

```ts
type OrdinaryMissionKind = 'transport' | 'deploy' | 'scout' | 'attack' | 'recycle' | 'colonize';
interface MissionAvailability {
  readonly allowed: boolean;
  readonly code: MissionAvailabilityCode;
  readonly message: string;
  readonly estimate?: FlightEstimate;
  readonly slotCapacity: number;
  readonly slotUsed: number;
  readonly target: RedactedMissionTarget | null;
}
```

### Acceptance

- exact mission matrix and stable reasons;
- flight slots enforced in reducer;
- UI displays the same reasons and never raw owner data;
- bots can call the same pure rule without mutating state;
- no schema/save change.

## #118 — ESPIONAGE-COUNTERINTELLIGENCE

### Purpose

Make the existing scout mission a complete deterministic ordinary intelligence action.

### Expected paths

```text
src/simulation/intelligence/resolveScout.ts
src/simulation/intelligence/intelligenceState.ts
src/simulation/intelligence/types.ts                 no new required persisted field
src/simulation/fleets/flightCommands.ts
src/simulation/fleets/missionRules.ts
src/simulation/history/stateHistory.ts               limits unchanged unless evidence requires lower bound
src/simulation/units/shipCapabilities.ts
tests/simulation/intelligence.test.ts
tests/simulation/fleets.test.ts
tests/simulation/determinism.test.ts
tests/storage/saveFormat.test.ts
docs/changes/pr118-espionage-counterintelligence.md
```

### Acceptance

- exactly one scout-role ship and zero cargo;
- relative level-1/2/3 report tier;
- deterministic cooldown boundary;
- deterministic detection using recorded formula;
- detected probe removed, observation and alert retained;
- undetected probe returns;
- old schema-v14 saves parse/serialize unchanged;
- identical seed/state/sequence produces identical result.

## #119 — INTELLIGENCE-REPORTS-PRESENTATION

### Purpose

Expose the shared mechanics through the routed shell without leaking hidden intelligence.

### Expected paths

```text
src/simulation/intelligence/incomingFlights.ts       new expected selector
src/simulation/reports/missionReports.ts
src/ui/appShellRoute.ts
src/ui/reportsWorkspace.ts
src/ui/fleetOperationsWorkspace.ts
src/ui/fleetComposerViewModel.ts
src/ui/globalHudViewModel.ts
src/ui/globalHud.ts
src/ui/shellContextPanel.ts
src/styles/operationsRoutes.css or focused existing/new route CSS
tests/simulation/missionReports.test.ts
tests/simulation/missionReportMapBacklink.test.ts
tests/ui/appShellRoute.test.ts
tests/e2e/appShellFullGate.spec.ts
docs/changes/pr119-intelligence-reports-presentation.md
```

### Acceptance

- `#/reports/intelligence` parse/serialize/history/reload;
- observer and defender reports derived from existing state;
- exact map backlink;
- incoming contact thresholds enforced;
- Fleet composer candidates and labels are redacted;
- route changes and filters are checksum-neutral;
- keyboard and release viewports pass.

## #120 — MISSION-INTELLIGENCE-BOT-GATE

### Purpose

Complete honest bot use and validate the combined ordinary mission/intelligence loop.

### Expected paths

```text
src/simulation/bots/perception.ts
src/simulation/bots/fleetMissionPlanner.ts
src/simulation/bots/reasonCodes.ts or existing reason surfaces
src/runtime/BotRuntimeScheduler.ts                   only if planner diagnostics require wiring
src/testing/e2eRuntime.ts
tests/simulation/botPerception.test.ts
tests/simulation/botFleetMissionPlanner.test.ts
tests/simulation/botRuntimeScheduler.test.ts
tests/integration/ordinaryMissionIntelligenceLoop.test.ts  new expected
tests/e2e/ordinaryMissionIntelligence.spec.ts         new expected
docs/audits/completed/ordinary-missions-intelligence-01.md
docs/audits/batch-history.md
docs/audits/current-batch-audit.md
docs/audits/current-execution-state.md
docs/17-continuation-guide.md
docs/project-status.json
docs/roadmap-pr-index.json
docs/changes/pr120-mission-intelligence-bot-gate.md
```

### Acceptance

- bot plans use only owned state, public contacts, observations and alerts;
- no attack before current full intelligence;
- slot/cooldown/fuel failures have observable reason codes;
- deterministic headless scout→attack loop passes through save/load;
- complete existing + new Browser E2E passes;
- Graphify passes;
- Audit #116 is archived and batch status is completed;
- next action is a new Audit PR, not an unaudited implementation.

## Divergence rule

Stop expansion and update `current-execution-state.md` when implementation requires any of:

- a new persisted mission/event/report field;
- schema v15 or migration;
- new mission kind;
- demolition/destruction or alliance relationship;
- changing combat/plunder balance outside this contract.

Material divergence requires an amended or replacement Audit PR.
