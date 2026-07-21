# PR #70 — Operations workspace

## Delivered

- One operations-center entry in the side rail.
- Unified summary for market, logistics, expeditions, object operations, world events, reports and exotic matter.
- Existing market and logistics controls moved into the workspace without recreating commands or local state.
- Gateways to the existing expedition, space-object, event and report screens.
- Pure operations summary read model with regression tests.

## Boundaries

- No simulation or save-schema changes.
- Existing domain screens and commands remain canonical.
- The workspace is an orchestration/presentation layer, not a second implementation of market or logistics.
