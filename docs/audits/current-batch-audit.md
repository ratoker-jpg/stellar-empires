# POST-1.0-NEXT-PRODUCT-AUDIT

**State:** complete for controller review — docs only  
**Audit baseline / exact starting `main`:** `53cf207f30f1a51f864d77f61969937e0d1ad59c`  
**Baseline source:** squash-merged PR #177 `POST-1.0-PR4-LOW-COST-QUALITY-GATES`  
**Runtime baseline:** schema v19 / save format v6  
**Migration:** none  
**Implementation authorized:** false  
**Audit PR:** #178  
**Audit branch:** `audit/post-1.0-next-product`

## Controller gate

This Audit reconciles the completed #173–#177 batch and recommends one next product batch. It does **not** authorize implementation. Keep PR #178 for controller review; do not merge it automatically and do not create implementation branches until explicit controller approval.

Evidence state:

- **CONFIRMED** — verified in current source/tests, GitHub state or generated Graphify evidence;
- **DISPROVED** — a plausible hypothesis contradicted by current evidence;
- **UNKNOWN** — insufficient evidence for an implementation contract;
- **DECISION** — bounded Stellar product choice proposed for controller approval.

Nemexia-reference classification remains `KEEP_STELLAR`, `ADAPT_FROM_NEMEXIA`, `RESEARCH`, or `REJECT`. Nemexia is reference evidence, not authority.

## Executive verdict

The highest-value next development is **not** another endgame closure, combat-correctness pass, advertised-effect sweep, quality-gate pass, broad UI redesign, scoring port or architectural refactor.

The strongest fresh product gap is narrower and player-visible:

> **The default/recommended `compressed-v1` campaign has three named bot personalities, but most core strategic planning is shared. Personality is real in cadence and PvE opportunity ordering, while economy/research/production/logistics/ordinary fleet risk and compressed planner ordering mostly remain personality-agnostic.**

This means the old blanket hypothesis “bot personalities are unused” remains **DISPROVED**, but a more precise hypothesis is **CONFIRMED**: in the recommended campaign path, strategic differentiation is materially thinner than the profile labels imply.

**Recommended single next batch:** `POST-1.0-BOT-STRATEGY-DIFFERENTIATION` — three bounded implementation PRs that reuse the existing bot profile/perception/planner/reducer architecture, add no archetypes, add no new combat engine, and require no schema/save migration.

## Phase 1 — post-merge reconciliation

GitHub truth at Audit start:

- #177 is squash-merged;
- exact merge/current `main`: `53cf207f30f1a51f864d77f61969937e0d1ad59c`;
- previous batch `POST-1.0-NEMEXIA-PARITY`: **COMPLETE**;
- last merged PR: **177**;
- active implementation PR: **none**;
- active implementation work item: **none**;
- PR5: **not authorized / does not exist**;
- schema v19;
- save format v6;
- migration none.

Post-merge prose that still described #177 as active was generated stale metadata. This Audit reconciles that state; it does not reinterpret it as authorization to repeat PR4.

## Studied surfaces

### Authority / control plane

- `AGENTS.md`
- `docs/28-audit-first-autonomous-delivery-protocol.md`
- `docs/audits/current-execution-state.md`
- `docs/audits/current-batch-audit.md`
- `docs/audits/completed/post-1.0-nemexia-parity.md`
- `docs/audits/batch-history.md`
- `docs/project-status.json`
- `docs/roadmap-pr-index.json`
- `docs/17-continuation-guide.md`
- `docs/16-execution-roadmap.md`
- `docs/29-post-1.0-nemexia-reference-roadmap.md`
- GitHub PR #177 and current PR/branch state

### Bot/product path

