import {
  getAllianceMembers,
  getEmpireParticipation,
  isEmpireSoloEligible,
  normalizeAllianceName,
} from '../simulation/endgame/participation';
import { enterSolarWar } from '../simulation/endgame/solarWar';
import {
  getCurrentSolarWarCycle,
  getEligibleSolarWarFleets,
  getSolarWarEntryForEmpire,
  getSolarWarPublicResults,
  getSolarWarResultsForEmpire,
  getSolarWarScoreboard,
} from '../simulation/endgame/solarWarView';
import {
  ALLIANCE_NAME_MAX_LENGTH,
  ALLIANCE_NAME_MIN_LENGTH,
  type EndgameAlliance,
  type SolarWarEntry,
  type SolarWarOutcome,
  type SolarWarParticipationKind,
} from '../simulation/endgame/types';
import type { FleetState } from '../simulation/fleets/types';
import type { GameState } from '../simulation/types';
import { getUnitDefinition } from '../simulation/units/catalog';

export const PLAYER_EMPIRE_ID = 'player';

const FACTION_LABELS = {
  aegis: 'Эгида',
  synod: 'Синод',
  veyra: 'Вейра',
} as const;

const OUTCOME_LABELS: Readonly<Record<SolarWarOutcome, string>> = {
  victory: 'Победа',
  defeat: 'Поражение',
  draw: 'Ничья',
};

const SOLAR_WAR_VALIDATION_MESSAGES: Readonly<Record<string, string>> = {
  ENDGAME_PARTICIPATION_UNAVAILABLE: 'Состояние участия в эндгейме недоступно.',
  EMPIRE_NOT_FOUND: 'Империя игрока недоступна.',
  SOLAR_WAR_ENTRY_ACTIVE: 'У империи уже есть активный вход в текущую Солнечную войну.',
  SOLAR_WAR_FLEET_NOT_FOUND: 'Выбранный флот больше недоступен.',
  SOLAR_WAR_FLEET_NOT_IDLE: 'Нужен собственный станционированный флот без активной миссии.',
  SOLAR_WAR_FLEET_NOT_COMBAT_CAPABLE: 'Во флоте должен быть хотя бы один боевой корабль.',
  SOLAR_WAR_ORIGIN_UNAVAILABLE: 'Планета базирования флота недоступна.',
};

export interface AllianceRosterView {
  readonly id: string;
  readonly name: string;
  readonly founderEmpireId: string;
  readonly createdAt: number;
  readonly members: readonly string[];
  readonly memberCount: number;
  readonly current: boolean;
  readonly canJoin: boolean;
}

export interface SolarWarFleetOptionView {
  readonly id: string;
  readonly originPlanetId: string;
  readonly label: string;
  readonly shipCount: number;
  readonly composition: string;
}

export interface SolarWarPublicResultView {
  readonly id: string;
  readonly cycleId: string;
  readonly cycleIndex: number;
  readonly empireId: string;
  readonly participationKind: SolarWarParticipationKind;
  readonly participationId: string;
  readonly allianceId: string | null;
  readonly resolvedAt: number;
  readonly outcome: SolarWarOutcome;
  readonly outcomeLabel: string;
  readonly score: number;
}

export interface SolarWarOwnedResultView extends SolarWarPublicResultView {
  readonly fleetId: string;
  readonly originPlanetId: string;
  readonly ownLosses: string;
  readonly ownSurvivors: string;
  readonly enemyLosses: string;
  readonly enemySurvivors: string;
}

export interface SolarWarScoreboardView {
  readonly participationKind: SolarWarParticipationKind;
  readonly participationId: string;
  readonly allianceId: string | null;
  readonly label: string;
  readonly score: number;
  readonly entries: number;
  readonly victories: number;
  readonly draws: number;
  readonly defeats: number;
}

