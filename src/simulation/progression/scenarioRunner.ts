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
import { getFactionIdForEmpire } from '../factions/factionMechanicalCatalogRegistry';
import { getFactionMechanicalRoles } from '../factions/factionMechanicalRoles';
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

export interface OrganicTerminalEmpireEvidence {
  readonly empireId: string;
  readonly planetDestroyerId: string;
  readonly firstPhysicalPlanetDestroyerAtRealSeconds: number | null;
  readonly physicalPlanetDestroyerCount: number;
  readonly maximumSolarWarScore: number;
  readonly positiveSolarWarResults: number;
  readonly strongestSolarWarFleetShips: number;
  readonly strongestSolarWarFleet: Readonly<Record<string, number>>;
}

export interface OrganicTerminalScenarioResult {
  readonly input: Required<ProgressionScenarioInput>;
  readonly state: GameState;
  readonly complete: boolean;
  readonly elapsedRealSeconds: number;
  readonly phaseReachedAtRealSeconds: Readonly<
    Record<string, Partial<Record<BotProgressionPhase, number>>>
  >;
  readonly acceptedPlayerCommands: number;
  readonly rejectedPlayerCommands: number;
  readonly empireEvidence: Readonly<Record<string, OrganicTerminalEmpireEvidence>>;
}

function resolveInput(input: ProgressionScenarioInput): Required<ProgressionScenarioInput> {
  return {
    seed: input.seed,
    playerFaction: input.playerFaction,
    worldSpeed: input.worldSpeed ?? 2,
    maximumRealSeconds: input.maximumRealSeconds ?? 14 * 24 * 60 * 60,
    decisionStepGameSeconds: input.decisionStepGameSeconds ?? 3_600,
  };
}