- `src/simulation/campaign/settings.ts`
- `src/simulation/createInitialGameState.ts`
- `src/simulation/bots/profiles.ts`
- `src/simulation/bots/scheduler.ts`
- `src/simulation/bots/perception.ts`
- `src/simulation/bots/memory.ts`
- `src/simulation/bots/progressionPhase.ts`
- `src/simulation/bots/progressionPriorities.ts`
- `src/simulation/bots/economyPlanner.ts`
- `src/simulation/bots/researchProductionPlanner.ts`
- `src/simulation/bots/colonyLogisticsPlanner.ts`
- `src/simulation/bots/fleetMissionPlanner.ts`
- `src/simulation/bots/threatRecoveryPlanner.ts`
- `src/simulation/bots/pveOperationsPlanner.ts`
- `src/simulation/bots/pveOperationsPlannerLegacy.ts`
- `tests/simulation/botScheduler.test.ts`
- `tests/simulation/botEconomyPlanner.test.ts`
- `tests/simulation/botResearchProductionPlanner.test.ts`
- `tests/simulation/botColonyLogisticsPlanner.test.ts`
- `tests/simulation/botFleetMissionPlanner.test.ts`
- `tests/simulation/botThreatRecoveryPlanner.test.ts`
- `tests/simulation/botPveOperationsPlanner.test.ts`

### Combat / information / meta / world / colony / UX

- `src/simulation/combat/fleetDoctrine.ts`
- `src/simulation/combat/types.ts`
- `src/simulation/command/commandDoctrine.ts`
- `src/ui/fleetDoctrineScreen.ts`
- `src/ui/commandDoctrineScreen.ts`
- `tests/simulation/fleetDoctrine.test.ts`
- `tests/simulation/commandDoctrine.test.ts`
- `src/simulation/reports/missionReports.ts`
- `src/ui/missionReportsPanel.ts`
- `src/simulation/intelligence/intelligenceState.ts`
- `src/simulation/galaxy/intelligenceView.ts`
- `src/ui/galaxyIntelPanel.ts`
- `src/ui/commandRanking.ts`
- `src/ui/commandRankingScreen.ts`
- `src/simulation/endgame/solarWarView.ts`
- `src/simulation/pve/spaceObjects.ts`
- `src/ui/spaceObjectsPanel.ts`
- `src/simulation/planet/specialization.ts`
- `src/simulation/economy/empireEconomy.ts`
- logistics/market consumers used by bot and player paths

### Technical / quality

- `.agents/skills/graphify/SKILL.md`
- `scripts/graphify-audit.sh`
- `.github/workflows/graphify-audit.yml`
- current CI / Browser E2E workflow state
- #177 final quality-gate evidence

## Mandatory Graphify evidence

Repository-pinned Graphify `0.8.38` ran successfully through `scripts/graphify-audit.sh code` on PR #178 Audit state:

- Graphify run #1302 / run id `32579558191` — SUCCESS;
- artifact `graphify-audit-output`, id `9477434626`;
- 456 code files, 0 docs/images in the code-only corpus;
- 3,546 nodes;
- 12,388 edges;
- 135 communities after clustering;
- graph extraction 100% extracted, three inferred edges after clustering;
- `GameState` 320 edges;
- `createInitialGameState()` 229;
- `executeCommand()` 162;
- `getFactionMechanicalRoles()` 122;
- `GameCommand` 95.

Relevant path findings, verified against source:

