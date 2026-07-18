# PR #23 — Runtime autosave and restore

The active browser session now loads the checksum-validated `autosave` slot before mounting Phaser and the management UI. Successful simulation commands are coalesced into a debounced IndexedDB write, and page hiding triggers a best-effort flush.

Persistence failure does not prevent a new game from starting. Corrupted autosaves are rejected by the existing save parser and reported through the application status instead of being applied to runtime state.
