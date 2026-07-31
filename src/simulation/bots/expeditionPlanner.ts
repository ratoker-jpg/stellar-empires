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
    .filter((planet) => !occupiedGalaxyPlanetIds.has(planet.id))
    .sort((left, right) => left.id.localeCompare(right.id));

  for (const fleet of fleets) {
    for (const target of targets) {
      const command: Extract<GameCommand, { readonly type: 'START_EXPEDITION' }> = {
        type: 'START_EXPEDITION',
        empireId,
        fleetId: fleet.id,
        targetGalaxyPlanetId: target.id,
      };
      if (startExpedition(state, command).ok) {
        return {
          empireId,
          reasonCode: 'expedition-selected',
          explanation: `Флот ${fleet.id} отправляется в ресурсную экспедицию к ${target.id}.`,
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
