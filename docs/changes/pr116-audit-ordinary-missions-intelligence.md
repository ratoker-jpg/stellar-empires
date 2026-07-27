# PR #116 — audit ordinary missions and intelligence

## Purpose

Select and contract the first coherent batch inside roadmap M4 after the completed UI shell.

## Decision

Authorize medium batch `ORDINARY-MISSIONS-INTELLIGENCE-01`:

```text
#117 MISSION-RULES-REGISTRY
→ #118 ESPIONAGE-COUNTERINTELLIGENCE
→ #119 INTELLIGENCE-REPORTS-PRESENTATION
→ #120 MISSION-INTELLIGENCE-BOT-GATE
```

## Main findings

- mission validation, player target selection and bot planning duplicate rules;
- flight-slot research exists but is not enforced;
- Fleet composer exposes raw foreign owner IDs outside the redacted intelligence view;
- scout observations/alerts already provide enough bounded schema-v14 state for deeper intelligence;
- intelligence reports and incoming-flight selectors can be derived without new save fields;
- destruction and multi-colony economy are separate later audits.

## Runtime impact

None. This PR changes documentation/status only.

## Validation

- JSON status documents must parse;
- CI, Browser E2E and fresh Graphify must remain green;
- no source, asset, balance, schema or migration file is changed.
