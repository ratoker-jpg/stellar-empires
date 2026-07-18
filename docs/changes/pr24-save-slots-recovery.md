# PR #24 — Save slots, import/export and recovery

The settings rail now opens a local save manager with named manual slots, validated load, JSON export/import and deletion of non-reserved slots. Loading a slot promotes it to the active autosave and reloads the application so Phaser and the management UI start from the same restored state.

Before replacing the primary autosave, the previous checksum-valid state rotates into `autosave.snapshot`. Startup automatically repairs a missing or corrupted primary from that snapshot and reports the recovery source. Slot diagnostics keep invalid entries visible without applying them.
