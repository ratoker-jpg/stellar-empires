import type { ResourceCost } from '../economy/types';
import { appendCommandHistory } from '../history/stateHistory';
import { getBuildingDefinition } from '../planet/buildingCatalog';
import { queueBuildingConstruction } from '../planet/buildingQueue';
import {
  calculateBuildingCost,
  canAfford,
  findMissingRequirements,
  getBuildingLevel,
  spendResources,
} from '../planet/buildingProgression';
import { getCompleteBuildingIds } from '../planet/completeBuildingCatalog';
import type { FactionId, PlanetState } from '../planet/types';
import type { CommandResult, GameCommand, GameState } from '../types';
import {
  getAllianceMembers,
  getEmpireParticipation,
} from './participation';
import {
  FINAL_OBJECT_CONTRIBUTION_HISTORY_LIMIT,
  FINAL_OBJECT_HISTORY_LIMIT,
  type CampaignResult,
  type EndgameFinalObjectState,
  type FinalObjectContributionHistoryEntry,
  type FinalObjectHistoryEntry,
  type FinalObjectProject,
  type FinalObjectQualificationSnapshot,
  type SolarWarParticipationKind,
  type SolarWarResult,
} from './types';

const ZERO_RESOURCES: ResourceCost = { metal: 0, crystal: 0, gas: 0 };
const PROJECT_ID_PATTERN = /^final-project-([1-9]\d*)$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return isNonNegativeInteger(value) && value > 0;
}

function isFactionId(value: unknown): value is FactionId {
  return value === 'aegis' || value === 'synod' || value === 'veyra';
}

function isParticipationKind(value: unknown): value is SolarWarParticipationKind {
  return value === 'solo' || value === 'alliance';
}

function isResourceCost(value: unknown): value is ResourceCost {
  return isRecord(value) &&
    isNonNegativeInteger(value.metal) &&
    isNonNegativeInteger(value.crystal) &&
    isNonNegativeInteger(value.gas);
}

function resourceEquals(left: ResourceCost, right: ResourceCost): boolean {
  return left.metal === right.metal &&
    left.crystal === right.crystal &&
    left.gas === right.gas;
}

function addResources(left: ResourceCost, right: ResourceCost): ResourceCost {
  return {
    metal: left.metal + right.metal,
    crystal: left.crystal + right.crystal,
    gas: left.gas + right.gas,
  };
}

function remainingResources(required: ResourceCost, contributed: ResourceCost): ResourceCost {
  return {
    metal: required.metal - contributed.metal,
    crystal: required.crystal - contributed.crystal,
    gas: required.gas - contributed.gas,
  };
}

function isWithinResources(value: ResourceCost, maximum: ResourceCost): boolean {
  return value.metal <= maximum.metal &&
    value.crystal <= maximum.crystal &&
    value.gas <= maximum.gas;
}

function hasPositiveResource(value: ResourceCost): boolean {
  return value.metal > 0 || value.crystal > 0 || value.gas > 0;
}

function replacePlanet(
  planets: readonly PlanetState[],
  planetId: string,
  replacement: PlanetState,
): readonly PlanetState[] {
  return planets.map((planet) => (planet.id === planetId ? replacement : planet));
}

function projectSequence(projectId: string): number | undefined {
  const match = PROJECT_ID_PATTERN.exec(projectId);
  if (match === null) return undefined;
  const sequence = Number(match[1]);
  return Number.isSafeInteger(sequence) && sequence > 0 ? sequence : undefined;
}

function retainNewest<T>(entries: readonly T[], limit: number): readonly T[] {
  return entries.length <= limit ? entries : entries.slice(entries.length - limit);
}

function sortedUnique(values: readonly string[]): boolean {
  for (let index = 0; index < values.length; index += 1) {
    if (typeof values[index] !== 'string' || values[index]!.length === 0) return false;
    if (index > 0 && values[index - 1]!.localeCompare(values[index]!) >= 0) return false;
  }
  return true;
}

function isQualification(value: unknown): value is FinalObjectQualificationSnapshot {
  return isRecord(value) &&
    typeof value.cycleId === 'string' && value.cycleId.length > 0 &&
    isNonNegativeInteger(value.cycleIndex) &&
    isNonNegativeInteger(value.resolvedAt) &&
    isPositiveInteger(value.score);
}

