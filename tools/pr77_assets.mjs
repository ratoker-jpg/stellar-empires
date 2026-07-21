import fs from 'node:fs';

const path = 'src/assets/aegisVerticalSliceAssets.ts';
let content = fs.readFileSync(path, 'utf8');
const marker = `  {
    id: 'ship.aegis.scout',`;
const additions = `  {
    id: 'building.aegis.orbital-depot',
    name: 'Орбитальный распределитель',
    category: 'building',
    atlasUrl: RUNTIME_ASSETS.factionAegisBuildingsAtlas,
    frame: frame(0, 0, 256, 256),
    role: 'Расширение складов и орбитального снабжения',
    stage: 'P1',
  },
  {
    id: 'building.aegis.civic-core',
    name: 'Гражданский координационный узел',
    category: 'building',
    atlasUrl: RUNTIME_ASSETS.factionAegisBuildingsAtlas,
    frame: frame(256, 256, 256, 256),
    role: 'Население и стабильность колонии',
    stage: 'P1',
  },
  {
    id: 'building.aegis.tactical-academy',
    name: 'Тактическая академия',
    category: 'building',
    atlasUrl: RUNTIME_ASSETS.factionAegisBuildingsAtlas,
    frame: frame(768, 256, 256, 256),
    role: 'Подготовка тяжёлых боевых соединений',
    stage: 'P1',
  },
  {
    id: 'building.aegis.defense-foundry',
    name: 'Оборонная литейная',
    category: 'building',
    atlasUrl: RUNTIME_ASSETS.factionAegisBuildingsAtlas,
    frame: frame(512, 256, 256, 256),
    role: 'Производство тяжёлой планетарной обороны',
    stage: 'P1',
  },
`;
if (!content.includes(marker)) throw new Error('Asset insertion marker missing.');
content = content.replace(marker, `${additions}${marker}`);
content = content.replace(`    count: 8,`, `    count: 12,`);
fs.writeFileSync(path, content);

const testPath = 'tests/assets/aegisVerticalSliceAssets.test.ts';
let test = fs.readFileSync(testPath, 'utf8');
test = test.replace('toHaveLength(26)', 'toHaveLength(30)').replace('toBe(26)', 'toBe(30)');
fs.writeFileSync(testPath, test);
