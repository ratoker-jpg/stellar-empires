# Current audit boundary

**Status:** Audit PR #157 `COMPLETE-ENDGAME-02` complete; exact-head validation and squash merge pending; implementation is **not authorized until merge**  
**Updated:** 2026-08-18  
**Verified runtime baseline:** PR #156 squash · `c2fcaf39402392f0ebbad297d88f9689f4165e4c`  
**Current runtime on `main`:** schema v18 / save format v5  
**Accepted Stage-2 target:** schema v19 / save format v6  
**Critical unknowns:** 0

## Closed batch

`COMPLETE-ENDGAME-01` is complete with divergence **none**.

```text
#152 Audit d777a619109d4a9bfc8e5129bf4c525f3327b9b6
→ #153 c567675c506d55a14a73757afa80c704fb079fc7
→ #154 b62d8b739c27cf1616b33302886e565d88c04a42
→ #155 a5c72562200c2a6dfdc49f1e4f07e8a869a6558d
→ #156 c2fcaf39402392f0ebbad297d88f9689f4165e4c
```

The closed stage delivers optional alliance/solo participation, deterministic Solar War, canonical Operations/Reports/HUD presentation and exact three-faction 48-hour partition closure. No fifth implementation PR belongs to that batch.

## Audit #157 evidence and contract

The recon is complete and recorded in:

- `docs/audits/evidence/complete-endgame-02.md`;
- `docs/audits/contracts/complete-endgame-02.md`.

The audit found that existing final-building catalogs/assets, ordinary build queue, ordinary combat/planet destruction, event queue, campaign runtime and current endgame UI shell are sufficient for a bounded implementation. No gameplay/runtime code is changed by Audit #157.

## Accepted Stage-2 contract

- use existing faction Obelisk and Supreme Galactic Gates definitions, costs, prerequisites, timings and assets;
- use positive scored Solar War result as qualification snapshot; no new meta-currency;
- preserve legal solo completion;
- alliance project has one owner empire/planet and immutable eligible-cohort snapshot;
- contribute existing metal/crystal/gas through a dedicated endgame command; ordinary transport stays own-colony-only;
- reuse ordinary Gate construction timing/queue rather than creating a second builder;
- Gate completion starts a public `86,400` campaign-second vulnerability/stabilization window;
- reuse ordinary `ATTACK` and combat; attacker win plus surviving existing planet-destroyer role destroys a vulnerable Gate deterministically;
- keep Obelisk/Gate excluded from ordinary random building demolition;
- reuse existing whole-planet destruction reconciliation to lose/cancel a hosted project;
- use deterministic rebuild rather than a new Gate HP/repair subsystem;
- persist final-project and campaign-result state in schema v19/save v6 with controlled v18/v5 migration;
- keep existing `executeAt` then `sequence` event order authoritative;
- final stabilization writes immutable victory/defeat identity and exact terminal campaign second;
- freeze game time at terminal and leave future queues/events/fleets inert;
- reject all later gameplay mutations with `CAMPAIGN_TERMINAL`;
- active/offline runtime clears remaining real-time backlog without advancing terminal game state;
- present final-project/terminal state through existing Operations/Reports/HUD/catch-up shell;
- defer bot final-object/Solar-War perception and planning to `COMPLETE-ENDGAME-03`.

## Bounded implementation sequence

Exactly four implementation PRs belong to `COMPLETE-ENDGAME-02`, and only after this Audit is squash-merged:

```text
#158 FINAL-OBJECT-FOUNDATION
→ #159 FINAL-GATE-VULNERABILITY
→ #160 TERMINAL-RUNTIME-UX
→ #161 ENDGAME-TERMINAL-GATE
```

No fifth implementation PR is authorized.

## Hard authorization boundary

`implementationAuthorized: false`

While Audit #157 remains open, it does **not** authorize:

- functional Obelisk/Gate mechanics;
- resource contribution commands;
- final-object attacks/destruction;
- persisted victory/defeat or terminal freeze;
- terminal UI implementation;
- bot final-object planning or allied perception;
- new currency, catalogs/assets, global rebalance, multiplayer, seasons or M9 work.

## Audit completion criteria status

1. concrete existing code/test/catalog/UI paths cited — **done**;
2. critical product/persistence unknowns resolved — **done**;
3. solo/alliance ownership and victory semantics explicit — **done**;
4. schema/save migration decision explicit — **done: v19/v6**;
5. exact event ordering and terminal runtime behavior bound — **done**;
6. bounded implementation count/file map — **done: exactly four PRs**;
7. deterministic partition, Browser, Graphify, progression and performance gates — **done**;
8. Audit exact-head validation/review/squash merge — **pending**.

## Exact next action

Validate the final docs-only #157 head with CI, Browser E2E and Graphify, resolve any review issues, mark ready, squash merge, re-fetch fresh `main`, record the generated #157 squash SHA, then create **only** draft scaffold #158 `FINAL-OBJECT-FOUNDATION`. Do not implement Stage 2 before that merge.