function isFinalObjectProject(value: unknown, empireSet: ReadonlySet<string>): value is FinalObjectProject {
  if (!isRecord(value) ||
    typeof value.id !== 'string' || projectSequence(value.id) === undefined ||
    typeof value.ownerEmpireId !== 'string' || !empireSet.has(value.ownerEmpireId) ||
    typeof value.ownerPlanetId !== 'string' || value.ownerPlanetId.length === 0 ||
    !isFactionId(value.factionId) ||
    typeof value.obeliskBuildingId !== 'string' ||
    typeof value.gateBuildingId !== 'string' ||
    !isParticipationKind(value.participationKind) ||
    typeof value.participationId !== 'string' || value.participationId.length === 0 ||
    !(value.allianceId === null || typeof value.allianceId === 'string') ||
    !Array.isArray(value.eligibleEmpireIds) || value.eligibleEmpireIds.length === 0 ||
    !sortedUnique(value.eligibleEmpireIds as readonly string[]) ||
    !(value.eligibleEmpireIds as readonly string[]).every((empireId) => empireSet.has(empireId)) ||
    !(value.eligibleEmpireIds as readonly string[]).includes(value.ownerEmpireId) ||
    !isQualification(value.qualification) ||
    !(value.phase === 'funding' || value.phase === 'building' || value.phase === 'vulnerable') ||
    !isResourceCost(value.requiredResources) ||
    !hasPositiveResource(value.requiredResources) ||
    !isResourceCost(value.contributedResources) ||
    !isWithinResources(value.contributedResources, value.requiredResources) ||
    !Array.isArray(value.contributionByEmpire) ||
    value.contributionByEmpire.length !== value.eligibleEmpireIds.length ||
    !isNonNegativeInteger(value.startedAt)) {
    return false;
  }

  if (value.participationKind === 'solo') {
    if (value.allianceId !== null || value.participationId !== value.ownerEmpireId ||
      value.eligibleEmpireIds.length !== 1 || value.eligibleEmpireIds[0] !== value.ownerEmpireId) return false;
  } else if (value.allianceId !== value.participationId || value.allianceId === null) {
    return false;
  }

  const expectedIds = value.eligibleEmpireIds as readonly string[];
  let sum = ZERO_RESOURCES;
  for (let index = 0; index < value.contributionByEmpire.length; index += 1) {
    const contribution = value.contributionByEmpire[index];
    if (!isRecord(contribution) || contribution.empireId !== expectedIds[index] ||
      !isResourceCost(contribution.resources)) return false;
    sum = addResources(sum, contribution.resources);
  }
  if (!resourceEquals(sum, value.contributedResources)) return false;

  const factionIds = getCompleteBuildingIds(value.factionId);
  if (value.obeliskBuildingId !== factionIds.galacticObelisk ||
    value.gateBuildingId !== factionIds.supremeGalacticGates) return false;

  if (value.phase === 'funding') {
    return value.fundedAt === undefined &&
      value.gateQueueItemId === undefined && value.gateCompletesAt === undefined &&
      value.vulnerabilityStartedAt === undefined && value.stabilizesAt === undefined &&
      !resourceEquals(value.contributedResources, value.requiredResources);
  }

  if (!resourceEquals(value.contributedResources, value.requiredResources) ||
    !isNonNegativeInteger(value.fundedAt) || value.fundedAt < value.startedAt ||
    typeof value.gateQueueItemId !== 'string' || value.gateQueueItemId.length === 0 ||
    !isNonNegativeInteger(value.gateCompletesAt) || value.gateCompletesAt < value.fundedAt) {
    return false;
  }

  if (value.phase === 'building') {
    return value.vulnerabilityStartedAt === undefined && value.stabilizesAt === undefined;
  }

  return isNonNegativeInteger(value.vulnerabilityStartedAt) &&
    value.vulnerabilityStartedAt >= value.gateCompletesAt &&
    isNonNegativeInteger(value.stabilizesAt) &&
    value.stabilizesAt >= value.vulnerabilityStartedAt;
}

export function createInitialEndgameFinalObjectState(): EndgameFinalObjectState {
  return {
    activeProjects: [],
    history: [],
    contributionHistory: [],
    nextProjectSequence: 1,
    nextHistorySequence: 0,
    nextContributionSequence: 0,
  };
}