function createScenarioState(input: Required<ProgressionScenarioInput>): GameState {
  return createInitialGameState(input.seed, {
    playerFaction: input.playerFaction,
    campaignSettings: createCampaignSettings({
      scenarioPreset: 'campaign',
      worldSpeed: input.worldSpeed,
      progressionProfile: 'compressed-v1',
      createdAtReal: '2026-07-30T00:00:00.000Z',
    }),
  });
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

function countPhysicalShip(state: GameState, empireId: string, unitId: string): number {
  const planetCount = state.planets
    .filter((planet) => planet.ownerEmpireId === empireId)
    .reduce((total, planet) => total + (planet.inventory.ships[unitId] ?? 0), 0);
  return state.fleets
    .filter((fleet) => fleet.empireId === empireId)
    .reduce((total, fleet) => total + (fleet.ships[unitId] ?? 0), planetCount);
}

function recordPhysicalPlanetDestroyers(
  state: GameState,
  worldSpeed: WorldSpeed,
  firstProducedAt: Record<string, number | null>,
): void {
  const elapsedRealSeconds = state.clock.elapsedSeconds / worldSpeed;
  for (const empireId of state.empires) {
    if (firstProducedAt[empireId] !== null && firstProducedAt[empireId] !== undefined) continue;
    const factionId = getFactionIdForEmpire(state, empireId);
    const unitId = getFactionMechanicalRoles(factionId).ships.complete.planetDestroyer;
    if (countPhysicalShip(state, empireId, unitId) > 0) {
      firstProducedAt[empireId] = elapsedRealSeconds;
    } else if (firstProducedAt[empireId] === undefined) {
      firstProducedAt[empireId] = null;
    }
  }
}

function createEmpireEvidence(
  state: GameState,
  firstProducedAt: Readonly<Record<string, number | null>>,
): Readonly<Record<string, OrganicTerminalEmpireEvidence>> {
  return Object.fromEntries(state.empires.map((empireId) => {
    const factionId = getFactionIdForEmpire(state, empireId);
    const planetDestroyerId = getFactionMechanicalRoles(factionId).ships.complete.planetDestroyer;
    const results = state.endgameParticipation?.solarWar.history.filter(
      (result) => result.empireId === empireId,
    ) ?? [];
    const strongest = [...results].sort((left, right) => {
      const leftShips = Object.values(left.attackerInitial).reduce((sum, count) => sum + count, 0);
      const rightShips = Object.values(right.attackerInitial).reduce((sum, count) => sum + count, 0);
      return rightShips - leftShips || right.score - left.score;
    })[0];
    const strongestSolarWarFleet = strongest?.attackerInitial ?? {};
    const strongestSolarWarFleetShips = Object.values(strongestSolarWarFleet)
      .reduce((sum, count) => sum + count, 0);
    return [empireId, {
      empireId,
      planetDestroyerId,
      firstPhysicalPlanetDestroyerAtRealSeconds: firstProducedAt[empireId] ?? null,
      physicalPlanetDestroyerCount: countPhysicalShip(state, empireId, planetDestroyerId),
      maximumSolarWarScore: Math.max(0, ...results.map((result) => result.score)),
      positiveSolarWarResults: results.filter((result) => result.score > 0).length,
      strongestSolarWarFleetShips,
      strongestSolarWarFleet,
    } satisfies OrganicTerminalEmpireEvidence] as const;
  }));
}

function runScenarioFromState(
  initialState: GameState,
  input: Required<ProgressionScenarioInput>,
  stopAtEndgamePreparation: boolean,
): ProgressionScenarioResult | OrganicTerminalScenarioResult {
  let state = initialState;
  const phaseReachedAtRealSeconds: Record<
    string,
    Partial<Record<BotProgressionPhase, number>>
  > = {};
  const firstProducedAt: Record<string, number | null> = {};
  let acceptedPlayerCommands = 0;
  let rejectedPlayerCommands = 0;
  recordPhases(state, input.worldSpeed, phaseReachedAtRealSeconds);
  recordPhysicalPlanetDestroyers(state, input.worldSpeed, firstProducedAt);
  const maximumGameSeconds = input.maximumRealSeconds * input.worldSpeed;

  while (
    state.clock.elapsedSeconds < maximumGameSeconds &&
    state.campaignResult?.status !== 'terminal' &&
    !(stopAtEndgamePreparation && allEmpiresReachedEndgamePreparation(state))
  ) {
    const player = runPlayerDecision(state);
    state = runBotExpeditionDecisions(player.state);
    acceptedPlayerCommands += player.accepted;
    rejectedPlayerCommands += player.rejected;
    recordPhases(state, input.worldSpeed, phaseReachedAtRealSeconds);
    recordPhysicalPlanetDestroyers(state, input.worldSpeed, firstProducedAt);
    if (stopAtEndgamePreparation && allEmpiresReachedEndgamePreparation(state)) break;
    if (state.campaignResult?.status === 'terminal') break;

    const remaining = maximumGameSeconds - state.clock.elapsedSeconds;
    const step = Math.min(input.decisionStepGameSeconds, remaining);
    const advanced = advanceCampaignTime(state, step, { operationBudget: 50_000 });
    if (!advanced.complete) {
      throw new Error(
        `Progression scenario exhausted its operation budget with ${advanced.remainingGameSeconds} seconds remaining.`,
      );
    }
    state = advanced.state;
    recordPhases(state, input.worldSpeed, phaseReachedAtRealSeconds);
    recordPhysicalPlanetDestroyers(state, input.worldSpeed, firstProducedAt);
  }

  const common = {
    input,
    state,
    elapsedRealSeconds: state.clock.elapsedSeconds / input.worldSpeed,
    phaseReachedAtRealSeconds,
    acceptedPlayerCommands,
    rejectedPlayerCommands,
  };
  if (stopAtEndgamePreparation) {
    return {
      ...common,
      complete: allEmpiresReachedEndgamePreparation(state),
    };
  }
  return {
    ...common,
    complete: state.campaignResult?.status === 'terminal',
    empireEvidence: createEmpireEvidence(state, firstProducedAt),
  };
}

export function runProgressionScenario(
  input: ProgressionScenarioInput,
): ProgressionScenarioResult {
  const resolvedInput: Required<ProgressionScenarioInput> = {
    ...resolveInput(input),
    maximumRealSeconds: input.maximumRealSeconds ?? 16 * 60 * 60,
    decisionStepGameSeconds: input.decisionStepGameSeconds ?? 240,
  };
  return runScenarioFromState(
    createScenarioState(resolvedInput),
    resolvedInput,
    true,
  ) as ProgressionScenarioResult;
}

export function runOrganicTerminalScenario(
  input: ProgressionScenarioInput,
): OrganicTerminalScenarioResult {
  const resolvedInput = resolveInput(input);
  return runScenarioFromState(
    createScenarioState(resolvedInput),
    resolvedInput,
    false,
  ) as OrganicTerminalScenarioResult;
}

export function continueOrganicTerminalScenario(
  state: GameState,
  input: ProgressionScenarioInput,
): OrganicTerminalScenarioResult {
  const resolvedInput = resolveInput(input);
  if (state.campaignSettings.progressionProfile !== 'compressed-v1') {
    throw new Error('Organic terminal continuation requires compressed-v1 state.');
  }
  return runScenarioFromState(state, resolvedInput, false) as OrganicTerminalScenarioResult;
}
