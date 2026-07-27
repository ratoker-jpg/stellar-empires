# PR #115 — Command, System and full-shell gate

## Audit contract

Audit PR #111 · work item `UI-SHELL-COMMAND-SYSTEM-GATE`.

## Delivered routes

- `#/command/<overview|doctrine|fleet-doctrine|upgrades>`;
- `#/ranking`;
- `#/system/<saves|settings>`.

All nine implemented primary domains are now typed-registry routes:

- Planet;
- Fleets;
- Space;
- Research;
- Command;
- Ranking;
- Operations;
- Reports;
- System.

## Command and Ranking

- Empire Overview renders as a routed lifecycle workspace;
- Command Ranking renders as a routed profile and comparison workspace;
- Admiral Doctrine keeps existing doctrine and flagship commands;
- Fleet Doctrine keeps existing formation and target-priority command;
- Commander Ship catalog and active flagship ability remain visible;
- Command Upgrades summarizes existing ship-upgrade state and routes to the active colony upgrade workspace;
- no Command, Ranking or Doctrine top-level dialog or runtime navigation button is mounted.

## System

- Save Manager renders inside `#/system/saves`;
- create, load, import, export and delete behavior is preserved;
- local storage failure is represented as an unavailable workspace rather than a missing route;
- compact layout and reduced motion are presentation-only browser settings under `#/system/settings`;
- settings do not enter `GameState`, save JSON or checksums.

## Complete global HUD

- active colony, coordinates and world time;
- metal, crystal and gas amount/capacity/rate;
- energy production, consumption and free balance;
- population and hangar use/capacity;
- queue, mission and report activity;
- autosave state;
- primary navigation badges.

Capacity warning thresholds are explicit pure selectors:

- warning: 70%;
- danger: 85%;
- critical: 95%.

Energy becomes warning below a 10% reserve and danger when consumption exceeds production. Every warning has visible text and accessible labelling; colour is supplementary.

## Route-aware context

The persistent context panel now derives information for every route family. Space context uses only the existing redacted selection detail and never widens intelligence visibility.

## Accessibility and responsive gate

- all primary routes are keyboard reachable;
- rail and tablist arrow/Home/End behavior is supported;
- Enter and Space activation is isolated from hidden Phaser keyboard controls;
- active route transfers focus to the workspace heading and announces it;
- compact layout and reduced-motion settings persist across reloads;
- 1366×768 and 1920×1080 remain free of horizontal document overflow.

## Production cleanup

- removed asset-review showcase mounting from the composition root;
- removed asset-review dialogs and hidden runtime showcase hosts from production HTML;
- removed legacy primary Command/Doctrine/Ranking/Save mounts;
- no runtime module inserts a primary navigation entry.

## Preserved invariants

- no new gameplay command;
- no balance change;
- no schema or migration change;
- no bot-only capability;
- route/settings state remains outside `GameState` and save files;
- player and bots continue using the same validators;
- no alliances, solar war, Obelisks, Gates or victory work.

## Defects found and fixed

1. `exactOptionalPropertyTypes` exposed explicit optional Save Manager and cleanup-ref typing; the types now represent unavailable persistence deliberately.
2. A temporary `tee` diagnostic masked the TypeScript exit code; the workflow was restored and final CI runs the original strict command.
3. Enter on a focused primary rail button leaked to the hidden Space Map keyboard controller and rewrote the route; shell keyboard events are now isolated before they reach game-canvas controls.
4. Full-shell Browser E2E was aligned with route activation transferring focus to headings.

## Validation

- asset pipeline check: passed;
- lint: passed;
- TypeScript: passed;
- full unit suite: passed;
- production build: passed;
- Chromium Browser E2E: passed;
- Graphify: passed;
- existing Planet, Development, Universe and Fleet/Operations suites remain green;
- new all-route, Command/System, HUD, settings, history, reload, checksum, keyboard, focus and release-viewport coverage passed;
- temporary diagnostics, generated Graphify output and Playwright reports are absent from the final diff.

## Batch closure

Audit #111 and `COHERENT-UI-SHELL-01` are completed and archived in `docs/audits/completed/coherent-ui-shell-01.md`.

No implementation PR is authorized after #115. The next repository action must be a new Audit PR from fresh `main`.
