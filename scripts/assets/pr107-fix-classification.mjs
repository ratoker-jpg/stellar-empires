import { readFile, writeFile } from 'node:fs/promises';

const path = 'scripts/assets/lib.mjs';
let content = await readFile(path, 'utf8');

const familyStart = content.indexOf('export function inferFamily(repositoryPath) {');
const familyEnd = content.indexOf('\nconst COMMANDER_ID_BY_FILE', familyStart);
if (familyStart < 0 || familyEnd < 0) throw new Error('inferFamily block not found');
const familyBlock = `export function inferFamily(repositoryPath) {
  const universePath = repositoryPath.replace('/universe-navigation/', '/universe/');
  if (repositoryPath.includes('/buildings/')) return 'building';
  if (repositoryPath.includes('/technologies/')) return 'technology';
  if (repositoryPath.includes('/ship/')) return 'ship';
  if (repositoryPath.includes('/defenses/')) return 'defense';
  if (repositoryPath.includes('/comander_ship/')) return 'commander';
  if (universePath.includes('/universe/galaxies/')) return 'universe-galaxy';
  if (universePath.includes('/universe/system-stars/')) return 'universe-system-star';
  if (
    universePath.includes('/universe/active-suns/') ||
    universePath.includes('/universe/protostars/') ||
    universePath.includes('/universe/stellar-remnants/') ||
    universePath.includes('/generated/universe/suns/')
  ) {
    return 'universe-sun';
  }
  if (universePath.includes('/universe/planets/')) return 'universe-planet';
  if (
    universePath.includes('/universe/asteroids/') ||
    universePath.includes('/universe/debris/') ||
    universePath.includes('/universe/renegades/') ||
    universePath.includes('/generated/universe/objects/')
  ) {
    return 'universe-object';
  }
  if (universePath.includes('/universe/markers/')) return 'universe-marker';
  return 'runtime-other';
}
`;
content = `${content.slice(0, familyStart)}${familyBlock}${content.slice(familyEnd)}`;

const semanticStart = content.indexOf('export function inferSemanticId(repositoryPath) {');
const semanticEnd = content.indexOf('\nexport function classifyPath', semanticStart);
if (semanticStart < 0 || semanticEnd < 0) throw new Error('inferSemanticId block not found');
const semanticBlock = `export function inferSemanticId(repositoryPath) {
  const extension = path.extname(repositoryPath);
  const stem = path.basename(repositoryPath, extension);
  const universePath = repositoryPath.replace('/universe-navigation/', '/universe/');
  if (/^(building|technology|ship|defense)\\./.test(stem)) return stem;
  if (COMMANDER_ID_BY_FILE[stem] !== undefined) return COMMANDER_ID_BY_FILE[stem];

  const generatedSun = universePath.match(/\\/generated\\/universe\\/suns\\/(thumb|detail)\\/(active|protostar|collapsed)-(\\d+)\\.[^.]+$/);
  if (generatedSun !== null) {
    return \`universe.sun.\${generatedSun[2]}-\${generatedSun[3]}.\${generatedSun[1]}\`;
  }
  const generatedObject = universePath.match(/\\/generated\\/universe\\/objects\\/(asteroid|debris|renegade)-(\\d+)\\.[^.]+$/);
  if (generatedObject !== null) {
    return \`universe.object.\${generatedObject[1]}-\${generatedObject[2]}\`;
  }
  if (universePath.endsWith('/generated/universe/markers/sun-attack.webp')) return 'ui.mission.sun-attack';
  if (universePath.endsWith('/generated/universe/markers/sun-support.webp')) return 'ui.mission.sun-support';

  const suffix = numberSuffix(stem);
  if (universePath.includes('/universe/galaxies/')) {
    return suffix === undefined ? undefined : \`universe.galaxy.nebula-\${suffix}\`;
  }
  if (universePath.includes('/universe/system-stars/')) {
    return suffix === undefined ? undefined : \`universe.system-star.variant-\${suffix}\`;
  }
  if (universePath.includes('/universe/active-suns/')) {
    return suffix === undefined ? undefined : \`universe.sun.active-\${suffix}\`;
  }
  if (universePath.includes('/universe/protostars/')) {
    return suffix === undefined ? undefined : \`universe.sun.protostar-\${suffix}\`;
  }
  if (universePath.includes('/universe/stellar-remnants/')) {
    return suffix === undefined ? undefined : \`universe.sun.collapsed-\${suffix}\`;
  }
  if (universePath.includes('/universe/planets/')) {
    return suffix === undefined ? undefined : \`universe.planet.variant-\${suffix}\`;
  }
  if (universePath.includes('/universe/asteroids/')) {
    return suffix === undefined ? undefined : \`universe.asteroid.variant-\${suffix}\`;
  }
  if (universePath.includes('/universe/debris/')) {
    return suffix === undefined ? undefined : \`universe.debris-field.variant-\${suffix}\`;
  }
  if (universePath.includes('/universe/renegades/')) {
    return suffix === undefined ? undefined : \`universe.renegade-object.variant-\${suffix}\`;
  }
  if (universePath.includes('/universe/markers/')) {
    return suffix === undefined ? undefined : \`universe.marker.generic-\${suffix}\`;
  }
  return undefined;
}
`;
content = `${content.slice(0, semanticStart)}${semanticBlock}${content.slice(semanticEnd)}`;
await writeFile(path, content);
