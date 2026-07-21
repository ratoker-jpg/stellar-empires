import fs from 'node:fs';

function read(path) { return fs.readFileSync(path, 'utf8'); }
function write(path, content) {
  fs.mkdirSync(path.slice(0, path.lastIndexOf('/')), { recursive: true });
  fs.writeFileSync(path, content);
}
function replaceOnce(path, from, to) {
  const content = read(path);
  if (!content.includes(from)) throw new Error(`Missing fragment in ${path}: ${from.slice(0, 100)}`);
  write(path, content.replace(from, to));
}

const buildingAdditions = `  {
    id: 'building.aegis.orbital-depot',
    name: 'Орбитальный распределитель',
    factionId: 'aegis',
    zoneId: 'industry',
    fieldCost: 2,
    maxLevel: 15,
    assetId: 'building.aegis.command',
    baseCost: { metal: 900, crystal: 700, gas: 260 },
    baseBuildSeconds: 360,
    requirements: [{ buildingId: 'building.aegis.command', level: 3 }],
    economy: {
      storageCapacity: { metal: 4_000, crystal: 4_000, gas: 3_000 },
      energyConsumption: 22,
      populationUse: 2,
      stabilityDemand: 6,
    },
  },
  {
    id: 'building.aegis.civic-core',
    name: 'Гражданский координационный узел',
    factionId: 'aegis',
    zoneId: 'industry',
    fieldCost: 2,
    maxLevel: 12,
    assetId: 'building.aegis.research-lab',
    baseCost: { metal: 760, crystal: 920, gas: 320 },
    baseBuildSeconds: 420,
    requirements: [{ buildingId: 'building.aegis.command', level: 3 }],
    economy: {
      populationCapacity: 90,
      energyConsumption: 18,
      stabilityCapacity: 75,
    },
  },
  {
    id: 'building.aegis.tactical-academy',
    name: 'Тактическая академия',
    factionId: 'aegis',
    zoneId: 'military',
    fieldCost: 2,
    maxLevel: 10,
    assetId: 'building.aegis.sensor-array',
    baseCost: { metal: 1_100, crystal: 1_250, gas: 620 },
    baseBuildSeconds: 600,
    requirements: [
      { buildingId: 'building.aegis.research-lab', level: 3 },
      { buildingId: 'building.aegis.sensor-array', level: 2 },
    ],
    economy: {
      energyConsumption: 34,
      populationUse: 4,
      stabilityDemand: 12,
    },
  },
  {
    id: 'building.aegis.defense-foundry',
    name: 'Оборонная литейная',
    factionId: 'aegis',
    zoneId: 'military',
    fieldCost: 3,
    maxLevel: 12,
    assetId: 'building.aegis.shipyard',
    baseCost: { metal: 1_600, crystal: 1_100, gas: 720 },
    baseBuildSeconds: 720,
    requirements: [
      { buildingId: 'building.aegis.shipyard', level: 3 },
      { buildingId: 'building.aegis.sensor-array', level: 3 },
    ],
    economy: {
      energyConsumption: 48,
      populationUse: 5,
      stabilityDemand: 16,
    },
  },
`;
replaceOnce(
  'src/simulation/planet/buildingCatalog.ts',
  `] as const;\n\nconst BUILDINGS_BY_ID`,
  `${buildingAdditions}] as const;\n\nconst BUILDINGS_BY_ID`,
);

