# Evidence — local campaign world-speed contract

## Owner decisions recorded

- local browser campaign rather than a required continuously running server;
- fixed world-speed multiplier selected at campaign creation;
- selected speed cannot be changed during the campaign;
- speed applies uniformly to canonical simulation time;
- deterministic offline catch-up uses the same speed;
- bots may legally develop, scout, attack, form alliances and advance endgame while the browser is closed;
- campaign progression should be compressed so a complete strategic cycle can finish in roughly one active day;
- exact level caps, timings and balance remain a later audited implementation decision;
- navigation/usability repair is the first implementation priority.

## Existing project support

The current runtime already has:

- deterministic canonical simulation time and event ordering;
- IndexedDB autosave/restore, manual slots and snapshot recovery;
- serialized bot decision cursors and bounded catch-up foundations;
- final-colony protection and deterministic historical reporting.

PR #124 records the product contract only and does not claim that world-speed settings, trusted offline elapsed-time input, complete catch-up, diplomacy or endgame are already implemented.

## Next verification

Audit PR #125 must inspect current player navigation and actual route/task-flow consumers. A later separate audit must verify the exact simulation, persistence, bot, balance and performance changes required by the campaign-time contract.