export function createInitialCampaignResult(): CampaignResult {
  return { status: 'ongoing' };
}

export function isCampaignResult(value: unknown, empireIds: readonly string[]): value is CampaignResult {
  if (!isRecord(value)) return false;
  if (value.status === 'ongoing') return Object.keys(value).length === 1;
  if (value.status !== 'terminal' ||
    !isParticipationKind(value.winningParticipationKind) ||
    typeof value.winningParticipationId !== 'string' || value.winningParticipationId.length === 0 ||
    !Array.isArray(value.winningEmpireIds) || value.winningEmpireIds.length === 0 ||
    !sortedUnique(value.winningEmpireIds as readonly string[]) ||
    typeof value.ownerEmpireId !== 'string' ||
    typeof value.hostPlanetId !== 'string' || value.hostPlanetId.length === 0 ||
    !isNonNegativeInteger(value.terminalAt) || value.reason !== 'final-gate-stabilized') return false;
  const empireSet = new Set(empireIds);
  if (!(value.winningEmpireIds as readonly string[]).every((empireId) => empireSet.has(empireId)) ||
    !empireSet.has(value.ownerEmpireId) ||
    !(value.winningEmpireIds as readonly string[]).includes(value.ownerEmpireId)) return false;
  if (value.winningParticipationKind === 'solo') {
    return value.winningParticipationId === value.ownerEmpireId &&
      value.winningEmpireIds.length === 1 && value.winningEmpireIds[0] === value.ownerEmpireId;
  }
  return true;
}

export function isEndgameFinalObjectState(
  value: unknown,
  empireIds: readonly string[],
): value is EndgameFinalObjectState {
  if (!isRecord(value) || !Array.isArray(value.activeProjects) || !Array.isArray(value.history) ||
    !Array.isArray(value.contributionHistory) || !isPositiveInteger(value.nextProjectSequence) ||
    !isNonNegativeInteger(value.nextHistorySequence) || !isNonNegativeInteger(value.nextContributionSequence) ||
    value.history.length > FINAL_OBJECT_HISTORY_LIMIT ||
    value.contributionHistory.length > FINAL_OBJECT_CONTRIBUTION_HISTORY_LIMIT) return false;

  const empireSet = new Set(empireIds);
  if (empireSet.size !== empireIds.length) return false;
  const projectIds = new Set<string>();
  const participationIds = new Set<string>();
  const hostPlanetIds = new Set<string>();
  let previousProjectSequence = 0;
  for (const candidate of value.activeProjects as readonly unknown[]) {
    if (!isFinalObjectProject(candidate, empireSet)) return false;
    const sequence = projectSequence(candidate.id)!;
    if (sequence <= previousProjectSequence || sequence >= value.nextProjectSequence ||
      projectIds.has(candidate.id) || participationIds.has(candidate.participationId) ||
      hostPlanetIds.has(candidate.ownerPlanetId)) return false;
    previousProjectSequence = sequence;
    projectIds.add(candidate.id);
    participationIds.add(candidate.participationId);
    hostPlanetIds.add(candidate.ownerPlanetId);
  }

  let previousHistorySequence = -1;
  for (const candidate of value.history as readonly unknown[]) {
    if (!isRecord(candidate) || !isNonNegativeInteger(candidate.sequence) ||
      candidate.sequence <= previousHistorySequence || candidate.sequence >= value.nextHistorySequence ||
      typeof candidate.projectId !== 'string' || projectSequence(candidate.projectId) === undefined ||
      candidate.action !== 'cancelled' || typeof candidate.ownerEmpireId !== 'string' ||
      !empireSet.has(candidate.ownerEmpireId) || typeof candidate.ownerPlanetId !== 'string' ||
      typeof candidate.participationId !== 'string' || !isNonNegativeInteger(candidate.occurredAt)) return false;
    previousHistorySequence = candidate.sequence;
  }

  let previousContributionSequence = -1;
  for (const candidate of value.contributionHistory as readonly unknown[]) {
    if (!isRecord(candidate) || !isNonNegativeInteger(candidate.sequence) ||
      candidate.sequence <= previousContributionSequence || candidate.sequence >= value.nextContributionSequence ||
      typeof candidate.projectId !== 'string' || projectSequence(candidate.projectId) === undefined ||
      typeof candidate.empireId !== 'string' || !empireSet.has(candidate.empireId) ||
      typeof candidate.sourcePlanetId !== 'string' || !isResourceCost(candidate.resources) ||
      !hasPositiveResource(candidate.resources) || !isNonNegativeInteger(candidate.occurredAt)) return false;
    previousContributionSequence = candidate.sequence;
  }
  return true;
}

