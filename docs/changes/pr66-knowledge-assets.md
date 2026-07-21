# PR #66 — Mechanics knowledge, project audit and source asset intake

## Scope

- import the 96-item official-help mechanics reference as reference-only research;
- audit current runtime domains against the reference;
- replace stale roadmap/status/handoff documents with v3 based on actual merged PR #65;
- register two original user-supplied source packs and their planned integration;
- preserve a strict boundary between original source packs and captured third-party material.

## No gameplay changes

- no reducer/state/save schema changes;
- no runtime asset URL changes;
- no copied Nemexia HTML/screens/assets;
- no monetization/account systems;
- no direct merge of the stale ship-upgrade branch.

## Binary asset status

The complete inventory is validated and committed as source-only material: 162 files, 161,379,761 uncompressed bytes, maximum member 3,494,229 bytes, with SHA-256 checks passed. Runtime asset URLs, atlases, scenes, UI and gameplay remain unchanged.

## Validation

- JSON documents parse;
- roadmap and handoff use actual PR #65 baseline;
- normal project CI remains lint/typecheck/tests/build.