const researchAdditions = `  {
    id: 'technology.aegis.logistics',
    name: 'Координация логистики',
    factionId: 'aegis',
    category: 'navigation',
    description: 'Синхронизирует снабжение и повышает маршевую скорость соединений.',
    maxLevel: 10,
    baseCost: { metal: 780, crystal: 720, gas: 520 },
    baseSeconds: 660,
    requiredLaboratoryLevel: 3,
    requirements: [
      { technologyId: 'technology.aegis.construction', level: 2 },
      { technologyId: 'technology.aegis.propulsion', level: 1 },
    ],
    effects: [{ type: 'FLEET_SPEED', percentPerLevel: 3 }],
    assetId: 'technology.aegis.propulsion',
  },
  {
    id: 'technology.aegis.shield-harmonics',
    name: 'Гармоники щита',
    factionId: 'aegis',
    category: 'defense',
    description: 'Усиливает согласование защитных полей кораблей и стационарных узлов.',
    maxLevel: 10,
    baseCost: { metal: 840, crystal: 1_020, gas: 640 },
    baseSeconds: 780,
    requiredLaboratoryLevel: 4,
    requirements: [
      { technologyId: 'technology.aegis.energy', level: 3 },
      { technologyId: 'technology.aegis.armor', level: 2 },
    ],
    effects: [{ type: 'ARMOR_STRENGTH', percentPerLevel: 3 }],
    assetId: 'technology.aegis.armor',
  },
  {
    id: 'technology.aegis.battle-network',
    name: 'Тактическая сеть',
    factionId: 'aegis',
    category: 'weapons',
    description: 'Объединяет сенсоры и огневые контуры крупных соединений.',
    maxLevel: 10,
    baseCost: { metal: 1_100, crystal: 1_260, gas: 820 },
    baseSeconds: 900,
    requiredLaboratoryLevel: 5,
    requirements: [
      { technologyId: 'technology.aegis.sensors', level: 3 },
      { technologyId: 'technology.aegis.weapons', level: 3 },
    ],
    effects: [{ type: 'WEAPON_STRENGTH', percentPerLevel: 3 }],
    assetId: 'technology.aegis.weapons',
  },
`;
replaceOnce(
  'src/simulation/research/catalog.ts',
  `] as const;\n\nconst RESEARCH_BY_ID`,
  `${researchAdditions}] as const;\n\nconst RESEARCH_BY_ID`,
);

