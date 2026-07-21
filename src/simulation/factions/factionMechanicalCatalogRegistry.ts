import { AEGIS_BUILDING_CATALOG } from '../planet/aegisBuildingCatalog';
import type { BuildingDefinition } from '../planet/buildingDefinitions';
import type { FactionId } from '../planet/types';
import { AEGIS_RESEARCH_CATALOG } from '../research/aegisResearchCatalog';
import type { ResearchDefinition } from '../research/types';
import type { GameState } from '../types';
import { AEGIS_UNIT_CATALOG } from '../units/aegisUnitCatalog';
import type { UnitDefinition, UnitKind } from '../units/types';
import { getFactionCatalogManifest } from './factionCatalogManifest';
import { parseMechanicalId } from './mechanicalIds';
import {
  SYNOD_BUILDING_CATALOG,
  SYNOD_RESEARCH_CATALOG,
  SYNOD_UNIT_CATALOG,
} from './synodMechanicalCatalog';
import {
  VEYRA_BUILDING_CATALOG,
  VEYRA_RESEARCH_CATALOG,
  VEYRA_UNIT_CATALOG,
} from './veyraMechanicalCatalog';

export interface FactionMechanicalCatalog {
  readonly factionId: FactionId;
  readonly sourceFactionId: FactionId;
  readonly buildings: readonly BuildingDefinition[];
  readonly research: readonly ResearchDefinition[];
  readonly units: readonly UnitDefinition[];
}

type MechanicalCatalogSource = Omit<FactionMechanicalCatalog, 'factionId'>;

const SOURCE_CATALOGS: Readonly<Partial<Record<FactionId, MechanicalCatalogSource>>> = {
  aegis: {
    sourceFactionId: 'aegis',
    buildings: AEGIS_BUILDING_CATALOG,
    research: AEGIS_RESEARCH_CATALOG,
    units: AEGIS_UNIT_CATALOG,
  },
  synod: {
    sourceFactionId: 'synod',
    buildings: SYNOD_BUILDING_CATALOG,
    research: SYNOD_RESEARCH_CATALOG,
    units: SYNOD_UNIT_CATALOG,
  },
  veyra: {
    sourceFactionId: 'veyra',
    buildings: VEYRA_BUILDING_CATALOG,
    research: VEYRA_RESEARCH_CATALOG,
    units: VEYRA_UNIT_CATALOG,
  },
};

const REGISTERED_SOURCES = Object.values(SOURCE_CATALOGS).filter(
  (source): source is MechanicalCatalogSource => source !== undefined,
);
const BUILDINGS_BY_ID = new Map(
  REGISTERED_SOURCES.flatMap((source) => source.buildings).map((definition) => [definition.id, definition]),
);
const RESEARCH_BY_ID = new Map(
  REGISTERED_SOURCES.flatMap((source) => source.research).map((definition) => [definition.id, definition]),
);
const UNITS_BY_ID = new Map(
  REGISTERED_SOURCES.flatMap((source) => source.units).map((definition) => [definition.id, definition]),
);

export function getFactionMechanicalCatalog(
  factionId: FactionId,
): FactionMechanicalCatalog {
  const manifest = getFactionCatalogManifest(factionId);
  const source = SOURCE_CATALOGS[manifest.sourceFactionId];
  if (source === undefined) {
    throw new Error(`Mechanical catalog source is not registered: ${manifest.sourceFactionId}`);
  }
  return {
    factionId,
    sourceFactionId: manifest.sourceFactionId,
    buildings: source.buildings,
    research: source.research,
    units: source.units,
  };
}

export function getBuildingCatalogForFaction(
  factionId: FactionId,
): readonly BuildingDefinition[] {
  return getFactionMechanicalCatalog(factionId).buildings;
}

export function getResearchCatalogForFaction(
  factionId: FactionId,
): readonly ResearchDefinition[] {
  return getFactionMechanicalCatalog(factionId).research;
}

