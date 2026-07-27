# PR #119 — intelligence reports and redacted presentation

**Audit:** #116 `ORDINARY-MISSIONS-INTELLIGENCE-01`  
**Work item:** `INTELLIGENCE-REPORTS-PRESENTATION`  
**Schema:** v14 unchanged

## Delivered

- canonical `#/reports/intelligence` route with direct load, history and reload support;
- observer and defender intelligence reports derived from existing observations and alerts;
- report freshness and detection/loss state calculated at presentation time;
- exact report coordinates used for canonical map backlinks;
- player report visibility excludes private bot observations;
- pure incoming-flight selector with audited visibility tiers:
  - sensor strength 0–4: generic contact, owned target and ETA;
  - sensor strength 5–9: source empire, target and ETA;
  - sensor strength 10+: mission and ship composition too;
  - current level-three source intelligence promotes to full visibility;
- cargo is not present in the incoming-contact model;
- incoming counts are surfaced in HUD and Fleet context without mutating state;
- compatibility Reports code handles extensible report kinds while the routed workspace remains canonical.

## Validation

- asset pipeline passed;
- lint passed;
- TypeScript passed;
- full unit suite: 384 tests passed;
- production build passed;
- Browser E2E passed, including direct intelligence route, keyboard tabs, exact map backlink, reload, checksum neutrality and release viewports;
- Graphify passed;
- temporary diagnostic/autofix workflows were removed before the final diff.

## Boundaries

No new persisted report collection, schema version, migration, gameplay command, mission kind, bot strategy, combat/balance rule, destruction, alliance, solar-war or endgame work.

## Next

After #119 merges, #120 may implement only `MISSION-INTELLIGENCE-BOT-GATE` from fresh `main` and close the accepted batch.