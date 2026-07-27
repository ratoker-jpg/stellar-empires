# PR #112 — shell runtime controller and router

## Audit contract

Audit PR #111 · work item `UI-SHELL-RUNTIME-ROUTER`.

## Delivered

### Application controller

Added `src/runtime/GameApplicationController.ts` as the presentation/application boundary for:

- current `GameState`;
- active-colony presentation context;
- reducer command execution;
- accepted-state transition subscriptions;
- status messages;
- downstream Phaser, Space Map, E2E, autosave and bot-scheduler effects;
- bot and Planet compatibility state adoption.

Rejected commands do not emit accepted transitions. Route or colony presentation changes do not enter `GameState`.

### Canonical shell routing

Added:

```text
src/ui/appShellRoute.ts
src/ui/appShellController.ts
```

Supported shell route families in this work item:

```text
#/planet/<planet-id>/<overview|resource|industry|military>
#/space/...
```

Planet routes normalize stale planet IDs and invalid modes to the active player colony overview. Space subroutes remain parsed and validated by the existing `SpaceMapNavigationController`.

Browser back, forward and reload restore the canonical route. Route changes remain checksum-neutral.

### Static registry foundation

Added `src/ui/screenRegistry.ts` with stable primary IDs, labels, accessible names, order and route/legacy classification.

The shell owns canonical route metadata and active state. Existing compatibility launchers may still be inserted until their assigned PRs, but cloned legacy buttons are reconciled so they cannot impersonate registry entries or canonical active routes.

### Compatibility migration

All non-Planet screens now receive the application command bridge rather than using `planetScreen.ts` as their accepted-command owner.

Planet remains a compatibility adapter for its existing development UI until PR #113. This avoids combining the foundation and development-workspace migrations in one PR.

### Space Map lifecycle

`spaceMapNavigation.ts` no longer changes top-level Planet/Space visibility during every render or state refresh. Workspace visibility is owned only by the shell controller.

Canonical Planet/Space clicks stop obsolete same-element route handlers from opening unrelated legacy dialogs.

## Tests

Added:

```text
tests/runtime/gameApplicationController.test.ts
tests/ui/appShellRoute.test.ts
tests/ui/screenRegistry.test.ts
tests/e2e/appShellRouting.spec.ts
```

Coverage includes:

- one accepted command → one transition notification;
- rejected command isolation;
- active-planet presentation context;
- bot state adoption;
- route parse/serialize/normalization;
- Space route delegation;
- registry uniqueness and compatibility labels;
- Planet/Space visibility;
- invalid route recovery;
- browser history and reload;
- checksum neutrality;
- canonical registry metadata;
- keyboard rail order.

Existing Universe Browser E2E remains green.

## Defects found and fixed

1. An initial `GameState` assignment was always overwritten during bootstrap. It was removed after ESLint identified `no-useless-assignment`.
2. Space Map refreshes forced the Galaxy workspace visible even while the shell route was Planet. Visibility ownership was removed from the Space Map renderer.
3. Legacy buttons cloned canonical Galaxy metadata and appeared as registry entries. The shell now reconciles inserted launchers.
4. Galaxy Intelligence captured the canonical Galaxy click and opened a modal over route navigation. Canonical route handlers now stop obsolete competing handlers.

## Validation

Clean-head gate:

- asset pipeline check: passed;
- lint: passed;
- TypeScript: passed;
- full unit suite: passed;
- production build: passed;
- Chromium Browser E2E: passed;
- Graphify: passed.

## Intentional omissions

Reserved for PR #113:

- routed Research, Production, Defence, Repair and Ship Upgrade workspaces;
- removal of their modal-only compatibility surfaces;
- direct development-zone gateway routing;
- development workspace refresh lifecycle.

Reserved for #114–#115:

- fleet/operations/report route families;
- command/system route families;
- final global HUD/context and batch closure.

No gameplay commands, balance values, save fields, migrations, alliances, solar-war mechanics or framework changes were introduced.
