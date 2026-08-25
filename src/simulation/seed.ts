export const UINT32_MAX = 0xffff_ffff;

export function isUint32Seed(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= UINT32_MAX;
}

export function parseUint32Seed(value: string): number | undefined {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) return undefined;
  const parsed = Number(normalized);
  return isUint32Seed(parsed) ? parsed : undefined;
}

export function normalizeSeed(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function resolveSeed(value: string | number): number {
  if (typeof value === 'string') return normalizeSeed(value);
  if (!isUint32Seed(value)) {
    throw new Error(`Campaign seed must be an integer from 0 to ${UINT32_MAX}.`);
  }
  return value;
}

export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}
