export const HOUR_MS = 60 * 60 * 1000;

const SPEED_STEPS = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 125, 150, 175, 200] as const;

export const SPEED_MIN = SPEED_STEPS[0];
export const SPEED_MAX = SPEED_STEPS[SPEED_STEPS.length - 1];

function findSpeedIndex(speed: number): number {
  const exact = SPEED_STEPS.indexOf(speed as (typeof SPEED_STEPS)[number]);
  if (exact !== -1) return exact;

  const next = SPEED_STEPS.findIndex((step) => step > speed);
  return next === -1 ? SPEED_STEPS.length - 1 : Math.max(0, next - 1);
}

export function stepSpeedUp(speed: number): number {
  const idx = findSpeedIndex(speed);
  return SPEED_STEPS[Math.min(idx + 1, SPEED_STEPS.length - 1)];
}

export function stepSpeedDown(speed: number): number {
  const idx = findSpeedIndex(speed);
  return SPEED_STEPS[Math.max(idx - 1, 0)];
}