import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { loadConfig, loadJson, resolveRepositoryPath } from './lib.mjs';

const config = await loadConfig();
const bindings = await loadJson(config.mechanicalBindingsPath);
const entries = bindings.entries.filter((entry) => entry.category === 'building');
const factions = ['aegis', 'synod', 'veyra'];
const backgrounds = [
  ['dark', '#061018'],
  ['light', '#e7edf2'],
];
const columns = 6;
const rows = 4;
const cell = 180;
const width = columns * cell;
const height = rows * cell;

for (const faction of factions) {
  const factionEntries = entries
    .filter((entry) => entry.mechanicalId.startsWith(`building.${faction}.`))
    .sort((left, right) => left.mechanicalId.localeCompare(right.mechanicalId));
  if (factionEntries.length !== 24) {
    throw new Error(`Expected 24 building entries for ${faction}, found ${factionEntries.length}`);
  }
  for (const [theme, background] of backgrounds) {
    const composites = [];
    for (const [index, entry] of factionEntries.entries()) {
      const input = await sharp(resolveRepositoryPath(entry.outputPath))
        .resize(144, 144, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      composites.push({
        input,
        left: (index % columns) * cell + 18,
        top: Math.floor(index / columns) * cell + 18,
      });
    }
    const output = `docs/assets/qa/buildings/${faction}-${theme}.png`;
    await mkdir(path.dirname(resolveRepositoryPath(output)), { recursive: true });
    await sharp({
      create: { width, height, channels: 4, background },
    })
      .composite(composites)
      .png({ compressionLevel: 9 })
      .toFile(resolveRepositoryPath(output));
  }
}
console.log('Generated six building contact sheets.');
