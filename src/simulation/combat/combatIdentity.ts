const FNV_OFFSET_BASIS_32 = 2_166_136_261;
const FNV_PRIME_32 = 16_777_619;

export function stableFleetIdentityContribution(fleetId: string): number {
  let hash = FNV_OFFSET_BASIS_32;
  for (let index = 0; index < fleetId.length; index += 1) {
    hash ^= fleetId.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME_32);
  }
  return hash >>> 0;
}
