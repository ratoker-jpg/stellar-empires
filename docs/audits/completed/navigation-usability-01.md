# Completed implementation batch — NAVIGATION-USABILITY-01

**Roadmap milestone:** M3b — Navigation and usability repair  
**Complexity:** medium  
**Audit PR:** #125 · `a13f017d79d5dce5fde954e9f6e1419a2182d78e`  
**Accepted baseline:** `cdd112c544ce8d37af17e938867d4588bedcf152`  
**Implementation PRs:** #126–#129  
**Schema:** v14 retained  
**Divergence:** none

## Delivered chain

| PR | Work item | Result |
|---:|---|---|
| #126 | `NAV-IA-PRIMARY-SHELL` | player-centered gameplay/development/information/system hierarchy; Operations promoted; Space labelled `Вселенная`; merge `2a9ebcbbe42c67f76f0c78dee9ed431555c9afd1` |
| #127 | `NAV-CONTEXT-ROUTE-MODEL` | campaign-scoped session route memory, active-colony context, localized breadcrumbs, typed return destination and stale-context normalization; merge `2821c4dda3f41ab0daf4c7d24f9c1cd6664e2418` |
| #128 | `NAV-CROSS-DOMAIN-FLOWS` | reload-safe prepared Fleet target, explicit source return, exact Report/Space backlinks, invalid-target fallback and explicit send boundary; merge `051c46736dbb92a7fb5061243d458eb3faabecfe` |
| #129 | `NAV-USABILITY-GATE` | measured task budgets, no-dead-end/legacy-launcher gate, keyboard/history/reload/reduced-motion/release-viewport validation and batch closure; exact merge recorded in canonical status after merge |

## Final player outcome

The application no longer presents nine equally weighted technical destinations. Core gameplay, development, information and system destinations have explicit hierarchy. Primary activation restores the latest still-valid subroute instead of resetting the player to a generic overview.

Planet, Space, Fleet, Operations and Report tasks preserve their relevant colony, route and origin context. Prepared Fleet targets survive reload in browser-session presentation state, are revalidated against current visible candidates and never send automatically. Exact map/report return paths remain reversible through the browser history and the shared return control.

## Measured usability contract

The closure gate verifies:

- active colony → Research within two purposeful actions;
- relevant Planet zone → Shipyard, Defence or Upgrades in one gateway action;
- Operations overview → exact mode in one action;
- another family → latest valid Operations subroute in one primary activation;
- Space target → prefilled Fleet composer while `SEND_FLEET` remains explicit;
- report → exact Space coordinate and one-action return;
- equivalent Planet task retention when switching between valid player colonies;
- all primary destinations reachable without obsolete competing dialogs or launchers;
- checksum neutrality across navigation, history and reload;
- keyboard, reduced motion, Back/Forward and reload parity;
- no horizontal overflow at 1366×768 and 1920×1080.

## Storage and simulation boundaries

Navigation and prepared-task state remain browser/application presentation state. They are excluded from `GameState`, save envelopes, command/event logs, replay and simulation checksums. Route normalization uses stable reason codes and never expands hidden intelligence.

No gameplay command, mission kind, formula, bot policy, save schema or simulation timing changed in this batch.

## Validation

Each implementation PR passed asset validation, lint, strict TypeScript, full tests, production build, Chromium Browser E2E and Graphify before merge. Exact final #129 run IDs and merge SHA are recorded in `docs/project-status.json` and `docs/audits/current-execution-state.md` after merge.

## Next ordered audit

After this batch closes, the only authorized next repository action is Audit PR #130 `LOCAL-CAMPAIGN-TIME-PACING-01`.

That audit must inspect campaign setup, immutable world-speed persistence, trusted elapsed time, bounded deterministic offline catch-up, bot/diplomacy/endgame catch-up parity, return summary, progression compression and headless campaign-duration balance. It must not implement those systems before the audit is accepted.
