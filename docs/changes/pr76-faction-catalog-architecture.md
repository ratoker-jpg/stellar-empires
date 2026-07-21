# PR #76 — Faction mechanical catalog architecture

## Delivered

- Explicit manifest for native and temporary legacy-alias faction catalogs.
- Stable `kind.faction.slug` mechanical ID parser and constructor.
- Unified registry for buildings, research and units.
- Catalog validation for duplicate IDs, namespace mismatches and unresolved requirements.
- Runtime compatibility now resolves through the manifest instead of an implicit Aegis exception.
- Documented migration policy for replacing legacy aliases with native faction IDs.

## Compatibility

- Existing Aegis IDs remain unchanged.
- Synod and Veyra continue to use Aegis mechanics until PR #78 and #79, but the compatibility path is now explicit and covered by tests.
- No save schema change is required in this architecture PR.