export interface EndgameOperationsViewModel {
  readonly available: boolean;
  readonly empireId: string;
  readonly soloEligible: boolean;
  readonly participationKind: SolarWarParticipationKind;
  readonly currentAllianceId: string | null;
  readonly currentAllianceName: string | null;
  readonly canCreateAlliance: boolean;
  readonly canLeaveAlliance: boolean;
  readonly alliances: readonly AllianceRosterView[];
  readonly cycle: {
    readonly id: string;
    readonly index: number;
    readonly startsAt: number;
    readonly resolvesAt: number;
    readonly remainingSeconds: number;
    readonly factionLabel: string;
    readonly enemySummary: string;
  };
  readonly eligibleFleets: readonly SolarWarFleetOptionView[];
  readonly activeEntry: SolarWarEntry | null;
  readonly publicResults: readonly SolarWarPublicResultView[];
  readonly ownedResults: readonly SolarWarOwnedResultView[];
  readonly scoreboardCycleIndex: number;
  readonly scoreboard: readonly SolarWarScoreboardView[];
}

export interface AllianceNameValidation {
  readonly ok: boolean;
  readonly normalizedName: string;
  readonly message: string;
}

export interface SolarWarEntryValidation {
  readonly ok: boolean;
  readonly code: string | null;
  readonly message: string;
}

function containsControlCharacter(value: string): boolean {
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint !== undefined && (codePoint <= 0x1f || codePoint === 0x7f)) return true;
  }
  return false;
}

export function validateAllianceNameInput(value: string): AllianceNameValidation {
  const normalizedName = normalizeAllianceName(value);
  if (
    normalizedName.length < ALLIANCE_NAME_MIN_LENGTH ||
    normalizedName.length > ALLIANCE_NAME_MAX_LENGTH ||
    containsControlCharacter(normalizedName)
  ) {
    return {
      ok: false,
      normalizedName,
      message: `Название должно содержать ${ALLIANCE_NAME_MIN_LENGTH}–${ALLIANCE_NAME_MAX_LENGTH} символов без управляющих знаков.`,
    };
  }
  return {
    ok: true,
    normalizedName,
    message: 'Название готово к созданию публичного альянса.',
  };
}

function totalShips(fleet: FleetState): number {
  return Object.values(fleet.ships).reduce((total, count) => total + count, 0);
}

function unitSummary(units: Readonly<Record<string, number>>): string {
  const entries = Object.entries(units).filter(([, count]) => count > 0);
  if (entries.length === 0) return 'нет';
  return entries
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([unitId, count]) => `${getUnitDefinition(unitId)?.name ?? unitId} ×${count}`)
    .join(' · ');
}

function unitLossSummary(
  initial: Readonly<Record<string, number>>,
  remaining: Readonly<Record<string, number>>,
): string {
  const losses = Object.fromEntries(
    Object.entries(initial)
      .map(([unitId, count]) => [unitId, Math.max(0, count - (remaining[unitId] ?? 0))] as const)
      .filter(([, count]) => count > 0),
  );
  return unitSummary(losses);
}

function allianceName(alliances: readonly EndgameAlliance[], allianceId: string | null): string | null {
  if (allianceId === null) return null;
  return alliances.find((alliance) => alliance.id === allianceId)?.name ?? allianceId;
}

function createAllianceViews(
  state: GameState,
  empireId: string,
  currentAllianceId: string | null,
): readonly AllianceRosterView[] {
  const participation = state.endgameParticipation;
  if (participation === undefined) return [];
  return participation.alliances.map((alliance): AllianceRosterView => {
    const members = getAllianceMembers(participation, alliance.id).map((member) => member.empireId);
    return {
      id: alliance.id,
      name: alliance.name,
      founderEmpireId: alliance.founderEmpireId,
      createdAt: alliance.createdAt,
      members,
      memberCount: members.length,
      current: alliance.id === currentAllianceId,
      canJoin: currentAllianceId === null && !members.includes(empireId),
    };
  });
}

function createFleetOption(state: GameState, fleet: FleetState): SolarWarFleetOptionView {
  const originPlanetId = fleet.location.type === 'planet'
    ? fleet.location.planetId
    : fleet.originPlanetId;
  const origin = state.planets.find((planet) => planet.id === originPlanetId);
  const shipCount = totalShips(fleet);
  const composition = unitSummary(fleet.ships);
  return {
    id: fleet.id,
    originPlanetId,
    shipCount,
    composition,
    label: `${fleet.id} · ${origin?.name ?? originPlanetId} · кораблей ${shipCount}`,
  };
}

