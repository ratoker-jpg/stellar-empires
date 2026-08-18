# Current audit boundary

**Status:** Audit PR #157 `COMPLETE-ENDGAME-02` squash-merged; #158 implementation complete and awaiting exact-head validation  
**Updated:** 2026-08-18  
**Audit squash / fresh `main`:** `7750cdb83b58e95f790351b306e9cf5b344bd780`  
**Current runtime on `main`:** schema v18 / save format v5  
**Current runtime on PR #158:** schema v19 / save format v6  
**Critical unknowns:** 0

## Audit authority

Audit #157 remains the binding source for this batch. Authoritative evidence and contract:

- `docs/audits/evidence/complete-endgame-02.md`;
- `docs/audits/contracts/complete-endgame-02.md`.

The accepted sequence remains exactly:

```text
#158 FINAL-OBJECT-FOUNDATION
→ #159 FINAL-GATE-VULNERABILITY
→ #160 TERMINAL-RUNTIME-UX
→ #161 ENDGAME-TERMINAL-GATE
```

No fifth implementation PR is authorized.

## #158 implementation result

`FINAL-OBJECT-FOUNDATION` now delivers the bounded foundation authorized by Audit #157:

- schema v19/save v6 and controlled v18/v5 migration;
- persisted final-project state and ongoing campaign-result foundation;
- strict malformed-current final-object/result validation;
- positive Solar War qualification lookup/snapshot;
- qualified ordinary Obelisk queueing;
- immutable solo/alliance project cohort;
- project start/cancel lifecycle;
- dedicated metal/crystal/gas contributions from contributor-owned planets;
- exact existing faction Gate level-1 funding target;
- pre-funded transition into existing building queue/timing/`BUILDING_COMPLETE` machinery;
- one active project per participation identity and host planet;
- bounded contribution/project history;
- pooled Gate ordinary refund cancellation blocked;
- ordinary transport behavior unchanged;
- all three factions × solo/alliance funded-Gate construction acceptance matrix.

Product-code/test closure head before final documentation: `93be3b90bf46409fe257c3819c3f6a1c8e9fcb2a`.

## Explicitly still not authorized/delivered in #158

- Gate vulnerability/stabilization;
- Gate attack/destruction/rebuild combat integration;
- terminal victory/defeat transition or clock freeze;
- global `CAMPAIGN_TERMINAL` command enforcement;
- terminal runtime/autosave/UI;
- bot endgame planning/perception;
- new currency/assets/catalogs or wider ordinary transport behavior.

These remain bound to #159–#161 and `COMPLETE-ENDGAME-03` as accepted.

## Current authorization boundary

`implementationAuthorized: true`

Authorization is sequential, not parallel. #158 may now only be validated/fixed within its accepted scope and merged. #159 must not be implemented before the generated #158 squash is present on fresh `main`.

## Exact next action

Run the mandatory exact-head CI, Browser E2E, Graphify, progression/performance and review/mergeability gates for the final #158 documentation head. If green, squash-merge #158, fetch the generated squash SHA, then create only a draft scaffold for #159 `FINAL-GATE-VULNERABILITY` from that fresh main.
