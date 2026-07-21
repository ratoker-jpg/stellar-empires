import fs from 'node:fs';

function patch(path, replacements) {
  let content = fs.readFileSync(path, 'utf8');
  for (const [from, to] of replacements) {
    if (!content.includes(from)) throw new Error(`Missing ${from} in ${path}`);
    content = content.replace(from, to);
  }
  fs.writeFileSync(path, content);
}

patch('src/simulation/planet/buildingCatalog.ts', [
  ["id: 'building.aegis.orbital-depot',\n    name: 'Орбитальный распределитель',\n    factionId: 'aegis',\n    zoneId: 'industry',\n    fieldCost: 2,\n    maxLevel: 15,\n    assetId: 'building.aegis.command'", "id: 'building.aegis.orbital-depot',\n    name: 'Орбитальный распределитель',\n    factionId: 'aegis',\n    zoneId: 'industry',\n    fieldCost: 2,\n    maxLevel: 15,\n    assetId: 'building.aegis.orbital-depot'"],
  ["id: 'building.aegis.civic-core',\n    name: 'Гражданский координационный узел',\n    factionId: 'aegis',\n    zoneId: 'industry',\n    fieldCost: 2,\n    maxLevel: 12,\n    assetId: 'building.aegis.research-lab'", "id: 'building.aegis.civic-core',\n    name: 'Гражданский координационный узел',\n    factionId: 'aegis',\n    zoneId: 'industry',\n    fieldCost: 2,\n    maxLevel: 12,\n    assetId: 'building.aegis.civic-core'"],
  ["id: 'building.aegis.tactical-academy',\n    name: 'Тактическая академия',\n    factionId: 'aegis',\n    zoneId: 'military',\n    fieldCost: 2,\n    maxLevel: 10,\n    assetId: 'building.aegis.sensor-array'", "id: 'building.aegis.tactical-academy',\n    name: 'Тактическая академия',\n    factionId: 'aegis',\n    zoneId: 'military',\n    fieldCost: 2,\n    maxLevel: 10,\n    assetId: 'building.aegis.tactical-academy'"],
  ["id: 'building.aegis.defense-foundry',\n    name: 'Оборонная литейная',\n    factionId: 'aegis',\n    zoneId: 'military',\n    fieldCost: 3,\n    maxLevel: 12,\n    assetId: 'building.aegis.shipyard'", "id: 'building.aegis.defense-foundry',\n    name: 'Оборонная литейная',\n    factionId: 'aegis',\n    zoneId: 'military',\n    fieldCost: 3,\n    maxLevel: 12,\n    assetId: 'building.aegis.defense-foundry'"],
]);
patch('tests/ui/planetViewModel.test.ts', [
  ["creates one building card for every Aegis vertical slice building", "creates one building card for every Aegis catalog building"],
  ['expect(cards).toHaveLength(8);', 'expect(cards).toHaveLength(12);'],
  ['expect(new Set(cards.map((card) => card.id)).size).toBe(8);', 'expect(new Set(cards.map((card) => card.id)).size).toBe(12);'],
]);
patch('tests/simulation/researchCatalog.test.ts', [
  ['expect(AEGIS_RESEARCH_CATALOG).toHaveLength(7);', 'expect(AEGIS_RESEARCH_CATALOG).toHaveLength(10);'],
]);
