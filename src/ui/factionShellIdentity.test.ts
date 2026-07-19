import { describe, expect, it } from 'vitest';
import { getFactionShellCopy } from './factionShellIdentity';

describe('faction shell identity', () => {
  it('uses faction-specific naming for the command shell', () => {
    expect(getFactionShellCopy('aegis').buildingHeading).toBe('Здания «Эгиды»');
    expect(getFactionShellCopy('synod').buildingHeading).toBe('Узлы Синода');
    expect(getFactionShellCopy('veyra').buildingHeading).toBe('Структуры Вейра');
  });

  it('does not describe Synod or Veyra as Aegis content', () => {
    expect(getFactionShellCopy('synod').arsenalDescription).not.toContain('Эгид');
    expect(getFactionShellCopy('veyra').planetModel).not.toContain('Эгид');
  });
});
