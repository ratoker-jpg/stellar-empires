# PR #123 — PLANET-DESTRUCTION-RECOVERY-GATE

**Batch:** `PLANET-DEMOLITION-DESTRUCTION-01`  
**Audit:** #121 · `2000a68216c7681fcbea0d69d1ed7e58e0c0c7f9`  
**Previous implementation:** #122 · `be0caff4fbf06384cdf5d370dbc2da80d4081152`  
**Scope:** whole-planet destruction, atomic recovery and combined batch gate

## Delivered

- deterministic faction/weapon-scaled whole-planet destruction chance;
- surviving defence, defender planet-destroyer and Polias reductions;
- 30% cap, zero floor, attacker-win eligibility and final-colony protection;
- additive `BattleReport.destruction`, stable target coordinate and galaxy-planet ID;
- atomic colony removal and galaxy ownership release;
- cancellation of planet-bound queues/events without refunds;
- deterministic nearest-colony rehome for surviving fleets;
- ordinary inbound/return event rebuilding without duplicate attacker returns;
- pending expedition and space-object `returnPlanetId` while historical `originPlanetId` remains immutable;
- reward, object depletion/control/cooldown and strategic-resource resolution at the live destination;
- logistics, world-event and flagship cleanup;
- debris re-keying to the released galaxy position and recycle support there;
- fresh-identity recolonization of a released coordinate;
- routed siege evidence and exact map backlink after active-colony removal;
- schema-v14 save/load coverage, integration coverage and focused Browser E2E.

## Explicit exclusions

No final-colony destruction, empire elimination, new mission kind, new command, schema migration, alliances, solar war, endgame, economy/logistics redesign or extra destruction loot.

## Validation surface

- faction/weapon scaling, cap/floor and all blocked reasons;
- defence, defender destroyer and Polias reductions;
- deterministic roll and final-colony protection;
- fleet, queue, logistics, world-event and flagship reconciliation;
- expedition and space-object historical/live return split;
- released-coordinate recycle and fresh recolonization;
- save/load validity and deterministic integration flow;
- routed report evidence, map backlink and reload-stable Browser E2E;
- repository CI, Chromium Browser E2E and Graphify on the final PR head.

Exact final head and workflow run IDs are recorded in GitHub PR #123 metadata before merge. Exact squash merge SHA is recorded on `main` after merge.
