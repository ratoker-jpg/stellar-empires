# PR #18 — Three-zone save migration

This change raises the game/save schema to version 2 and replaces the temporary four-zone planet model with the canonical `resource`, `industry`, and `military` domains.

Legacy version-1 saves are checksum-verified before migration. Planet resources, building levels, queues, events, and logs are preserved while zone occupancy is recalculated from the current building catalogue.
