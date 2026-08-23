import {
  DEFAULT_BOT_PROFILES,
  type BotPersonality,
  type BotProfile,
} from '../../src/simulation/bots/profiles';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import type { GameState } from '../../src/simulation/types';
import { getUnitDefinition } from '../../src/simulation/units/catalog';

const ZERO_CARGO = { metal: 0, crystal: 0, gas: 0 } as const;
const CANONICAL_SEED = 'bot-tactical-risk-shared-canonical';
const EXPLORER_BOUNDARY_SEED = 'bot-tactical-risk-shared-explorer-boundary';
const CANONICAL_FIGHTER_ID = 'ship.aegis.fighter';
const CANONICAL_DEFENSE_ID = 'defense.aegis.gun-battery';

export interface SharedTacticalRiskFixture {
  readonly state: GameState;
  readonly empireId: string;
  readonly targetEmpireId: string;
  readonly originPlanetId: string;
  readonly targetPlanetId: string;
  readonly attackFleetId: string;
  readonly fighterId: string;
  readonly defenseId: string;
  readonly ownCount: number;
  readonly targetCount: number;
  readonly ownPower: number;
  readonly targetPower: number;
  readonly riskPermille: number;
  readonly intelligenceLevel: 3;
  readonly observedAt: number;
  readonly expiresAt: number;
  readonly profiles: Readonly<Record<BotPersonality, BotProfile>>;
}

function catalogPower(unitId: string, quantity: number): number {
  const definition = getUnitDefinition(unitId);
  if (definition === undefined) throw new Error(`Missing unit definition: ${unitId}`);
  return quantity * (
    definition.stats.attack * 2 +
    definition.stats.armor +
    definition.stats.shield
  );
}

function tacticalProfile(personality: BotPersonality): BotProfile {
  const base = DEFAULT_BOT_PROFILES.find((profile) => profile.empireId === 'aegis-bot');
  if (base === undefined) throw new Error('Missing Aegis bot profile.');
  return { ...base, id: `aegis-${personality}-shared-tactical-risk`, personality };
}

function findConfiguration(
  fighterId: string,
  defenseId: string,
  acceptsRisk: (riskPermille: number) => boolean,
): {
  readonly ownCount: number;
  readonly targetCount: number;
  readonly ownPower: number;
  readonly targetPower: number;
  readonly riskPermille: number;
} {
  for (let ownCount = 1; ownCount <= 40; ownCount += 1) {
    for (let targetCount = 1; targetCount <= 40; targetCount += 1) {
      const ownPower = catalogPower(fighterId, ownCount);
      const targetPower = catalogPower(defenseId, targetCount);
      const riskPermille = Math.min(
        9_999,
        Math.floor((targetPower * 1_000) / Math.max(1, ownPower)),
      );
      if (acceptsRisk(riskPermille)) {
        return { ownCount, targetCount, ownPower, targetPower, riskPermille };
      }
    }
  }
  throw new Error('No matching real-catalog tactical-risk configuration found.');
}

function buildFixture(
  seed: string,
  acceptsRisk: (riskPermille: number) => boolean,
): SharedTacticalRiskFixture {
  const empireId = 'aegis-bot';
  let state = createInitialGameState(seed);
  const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId);
  const target = state.planets.find((planet) => planet.ownerEmpireId === 'player');
  if (origin === undefined || target === undefined || target.ownerEmpireId === null) {
    throw new Error('Missing canonical Aegis origin or player target.');
  }

  // Use the exact real-catalog pair from the regression-first proof. These
  // legacy Aegis definitions remain registered runtime units and have stable
  // planner powers of 100 (fighter) and 124 (gun battery), independent of the
  // complete-catalog role mapping or the seed-selected player faction.
  const fighterId = CANONICAL_FIGHTER_ID;
  const defenseId = CANONICAL_DEFENSE_ID;
  const configuration = findConfiguration(fighterId, defenseId, acceptsRisk);
  const fighter = getUnitDefinition(fighterId);
  if (fighter === undefined) throw new Error(`Missing fighter definition: ${fighterId}`);

  const attackFleetId = `${seed}-strike`;
  const observedAt = state.clock.elapsedSeconds;
  const expiresAt = observedAt + 10_000;
  state = {
    ...state,
    planets: state.planets.map((planet) => {
      if (planet.id === target.id) {
        return { ...planet, factionId: 'aegis' as const };
      }
      if (planet.ownerEmpireId !== empireId) return planet;
      return {
        ...planet,
        inventory: { ships: {}, defenses: {} },
        economy: {
          ...planet.economy,
          resources: {
            ...planet.economy.resources,
            gas: {
              ...planet.economy.resources.gas,
              amount: planet.economy.resources.gas.capacity,
            },
          },
        },
      };
    }),
    fleets: [{
      id: attackFleetId,
      empireId,
      originPlanetId: origin.id,
      location: { type: 'planet' as const, planetId: origin.id },
      status: 'stationed' as const,
      ships: { [fighterId]: configuration.ownCount },
      cargo: ZERO_CARGO,
      speed: fighter.stats.speed,
      cargoCapacity: 1_000,
      mission: null,
    }],
    pendingEvents: [],
    intelligence: state.intelligence.map((entry) =>
      entry.empireId === empireId
        ? {
            ...entry,
            observations: [{
              id: `${seed}-intel`,
              observerEmpireId: empireId,
              targetPlanetId: target.id,
              coordinate: target.coordinate,
              observedAt,
              expiresAt,
              detected: false,
              snapshot: {
                planetId: target.id,
                coordinate: target.coordinate,
                name: target.name,
                ownerEmpireId: target.ownerEmpireId,
                factionId: 'aegis' as const,
                level: 3 as const,
                defenses: { [defenseId]: configuration.targetCount },
                stationedFleets: [],
              },
            }],
          }
        : entry,
    ),
  };

  return {
    state,
    empireId,
    targetEmpireId: target.ownerEmpireId,
    originPlanetId: origin.id,
    targetPlanetId: target.id,
    attackFleetId,
    fighterId,
    defenseId,
    ...configuration,
    intelligenceLevel: 3,
    observedAt,
    expiresAt,
    profiles: {
      industrial: tacticalProfile('industrial'),
      explorer: tacticalProfile('explorer'),
      aggressive: tacticalProfile('aggressive'),
    },
  };
}

export function buildCanonicalMarginalTacticalRiskFixture(): SharedTacticalRiskFixture {
  return buildFixture(
    CANONICAL_SEED,
    (riskPermille) => riskPermille > 800 && riskPermille <= 900,
  );
}

export function buildExactExplorerBoundaryTacticalRiskFixture(): SharedTacticalRiskFixture {
  return buildFixture(EXPLORER_BOUNDARY_SEED, (riskPermille) => riskPermille === 800);
}
