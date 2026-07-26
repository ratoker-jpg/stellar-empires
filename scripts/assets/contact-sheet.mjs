import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { loadConfig, loadJson, resolveRepositoryPath } from './lib.mjs';

const config = await loadConfig();
const bindings = await loadJson(config.mechanicalBindingsPath);
const backgrounds = [
  ['dark', '#061018'],
  ['light', '#e7edf2'],
];

async function renderSheet(entries, outputPrefix, columns, rows, cell) {
  const width = columns * cell;
  const height = rows * cell;
  for (const [theme, background] of backgrounds) {
    const composites = [];
    for (const [index, entry] of entries.entries()) {
      const input = await sharp(resolveRepositoryPath(entry.outputPath))
        .resize(cell - 36, cell - 36, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
      composites.push({
        input,
        left: (index % columns) * cell + 18,
        top: Math.floor(index / columns) * cell + 18,
      });
    }
    const output = `${outputPrefix}-${theme}.png`;
    await mkdir(path.dirname(resolveRepositoryPath(output)), { recursive: true });
    await sharp({ create: { width, height, channels: 4, background } })
      .composite(composites)
      .png({ compressionLevel: 9 })
      .toFile(resolveRepositoryPath(output));
  }
}

for (const faction of ['aegis', 'synod', 'veyra']) {
  const entries = bindings.entries
    .filter((entry) =>
      entry.category === 'building' && entry.mechanicalId.startsWith(`building.${faction}.`),
    )
    .sort((left, right) => left.mechanicalId.localeCompare(right.mechanicalId));
  if (entries.length !== 24) {
    throw new Error(`Expected 24 building entries for ${faction}, found ${entries.length}`);
  }
  await renderSheet(entries, `docs/assets/qa/buildings/${faction}`, 6, 4, 180);
}

const uniqueTechnologyEntries = [...new Map(
  bindings.entries
    .filter((entry) => entry.category === 'technology')
    .map((entry) => [entry.runtimeSemanticId, entry]),
).values()].sort((left, right) => left.runtimeSemanticId.localeCompare(right.runtimeSemanticId));
if (uniqueTechnologyEntries.length !== 22) {
  throw new Error(`Expected 22 technology concepts, found ${uniqueTechnologyEntries.length}`);
}
await renderSheet(uniqueTechnologyEntries, 'docs/assets/qa/technologies/shared', 6, 4, 160);

for (const faction of ['aegis', 'synod', 'veyra']) {
  const entries = bindings.entries
    .filter((entry) =>
      entry.category === 'ship' && entry.mechanicalId.startsWith(`ship.${faction}.`),
    )
    .sort((left, right) => left.mechanicalId.localeCompare(right.mechanicalId));
  if (entries.length !== 13) {
    throw new Error(`Expected 13 ship entries for ${faction}, found ${entries.length}`);
  }
  await renderSheet(entries, `docs/assets/qa/ships/${faction}`, 5, 3, 190);
}

for (const faction of ['aegis', 'synod', 'veyra']) {
  const entries = bindings.entries
    .filter((entry) =>
      entry.category === 'defense' && entry.mechanicalId.startsWith(`defense.${faction}.`),
    )
    .sort((left, right) => left.mechanicalId.localeCompare(right.mechanicalId));
  if (entries.length !== 9) {
    throw new Error(`Expected 9 defense entries for ${faction}, found ${entries.length}`);
  }
  await renderSheet(entries, `docs/assets/qa/defenses/${faction}`, 3, 3, 190);
}

const commanderEntries = bindings.entries
  .filter((entry) => entry.category === 'commander')
  .sort((left, right) => left.mechanicalId.localeCompare(right.mechanicalId));
if (commanderEntries.length !== 13) {
  throw new Error(`Expected 13 Commander entries, found ${commanderEntries.length}`);
}
await renderSheet(commanderEntries, 'docs/assets/qa/commanders/shared', 5, 3, 190);

const spaceBindings = await loadJson(config.spaceMapBindingsPath);
const sheetSpecs = [
  ['galaxy-nebula', 'galaxies', 5, 4, 180],
  ['system-star', 'system-stars', 4, 3, 170],
  ['sun-thumb', 'sun-thumbnails', 4, 3, 170],
  ['sun-detail', 'sun-details', 4, 3, 190],
  ['planet', 'planets', 6, 4, 170],
  ['asteroid', 'asteroids', 4, 2, 180],
  ['debris', 'debris', 3, 2, 180],
  ['renegade', 'renegades', 3, 2, 180],
  ['marker', 'markers', 2, 1, 180],
];
for (const [family, slug, columns, rows, cell] of sheetSpecs) {
  const entries = spaceBindings.entries
    .filter((entry) => entry.family === family)
    .sort((left, right) => left.runtimeSemanticId.localeCompare(right.runtimeSemanticId));
  if (entries.length === 0) throw new Error(`Missing Universe QA family: ${family}`);
  await renderSheet(entries, `docs/assets/qa/universe/${slug}`, columns, rows, cell);
}
console.log('Generated complete catalog and Universe contact sheets.');
