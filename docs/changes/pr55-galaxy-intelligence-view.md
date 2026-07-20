# PR #55 — Galaxy v2 intelligence view

## Delivered

- Public galaxy topology is separated from private colony state and stored intelligence.
- Own colonies expose full operational data.
- Foreign colonies without observations appear only as unknown contacts.
- Current and expired observations render from their stored snapshots; hidden live changes never leak into the view.
- Unclaimed orbital positions remain visible from public galaxy generation data.
- Search covers systems, contacts and public IDs.
- Filters support owner class, intelligence freshness, biome and minimum planet size.
- Summary counters partition every orbital position into owned, current, stale, contact or unclaimed.
- A modal Galaxy Intelligence UI opens from the existing galaxy navigation button.
- Tests cover fog isolation, snapshot fidelity, stale data, filtering and complete summary partitioning.

## Intentional limitations

- The Phaser map itself is not yet re-rendered with fog overlays; this PR provides the authoritative fog-aware data model and searchable command panel.
- Unknown undeveloped positions expose public physical generation properties but no event, reward or hidden ownership state.
- Route plotting and bookmarks remain future navigation work.