| Subject | Graph evidence | Audit consequence |
|---|---|---|
| `compressedCandidate()` | 11 edges; directly calls logistics, economy, research/production, fleet, threat, PvE and endgame planning | personality adaptation can be bounded at an existing orchestration seam instead of forking the simulation |
| `runBotScheduler()` | consumed by campaign time, worker and multiple simulation/audit tests | scheduler behavior is highly regression-visible; every personality change needs deterministic scenario gates |
| `BotProfile` | 23 incoming references; already consumed by scheduler/PvE/endgame paths | use the existing profile as policy input; do not persist a duplicate strategy state |
| `planBotEconomy()` | 24 edges; shared by scheduler, threat recovery and scenario runner | avoid invasive personality-specific economy forks in the first batch |
| `planBotResearchAndProduction()` | 14 edges; shared by scheduler, threat recovery and scenario runner | bias ordering through policy first; retain ordinary production/research validators |
| `planBotFleetMission()` | 18 edges; scheduler, threat recovery, E2E/runtime and integration consumers | tactical policy changes need shared mission validation and information-boundary tests |
| `planBotThreatAndRecovery()` | 11 edges | bounded risk/recovery policy is feasible without replacing the threat model |
| `createBotMemoryTimeline()` | only intelligence observations/alerts; no battle outcome adaptation path | recent win/loss response is a real gap, but can be derived from existing history rather than persisted state |
| `createUnifiedMissionReports()` | 19 edges into ranking/HUD/report UI/tests | reports are a natural player-observation surface; no new telemetry subsystem is required |
| `FleetFormation` | referenced by battle input/report, fleet state, UI and tests | combat doctrine is already a live gameplay system, not a missing engine |
| `createInitialSpaceObjects()` | creation/migration/state consumers exist | moving/lifecycle objects would touch persistence/determinism boundaries and are not a low-risk follow-up |

Graphify also reports existing import cycles around combat/unit/type and PvE space-object/world-event modules. There is no failing test, runtime defect or delivery blocker tied to those cycles, so this Audit does **not** authorize a refactor batch for architectural aesthetics.

Graphify is evidence, not authority. Community names are generic because no external LLM backend is configured; product conclusions above were verified against source and tests.

## Fresh product survey A–I

### A. Player gameplay depth — CONFIRMED / mixed

The current product already has a broad early→mid→late→terminal loop, multiple colonies, specializations, logistics, market, research, fleets, scouting, PvE, bot warfare, Solar War and final objects. #174 already proved organic endgame closure.

The strongest fresh depth issue is therefore not missing systems. It is **opponent strategy readability and differentiation**: the player can build different plans, but the three persistent opponents often feed the same core planners in the recommended profile.

### B. Bot personality / strategy — CONFIRMED gap, blanket claim DISPROVED

Current profile truth:

- Aegis → `industrial`, normal, 600s cadence / early 240s, max 2 commands;
- Synod → `explorer`, hard, 300s / early 240s, max 3;
- Veyra → `aggressive`, normal, 450s / early 240s, max 2.

Player-visible differentiation already exists:

- cadence / command budget differs;
- PvE candidate ordering is personality-specific: explorer favors anomaly/expedition, industrial favors resource objects, aggressive favors pirate hunt;
- faction catalogs/mechanical roles remain distinct.

But the recommended `compressed-v1` path uses one shared `compressedCandidate()` planner ordering. `planBotEconomy`, `planBotResearchAndProduction`, `planBotColonyLogistics`, `planBotFleetMission` and `planBotThreatAndRecovery` take `empireId`/state rather than personality policy. Ordinary attack safety uses a fixed threshold, logistics assigns the same colony-index role pattern, and bot memory summarizes intelligence rather than battle outcomes.

**Verdict:** different bots are real, but most core compressed strategy differences are cadence/faction/PvE rather than coherent opponent doctrines. This is the best leverage point for the next batch.

### C. Combat depth — broad redesign DISPROVED

Stellar already has:

- line/screen/wedge formations with real attack/armor trade-offs;
- target priorities with target-size weights;
- class skills tied to formation;
- Admiral doctrines;
- 13 commander ships and flagship ability selection;
- deterministic tests proving formation/priority changes damage and target allocation.

Therefore a new combat engine, initiative system or generic active-ability layer is not justified.

A smaller **combat-doctrine observability** gap is real: `BattleReport` retains commander IDs, attacker/defender formation and target priority, while `UnifiedMissionReport`/`missionReportsPanel` expose detailed damage breakdown but do not currently surface those doctrine choices. That is a valuable future one-PR candidate, not part of the chosen bot batch.

### D. Score / achievements / long-term meta — RESEARCH

`commandRanking.ts` already provides a native composite ranking plus colonies, resource stock, production, building/research levels, units, fleets and victories. Solar War also has its own scoreboard.

