# PR #53 — Bot threat, target and recovery planner

## Delivered

- Honest threat classification from alerts and current stored intelligence.
- Deterministic military-power estimates for owned forces and known foreign defenders.
- Target ranking by observed reward, intelligence freshness, uncertainty and risk.
- Attacks are recommended only for current level-three observations with acceptable perceived risk.
- Key-colony selection for protection and recovery prioritization.
- Recovery phases cover critical infrastructure, depleted economy, lost fleet and stable development.
- Recovery actions reuse the existing economy, production, research and fleet planners.
- Tests cover hidden-state isolation, profitable targets, rebuilding after fleet loss, high-threat response, complete planet loss and determinism.

## Intentional limitations

- The planner has no diplomatic context yet; every known foreign empire is potentially hostile.
- Estimates use currently available unit stats and do not simulate full combat rounds.
- The autonomous scheduler that executes these recommendations arrives in PR #54.