export function getFinalObjectQualification(
  state: GameState,
  empireId: string,
): { readonly kind: SolarWarParticipationKind; readonly participationId: string; readonly allianceId: string | null; readonly result: SolarWarResult } | undefined {
  const participation = state.endgameParticipation;
  if (participation === undefined) return undefined;
  const participant = getEmpireParticipation(participation, empireId);
  if (participant === undefined) return undefined;
  const kind: SolarWarParticipationKind = participant.allianceId === null ? 'solo' : 'alliance';
  const participationId = participant.allianceId ?? empireId;
  for (let index = participation.solarWar.history.length - 1; index >= 0; index -= 1) {
    const result = participation.solarWar.history[index]!;
    if (result.score > 0 && result.participationKind === kind &&
      result.participationId === participationId && result.allianceId === participant.allianceId) {
      return { kind, participationId, allianceId: participant.allianceId, result };
    }
  }
  return undefined;
}

export function canQueueQualifiedObelisk(
  state: GameState,
  empireId: string,
  planet: PlanetState,
  buildingId: string,
): boolean {
  if (state.campaignResult?.status !== 'ongoing') return false;
  const expected = getCompleteBuildingIds(planet.factionId).galacticObelisk;
  return buildingId === expected && getFinalObjectQualification(state, empireId) !== undefined;
}

function unavailableFinalObjects(): CommandResult<never> {
  return {
    ok: false,
    code: 'FINAL_OBJECTS_UNAVAILABLE',
    message: 'The campaign state has not been migrated to final-object support.',
  };
}

function activeState(state: GameState): EndgameFinalObjectState | undefined {
  return state.endgameFinalObjects;
}

function successfulMutation(
  state: GameState,
  command: GameCommand,
  finalObjects: EndgameFinalObjectState,
): CommandResult<GameState> {
  return {
    ok: true,
    value: {
      ...state,
      endgameFinalObjects: finalObjects,
      commandLog: appendCommandHistory(state.commandLog, command),
    },
  };
}

function currentCohort(state: GameState, empireId: string, allianceId: string | null): readonly string[] {
  if (allianceId === null) return [empireId];
  const participation = state.endgameParticipation;
  if (participation === undefined) return [];
  return getAllianceMembers(participation, allianceId)
    .map((participant) => participant.empireId)
    .sort((left, right) => left.localeCompare(right));
}

function gateReadiness(
  state: GameState,
  planet: PlanetState,
  gateBuildingId: string,
): CommandResult<{ readonly definition: NonNullable<ReturnType<typeof getBuildingDefinition>>; readonly cost: ResourceCost }> {
  const definition = getBuildingDefinition(gateBuildingId);
  if (definition === undefined) {
    return { ok: false, code: 'FINAL_GATE_NOT_FOUND', message: 'The faction final Gate is not registered.' };
  }
  if (planet.buildQueue.length > 0) {
    return { ok: false, code: 'BUILD_QUEUE_BUSY', message: 'The final-project host construction queue is occupied.' };
  }
  if (getBuildingLevel(planet.buildings, gateBuildingId) > 0) {
    return { ok: false, code: 'FINAL_GATE_ALREADY_BUILT', message: 'The final Gate is already present on this planet.' };
  }
  const profileId = state.campaignSettings.progressionProfile;
  const missingRequirements = findMissingRequirements(planet, definition.requirements, profileId);
  if (missingRequirements.length > 0) {
    return {
      ok: false,
      code: 'FINAL_GATE_REQUIREMENTS_NOT_MET',
      message: 'The final Gate prerequisites are not met.',
      details: { missingRequirements },
    };
  }
  const zone = planet.zones[definition.zoneId];
  if (zone.fieldLimit - zone.usedFields < definition.fieldCost) {
    return { ok: false, code: 'ZONE_FIELDS_FULL', message: 'The final-project host has no free military field.' };
  }
  return {
    ok: true,
    value: {
      definition,
      cost: calculateBuildingCost(definition, 1, profileId),
    },
  };
}