No executable Achievement subsystem was found in the current code graph. A Resource/Battle/Achievement score split or achievement checklist therefore needs an independent gameplay goal. Porting Nemexia score formulas would add vanity/accounting surface without proven decisions. Keep as RESEARCH.

### E. World / space-object depth — existing gameplay CONFIRMED, movement RESEARCH

Asteroids, gas clouds and anomalies already have specialist hull requirements, deterministic coordinates, fuel/travel, depletion, hazards, cooldowns, temporary control, contextual yield and reports. The system is meaningful, not cosmetic.

The fresh limitation is that initial space-object positions are deterministic and fixed; there is no verified moving-object/lifecycle trajectory contract. Movement could create competition and route re-evaluation, but would increase persistence, determinism and UX risk. Keep deterministic lifecycle/movement as RESEARCH until a Stellar-native product contract is approved; do not copy an unknown Nemexia formula.

### F. Economy / colony specialization — KEEP_STELLAR

Planet specialization already changes resource production, construction speed, ship speed and defense speed with explicit trade-offs. Development templates and inter-colony logistics are real. Bots assign industry/resource/military roles and maintain routes/market fallback.

No fresh evidence proves a dominant player strategy severe enough to justify broad rebalance. Do not rebalance economy from intuition alone.

### G. Intelligence / reports / information game — KEEP_STELLAR with one bounded combat-report opportunity

Galaxy intelligence distinguishes owned/current/stale/contact/unclaimed, shows observation expiry and supports target-to-mission flow. Bot attacks require current full intelligence. Unified reports include intelligence events, battle/PvE/Solar-War history, filtering, comparison and map backlinks.

Broad “information gameplay missing” is disproved. The specific doctrine-to-result explanation gap in battle reports remains a future bounded candidate.

### H. UI / UX gaps — no redesign batch

The audit found existing dedicated surfaces for doctrines, Admiral/commander ships, rankings, intelligence, reports, space objects and operations. Quality gates do not prove perfect UX, but no fresh task-level evidence supports a broad redesign.

Do not replace navigation or information architecture merely because the product is dense. Future UX work must tie to a specific decision task.

### I. Technical health — KEEP current architecture; no refactor batch

#177 already hardened reproducible install, axe, deterministic snapshot, production browser smoke and Graphify corpus. Graphify shows large shared hubs and several import cycles, but current tests/gates do not show a defect or cost that requires a refactor before player-facing work.

The bot strategy seam is existing and bounded enough to proceed without architecture cleanup. Technical work should accompany the behavior it protects, not precede it as a cosmetic refactor.

## CONFIRMED

1. #177 is merged and #173–#177 is complete.
2. Default campaign progression is `compressed-v1`.
3. Three bot personalities exist with distinct cadence/budgets.
4. Personality already affects PvE opportunity ordering; “personalities unused” is false.
5. Core compressed planner ordering is shared across personalities.
6. Economy/research/production/logistics/ordinary fleet/threat planners are largely personality-agnostic.
7. Ordinary bot attack safety is fixed rather than personality-specific.
8. Bot memory is intelligence-centric and does not model recent battle win/loss adaptation.
9. Combat doctrine, target priorities, class skills, Admiral and commander ships already affect gameplay.
10. Ranking/profile already exists as a Stellar-native composite model.
11. Space objects already provide persistent deterministic gameplay with depletion/control/hazards.
12. Colony specialization/logistics and stale intelligence/reporting are real runtime systems.
13. Current Graphify code corpus is cleanly code-only: 456 files, 3,546 nodes, 12,388 edges.

## DISPROVED

1. “The next step is PR5 from the old batch.” — false; PR5 is not authorized and #177 closed that batch.
2. “Organic endgame still needs another closure PR.” — false after #174.
3. “Combat doctrine/counters are missing.” — false; live simulation + UI + tests exist.
4. “Bot personalities are completely unused.” — false; PvE and cadence already use them.
5. “Scouting/stale intel/reporting are absent.” — false.
6. “Colonies do not specialize.” — false.
7. “Space objects are only decorative.” — false.
8. “A new quality-gate/refactor batch is required before gameplay work.” — no evidence supports it.

