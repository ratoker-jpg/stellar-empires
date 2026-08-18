# Execution Roadmap Stellar Empires — current entrypoint

**Status:** Audit #157 `COMPLETE-ENDGAME-02` merged; PR #158 `FINAL-OBJECT-FOUNDATION` implemented and awaiting exact-head closure gates  
**Updated:** 2026-08-18  
**Verified main:** `7750cdb83b58e95f790351b306e9cf5b344bd780`  
**Last merged PR:** #157 `COMPLETE-ENDGAME-02` Audit  
**Runtime on `main`:** schema v18 / save format v5  
**Runtime delivered by #158:** schema v19 / save format v6

## Authoritative files

```text
AGENTS.md
docs/28-audit-first-autonomous-delivery-protocol.md
docs/audits/contracts/complete-endgame-02.md
docs/audits/evidence/complete-endgame-02.md
docs/audits/current-execution-state.md
docs/audits/current-batch-audit.md
docs/project-status.json
docs/roadmap-pr-index.json
docs/27-playable-game-roadmap-v5.md
```

## Closed M8 stage 1

```text
#152 COMPLETE-ENDGAME-01 Audit d777a619109d4a9bfc8e5129bf4c525f3327b9b6
→ #153 c567675c506d55a14a73757afa80c704fb079fc7
→ #154 b62d8b739c27cf1616b33302886e565d88c04a42
→ #155 a5c72562200c2a6dfdc49f1e4f07e8a869a6558d
→ #156 c2fcaf39402392f0ebbad297d88f9689f4165e4c
```

Stage 1 is complete with divergence **none**. It delivers optional alliance/solo participation, deterministic Solar War, canonical Operations/Reports/HUD presentation and exact three-faction 48-hour partition closure.

## Active stage 2 — COMPLETE-ENDGAME-02

Audit #157 closed all critical unknowns and was squash-merged as:

`7750cdb83b58e95f790351b306e9cf5b344bd780`

It authorizes exactly this sequential implementation chain:

```text
#158 FINAL-OBJECT-FOUNDATION
→ #159 FINAL-GATE-VULNERABILITY
→ #160 TERMINAL-RUNTIME-UX
→ #161 ENDGAME-TERMINAL-GATE
```

No fifth implementation PR is authorized. Each next PR may start only after the previous one is squash-merged and the generated fresh `main` SHA is verified.

## PR #158 delivered scope

`FINAL-OBJECT-FOUNDATION` contains only the accepted foundation:

- schema v19/save v6 with controlled v18/v5 migration;
- persisted final-project state and ongoing campaign result;
- strict malformed-current-state rejection;
- positive Solar War qualification snapshot;
- qualified ordinary Obelisk construction while direct Gate queueing stays locked;
- immutable solo/alliance project cohort;
- dedicated metal/crystal/gas contributions;
- exact existing level-1 Gate funding target;
- fully funded transition into the ordinary Gate build queue and `BUILDING_COMPLETE` path;
- bounded project/contribution history and deterministic three-faction × solo/alliance acceptance coverage;
- campaign-time hot-path optimizations needed to preserve the permanent performance gates without changing ordering, semantics or thresholds.

Still reserved for later PRs:

- #159: Gate vulnerability, stabilization event scheduling and ordinary ATTACK/planet-destroyer destruction/rebuild path;
- #160: immutable terminal result, exact freeze/runtime backlog/autosave behavior and terminal UX;
- #161: complete three-faction × solo/alliance terminal integration/closure evidence.

Bot final-object planning/perception remains deferred to `COMPLETE-ENDGAME-03`.

## Permanent boundary

- no new final-building catalogs/assets or meta currency;
- no alliance treasury or transport widening for contributions;
- no separate final-object combat engine;
- no post-victory sandbox in Stage 2;
- no bot endgame planner/perception in `COMPLETE-ENDGAME-02`;
- no multiplayer, seasons, global rebalance or M9 work;
- progression, deterministic partition equality, Browser E2E, Graphify and `<15 s` / `<30 s` campaign performance gates remain mandatory on each exact final head.

## Immediate action

```text
finish exact-head #158 CI / Browser / Graphify / performance / review gates
→ squash-merge #158 with expected_head_sha
→ verify generated fresh main SHA
→ create #159 FINAL-GATE-VULNERABILITY only from that exact main
→ continue sequentially through #160 and #161
```
