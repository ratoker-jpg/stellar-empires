import { readFile, writeFile } from 'node:fs/promises';

const path = 'scripts/assets/lib.mjs';
let content = await readFile(path, 'utf8');
content = content.replace(
  `function includesUniverseSegment(repositoryPath, segment) {
  return (
    repositoryPath.includes(\`/universe/\${segment}/\`) ||
    repositoryPath.includes(\`/universe-navigation/\${segment}/\`)
  );
}

`,
  '',
);
await writeFile(path, content);
console.log('Removed redundant PR107 compatibility helper.');