## UNKNOWN

1. Exact optimal numeric risk margins for each bot personality.
2. Whether long-run player win rate needs balance adjustment after personality differentiation.
3. Whether achievement layers would change player behavior enough to justify persistence/UI cost.
4. A Stellar-native moving-asteroid trajectory/lifecycle contract.
5. Whether `bankCreditEfficiencyPercent` should ever become a credit system; remains untouched.
6. Whether existing Graphify import cycles create material maintenance cost; no current defect proves it.

## Nemexia/reference classification summary

| Area | Classification | Reason |
|---|---|---|
| Core Stellar progression/endgame | `KEEP_STELLAR` | already closed and proven |
| Current combat engine/doctrines | `KEEP_STELLAR` | rich deterministic native system |
| Bot strategy differentiation | `KEEP_STELLAR` + bounded adaptation concept | use Stellar profiles/planners; no Nemexia formula is required |
| Separate Resource/Battle/Achievement scores | `RESEARCH` | native ranking exists; gameplay value unproven |
| Achievements | `RESEARCH` | no current contract; avoid vanity checklist |
| Moving/dynamic space objects | `RESEARCH` | current objects meaningful; trajectory semantics unknown |
| Colony specialization/logistics | `KEEP_STELLAR` | existing trade-offs and routes are live |
| Intelligence/report loop | `KEEP_STELLAR` | current/stale intel + report backlinks exist |
| Broad UI parity/redesign | `REJECT` for next batch | no task-level evidence |
| Nemexia credit system from Bank field | `REJECT` without new decision | source field remains UNKNOWN / UNTOUCHED |
| New initiative/ability combat engine | `REJECT` for next batch | duplicates existing depth without proven value |

No `USER_MEMORY`, `HEURISTIC` or `HYPOTHESIS` reference claim is promoted into a Stellar contract by this Audit. The chosen batch is justified by LIVE STELLAR source/tests/Graphify evidence.

## Ranked next backlog

### #1 — Bot strategy differentiation in the default campaign — RECOMMEND

**Player-visible problem:** Aegis/Synod/Veyra carry distinct labels and some distinct behavior, but default compressed campaign decisions often converge onto the same planner ordering/risk logic.

**Why now:** the game already has enough economy, fleets, intelligence, PvE and endgame depth for opponent behavior to leverage. Improving strategy differentiation compounds existing systems instead of adding another subsystem.

**Smallest viable scope:** derived personality policy; personality-sensitive compressed planner ordering; bounded tactical risk/scouting differences; recent outcome signal derived from existing battle history; deterministic multi-personality scenario gates.

**Persistence:** none expected. Policy and outcome signal are derived from existing profile/state/history.

**Main risks:** destabilizing organic progression; making one personality objectively stronger; accidentally using hidden player state; nondeterministic tie-breaking.

### #2 — Combat doctrine observability in battle reports — DEFER as next one-PR candidate

**Player-visible problem:** doctrine choices affect battle resolution, but the unified report UI does not explain which formation, target priority and commander context produced the result.

**Leverage:** data already exists in `BattleReport`; likely no schema change.

**Why not #1:** improves comprehension of one system, but does not change the strategic opposition across the whole campaign.

### #3 — Deterministic world-object lifecycle/movement — RESEARCH

**Player-visible problem:** persistent objects are meaningful but spatially static after generation, reducing route re-evaluation and competition.

**Why not now:** movement/lifecycle touches save/determinism/map/mission semantics and lacks a proved Stellar-native contract. Research first.

## Rejected / deprioritized / explicit no-action