const unitAdditions = `  {
    id: 'ship.aegis.corvette',
    name: 'Корвет «Рубеж»',
    factionId: 'aegis',
    kind: 'ship',
    role: 'fighter',
    description: 'Быстрый корабль сопровождения для защиты строя от лёгких целей.',
    assetId: 'ship.aegis.fighter',
    baseCost: { metal: 920, crystal: 680, gas: 420 },
    baseSeconds: 300,
    populationCost: 2,
    hangarCost: 2,
    defenseGridCost: 0,
    buildingRequirements: [
      { buildingId: 'building.aegis.shipyard', level: 2 },
      { buildingId: 'building.aegis.tactical-academy', level: 1 },
    ],
    researchRequirements: [
      { technologyId: 'technology.aegis.weapons', level: 2 },
      { technologyId: 'technology.aegis.sensors', level: 2 },
    ],
    stats: { speed: 12, cargo: 45, attack: 58, armor: 54, shield: 22 },
  },
  {
    id: 'ship.aegis.cruiser',
    name: 'Крейсер «Оплот»',
    factionId: 'aegis',
    kind: 'ship',
    role: 'frigate',
    description: 'Тяжёлый линейный корабль с устойчивым щитом и ракетным вооружением.',
    assetId: 'ship.aegis.frigate',
    baseCost: { metal: 3_200, crystal: 2_200, gas: 1_500 },
    baseSeconds: 780,
    populationCost: 6,
    hangarCost: 6,
    defenseGridCost: 0,
    buildingRequirements: [
      { buildingId: 'building.aegis.shipyard', level: 4 },
      { buildingId: 'building.aegis.tactical-academy', level: 2 },
    ],
    researchRequirements: [
      { technologyId: 'technology.aegis.armor', level: 3 },
      { technologyId: 'technology.aegis.weapons', level: 3 },
    ],
    stats: { speed: 7, cargo: 220, attack: 174, armor: 260, shield: 96 },
  },
  {
    id: 'ship.aegis.carrier',
    name: 'Носитель «Горизонт»',
    factionId: 'aegis',
    kind: 'ship',
    role: 'transport',
    description: 'Командно-логистическая платформа для дальних операций.',
    assetId: 'ship.aegis.cargo',
    baseCost: { metal: 4_100, crystal: 3_400, gas: 2_300 },
    baseSeconds: 960,
    populationCost: 8,
    hangarCost: 8,
    defenseGridCost: 0,
    buildingRequirements: [
      { buildingId: 'building.aegis.shipyard', level: 5 },
      { buildingId: 'building.aegis.orbital-depot', level: 3 },
    ],
    researchRequirements: [
      { technologyId: 'technology.aegis.logistics', level: 2 },
      { technologyId: 'technology.aegis.battle-network', level: 2 },
    ],
    stats: { speed: 7, cargo: 2_400, attack: 74, armor: 330, shield: 150 },
  },
  {
    id: 'ship.aegis.dreadnought',
    name: 'Дредноут «Цитадель»',
    factionId: 'aegis',
    kind: 'ship',
    role: 'frigate',
    description: 'Флагманский тяжёлый корпус для прорыва укреплённых рубежей.',
    assetId: 'ship.aegis.frigate',
    baseCost: { metal: 8_600, crystal: 6_900, gas: 4_800 },
    baseSeconds: 1_800,
    populationCost: 14,
    hangarCost: 14,
    defenseGridCost: 0,
    buildingRequirements: [
      { buildingId: 'building.aegis.shipyard', level: 6 },
      { buildingId: 'building.aegis.tactical-academy', level: 4 },
    ],
    researchRequirements: [
      { technologyId: 'technology.aegis.weapons', level: 5 },
      { technologyId: 'technology.aegis.armor', level: 5 },
      { technologyId: 'technology.aegis.shield-harmonics', level: 3 },
    ],
    stats: { speed: 5, cargo: 500, attack: 420, armor: 720, shield: 320 },
  },
  {
    id: 'defense.aegis.point-defense',
    name: 'Сеть точечного перехвата',
    factionId: 'aegis',
    kind: 'defense',
    role: 'kinetic',
    description: 'Скорострельные узлы для подавления малых кораблей.',
    assetId: 'defense.aegis.gun-battery',
    baseCost: { metal: 760, crystal: 520, gas: 260 },
    baseSeconds: 240,
    populationCost: 1,
    hangarCost: 0,
    defenseGridCost: 2,
    buildingRequirements: [{ buildingId: 'building.aegis.defense-foundry', level: 1 }],
    researchRequirements: [
      { technologyId: 'technology.aegis.sensors', level: 2 },
      { technologyId: 'technology.aegis.weapons', level: 2 },
    ],
    stats: { speed: 0, cargo: 0, attack: 72, armor: 72, shield: 12 },
  },
  {
    id: 'defense.aegis.fortress-array',
    name: 'Крепостной ракетный массив',
    factionId: 'aegis',
    kind: 'defense',
    role: 'missile',
    description: 'Тяжёлый оборонительный комплекс против крупных кораблей.',
    assetId: 'defense.aegis.missile-battery',
    baseCost: { metal: 1_800, crystal: 1_300, gas: 840 },
    baseSeconds: 540,
    populationCost: 3,
    hangarCost: 0,
    defenseGridCost: 5,
    buildingRequirements: [{ buildingId: 'building.aegis.defense-foundry', level: 3 }],
    researchRequirements: [
      { technologyId: 'technology.aegis.battle-network', level: 2 },
      { technologyId: 'technology.aegis.shield-harmonics', level: 2 },
    ],
    stats: { speed: 0, cargo: 0, attack: 210, armor: 220, shield: 90 },
  },
`;
replaceOnce(
  'src/simulation/units/catalog.ts',
  `] as const;\n\nconst UNITS_BY_ID`,
  `${unitAdditions}] as const;\n\nconst UNITS_BY_ID`,
);

replaceOnce(
  'src/simulation/combat/combatProfiles.ts',
  `  'defense.aegis.gun-battery': {`,
  `  'ship.aegis.corvette': { weaponType: 'plasma', protectionType: 'light-armor', targetSize: 'small' },\n  'ship.aegis.cruiser': { weaponType: 'missile', protectionType: 'heavy-armor', targetSize: 'large' },\n  'ship.aegis.carrier': { weaponType: 'kinetic', protectionType: 'shield-grid', targetSize: 'large' },\n  'ship.aegis.dreadnought': { weaponType: 'disruptor', protectionType: 'shield-grid', targetSize: 'large' },\n  'defense.aegis.point-defense': { weaponType: 'kinetic', protectionType: 'fortified', targetSize: 'installation' },\n  'defense.aegis.fortress-array': { weaponType: 'missile', protectionType: 'fortified', targetSize: 'installation' },\n  'defense.aegis.gun-battery': {`,
);

