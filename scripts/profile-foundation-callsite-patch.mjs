import fs from 'node:fs';

function replaceExact(path, before, after) {
  const source = fs.readFileSync(path, 'utf8');
  const occurrences = source.split(before).length - 1;
  if (occurrences !== 1) {
    throw new Error(`${path}: expected exactly one match, found ${occurrences}: ${before}`);
  }
  fs.writeFileSync(path, source.replace(before, after));
}

replaceExact(
  'src/simulation/reducer.ts',
  "import type { PlanetState } from './planet/types';\n",
  "import type { PlanetState } from './planet/types';\nimport { getBuildingMaxLevel } from './progression/profile';\n",
);
replaceExact(
  'src/simulation/reducer.ts',
  "  const currentLevel = getBuildingLevel(planet.buildings, definition.id);\n  const targetLevel = currentLevel + 1;\n  if (targetLevel > definition.maxLevel) {",
  "  const profileId = state.campaignSettings.progressionProfile;\n  const currentLevel = getBuildingLevel(planet.buildings, definition.id);\n  const targetLevel = currentLevel + 1;\n  if (targetLevel > getBuildingMaxLevel(profileId, definition)) {",
);
replaceExact(
  'src/simulation/reducer.ts',
  '  const missingRequirements = findMissingRequirements(planet, definition.requirements);',
  '  const missingRequirements = findMissingRequirements(planet, definition.requirements, profileId);',
);
replaceExact(
  'src/simulation/reducer.ts',
  '  const cost = calculateBuildingCost(definition, targetLevel);',
  '  const cost = calculateBuildingCost(definition, targetLevel, profileId);',
);
replaceExact(
  'src/simulation/reducer.ts',
  '    calculateBuildSeconds(definition, targetLevel, planet),',
  '    calculateBuildSeconds(definition, targetLevel, profileId, planet),',
);

replaceExact(
  'src/ui/productionScreen.ts',
  '        const cost = calculateUnitBatchCost(definition, amount);',
  '        const cost = calculateUnitBatchCost(\n          definition,\n          amount,\n          state.campaignSettings.progressionProfile,\n        );',
);
replaceExact(
  'src/ui/productionScreen.ts',
  '        const missing = findMissingUnitRequirements(definition, planet, research);',
  '        const missing = findMissingUnitRequirements(\n          definition,\n          planet,\n          research,\n          state.campaignSettings.progressionProfile,\n        );',
);
replaceExact(
  'src/ui/productionScreen.ts',
  '        const time = calculateUnitBatchSeconds(definition, amount, planet);',
  '        const time = calculateUnitBatchSeconds(\n          definition,\n          amount,\n          planet,\n          state.campaignSettings.progressionProfile,\n        );',
);

replaceExact(
  'src/ui/researchScreen.ts',
  "import { getResearchDefinition } from '../simulation/research/catalog';\n",
  "import { getResearchMaxLevel } from '../simulation/progression/profile';\nimport { getResearchDefinition } from '../simulation/research/catalog';\n",
);
replaceExact(
  'src/ui/researchScreen.ts',
  "      const level = getResearchLevel(research, definition.id);\n      const targetLevel = level + 1;\n      const missing = findMissingResearchRequirements(definition, research, planet);\n      const maxed = level >= definition.maxLevel;\n      const boundedTargetLevel = Math.min(targetLevel, definition.maxLevel);\n      const cost = calculateResearchCost(definition, boundedTargetLevel);\n      const seconds = calculateResearchSeconds(definition, boundedTargetLevel);",
  "      const profileId = state.campaignSettings.progressionProfile;\n      const maxLevel = getResearchMaxLevel(profileId, definition);\n      const level = getResearchLevel(research, definition.id);\n      const targetLevel = level + 1;\n      const missing = findMissingResearchRequirements(\n        definition,\n        research,\n        planet,\n        profileId,\n      );\n      const maxed = level >= maxLevel;\n      const boundedTargetLevel = Math.min(targetLevel, maxLevel);\n      const cost = calculateResearchCost(definition, boundedTargetLevel, profileId);\n      const seconds = calculateResearchSeconds(definition, boundedTargetLevel, profileId);",
);
replaceExact(
  'src/ui/researchScreen.ts',
  '      meta.textContent = `${CATEGORY_LABELS[definition.category]} · ур. ${level}/${definition.maxLevel}`;',
  '      meta.textContent = `${CATEGORY_LABELS[definition.category]} · ур. ${level}/${maxLevel}`;',
);

console.log('Progression profile call sites patched successfully.');