- repeat organic late-game closure — **NO ACTION**;
- repeat combat identity correctness — **NO ACTION**;
- repeat advertised-effect cleanup — **NO ACTION**;
- second low-cost quality-gate PR — **NO ACTION**;
- broad economy rebalance — **DEFER** pending measured dominant-strategy evidence;
- broad colony redesign — **NO ACTION**;
- broad intelligence rewrite — **NO ACTION**;
- generic UI redesign — **REJECT** for next batch;
- achievement/score formula port — **RESEARCH**;
- new combat engine/initiative layer — **REJECT** for next batch;
- Bank/credit subsystem — **REJECT** without separate product evidence;
- import-cycle/module refactor — **DEFER** until a concrete defect/cost or feature unblock is demonstrated.

# Chosen single next batch

## `POST-1.0-BOT-STRATEGY-DIFFERENTIATION`

**Theme:** make the three existing opponents express distinct, understandable strategies throughout the recommended `compressed-v1` campaign by adapting existing planner decisions, not by adding new factions/archetypes or replacing the simulation.

**Dependency graph:** PR1 → PR2 → PR3. No parallel implementation is authorized by this Audit.

## Proposed PR1 — `POST-1.0-PR1-COMPRESSED-PERSONALITY-STRATEGY`

### Purpose / player-visible outcome

Make Aegis industrial, Synod explorer and Veyra aggressive affect the ordinary `compressed-v1` scheduler decision portfolio, while preserving mandatory logistics/endgame invariants and ordinary command validators.

### Verified current state

`legacyCandidatesForPersonality()` already has personality-specific source ordering; `compressedCandidate()` currently uses one shared ordering. `BotProfile` is already provided to scheduler decisions and is not persisted inside `GameState`.

### Expected files / functions

- `src/simulation/bots/profiles.ts` — bounded strategy-policy type/derivation or profile-owned policy constants;
- `src/simulation/bots/scheduler.ts` — `compressedCandidate()`, candidate ordering helpers, `runProfileDecision()`;
- focused scheduler tests in `tests/simulation/botScheduler.test.ts` and/or a new `tests/simulation/botStrategyPolicy.test.ts`.

Do not change reducer command semantics.

### Data flow

`DEFAULT_BOT_PROFILES` → derived strategy policy → `runProfileDecision()` → `compressedCandidate()` → existing planners → `selectCandidate()` → `executeCommand()`.

### Consumers

Bots directly; player observes different growth/scouting/aggression tempo through map, reports, ranking and attacks. Worker/campaign-time consumers remain unchanged.

### Persistence / schema

None. `schemaVersion=19`, save v6, no migration.

### Determinism / performance constraints

- policy is a pure function of existing profile fields;
- stable ordering/tie-breaks only;
- no randomness or wall clock;
- no extra unbounded planner loops;
- mandatory logistics/endgame actions remain ahead of personality flavor when they protect invariants/closure.

### Required gates

- focused policy/scheduler unit tests;
- existing bot scheduler/save/hidden-state tests;
- organic campaign/endgame audit tests;
- full CI + Browser E2E on exact head.

### Risks

Personality flavor could starve prerequisites or endgame participation. The implementation must distinguish **preference** from invariant-breaking priority.

### Non-goals

No new personalities, no difficulty redesign, no faction catalog rebalance, no UI redesign, no save fields.

### Ordered implementation steps

1. Encode three bounded strategy preferences using existing profile identity.
2. Refactor compressed candidate ordering to consume that policy while retaining invariant actions.
3. Add controlled fixtures where multiple valid planner actions coexist.
4. Prove personalities choose different ordinary sources in those fixtures.
5. Run organic closure/regression gates.

### Exact acceptance gate

On an equalized deterministic fixture where at least economy, fleet/scout and military/production actions are simultaneously valid, the three profiles must produce the documented personality-specific ordering, all accepted commands must pass the existing reducer validators, repeated runs/checksums must match, hidden player-state mutation must not change a bot choice, and Fresh Game→Terminal closure tests must remain green.

### Unresolved question / verification

