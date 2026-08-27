export const HOUR_MS = 60 * 60 * 1000;

const SPEED_STEPS = [
  1, 20, 30, 40, 50, 60, 70, 80, 90, 100,
  150, 200, 250, 300, 350, 400, 450, 500,
  600, 700, 800, 900, 1000,
  1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000,
] as const;

export const SPEED_MIN = SPEED_STEPS[0];
export const SPEED_MAX = SPEED_STEPS[SPEED_STEPS.length - 1];
export const SPEED_SLIDER_MAX = SPEED_STEPS.length - 1;
export const DEFAULT_PLAYBACK_SPEED = 20;

export function speedToSliderIndex(speed: number): number {
  const exact = SPEED_STEPS.indexOf(speed as (typeof SPEED_STEPS)[number]);
  if (exact !== -1) return exact;

  const next = SPEED_STEPS.findIndex((step) => step > speed);
  return next === -1 ? SPEED_STEPS.length - 1 : Math.max(0, next - 1);
}

export function sliderIndexToSpeed(index: number): number {
  const clamped = Math.max(0, Math.min(SPEED_SLIDER_MAX, Math.round(index)));
  return SPEED_STEPS[clamped];
}