export function startFinalObjectProject(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'START_FINAL_OBJECT_PROJECT' }>,
): CommandResult<GameState> {
  const finalObjects = activeState(state);
  if (finalObjects === undefined || state.campaignResult === undefined) return unavailableFinalObjects();
  if (state.campaignResult.status !== 'ongoing') {
    return { ok: false, code: 'CAMPAIGN_TERMINAL', message: 'The campaign has already reached a terminal result.' };
  }
  const planet = state.planets.find((candidate) => candidate.id === command.planetId);
  if (planet === undefined || planet.ownerEmpireId !== command.empireId) {
    return { ok: false, code: 'FINAL_PROJECT_HOST_NOT_OWNED', message: 'The final-project host must be owned by the project owner.' };
  }
  const ids = getCompleteBuildingIds(planet.factionId);
  if (getBuildingLevel(planet.buildings, ids.galacticObelisk) < 1) {
    return { ok: false, code: 'FINAL_OBELISK_REQUIRED', message: 'A completed faction Obelisk is required before final Gate funding can begin.' };
  }
  const qualification = getFinalObjectQualification(state, command.empireId);
  if (qualification === undefined) {
    return { ok: false, code: 'FINAL_OBJECT_NOT_QUALIFIED', message: 'A positive Solar War result is required for the current participation identity.' };
  }
  if (finalObjects.activeProjects.some((project) => project.participationId === qualification.participationId)) {
    return { ok: false, code: 'FINAL_PROJECT_PARTICIPATION_ACTIVE', message: 'This participation identity already has an active final project.' };
  }
  if (finalObjects.activeProjects.some((project) => project.ownerPlanetId === planet.id)) {
    return { ok: false, code: 'FINAL_PROJECT_HOST_ACTIVE', message: 'This planet already hosts an active final project.' };
  }
  const readiness = gateReadiness(state, planet, ids.supremeGalacticGates);
  if (!readiness.ok) return readiness;
  const eligibleEmpireIds = currentCohort(state, command.empireId, qualification.allianceId);
  if (eligibleEmpireIds.length === 0 || !eligibleEmpireIds.includes(command.empireId)) {
    return { ok: false, code: 'FINAL_PROJECT_COHORT_INVALID', message: 'The current participation cohort cannot be snapshotted.' };
  }
  const project: FinalObjectProject = {
    id: `final-project-${finalObjects.nextProjectSequence}`,
    ownerEmpireId: command.empireId,
    ownerPlanetId: planet.id,
    factionId: planet.factionId,
    obeliskBuildingId: ids.galacticObelisk,
    gateBuildingId: ids.supremeGalacticGates,
    participationKind: qualification.kind,
    participationId: qualification.participationId,
    allianceId: qualification.allianceId,
    eligibleEmpireIds,
    qualification: {
      cycleId: qualification.result.cycleId,
      cycleIndex: qualification.result.cycleIndex,
      resolvedAt: qualification.result.resolvedAt,
      score: qualification.result.score,
    },
    phase: 'funding',
    requiredResources: readiness.value.cost,
    contributedResources: ZERO_RESOURCES,
    contributionByEmpire: eligibleEmpireIds.map((empireId) => ({ empireId, resources: ZERO_RESOURCES })),
    startedAt: state.clock.elapsedSeconds,
  };
  return successfulMutation(state, command, {
    ...finalObjects,
    activeProjects: [...finalObjects.activeProjects, project],
    nextProjectSequence: finalObjects.nextProjectSequence + 1,
  });
}

function updateContributionByEmpire(
  project: FinalObjectProject,
  empireId: string,
  resources: ResourceCost,
): FinalObjectProject['contributionByEmpire'] {
  return project.contributionByEmpire.map((entry) =>
    entry.empireId === empireId
      ? { ...entry, resources: addResources(entry.resources, resources) }
      : entry,
  );
}

function appendContributionHistory(
  finalObjects: EndgameFinalObjectState,
  projectId: string,
  empireId: string,
  sourcePlanetId: string,
  resources: ResourceCost,
  occurredAt: number,
): Pick<EndgameFinalObjectState, 'contributionHistory' | 'nextContributionSequence'> {
  const entry: FinalObjectContributionHistoryEntry = {
    sequence: finalObjects.nextContributionSequence,
    projectId,
    empireId,
    sourcePlanetId,
    resources,
    occurredAt,
  };
  return {
    contributionHistory: retainNewest(
      [...finalObjects.contributionHistory, entry],
      FINAL_OBJECT_CONTRIBUTION_HISTORY_LIMIT,
    ),
    nextContributionSequence: finalObjects.nextContributionSequence + 1,
  };
}

