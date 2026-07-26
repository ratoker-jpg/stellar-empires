import { mkdir, rm } from 'node:fs/promises';
import sharp from 'sharp';
import { loadConfig, loadJson, resolveRepositoryPath } from './lib.mjs';

const config = await loadConfig();
const bindings = await loadJson(config.spaceMapBindingsPath);
const outputRoot = 'docs/assets/qa/universe';
await rm(resolveRepositoryPath(outputRoot), { recursive: true, force: true });
await mkdir(resolveRepositoryPath(outputRoot), { recursive: true });
const groups = Map.groupBy(bindings.entries, (entry) => entry.family);
for (const [family, entries] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const columns = Math.min(6, entries.length);
  const rows = Math.ceil(entries.length / columns);
  const cell = 176;
  for (const theme of ['dark', 'light']) {
    const background = theme === 'dark' ? '#071019' : '#edf3f7';
    const textColor = theme === 'dark' ? '#d8f4ff' : '#13202a';
    const composites = [];
    for (const [index, entry] of entries.entries()) {
      const image = await sharp(resolveRepositoryPath(entry.outputPath))
        .resize({ width: 128, height: 128, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      const x = (index % columns) * cell + 24;
      const y = Math.floor(index / columns) * cell + 12;
      composites.push({ input: image, left: x, top: y });
      const label = entry.runtimeSemanticId.replace('universe.', '').replace('ui.mission.', 'mission.');
      const svg = Buffer.from(`<svg width="168" height="30" xmlns="http://www.w3.org/2000/svg"><text x="84" y="16" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="${textColor}">${label}</text></svg>`);
      composites.push({ input: svg, left: (index % columns) * cell + 4, top: Math.floor(index / columns) * cell + 142 });
    }
    await sharp({ create: { width: columns * cell, height: rows * cell, channels: 4, background } })
      .composite(composites)
      .png({ compressionLevel: 9, adaptiveFiltering: false })
      .toFile(resolveRepositoryPath(`${outputRoot}/${family}-${theme}.png`));
  }
}
console.log(`Generated ${groups.size * 2} Universe QA contact sheets.`);
