# PR #113 — UI shell development workspaces

## Audit contract

Implements only `UI-SHELL-DEVELOPMENT-WORKSPACES` from accepted Audit PR #111.

## Delivered

- promoted Research to canonical `#/research` primary workspace;
- retained canonical Planet zone routes and added checksum-neutral local URL surfaces for shipyard, Defence/Repair and Ship Upgrades;
- removed top-level modal ownership from Research, Production and Ship Upgrades;
- routed Industry and Military gateways to real catalogs instead of placeholder dialogs;
- kept requirements, resource checks, capacity checks, queue reservation, cancellation/refund and reducer validation unchanged;
- added persistent active-colony, coordinate and world-time HUD context;
- connected Research, production, repair, upgrade, Planet strategy and artwork presentation to application subscriptions;
- preserved browser history, reload restoration and one-primary-workspace visibility;
- added unit and Browser E2E coverage for route parsing, surface normalization, gateway navigation, queue selectors, checksum neutrality and 1366×768 / 1920×1080 layouts.

## Defects found during validation

1. Replaced a mutable shell controller variable with a stable ref object to satisfy lint and make initialization ownership explicit.
2. Corrected the Research gateway label to the actual `Исследовательский комплекс` view-model contract.
3. Removed presentation-only gateway blocking: locked catalogs now open their real workspace while existing reducer requirements keep actions disabled.
4. Replaced ambiguous text locators with accessible-name gateway locators in Browser E2E.

## Explicit omissions

- no Fleet, Galaxy intelligence, Expeditions, Space Objects, World Events, Market, Logistics or Reports migration from #114;
- no Command, Ranking, Doctrine, Saves/Settings, final HUD warnings/badges or batch closure from #115;
- no gameplay mechanic, command, schema, migration or balance change.

## Final validation

- asset pipeline check: passed;
- lint: passed;
- TypeScript: passed;
- full unit suite: passed;
- production build: passed;
- Chromium Browser E2E: passed;
- Graphify: passed;
- temporary workflow diagnostics and generated reports are absent from the final diff.

After merge, the next allowed action is PR #114 from fresh `main`, implementing only `UI-SHELL-FLEET-OPERATIONS-WORKSPACES`.
