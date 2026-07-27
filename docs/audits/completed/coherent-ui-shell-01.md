# Completed batch — COHERENT-UI-SHELL-01

**Audit PR:** #111  
**Implementation PRs:** #112, #113, #114, #115  
**Completed:** 2026-07-27  
**Complexity:** medium  
**Divergence:** none

## Accepted result

The audited coherent UI shell was delivered sequentially:

1. PR #112 — `UI-SHELL-RUNTIME-ROUTER`;
2. PR #113 — `UI-SHELL-DEVELOPMENT-WORKSPACES`;
3. PR #114 — `UI-SHELL-FLEET-OPERATIONS-WORKSPACES`;
4. PR #115 — `UI-SHELL-COMMAND-SYSTEM-GATE`.

The application now has one runtime controller, one typed primary navigation registry, canonical URL/history routes, one active primary workspace, persistent global HUD and route-aware context. Planet, Space, Research, Fleets, Operations, Command, Ranking, Reports and System are directly routed application domains.

## Delivered architecture

- `GameApplicationController` owns the current state reference, command execution and accepted-transition subscriptions;
- route state remains in URL/history and outside `GameState`, saves and checksums;
- `SpaceMapNavigationController` remains authoritative for `#/space/...`;
- all nine implemented primary domains are declared exactly once in the typed registry;
- primary screens use explicit activate, refresh, deactivate and dispose lifecycles;
- runtime modules no longer insert primary navigation buttons;
- top-level domains no longer depend on modal-only presentation;
- the left context panel derives only route-appropriate, already-authorized information;
- production asset-review showcase surfaces were removed from the game shell.

## Delivered player routes

```text
#/planet/<planet-id>/<overview|resource|industry|military>
#/fleets/<overview|compose|active|battles>
#/space/...
#/research
#/operations/<overview|expeditions|objects|events|market|logistics>
#/command/<overview|doctrine|fleet-doctrine|upgrades>
#/ranking
#/reports/<all|combat|expedition|object|event>
#/system/<saves|settings>
```

Planet-local development surfaces remain checksum-neutral URL query state for shipyard, defence/repair and ship upgrades.

## Final PR #115 result

- routed Command Overview, Admiral Doctrine, Fleet Doctrine and upgrades summary;
- routed Ranking profile and empire comparison;
- routed System Saves and Settings;
- Save Manager retains create, load, import, export and delete behavior;
- presentation settings remain browser-local and outside game saves;
- persistent HUD exposes active colony, coordinates, world time, resources, energy, population, hangar, queue, mission, report and autosave states;
- explicit capacity warning thresholds are 70%, 85% and 95%;
- energy warning and deficit states are text-labelled rather than colour-only;
- keyboard navigation is isolated from hidden game-canvas controls;
- route activation transfers focus to the active workspace heading and announces it;
- compact and reduced-motion settings are retained across reloads.

## Preserved invariants

- no new gameplay command;
- no balance change;
- no schema field or migration;
- no bot-only capability;
- no intelligence-redaction widening;
- no copied Nemexia HTML, CSS, prose, branding or assets;
- no alliances, solar war, Obelisks, Gates or victory work;
- player and bots continue using the same simulation commands and validators.

## Final validation

- asset pipeline check: passed;
- lint: passed;
- TypeScript: passed;
- full unit suite: passed;
- production build: passed;
- Chromium Browser E2E: passed;
- all primary routes, history, reload and checksum-neutrality: passed;
- explicit Fleet mission confirmation and report backlinks: passed;
- keyboard, focus, compact and reduced-motion behavior: passed;
- 1366×768 and 1920×1080 release viewports: passed;
- Graphify: passed;
- generated reports and temporary diagnostics are absent from the final diff.

## Archived evidence

- accepted PR split: `docs/audits/contracts/coherent-ui-shell-01-prs.md`;
- route/layout contract: `docs/audits/contracts/coherent-ui-shell-01-route-layout.md`;
- Graphify evidence: `docs/audits/evidence/coherent-ui-shell-01-graphify.md`;
- exact accepted source audit: `docs/audits/completed/coherent-ui-shell-01-authorized-audit.md`;
- implementation change notes: `docs/changes/pr112-*`, `docs/changes/pr113-*`, `docs/changes/pr114-*`, `docs/changes/pr115-*`.

## Next repository action

This batch is closed. No further implementation PR is authorized by Audit #111. The next implementation work must first be defined and accepted in a **new Audit PR** from fresh `main`.