export function contributeFinalObjectProject(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'CONTRIBUTE_FINAL_OBJECT_PROJECT' }>,
): CommandResult<GameState> {
  const finalObjects = activeState(state);
  if (finalObjects === undefined || state.campaignResult === undefined) return unavailableFinalObjects();
  if (state.campaignResult.status !== 'ongoing') {
    return { ok: false, code: 'CAMPAIGN_TERMINAL', message: 'The campaign has already reached a terminal result.' };
  }
  const project = finalObjects.activeProjects.find((candidate) => candidate.id === command.projectId);
  if (project === undefined) {
    return { ok: false, code: 'FINAL_PROJECT_NOT_FOUND', message: 'The requested final project is not active.' };
  }
  if (project.phase !== 'funding') {
    return { ok: false, code: 'FINAL_PROJECT_NOT_FUNDING', message: 'This final project is no longer accepting contributions.' };
  }
  if (!project.eligibleEmpireIds.includes(command.empireId)) {
    return { ok: false, code: 'FINAL_PROJECT_NOT_ELIGIBLE', message: 'This empire was not in the project participation snapshot.' };
  }
  if (!isResourceCost(command.resources) || !hasPositiveResource(command.resources)) {
    return { ok: false, code: 'INVALID_FINAL_CONTRIBUTION', message: 'A contribution must contain positive finite whole resources.' };
  }
  const remaining = remainingResources(project.requiredResources, project.contributedResources);
  if (!isWithinResources(command.resources, remaining)) {
    return { ok: false, code: 'FINAL_OBJECT_OVERFUND', message: 'A contribution cannot exceed the remaining Gate funding target.', details: { remaining } };
  }
  const source = state.planets.find((planet) => planet.id === command.sourcePlanetId);
  if (source === undefined || source.ownerEmpireId !== command.empireId) {
    return { ok: false, code: 'FINAL_CONTRIBUTION_SOURCE_NOT_OWNED', message: 'Contributions must be spent from a contributor-owned planet.' };
  }
  if (!canAfford(source.economy, command.resources)) {
    return { ok: false, code: 'INSUFFICIENT_RESOURCES', message: 'The contribution source does not have enough resources.' };
  }

  const contributedResources = addResources(project.contributedResources, command.resources);
  const fullyFunded = resourceEquals(contributedResources, project.requiredResources);
  if (fullyFunded) {
    const hostBeforeSpend = state.planets.find((planet) => planet.id === project.ownerPlanetId);
    if (hostBeforeSpend === undefined || hostBeforeSpend.ownerEmpireId !== project.ownerEmpireId) {
      return { ok: false, code: 'FINAL_PROJECT_HOST_UNAVAILABLE', message: 'The final-project host is no longer available.' };
    }
    const readiness = gateReadiness(state, hostBeforeSpend, project.gateBuildingId);
    if (!readiness.ok) return readiness;
    if (!resourceEquals(readiness.value.cost, project.requiredResources)) {
      return { ok: false, code: 'FINAL_PROJECT_COST_CHANGED', message: 'The project funding target no longer matches the canonical Gate cost.' };
    }
  }

  const spentSource: PlanetState = { ...source, economy: spendResources(source.economy, command.resources) };
  let workingState: GameState = {
    ...state,
    planets: replacePlanet(state.planets, source.id, spentSource),
  };
  let updatedProject: FinalObjectProject = {
    ...project,
    contributedResources,
    contributionByEmpire: updateContributionByEmpire(project, command.empireId, command.resources),
  };

  if (fullyFunded) {
    const host = workingState.planets.find((planet) => planet.id === project.ownerPlanetId)!;
    const definition = getBuildingDefinition(project.gateBuildingId)!;
    const queued = queueBuildingConstruction(
      workingState,
      host,
      project.ownerEmpireId,
      definition,
      1,
      project.requiredResources,
      true,
    );
    workingState = queued.state;
    updatedProject = {
      ...updatedProject,
      phase: 'building',
      fundedAt: state.clock.elapsedSeconds,
      gateQueueItemId: queued.queueItemId,
      gateCompletesAt: queued.completesAt,
    };
  }

  const contributionHistory = appendContributionHistory(
    finalObjects,
    project.id,
    command.empireId,
    command.sourcePlanetId,
    command.resources,
    state.clock.elapsedSeconds,
  );
  const updatedFinalObjects: EndgameFinalObjectState = {
    ...finalObjects,
    activeProjects: finalObjects.activeProjects.map((candidate) =>
      candidate.id === project.id ? updatedProject : candidate,
    ),
    ...contributionHistory,
  };
  return {
    ok: true,
    value: {
      ...workingState,
      endgameFinalObjects: updatedFinalObjects,
      commandLog: appendCommandHistory(state.commandLog, command),
    },
  };
}

