import { COMPLETE_BUILDING_CATALOGS } from '../planet/completeBuildingCatalog';
import { resolveCanonicalBuildingId } from '../planet/buildingAliases';
import type { BuildingDefinition } from '../planet/buildingDefinitions';
import type { FactionId } from '../planet/types';
import { COMPLETE_RESEARCH_CATALOGS } from '../research/completeResearchCatalog';
import { resolveCanonicalResearchId } from '../research/researchAliases';
import type { ResearchDefinition } from '../research/types';
import type { GameState } from '../types';
import { AEGIS_UNIT_CATALOG } from '../units/aegisUnitCatalog';
import { COMPLETE_SHIP_CATALOGS } from '../units/completeShipCatalog';
import { resolveCanonicalUnitId } from '../units/unitAliases';
import type { UnitDefinition, UnitKind } from '../units/types';
import {
  COMPLETE_CATALOG_TARGETS,
  type CompleteCatalogCounts,
} from './completeCatalogTargets';
import { getFactionCatalogManifest } from './factionCatalogManifest';
import { parseMechanicalId } from './mechanicalIds';
import { SYNOD_UNIT_CATALOG } from './synodMechanicalCatalog';
import { VEYRA_UNIT_CATALOG } from './veyraMechanicalCatalog';

export interface FactionMechanicalCatalog {
  readonly factionId: FactionId;
  readonly sourceFactionId: FactionId;
  readonly buildings: readonly BuildingDefinition[];
  readonly research: readonly ResearchDefinition[];
  readonly units: readonly UnitDefinition[];
}

export interface FactionCatalogCompleteness {
  readonly factionId: FactionId;
  readonly current: CompleteCatalogCounts;
  readonly target: CompleteCatalogCounts;
  readonly complete: boolean;
}

type MechanicalCatalogSource = Omit<FactionMechanicalCatalog, 'factionId'>;

function defensesFrom(catalog: readonly UnitDefinition[]): readonly UnitDefinition[] {
  return catalog.filter((definition) => definition.kind === 'defense');
}

const SOURCE_CATALOGS: Readonly<Partial<Record<FactionId, MechanicalCatalogSource>>> = {
  aegis: {
    sourceFactionId: 'aegis',
    buildings: COMPLETE_BUILDING_CATALOGS.aegis,
    research: COMPLETE_RESEARCH_CATALOGS.aegis,
    units: [...COMPLETE_SHIP_CATALOGS.aegis, ...defensesFrom(AEGIS_UNIT_CATALOG)],
  },
  synod: {
    sourceFactionId: 'synod',
    buildings: COMPLETE_BUILDING_CATALOGS.synod,
    research: COMPLETE_RESEARCH_CATALOGS.synod,
    units: [...COMPLETE_SHIP_CATALOGS.synod, ...defensesFrom(SYNOD_UNIT_CATALOG)],
  },
  veyra: {
    sourceFactionId: 'veyra',
    buildings: COMPLETE_BUILDING_CATALOGS.veyra,
    research: COMPLETE_RESEARCH_CATALOGS.veyra,
    units: [...COMPLETE_SHIP_CATALOGS.veyra, ...defensesFrom(VEYRA_UNIT_CATALOG)],
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
const LEGACY_UNITS_BY_ID = new Map(
  [...AEGIS_UNIT_CATALOG, ...SYNOD_UNIT_CATALOG, ...VEYRA_UNIT_CATALOG]
    .map((definition) => [definition.id, definition] as const),
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

export function getFactionCatalogCompleteness(
  factionId: FactionId,
): FactionCatalogCompleteness {
  const catalog = getFactionMechanicalCatalog(factionId);
  const current: CompleteCatalogCounts = {
    buildings: catalog.buildings.length,
    technologies: catalog.research.length,
    ships: catalog.units.filter((unit) => unit.kind === 'ship').length,
    defenses: catalog.units.filter((unit) => unit.kind === 'defense').length,
    commanderShips: 0,
  };
  const target: CompleteCatalogCounts = {
    buildings: COMPLETE_CATALOG_TARGETS.buildingsPerFaction,
    technologies: COMPLETE_CATALOG_TARGETS.sharedTechnologies,
    ships: COMPLETE_CATALOG_TARGETS.shipsPerFaction,
    defenses: COMPLETE_CATALOG_TARGETS.defensesPerFaction,
    commanderShips: COMPLETE_CATALOG_TARGETS.sharedCommanderShips,
  };
  return {
    factionId,
    current,
    target,
    complete: (Object.keys(target) as (keyof CompleteCatalogCounts)[]).every(
      (category) => current[category] === target[category],
    ),
  };
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
  return BUILDINGS_BY_ID.get(resolveCanonicalBuildingId(buildingId));
}

export function getRegisteredResearchDefinition(
  technologyId: string,
): ResearchDefinition | undefined {
  return RESEARCH_BY_ID.get(resolveCanonicalResearchId(technologyId));
}

export function getRegisteredUnitDefinition(
  unitId: string,
): UnitDefinition | undefined {
  return (
    UNITS_BY_ID.get(unitId) ??
    LEGACY_UNITS_BY_ID.get(unitId) ??
    UNITS_BY_ID.get(resolveCanonicalUnitId(unitId))
  );
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
      if (!buildingIds.has(resolveCanonicalBuildingId(requirement.buildingId))) {
        errors.push(`Unknown building requirement ${requirement.buildingId} in ${building.id}`);
      }
    }
  }
  for (const technology of catalog.research) {
    for (const requirement of technology.requirements) {
      const canonicalRequirementId = resolveCanonicalResearchId(requirement.technologyId);
      if (!researchIds.has(canonicalRequirementId)) {
        errors.push(`Unknown research requirement ${requirement.technologyId} in ${technology.id}`);
      }
    }
  }
  for (const unit of catalog.units) {
    for (const requirement of unit.buildingRequirements) {
      if (!buildingIds.has(resolveCanonicalBuildingId(requirement.buildingId))) {
        errors.push(`Unknown unit building requirement ${requirement.buildingId} in ${unit.id}`);
      }
    }
    for (const requirement of unit.researchRequirements) {
      const canonicalRequirementId = resolveCanonicalResearchId(requirement.technologyId);
      if (!researchIds.has(canonicalRequirementId)) {
        errors.push(`Unknown unit research requirement ${requirement.technologyId} in ${unit.id}`);
      }
    }
  }

  const counts = getFactionCatalogCompleteness(catalog.factionId);
  if (counts.current.buildings > counts.target.buildings) {
    errors.push(`Building catalog exceeds target count: ${counts.current.buildings}/${counts.target.buildings}`);
  }
  if (counts.current.technologies > counts.target.technologies) {
    errors.push(`Technology catalog exceeds target count: ${counts.current.technologies}/${counts.target.technologies}`);
  }
  if (counts.current.ships > counts.target.ships) {
    errors.push(`Ship catalog exceeds target count: ${counts.current.ships}/${counts.target.ships}`);
  }
  if (counts.current.defenses > counts.target.defenses) {
    errors.push(`Defense catalog exceeds target count: ${counts.current.defenses}/${counts.target.defenses}`);
  }

  return errors;
}