Exact source ordering may need one fixture-driven adjustment if it starves a mandatory compressed milestone. Verify by the existing progression scenario and reject any ordering that regresses terminal closure.

## Proposed PR2 — `POST-1.0-PR2-PERSONALITY-TACTICAL-RISK`

### Purpose / player-visible outcome

Make personality visible in *how* fleets gather information, select safe targets and recover/defend — without changing battle rules.

### Verified current state

`planBotFleetMission()` and `planBotThreatAndRecovery()` currently use shared attack/recovery thresholds. Scout missions already precede attacks inside the ordinary fleet planner, attacks require current full intel, and all commands go through shared mission/reducer validation.

### Expected files / functions

- strategy policy definition from PR1;
- `src/simulation/bots/fleetMissionPlanner.ts` — `missionPlan()`, scout/attack ranking and policy input;
- `src/simulation/bots/threatRecoveryPlanner.ts` — `assessTargets()`, `threatLevel()`/action selection policy input where bounded;
- focused `botFleetMissionPlanner.test.ts` and `botThreatRecoveryPlanner.test.ts` fixtures;
- scheduler integration tests.

### Data flow

`BotProfile` → derived policy → perception/current intel → fleet/threat planner → shared `getMissionAvailability()`/production validators → scheduler → reducer.

### Player/bot/UI/report consumers

No new UI contract. Player observes Explorer refreshing uncertain/stale targets more strongly, Industrial preserving safer assets/recovery, Aggressive accepting the highest still-bounded safe attack opportunity. Existing reports/intelligence show resulting actions.

### Persistence / schema

None.

### Determinism / performance

Stable sort keys and integer thresholds only; no random personality roll; no access to hidden opponent data; no second combat simulation inside planning.

### Required gates

- current/stale/full-intel boundary tests;
- policy-specific target/risk fixtures;
- mission validator tests;
- hidden-state invariance;
- scheduler determinism/save round-trip;
- full CI/Browser.

### Risks

Too-wide risk margins can produce passive Industrial or suicidal Aggressive behavior. Numeric thresholds are product tuning, not Nemexia formulas.

### Non-goals

No combat-engine changes, no fleet formation redesign, no new intel level, no new ship role.

### Ordered steps

1. Thread PR1 policy into fleet/threat planners without duplicating state.
2. Parameterize only existing scout/target/risk decisions.
3. Add symmetric fixtures that vary policy while holding information/forces constant.
4. Confirm all selected commands remain ordinary and validated.
5. Calibrate within existing campaign-performance budget.

### Exact acceptance gate

For the same deterministic military/intelligence fixture, Explorer must prefer a valid information-gathering action when actionable intel is stale/incomplete, Aggressive must accept at least one marginal-but-bounded target that Industrial rejects, Industrial must still attack clearly favorable fully known targets, and no personality may attack without current full intelligence or bypass `getMissionAvailability()`/reducer validation. All outcomes must be seed/order deterministic.

### Unresolved question / verification

Exact numeric safety margins are **UNKNOWN**. Determine the smallest integer-permille separation that satisfies the controlled fixtures and does not materially regress campaign completion/performance; document chosen constants in implementation PR evidence.

## Proposed PR3 — `POST-1.0-PR3-BOT-OUTCOME-ADAPTATION-GATE`

### Purpose / player-visible outcome

Give the existing personalities bounded response to recent wins/losses so opposition changes after combat instead of returning immediately to a static policy, then prove player-visible differentiation across a scenario matrix.

### Verified current state

Battle reports/history are already in `GameState`; bot memory currently summarizes intelligence observations/alerts, not own battle outcomes. New persisted memory is therefore unnecessary for a first bounded adaptation.

### Expected files / functions

- new bounded helper such as `src/simulation/bots/outcomeSignals.ts` (name may vary, contract must not);
- `src/simulation/bots/scheduler.ts` and/or `threatRecoveryPlanner.ts` to consume a derived recent-outcome signal;
- tests for signal derivation, save/load equivalence and scenario behavior;
- existing report/event types only unless a missing read-only helper is required.

