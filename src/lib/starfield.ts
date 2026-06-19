export const STAR_COUNT = 5000;
export const STAR_RADIUS = 110;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildStarfieldBuffers(
  count = STAR_COUNT,
  radius = STAR_RADIUS,
): { positions: Float32Array; colors: Float32Array } {
  const rand = mulberry32(42);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const u = rand();
    const v = rand();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = radius * (0.94 + rand() * 0.06);

    const sinPhi = Math.sin(phi);
    positions[i * 3] = r * sinPhi * Math.cos(theta);
    positions[i * 3 + 1] = r * sinPhi * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const roll = rand();
    const brightness = roll < 0.15 ? 1 : 0.88 + rand() * 0.12;
    const tint = 0.94 + rand() * 0.06;
    colors[i * 3] = brightness * tint;
    colors[i * 3 + 1] = brightness * tint;
    colors[i * 3 + 2] = brightness;
  }

  return { positions, colors };
}