# M9 Release Candidate — audit evidence

**Audit PR:** #167  
**Recon baseline:** `a6b225fe38c1c320244fc54929534e49029d4026`  
**Date:** 2026-08-19

This file records the direct repository evidence behind `docs/audits/contracts/m9-release-candidate.md`.

## 1. Fresh baseline

### VERIFIED

GitHub `main` after PR #166 is exactly:

`a6b225fe38c1c320244fc54929534e49029d4026`

Commit message: `Close bot endgame acceptance gate (#166)`.

PR #166 final validation on its docs-inclusive exact head recorded:

- 167 passed test files + 1 skipped experiment;
- 684 passed tests + 1 skipped;
- Browser E2E 34/34, no retry;
- Graphify success;
- compressed progression success;
- one-day performance 6.039 s;
- seven-day performance 26.596 s;
- reviews 0;
- unresolved review threads 0.

The runtime remains state schema v19 / save format v6.

## 2. New-game release truth

### Source

`src/ui/newGameFactionPicker.ts`

### VERIFIED

The dialog already exposes:

- faction selection;
- scenario/world-size selection;
- world speed selection;
- immutable compressed progression profile;
- campaign duration expectation;
- offline progression notice.

The closing note still states:

`Финальная победа и работа Врат пока не входят в текущий runtime.`

That statement conflicts with the merged M8.2/M8.3 runtime and therefore is a release blocker in presentation truth, not a missing gameplay mechanic.

`tests/e2e/appShellFullGate.spec.ts` explicitly asserts the same obsolete sentence, so both implementation and acceptance must be updated together.

### INFERRED

A full tutorial subsystem is unnecessary to satisfy M9 onboarding. The existing new-game dialog is already the authoritative pre-campaign orientation surface; concise first-step guidance there is sufficient unless Browser evidence demonstrates otherwise.

## 3. Production base-path evidence

### Sources

- `vite.config.ts`
- `playwright.config.ts`
- `.github/workflows/e2e.yml`
- `.github/workflows/pages.yml`

### VERIFIED

`vite.config.ts` uses:

- `/stellar-empires/` as the production base;
- `/` outside production.

The normal Playwright configuration uses:

- base URL `http://127.0.0.1:4173`;
- Vite dev server;
- `VITE_E2E=1` state injection path.

The current E2E workflow runs only `npm run e2e`, so its Browser evidence proves the dev-server root path, not the production base path.

The Pages workflow:

1. checks out `main`;
2. installs Node 22.12.0;
3. runs `npm install`;
4. runs `npm run check`;
5. uploads `dist`;
6. deploys with `actions/deploy-pages@v4`.

### DECISION SUPPORT

A separate production-build smoke is safer than replacing the existing 34-test dev suite. It can exercise the exact base path and real new-game flow while retaining the fast deterministic E2E suite for broad coverage.

## 4. Version and packaging evidence

### Sources

- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `index.html`
- `src/main.ts`

### VERIFIED

Current product version is independently encoded as `0.1.0` in multiple places:

- package version;
- package-lock root package version;
- Vite `__APP_VERSION__` define;
- initial HTML build badge.

At runtime `src/main.ts` overwrites the badge using `__APP_VERSION__`.

### RISK

Keeping version literals independent makes final release metadata drift likely. A single package-authoritative source is therefore part of M9 packaging hardening.

## 5. Node/toolchain evidence

### Sources

- `package.json`
- `.github/workflows/ci.yml`
- `.github/workflows/e2e.yml`
- `.github/workflows/pages.yml`
- final #166 workflow logs

### VERIFIED

The package declares Node `>=22.12.0`, and CI/E2E/Pages explicitly install `22.12.0`.

The #166 CI logs repeatedly emit `EBADENGINE` warnings from the ESLint 10 dependency family because those packages require one of:

- `^20.19.0`;
- `^22.13.0`;
- `>=24`.

The warnings are not current test failures, but retaining a release automation baseline that falls outside dependency engines is unnecessary risk.

### DECISION SUPPORT

Node 24 is an accepted engine range for the current dependency tree and provides one simple baseline across package metadata and workflows.

## 6. Repository documentation evidence

### Source

`README.md`

### VERIFIED

README still claims:

- baseline after PR #65;
- simulation schema v12;
- three factions share Aegis mechanics;
- active PRs #66–#71;
- old execution-roadmap entrypoint;
- license is not selected.

The first four claims are materially stale relative to current `main` and should be corrected before 1.0.

The license statement reflects an unresolved owner-controlled legal choice and must not be silently replaced with a guessed license.

## 7. Existing QA coverage

### Sources

`tests/e2e/`, CI workflows and accepted M8 closure suites.

### VERIFIED

Current Browser E2E already covers 34 scenarios across:

- new-campaign presentation at release viewports;
- primary shell/navigation and keyboard/history/reload;
- planet/development/research;
- fleet/operations/logistics/market;
- save/offline catch-up;
- reports/intelligence;
- planet destruction/recovery;
- PvE meta;
- alliance/Solar War participation;
- terminal Gate result and reload;
- mobile/reduced-motion constraints.

Unit/integration/audit suites already cover deterministic direct/chunk/save/offline partitions and terminal fixed points.

### VERIFIED GAP

The broad Browser suite does not directly run the built production artifact under `/stellar-empires/`.

## 8. Balance evidence

### VERIFIED

The repository already has:

- accepted compressed progression profile;
- permanent deterministic progression workflow;
- fixed campaign performance budgets;
- M8 endgame composed closure.

The roadmap's M9 word `balance` does not itself prove a current balance defect.

### DECISION

Do not retune progression in M9 without a measured release blocker. Preserve existing accepted values and keep permanent progression/performance gates binding.

## 9. Persistence impact

### VERIFIED

None of the audited release gaps requires a new GameState field or save-format change.

### DECISION

M9 target remains:

- state schema v19;
- save format v6;
- no migration.

## 10. Dependency/data-flow map

```text
package.json version
        ↓
vite config define
        ↓
src/main.ts
        ↓
#build-version

new-game dialog
        ↓
createCampaignSettings
        ↓
createInitialGameState
        ↓
normal runtime + IndexedDB autosave

production Vite build
        ↓
base /stellar-empires/
        ↓
dist
        ↓
GitHub Pages upload/deploy
```

The production Browser smoke must exercise the second and third chains without E2E state injection.

## 11. Graphify scope

Graphify remains a mandatory exact-head gate for Audit and implementation PRs. M9 does not rely on Graphify to infer deployment behavior; workflow/Vite/Playwright source and Browser evidence are authoritative for that boundary.

## 12. Unknown register

### Critical UNKNOWNs

None.

### Non-critical owner decision

License selection remains unresolved and outside M9 implementation authority. The technical 1.0 browser build can be validated without inventing a license grant.