function publicResultView(result: ReturnType<typeof getSolarWarPublicResults>[number]): SolarWarPublicResultView {
  return {
    ...result,
    outcomeLabel: OUTCOME_LABELS[result.outcome],
  };
}

export function createEndgameOperationsViewModel(
  state: GameState,
  empireId = PLAYER_EMPIRE_ID,
): EndgameOperationsViewModel {
  const participation = state.endgameParticipation;
  const participant = participation === undefined
    ? undefined
    : getEmpireParticipation(participation, empireId);
  const currentAllianceId = participant?.allianceId ?? null;
  const cycle = getCurrentSolarWarCycle(state);
  const eligibleFleets = getEligibleSolarWarFleets(state, empireId)
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((fleet) => createFleetOption(state, fleet));
  const publicResults = getSolarWarPublicResults(state)
    .slice()
    .sort((left, right) => right.resolvedAt - left.resolvedAt || left.id.localeCompare(right.id))
    .slice(0, 16)
    .map(publicResultView);
  const ownedResults = getSolarWarResultsForEmpire(state, empireId)
    .slice()
    .sort((left, right) => right.resolvedAt - left.resolvedAt || left.id.localeCompare(right.id))
    .slice(0, 12)
    .map((result): SolarWarOwnedResultView => ({
      ...publicResultView(result),
      fleetId: result.fleetId,
      originPlanetId: result.originPlanetId,
      ownLosses: unitLossSummary(result.attackerInitial, result.attackerRemaining),
      ownSurvivors: unitSummary(result.attackerRemaining),
      enemyLosses: unitLossSummary(result.enemyInitial, result.enemyRemaining),
      enemySurvivors: unitSummary(result.enemyRemaining),
    }));
  const scoreboardCycleIndex = publicResults[0]?.cycleIndex ?? cycle.cycleIndex;
  const scoreboard = getSolarWarScoreboard(state, scoreboardCycleIndex).map(
    (row): SolarWarScoreboardView => ({
      ...row,
      label: row.participationKind === 'alliance'
        ? allianceName(participation?.alliances ?? [], row.allianceId) ?? row.participationId
        : row.participationId,
    }),
  );

  return {
    available: participation !== undefined && participant !== undefined,
    empireId,
    soloEligible: participation === undefined
      ? false
      : isEmpireSoloEligible(participation, empireId),
    participationKind: currentAllianceId === null ? 'solo' : 'alliance',
    currentAllianceId,
    currentAllianceName: allianceName(participation?.alliances ?? [], currentAllianceId),
    canCreateAlliance: participation !== undefined && participant?.allianceId === null,
    canLeaveAlliance: participant?.allianceId !== null && participant?.allianceId !== undefined,
    alliances: createAllianceViews(state, empireId, currentAllianceId),
    cycle: {
      id: cycle.id,
      index: cycle.cycleIndex,
      startsAt: cycle.startsAt,
      resolvesAt: cycle.resolvesAt,
      remainingSeconds: Math.max(0, cycle.resolvesAt - state.clock.elapsedSeconds),
      factionLabel: FACTION_LABELS[cycle.factionId],
      enemySummary: unitSummary(cycle.enemyUnits),
    },
    eligibleFleets,
    activeEntry: getSolarWarEntryForEmpire(state, empireId) ?? null,
    publicResults,
    ownedResults,
    scoreboardCycleIndex,
    scoreboard,
  };
}

export function validateSolarWarEntrySelection(
  state: GameState,
  fleetId: string,
  empireId = PLAYER_EMPIRE_ID,
): SolarWarEntryValidation {
  if (fleetId.length === 0) {
    return {
      ok: false,
      code: 'SOLAR_WAR_FLEET_NOT_FOUND',
      message: 'Нет доступного боевого флота.',
    };
  }
  const result = enterSolarWar(state, {
    type: 'ENTER_SOLAR_WAR',
    empireId,
    fleetId,
  });
  if (result.ok) {
    return {
      ok: true,
      code: null,
      message: 'Флот готов к входу и будет удерживаться до завершения цикла.',
    };
  }
  return {
    ok: false,
    code: result.code,
    message: SOLAR_WAR_VALIDATION_MESSAGES[result.code] ?? result.message,
  };
}
