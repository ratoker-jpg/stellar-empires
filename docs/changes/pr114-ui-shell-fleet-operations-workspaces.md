# PR #114 — Fleet and Operations workspaces

## Audit contract

Audit PR #111 · work item `UI-SHELL-FLEET-OPERATIONS-WORKSPACES`.

## Delivered

- Fleet routes: `#/fleets/<overview|compose|active|battles>`;
- Operations routes: `#/operations/<overview|expeditions|objects|events|market|logistics>`;
- Reports routes: `#/reports/<all|combat|expedition|object|event>`;
- static primary hosts and typed-registry navigation for Fleet, Operations and Reports;
- explicit Fleet mission confirmation after map/intelligence target prefill;
- Galaxy intelligence through existing redaction selectors;
- routed Expeditions, Space Objects, World Events, Market and Logistics;
- routed unified Reports with exact Space Map backlinks;
- application-subscription refresh without remounting routed screens;
- compatibility Fleet dialog entrypoint made inert;
- obsolete Space Map dependency on the primary rail removed.

## Preserved invariants

- no command is dispatched by the initial map/intelligence target click;
- existing reducer commands and validators remain authoritative;
- Market and Logistics use their existing commands;
- intelligence redaction is unchanged;
- route state remains outside `GameState`, saves and checksums;
- no gameplay mechanic, balance value, schema field or migration changed;
- `SpaceMapNavigationController` remains authoritative for `#/space/...`.

## Defects found and fixed

1. Removed the obsolete `#nav-galaxy` dependency from `mountSpaceMapNavigation`.
2. Restored bootstrap navigation anchors required by the Planet compatibility adapter before typed-registry replacement.
3. Updated the Universe Browser E2E from modal semantics to routed Fleet/Reports semantics.
4. Added route, registry, summary and full operations Browser E2E coverage.

## Validation

- asset pipeline check: passed;
- lint: passed;
- TypeScript: passed;
- full unit suite: passed;
- production build: passed;
- Chromium Browser E2E: passed;
- Graphify: passed;
- existing Planet, Space, Development and Universe Browser E2E remains green;
- new Fleet, Operations and Reports history/reload/checksum/viewport coverage passed.

## Next authorized work

PR #115 from fresh post-#114 `main`: `UI-SHELL-COMMAND-SYSTEM-GATE` only.