function appendProjectHistory(
  finalObjects: EndgameFinalObjectState,
  project: FinalObjectProject,
  occurredAt: number,
): Pick<EndgameFinalObjectState, 'history' | 'nextHistorySequence'> {
  const entry: FinalObjectHistoryEntry = {
    sequence: finalObjects.nextHistorySequence,
    projectId: project.id,
    action: 'cancelled',
    ownerEmpireId: project.ownerEmpireId,
    ownerPlanetId: project.ownerPlanetId,
    participationId: project.participationId,
    occurredAt,
  };
  return {
    history: retainNewest([...finalObjects.history, entry], FINAL_OBJECT_HISTORY_LIMIT),
    nextHistorySequence: finalObjects.nextHistorySequence + 1,
  };
}

export function cancelFinalObjectProject(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'CANCEL_FINAL_OBJECT_PROJECT' }>,
): CommandResult<GameState> {
  const finalObjects = activeState(state);
  if (finalObjects === undefined || state.campaignResult === undefined) return unavailableFinalObjects();
  if (state.campaignResult.status !== 'ongoing') {
    return { ok: false, code: 'CAMPAIGN_TERMINAL', message: 'The campaign has already reached a terminal result.' };
  }
  const project = finalObjects.activeProjects.find((candidate) => candidate.id === command.projectId);
  if (project === undefined) {
    return { ok: false, code: 'FINAL_PROJECT_NOT_FOUND', message: 'The requested final project is not active.' };
  }
  if (project.ownerEmpireId !== command.empireId) {
    return { ok: false, code: 'FINAL_PROJECT_NOT_OWNER', message: 'Only the project owner can cancel this final project.' };
  }
  if (project.phase === 'vulnerable') {
    return { ok: false, code: 'FINAL_PROJECT_CANCEL_UNAVAILABLE', message: 'A completed vulnerable Gate cannot be cancelled as a funding project.' };
  }

  let workingState = state;
  if (project.phase === 'building' && project.gateQueueItemId !== undefined) {
    const host = state.planets.find((planet) => planet.id === project.ownerPlanetId);
    if (host === undefined || !host.buildQueue.some((item) => item.id === project.gateQueueItemId)) {
      return { ok: false, code: 'FINAL_PROJECT_CANCEL_UNAVAILABLE', message: 'The funded Gate construction order is no longer cancellable.' };
    }
    const updatedHost: PlanetState = {
      ...host,
      buildQueue: host.buildQueue.filter((item) => item.id !== project.gateQueueItemId),
    };
    workingState = {
      ...state,
      planets: replacePlanet(state.planets, host.id, updatedHost),
      pendingEvents: state.pendingEvents.filter((event) =>
        !(event.payload.type === 'BUILDING_COMPLETE' && event.payload.queueItemId === project.gateQueueItemId)),
    };
  }
  const history = appendProjectHistory(finalObjects, project, state.clock.elapsedSeconds);
  return {
    ok: true,
    value: {
      ...workingState,
      endgameFinalObjects: {
        ...finalObjects,
        activeProjects: finalObjects.activeProjects.filter((candidate) => candidate.id !== project.id),
        ...history,
      },
      commandLog: appendCommandHistory(state.commandLog, command),
    },
  };
}

export function isFinalProjectGateQueueItem(state: GameState, queueItemId: string): boolean {
  return state.endgameFinalObjects?.activeProjects.some(
    (project) => project.phase === 'building' && project.gateQueueItemId === queueItemId,
  ) === true;
}