export function getUnitCatalogForFaction(
  factionId: FactionId,
): readonly UnitDefinition[] {
  return getFactionMechanicalCatalog(factionId).units;
}

export function getFactionIdForEmpire(
  state: Pick<GameState, 'planets'>,
  empireId: string,
): FactionId {
  return state.planets.find((planet) => planet.ownerEmpireId === empireId)?.factionId ?? 'aegis';
}

export function getResearchCatalogForEmpire(
  state: Pick<GameState, 'planets'>,
  empireId: string,
): readonly ResearchDefinition[] {
  return getResearchCatalogForFaction(getFactionIdForEmpire(state, empireId));
}

export function getRegisteredBuildingDefinition(
  buildingId: string,
): BuildingDefinition | undefined {
  return BUILDINGS_BY_ID.get(buildingId);
}

export function getRegisteredResearchDefinition(
  technologyId: string,
): ResearchDefinition | undefined {
  return RESEARCH_BY_ID.get(technologyId);
}

export function getRegisteredUnitDefinition(
  unitId: string,
): UnitDefinition | undefined {
  return UNITS_BY_ID.get(unitId);
}

export function getRegisteredUnitsByKind(
  kind: UnitKind,
  factionId?: FactionId,
): readonly UnitDefinition[] {
  const catalog = factionId === undefined
    ? REGISTERED_SOURCES.flatMap((source) => source.units)
    : getUnitCatalogForFaction(factionId);
  return catalog.filter((definition) => definition.kind === kind);
}

function duplicateIds(ids: readonly string[]): readonly string[] {
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id]) => id)
    .sort();
}

export function validateFactionMechanicalCatalog(
  catalog: FactionMechanicalCatalog,
): readonly string[] {
  const errors: string[] = [];
  const definitions = [
    ...catalog.buildings.map((definition) => ({ id: definition.id, factionId: definition.factionId })),
    ...catalog.research.map((definition) => ({ id: definition.id, factionId: definition.factionId })),
    ...catalog.units.map((definition) => ({ id: definition.id, factionId: definition.factionId })),
  ];
  for (const duplicate of duplicateIds(definitions.map((definition) => definition.id))) {
    errors.push(`Duplicate mechanical id: ${duplicate}`);
  }
  for (const definition of definitions) {
    const parsed = parseMechanicalId(definition.id);
    if (parsed === undefined) {
      errors.push(`Invalid mechanical id: ${definition.id}`);
      continue;
    }
    if (parsed.factionId !== definition.factionId) {
      errors.push(`Mechanical id faction mismatch: ${definition.id}`);
    }
    if (definition.factionId !== catalog.sourceFactionId) {
      errors.push(`Definition is outside catalog source namespace: ${definition.id}`);
    }
  }

  const buildingIds = new Set(catalog.buildings.map((definition) => definition.id));
  const researchIds = new Set(catalog.research.map((definition) => definition.id));
  for (const building of catalog.buildings) {
    for (const requirement of building.requirements) {
      if (!buildingIds.has(requirement.buildingId)) {
        errors.push(`Unknown building requirement ${requirement.buildingId} in ${building.id}`);
      }
    }
  }
  for (const technology of catalog.research) {
    for (const requirement of technology.requirements) {
      if (!researchIds.has(requirement.technologyId)) {
        errors.push(`Unknown research requirement ${requirement.technologyId} in ${technology.id}`);
      }
    }
  }
  for (const unit of catalog.units) {
    for (const requirement of unit.buildingRequirements) {
      if (!buildingIds.has(requirement.buildingId)) {
        errors.push(`Unknown unit building requirement ${requirement.buildingId} in ${unit.id}`);
      }
    }
    for (const requirement of unit.researchRequirements) {
      if (!researchIds.has(requirement.technologyId)) {
        errors.push(`Unknown unit research requirement ${requirement.technologyId} in ${unit.id}`);
      }
    }
  }
  return errors;
}
