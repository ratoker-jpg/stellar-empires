import { planBotEconomy } from '../bots/economyPlanner';
import { planBotExpedition } from '../bots/expeditionPlanner';
import { planBotFleetMission } from '../bots/fleetMissionPlanner';
import { planBotResearchAndProduction } from '../bots/researchProductionPlanner';
import {
  BOT_PROGRESSION_PHASES,
  getBotProgressionPhase,
  type BotProgressionPhase,
} from '../bots/progressionPhase';
import { advanceCampaignTime } from '../campaign/time';
import { createCampaignSettings, type WorldSpeed } from '../campaign/settings';
import { createInitialGameState } from '../createInitialGameState';
import type { FactionId } from '../planet/types';
import { executeCommand } from '../reducer';
import type { GameCommand, GameState } from '../types';

export const ACCEPTED_PROGRESSION_SEEDS = [
  'stellar-empires-m1',
  'progression-aegis-01',
  'progression-synod-01',
  'progression-veyra-01',
  'progression-pressure-01',
] as const;

export interface ProgressionScenarioInput {
  readonly seed: string;
  readonly playerFaction: FactionId;
  readonly worldSpeed?: WorldSpeed;
  readonly maximumRealSeconds?: number;
  readonly decisionStepGameSeconds?: number;
}

export interface ProgressionScenarioResult {
  readonly input: Required<ProgressionScenarioInput>;
  readonly state: GameState;
  readonly complete: boolean;
  readonly elapsedRealSeconds: number;
  readonly phaseReachedAtRealSeconds: Readonly<
    Record<string, Partial<Record<BotProgressionPhase, number>>>
  >;
  readonly acceptedPlayerCommands: number;
  readonly rejectedPlayerCommands: number;
}

function applyCommand(state: GameState, command: GameCommand | null): {
  readonly state: GameState;
  readonly accepted: boolean;
  readonly attempted: boolean;
} {
  if (command === null) return { state, accepted: false, attempted: false };
  const result = executeCommand(state, command);
  return {
    state: result.ok ? result.value : state,
    accepted: result.ok,
    attempted: true,
  };
}

function runPlayerDecision(state: GameState): {
  readonly state: GameState;
  readonly accepted: number;
  readonly rejected: number;
} {
  let working = state;
  let accepted = 0;
  let rejected = 0;
  const commands = (): readonly (GameCommand | null)[] => {
    const economy = planBotEconomy(working, 'player');
    const science = planBotResearchAndProduction(working, 'player');
    const expedition = planBotExpedition(working, 'player');
    const fleet = planBotFleetMission(working, 'player');
    return [
      science.production.command,
      science.research.command,
      economy.command,
      expedition.command,
      fleet.command,
    ];
  };
  for (let pass = 0; pass < 2; pass += 1) {
    let changed = false;
    for (const command of commands()) {
      const result = applyCommand(working, command);
      if (!result.attempted) continue;
      if (result.accepted) {
        working = result.state;
        accepted += 1;
        changed = true;
      } else {
        rejected += 1;
      }
    }
    if (!changed) break;
  }
  return { state: working, accepted, rejected };
}

function runBotExpeditionDecisions(state: GameState): GameState {
  let working = state;
  for (const empireId of state.empires) {
    if (empireId === 'player') continue;
    const result = applyCommand(working, planBotExpedition(working, empireId).command);
    if (result.accepted) working = result.state;
  }
  return working;
}

function recordPhases(
  state: GameState,
  worldSpeed: WorldSpeed,
  reached: Record<string, Partial<Record<BotProgressionPhase, number>>>,
): void {
  const elapsedRealSeconds = state.clock.elapsedSeconds / worldSpeed;
  for (const empireId of state.empires) {
    const currentPhase = getBotProgressionPhase(state, empireId);
    const currentIndex = BOT_PROGRESSION_PHASES.indexOf(currentPhase);
    const empireReached = reached[empireId] ?? {};
    reached[empireId] = empireReached;
    for (let index = 0; index <= currentIndex; index += 1) {
      const phase = BOT_PROGRESSION_PHASES[index];
      if (phase !== undefined && empireReached[phase] === undefined) {
        empireReached[phase] = elapsedRealSeconds;
      }
    }
  }
}

function allEmpiresReachedEndgamePreparation(state: GameState): boolean {
  return state.empires.every(
    (empireId) => getBotProgressionPhase(state, empireId) === 'endgame-preparation',
  );
}

export function runProgressionScenario(
  input: ProgressionScenarioInput,
): ProgressionScenarioResult {
  const resolvedInput: Required<ProgressionScenarioInput> = {
    seed: input.seed,
    playerFaction: input.playerFaction,
    worldSpeed: input.worldSpeed ?? 2,
    maximumRealSeconds: input.maximumRealSeconds ?? 16 * 60 * 60,
    decisionStepGameSeconds: input.decisionStepGameSeconds ?? 240,
  };
  let state = createInitialGameState(resolvedInput.seed, {
    playerFaction: resolvedInput.playerFaction,
    campaignSettings: createCampaignSettings({
      scenarioPreset: 'campaign',
      worldSpeed: resolvedInput.worldSpeed,
      progressionProfile: 'compressed-v1',
      createdAtReal: '2026-07-30T00:00:00.000Z',
    }),
  });
  const phaseReachedAtRealSeconds: Record<
    string,
    Partial<Record<BotProgressionPhase, number>>
  > = {};
  let acceptedPlayerCommands = 0;
  let rejectedPlayerCommands = 0;
  recordPhases(state, resolvedInput.worldSpeed, phaseReachedAtRealSeconds);
  const maximumGameSeconds = resolvedInput.maximumRealSeconds * resolvedInput.worldSpeed;

  while (
    state.clock.elapsedSeconds < maximumGameSeconds &&
    !allEmpiresReachedEndgamePreparation(state)
  ) {
    const player = runPlayerDecision(state);
    state = runBotExpeditionDecisions(player.state);
    acceptedPlayerCommands += player.accepted;
    rejectedPlayerCommands += player.rejected;
    recordPhases(state, resolvedInput.worldSpeed, phaseReachedAtRealSeconds);
    if (allEmpiresReachedEndgamePreparation(state)) break;

    const remaining = maximumGameSeconds - state.clock.elapsedSeconds;
    const step = Math.min(resolvedInput.decisionStepGameSeconds, remaining);
    const advanced = advanceCampaignTime(state, step, { operationBudget: 50_000 });
    if (!advanced.complete) {
      throw new Error(
        `Progression scenario exhausted its operation budget with ${advanced.remainingGameSeconds} seconds remaining.`,
      );
    }
    state = advanced.state;
    recordPhases(state, resolvedInput.worldSpeed, phaseReachedAtRealSeconds);
  }

  return {
    input: resolvedInput,
    state,
    complete: allEmpiresReachedEndgamePreparation(state),
    elapsedRealSeconds: state.clock.elapsedSeconds / resolvedInput.worldSpeed,
    phaseReachedAtRealSeconds,
    acceptedPlayerCommands,
    rejectedPlayerCommands,
  };
}
