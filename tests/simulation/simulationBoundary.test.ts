import { describe, expect, it } from 'vitest';

const simulationSources = import.meta.glob('../../src/simulation/**/*.ts', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Readonly<Record<string, string>>;

describe('simulation boundary', () => {
  it('does not import Phaser, game scenes, UI modules or DOM globals', () => {
    const violations: string[] = [];
    for (const [path, source] of Object.entries(simulationSources)) {
      if (/from ['"]phaser['"]|from ['"]\.\.\/game\//.test(source)) {
        violations.push(`${path}: runtime framework import`);
      }
      if (/\b(?:document|window|HTMLElement|localStorage)\b/.test(source)) {
        violations.push(`${path}: DOM global`);
      }
    }
    expect(violations).toEqual([]);
  });
});