### Data flow

existing deterministic `eventLog` / `BATTLE_REPORT` history → derived per-empire recent outcome signal → strategy policy adjustment → existing planner choices. No write-back state.

### Consumers

Bots change posture; player observes recovery/caution after losses and return toward baseline after stabilization through reports/map/ranking. No new telemetry panel is required.

### Persistence / schema

None. Derive from existing saved history. If implementation discovers that required history is not persisted/reliably bounded, STOP and return to controller rather than adding schema implicitly.

### Determinism / performance

Use a bounded recent-history window; stable chronological/id ordering; O(bounded history) planner overhead; no wall-clock time; save/load must derive the same signal.

### Required gates

- recent-win/loss signal unit tests;
- save/load and partition determinism;
- player-hidden-information boundary;
- three-personality scenario matrix;
- organic Fresh Game→Terminal;
- full CI, Graphify, Browser E2E, production smoke.

### Risks

Feedback loops can amplify imbalance or make behavior oscillate. Adaptation must be bounded and decay/return to baseline using existing game-time/history, not permanent hidden state.

### Non-goals

No reinforcement learning, no long-term generated memory, no new persisted AI state, no personality count increase.

### Ordered steps

1. Derive a bounded recent outcome summary from existing battle history.
2. Prove save/load and ordering determinism.
3. Apply a small policy modifier after losses/wins.
4. Add controlled loss→recovery and win→baseline scenarios for all personalities.
5. Run campaign/performance/browser closure gates.

### Exact acceptance gate

Given identical saved state/history, outcome signal and next bot decisions must be identical before/after save-load and across event-array order normalization; a recent meaningful loss must move the affected bot toward a safer/recovery action relative to its baseline when such an action is valid; after the bounded window no longer contains the loss, the same profile must return to baseline policy. The three-profile scenario matrix must retain distinct behavior without preventing organic terminal closure or exceeding existing campaign performance gates.

### Unresolved question / verification

The minimum useful history window is UNKNOWN. Start with the smallest bounded number of own resolved battles that can satisfy loss/recovery fixtures; do not use elapsed real time or add persisted counters.

## Schema / save assessment

Chosen batch target:

- schema: remain v19;
- save format: remain v6;
- migration: none;
- strategy policy: derived from existing `BotProfile`;
- outcome adaptation: derived from already persisted game history.

**Stop condition:** if any proposed PR discovers that a required player-visible contract cannot be implemented honestly without new persisted state, it must stop and return to controller with a migration proposal. This Audit does not pre-authorize schema/save changes.

## Intentional non-goals

- no runtime changes in PR #178;
- no implementation branch from this Audit;
- no PR5 continuation of the closed batch;
- no Nemexia formula port;
- no fourth/eighth bot archetype;
- no combat engine redesign;
- no achievements/score-layer implementation;
- no moving asteroid implementation;
- no economy-wide rebalance;
- no broad UI redesign;
- no tooling/dependency/workflow change;
- no Bank/credit system.

## Material divergence

The Audit intentionally diverges from the old reference roadmap ordering. After #174–#177, several former high-priority risks are closed or disproved. Fresh evidence moves bot personality/strategy from a vague parity hypothesis to the strongest bounded product opportunity, while scoring, achievements and moving space objects remain RESEARCH.

The chosen batch is Stellar-native. It may resemble strategy differentiation seen in other 4X/browser games, but its contract comes from current `BotProfile`, scheduler/planner behavior, current information boundaries and deterministic reducer semantics — not from unverified Nemexia behavior.

## Exact-head validation contract

After the final docs/control-plane commit, PR #178 must have fresh exact-head:

- CI — SUCCESS;
- Graphify audit — SUCCESS;
- Browser E2E — SUCCESS;
- production smoke inside Browser E2E — SUCCESS;
- unresolved review threads — 0;
- mergeable — true.

Only then mark PR #178 Ready for review. **Do not merge. Do not create implementation branches.**
