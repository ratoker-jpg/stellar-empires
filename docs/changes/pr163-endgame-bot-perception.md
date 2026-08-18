# PR #163 — ENDGAME-BOT-PERCEPTION

**Batch:** `COMPLETE-ENDGAME-03`  
**Audit squash / exact baseline:** `b7de24f52c02480f6db244c00b1282407d5743cc`  
**Branch:** `agent/endgame-bot-perception`  
**Runtime:** schema v19 / save format v6 unchanged

## Scope

Add a pure bot endgame perception boundary. This PR does not make bots take endgame actions.

Delivered projection:

- public alliance identity and current member IDs;
- public Solar War cycle/results;
- own participation and own Solar War results;
- public final-project identity/host/phase/vulnerability timing;
- contribution/funding detail only for immutable eligible project-cohort members;
- persisted terminal campaign result as a public fact.

Hidden foreign economy, inventory, fleet/queue/logistics/private-intelligence state is not exposed by this projection. Dedicated regression coverage proves hidden foreign economy/inventory changes are perception-inert.

## Hard boundary

No scheduler behavior, alliance/Solar-War planner, final-object planner, schema/save migration, gameplay mechanic, balance, catalog, asset, route or combat change is included. Those remain bounded to #164/#165/#166 under the accepted Audit #162 contract.