replaceOnce(
  'tests/simulation/unitCatalog.test.ts',
  `  it('validates the first Aegis ship and defense set', () => {`,
  `  it('validates the complete Aegis ship and defense set', () => {`,
);
replaceOnce(
  'tests/simulation/unitCatalog.test.ts',
  `    expect(AEGIS_UNIT_CATALOG.filter((unit) => unit.kind === 'ship')).toHaveLength(6);\n    expect(AEGIS_UNIT_CATALOG.filter((unit) => unit.kind === 'defense')).toHaveLength(3);`,
  `    expect(AEGIS_BUILDING_CATALOG).toHaveLength(12);\n    expect(AEGIS_RESEARCH_CATALOG).toHaveLength(10);\n    expect(AEGIS_UNIT_CATALOG.filter((unit) => unit.kind === 'ship')).toHaveLength(10);\n    expect(AEGIS_UNIT_CATALOG.filter((unit) => unit.kind === 'defense')).toHaveLength(5);`,
);

write('tests/simulation/aegisCatalogProgression.test.ts', `import { describe, expect, it } from 'vitest';\nimport { getFactionMechanicalCatalog, validateFactionMechanicalCatalog } from '../../src/simulation/factions/factionMechanicalCatalogRegistry';\nimport { getUnitCombatProfile } from '../../src/simulation/combat/combatProfiles';\n\ndescribe('complete Aegis catalog', () => {\n  it('resolves every extended progression dependency', () => {\n    const catalog = getFactionMechanicalCatalog('aegis');\n    expect(validateFactionMechanicalCatalog(catalog)).toEqual([]);\n    expect(catalog.buildings.map((entry) => entry.id)).toContain('building.aegis.defense-foundry');\n    expect(catalog.research.map((entry) => entry.id)).toContain('technology.aegis.battle-network');\n    expect(catalog.units.map((entry) => entry.id)).toContain('ship.aegis.dreadnought');\n  });\n\n  it('assigns explicit combat profiles to every extended combat unit', () => {\n    expect(getUnitCombatProfile('ship.aegis.corvette').targetSize).toBe('small');\n    expect(getUnitCombatProfile('ship.aegis.dreadnought')).toMatchObject({\n      weaponType: 'disruptor',\n      protectionType: 'shield-grid',\n      targetSize: 'large',\n    });\n    expect(getUnitCombatProfile('defense.aegis.fortress-array').targetSize).toBe('installation');\n  });\n});\n`);

write('docs/changes/pr77-full-aegis-catalog.md', `# PR #77 — Full Aegis mechanical catalog\n\n## Delivered\n\n- 12 connected Aegis buildings.\n- 10 connected Aegis technologies.\n- 10 ships and 5 planetary defense systems.\n- New logistics, shield and tactical-network progression branches.\n- Corvette, cruiser, carrier and dreadnought combat roles.\n- Point-defense and fortress-array defensive tiers.\n- Explicit combat profiles and full dependency validation.\n\n## Balance identity\n\nAegis now emphasizes stable infrastructure, layered defenses, predictable logistics and durable line fleets. Values remain original prototype balance and will be tuned by the later balance harness.\n`);

const statusPath = 'docs/project-status.json';
const status = JSON.parse(read(statusPath));
status.lastMergedPr = 76;
status.lastMergeSha = '5dbb2d1d26f47b9d4346c5ee9e67cdfba3801033';
status.activePr = 77;
status.nextPrAfterActive = 78;
status.currentBatch.completed = [75, 76];
status.deliveredDomains = Array.from(new Set([
  ...status.deliveredDomains,
  'explicit faction catalog manifest, stable mechanical IDs and dependency validation',
]));
status.knownLimitations = [
  'Aegis native full catalog is active in PR #77',
  'Synod and Veyra still use explicit Aegis legacy-alias catalogs until PR #78 and #79',
  'diplomacy, coalitions, strategic stars and endgame are missing',
  'bots do not yet plan expanded faction content, command doctrine or diplomacy',
  'strategic exotic matter has no spending loop',
  'captured Nemexia HTML/screens/assets are excluded',
];
write(statusPath, `${JSON.stringify(status, null, 2)}\n`);

console.log('PR77 patch applied.');
