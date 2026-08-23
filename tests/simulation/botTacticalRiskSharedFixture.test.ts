import { describe, expect, it } from 'vitest';
import { planBotFleetMission } from '../../src/simulation/bots/fleetMissionPlanner';
import { planBotThreatAndRecovery } from '../../src/simulation/bots/threatRecoveryPlanner';
import type { BotProfile } from '../../src/simulation/bots/profiles';
import type { GameState } from '../../src/simulation/types';
import {
  buildCanonicalMarginalTacticalRiskFixture,
  buildExactExplorerBoundaryTacticalRiskFixture,
} from './botTacticalRiskFixture';

const marginal = buildCanonicalMarginalTacticalRiskFixture();
const explorerBoundary = buildExactExplorerBoundaryTacticalRiskFixture();

function targetAssessment(
  state: GameState,
  empireId: string,
  targetPlanetId: string,
  profile: BotProfile,
) {
  return planBotThreatAndRecovery(state, empireId, {}, profile).targets
    .find((candidate) => candidate.planetId === targetPlanetId);
}

function fleetAttackSelected(state: GameState, profile: BotProfile): boolean {
  return planBotFleetMission(state, marginal.empireId, profile).reasonCode === 'mission-attack-selected';
}

describe('shared tactical-risk fixture across planner paths', () => {
  it('locks one canonical marginal state to real catalog-derived power and current level-three intel', () => {
    expect(marginal).toMatchObject({
      empireId: 'aegis-bot',
      targetEmpireId: 'player',
      ownCount: 3,
      targetCount: 2,
      ownPower: 300,
      targetPower: 248,
      riskPermille: 826,
      intelligenceLevel: 3,
    });
    const intel = marginal.state.intelligence
      .find((entry) => entry.empireId === marginal.empireId)
      ?.observations.find((entry) => entry.targetPlanetId === marginal.targetPlanetId);
    expect(intel).toMatchObject({
      observedAt: marginal.observedAt,
      expiresAt: marginal.expiresAt,
      snapshot: { level: 3 },
    });
  });

  it('passes the exact same marginal state through fleet thresholds 700/800/900', () => {
    expect(fleetAttackSelected(marginal.state, marginal.profiles.industrial)).toBe(false);
    expect(fleetAttackSelected(marginal.state, marginal.profiles.explorer)).toBe(false);
    expect(fleetAttackSelected(marginal.state, marginal.profiles.aggressive)).toBe(true);
  });

  it('passes the exact same marginal state through threat thresholds 700/800/900', () => {
    const industrial = targetAssessment(
      marginal.state,
      marginal.empireId,
      marginal.targetPlanetId,
      marginal.profiles.industrial,
    );
    const explorer = targetAssessment(
      marginal.state,
      marginal.empireId,
      marginal.targetPlanetId,
      marginal.profiles.explorer,
    );
    const aggressive = targetAssessment(
      marginal.state,
      marginal.empireId,
      marginal.targetPlanetId,
      marginal.profiles.aggressive,
    );

    expect(industrial).toMatchObject({ riskPermille: 826, attackRecommended: false });
    expect(explorer).toMatchObject({ riskPermille: 826, attackRecommended: false });
    expect(aggressive).toMatchObject({ riskPermille: 826, attackRecommended: true });
    expect(planBotThreatAndRecovery(
      marginal.state,
      marginal.empireId,
      {},
      marginal.profiles.aggressive,
    ).ownMilitaryPower).toBe(marginal.ownPower);
  });

  it('keeps the exact Explorer 800 boundary identical in both planner paths', () => {
    expect(explorerBoundary.riskPermille).toBe(800);

    expect(planBotFleetMission(
      explorerBoundary.state,
      explorerBoundary.empireId,
      explorerBoundary.profiles.industrial,
    ).reasonCode).not.toBe('mission-attack-selected');
    expect(planBotFleetMission(
      explorerBoundary.state,
      explorerBoundary.empireId,
      explorerBoundary.profiles.explorer,
    ).reasonCode).toBe('mission-attack-selected');
    expect(planBotFleetMission(
      explorerBoundary.state,
      explorerBoundary.empireId,
      explorerBoundary.profiles.aggressive,
    ).reasonCode).toBe('mission-attack-selected');

    expect(targetAssessment(
      explorerBoundary.state,
      explorerBoundary.empireId,
      explorerBoundary.targetPlanetId,
      explorerBoundary.profiles.industrial,
    )).toMatchObject({ riskPermille: 800, attackRecommended: false });
    expect(targetAssessment(
      explorerBoundary.state,
      explorerBoundary.empireId,
      explorerBoundary.targetPlanetId,
      explorerBoundary.profiles.explorer,
    )).toMatchObject({ riskPermille: 800, attackRecommended: true });
    expect(targetAssessment(
      explorerBoundary.state,
      explorerBoundary.empireId,
      explorerBoundary.targetPlanetId,
      explorerBoundary.profiles.aggressive,
    )).toMatchObject({ riskPermille: 800, attackRecommended: true });
  });
});
