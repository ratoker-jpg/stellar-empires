import type { FactionId } from '../planet/types';

export interface IntelResourceSnapshot {
  readonly metal: number;
  readonly crystal: number;
  readonly gas: number;
  readonly energyProduced: number;
  readonly energyConsumed: number;
}

export interface IntelPlanetSnapshot {
  readonly planetId: string;
  readonly name: string;
  readonly ownerEmpireId: string;
  readonly factionId: FactionId;
  readonly level: 1 | 2 | 3;
  readonly resources?: IntelResourceSnapshot;
  readonly buildings?: Readonly<Record<string, number>>;
  readonly defenses?: Readonly<Record<string, number>>;
  readonly stationedFleets?: readonly {
    readonly fleetId: string;
    readonly ships: Readonly<Record<string, number>>;
  }[];
}

export interface IntelObservation {
  readonly id: string;
  readonly observerEmpireId: string;
  readonly targetPlanetId: string;
  readonly observedAt: number;
  readonly expiresAt: number;
  readonly detected: boolean;
  readonly snapshot: IntelPlanetSnapshot;
}

export interface IntelligenceAlert {
  readonly id: string;
  readonly empireId: string;
  readonly sourceEmpireId: string | null;
  readonly targetPlanetId: string;
  readonly detectedAt: number;
  readonly confidence: 'low' | 'medium' | 'high';
}

export interface EmpireIntelligenceState {
  readonly empireId: string;
  readonly observations: readonly IntelObservation[];
  readonly alerts: readonly IntelligenceAlert[];
}
