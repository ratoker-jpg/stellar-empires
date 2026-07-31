import { getResearchEffectsForEmpire } from '../factions/factionResearchEffects';
import { estimateFlightToGalaxyPlanet } from '../fleets/flightCalculations';
import { startExpedition } from '../pve/expeditions';
import type { GameCommand, GameState } from '../types';
import { hasShipRole } from '../units/shipCapabilities';
import { getBotProgressionPhase } from './progressionPhase';

export interface BotExpeditionPlan {
  readonly empireId: string;
  readonly reasonCode:
    | 'expedition-selected'
    | 'expedition-phase-unavailable'
    | 'expedition-fleet-unavailable'
    | 'expedition-target-unavailable';
  readonly explanation: string;
  readonly command: Extract<GameCommand, { readonly type: 'START_EXPEDITION' }> | null;
}

export function planBotExpedition(
  state: GameState,
  empireId: string,
): BotExpeditionPlan {
  if (
    state.campaignSettings.progressionProfile !== 'compressed-v1' ||
    getBotProgressionPhase(state, empireId) !== 'first-combat'
  ) {
    return {
      empireId,
      reasonCode: 'expedition-phase-unavailable',
      explanation: 'Экспедиции поддержки нужны только на compressed first-combat path.',
      command: null,
    };
  }

  const fleets = state.fleets
    .filter(
      (fleet) =>
        fleet.empireId === empireId &&
        fleet.status === 'stationed' &&
        fleet.location.type === 'planet' &&
        hasShipRole(fleet.ships, 'scout'),
    )
    .sort((left, right) => left.id.localeCompare(right.id));
  if (fleets.length === 0) {
    return {
      empireId,
      reasonCode: 'expedition-fleet-unavailable',
      explanation: 'Нет свободного флота с разведывательным кораблём.',
      command: null,
    };
  }

  const occupiedGalaxyPlanetIds = new Set(
    state.planets.map((planet) => planet.galaxyPlanetId),
  );
  const targets = state.galaxy.systems
    .flatMap((system) => system.planets)
    .filter((planet) => !occupiedGalaxyPlanetIds.has(planet.id));
  const speedBonus = getResearchEffectsForEmpire(state, empireId).fleetSpeedPercent;

  for (const fleet of fleets) {
    const rankedTargets = targets
      .map((target) => ({
        target,
        estimate: estimateFlightToGalaxyPlanet(
          state.galaxy,
          state.planets,
          fleet,
          target.id,
          speedBonus,
        ),
      }))
      .sort(
        (left, right) =>
          left.estimate.durationSeconds - right.estimate.durationSeconds ||
          left.estimate.fuelCost - right.estimate.fuelCost ||
          left.target.id.localeCompare(right.target.id),
      );

    for (const candidate of rankedTargets) {
      const command: Extract<GameCommand, { readonly type: 'START_EXPEDITION' }> = {
        type: 'START_EXPEDITION',
        empireId,
        fleetId: fleet.id,
        targetGalaxyPlanetId: candidate.target.id,
      };
      if (startExpedition(state, command).ok) {
        return {
          empireId,
          reasonCode: 'expedition-selected',
          explanation: `Флот ${fleet.id} отправляется в ближайшую ресурсную экспедицию к ${candidate.target.id}.`,
          command,
        };
      }
    }
  }

  return {
    empireId,
    reasonCode: 'expedition-target-unavailable',
    explanation: 'Нет доступной экспедиционной цели с допустимым топливным бюджетом.',
    command: null,
  };
}
