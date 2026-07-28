# AI Continuation Guide

**Status:** Audit PR #121 defines `PLANET-DEMOLITION-DESTRUCTION-01`  
**Updated:** 2026-07-28  
**Runtime baseline:** PR #120 · `c59a2dd7afdc31fc250d2ec21364f655d6a4e665`  
**Audit baseline:** post-#120 `main` · `818aba011199dd5a96518f859ed35de671be892f`  
**Next implementation after audit merge:** #122 `PLANET-DEMOLITION-CONTRACT`

## Repository

`ratoker-jpg/stellar-empires` · default branch `main` · GitHub Pages deployment.

GitHub history and current `main` override stale prose, prior chat memory and abandoned branches.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/audits/contracts/planet-demolition-destruction-01-prs.md`
6. `docs/audits/contracts/planet-demolition-destruction-01-rules.md`
7. `docs/audits/evidence/planet-demolition-destruction-01-graphify.md`
8. this document
9. `docs/project-status.json`
10. `docs/roadmap-pr-index.json`
11. `docs/27-playable-game-roadmap-v5.md`
12. latest merged pull requests and actual `main`

## Completed product state

- #101–#105: complete catalog runtime art;
- #106–#110: schema-v14 Universe navigation and action gate;
- #111–#115: coherent routed application shell and browser/accessibility gate;
- #116–#120: shared ordinary mission rules, deterministic intelligence/counter-intelligence, routed redacted reports and honest bot parity gate.

## Audit #121 decision

Heavy batch `PLANET-DEMOLITION-DESTRUCTION-01` completes the destructive branch of ordinary planet attacks without introducing a new mission kind:

```text
#122 PLANET-DEMOLITION-CONTRACT
→ #123 PLANET-DESTRUCTION-RECOVERY-GATE
```

### #122

- faction-specific planet-destroyer profiles and weapon-level scaling;
- deterministic demolition points and threshold table;
- defence-population reduction;
- Annihilator modifies building rolls rather than generic combat damage;
- one-level building damage, zone recalculation and no-refund queue cancellation;
- extended battle report and routed presentation.

### #123

- whole-planet destruction chance, defender planet-killer and Polias reductions;
- 30% cap and final-colony protection;
- atomic removal of the colony and reconciliation of fleets, queues, events, routes, world events and flagship references;
- historical intelligence/report retention and exact coordinate backlinks;
- debris recycling at the released coordinate;
- normal recolonization, bots, save/load and Browser E2E gate;
- batch archive/closure.

## Invariants

- existing ordinary `attack` remains the only command/mission entry point;
- schema remains v14; no tombstone collection or migration;
- battle → demolition → destruction order is deterministic;
- the final colony of an empire cannot be destroyed;
- no hidden state reaches player previews or bot scoring;
- no destruction queue cancellation refunds resources;
- Sun Attack, system collapse, alliances, crystals, Obelisks, Gates and victory remain excluded;
- economy/logistics redesign remains a separate audit;
- every implementation branch starts from fresh merged `main`.

## Immediate route

Finalize and merge Audit PR #121. After it merges, create PR #122 from exact fresh `main` and implement only `PLANET-DEMOLITION-CONTRACT`. Do not start #123 in the same branch or PR.
