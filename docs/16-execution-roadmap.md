# Execution Roadmap Stellar Empires — current entrypoint

**Status:** PR #143 `PVE-TARGET-RECOVERY` active  
**Updated:** 2026-08-02  
**Verified main:** `81f1959b0bdbdd72d05dc21a2dce0a9e1470f010`  
**Last merged PR:** #142 `SUSTAINABLE-PVE-OPERATIONS-01` audit  
**Active implementation:** #143 `PVE-TARGET-RECOVERY`

## Authoritative files

```text
AGENTS.md
docs/28-audit-first-autonomous-delivery-protocol.md
docs/audits/current-execution-state.md
docs/audits/current-batch-audit.md
docs/audits/contracts/sustainable-pve-operations-01.md
docs/audits/evidence/sustainable-pve-operations-01.md
docs/changes/pr143-pve-target-recovery.md
docs/audits/completed/multi-colony-economy-logistics-01.md
docs/27-playable-game-roadmap-v5.md
docs/project-status.json
docs/roadmap-pr-index.json
```

## Delivered merged state

- #101–#105: complete catalog runtime art;
- #106–#110: Universe navigation/action gate;
- #111–#115: coherent application shell;
- #116–#120: ordinary missions, intelligence and honest bots;
- #121–#123: planet demolition, destruction and recovery;
- #124–#129: local campaign contract and navigation/usability closure;
- #130–#135: immutable campaign time and measured compressed progression;
- #137–#141: coherent multi-colony economy/logistics, complete player workflow and honest bot logistics;
- #142: accepted sustainable existing-PvE batch.

## Active M6a sequence

```text
#142 SUSTAINABLE-PVE-OPERATIONS-01 — Audit merged
→ #143 PVE-TARGET-RECOVERY — active
→ #144 PVE-OPERATIONS-INTELLIGENCE-UX — next after #143
→ #145 BOT-PVE-OPERATIONS
→ #146 PVE-SUSTAINABILITY-GATE
```

Complexity is medium. Exactly four implementation PRs are authorized; no fifth PR is allowed.

## Active PR #143 result

#143 establishes the deterministic lifecycle consumed by later M6a work:

- final object depletion recovers after 21,600 campaign seconds;
- non-final extraction retains 300 seconds;
- recovery runs at the existing 1,800-second world-event boundary;
- object identity and baseline properties remain stable;
- pirate resources/defenses recover from deterministic baselines;
- destroyed pirate bases respawn only at a free original position;
- at most one pirate base recovers per evaluation;
- long offline advances see battle reports executed earlier in the same call;
- targeted pirate-hunt reward is 1,500 permille combined with anti-repeat scaling;
- schema v16/save format v3 remain unchanged;
- direct/chunked/save-loaded 48-hour equality is gated.

Code head `ad23459708d6b7dab57c29c898e5772ba96e8917` passed CI `30741354763` and Graphify `30741354825`; Browser `30741354743` is checked before merge. Final documentation-head workflows remain mandatory.

## Compatibility boundary

- no new persisted event or state field;
- no player UX redesign from #144;
- no bot mission selection from #145;
- no batch archive/closure absorption from #146;
- no PvE currency, reputation, Arena or Admiral services;
- no global progression/economy rebalance;
- no alliances or endgame.

## Immediate action

```text
validate final #143 documentation head
→ CI + Browser E2E + Graphify
→ resolve review
→ mark ready and squash merge #143
→ fetch fresh main and exact merge SHA
→ create only #144 PVE-OPERATIONS-INTELLIGENCE-UX
```
