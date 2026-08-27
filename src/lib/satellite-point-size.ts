import { SatelliteRecord } from "@/lib/satellite-math";

/**
 * Dialable satellite point sizing.
 *
 * Default + zoomed-in: full CLASS_PIXELS.
 * Past opening fit: smooth shrink toward MIN_SCALE (no band snaps).
 */
export const SIZE_SCALE = 1;
/** Phones only — Mac/iPad stay at full size (finer look). Dial down to match. */
export const PHONE_SIZE_SCALE = 0.7;

export type SizeClass = "iss" | "station" | "nav" | "mega";

/** Short side &lt; 600 CSS px ≈ phone; iPad/Mac stay out. */
export function isPhonePointViewport(): boolean {
  if (typeof window === "undefined") return false;
  return Math.min(window.innerWidth, window.innerHeight) < 600;
}

/** Pixel size for default through zoomed-in (before SIZE_SCALE). */
const CLASS_PIXELS: Record<SizeClass, number> = {
  iss: 4.2,
  station: 2.6,
  nav: 2,
  mega: 1.3,
};

/** Floor scale when fully zoomed out (1 = no shrink). */
const MIN_SCALE: Record<SizeClass, number> = {
  iss: 0.95,
  station: 0.85,
  nav: 0.72,
  mega: 0.36,
};

/** Shrink begins slightly past opening fit; finishes toward max zoom. */
const SHRINK_START_RATIO = 1.05;
const SHRINK_END_RATIO = 1.55;

function isIss(satellite: SatelliteRecord): boolean {
  return satellite.id === "25544";
}

export function getSizeClass(
  constellationId: string,
  satellite: SatelliteRecord,
): SizeClass {
  if (isIss(satellite)) return "iss";
  if (constellationId === "stations") return "station";
  if (
    constellationId === "starlink" ||
    constellationId === "oneweb" ||
    constellationId === "iridium" ||
    constellationId === "kuiper"
  ) {
    return "mega";
  }
  return "nav";
}

function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/**
 * 1 at default/zoomed-in, 0 when fully zoomed out.
 * Continuous — pair with size lerp in the field renderer.
 */
export function resolveZoomScale(
  cameraDistance: number,
  fitCameraDistance: number,
  maxCameraDistance: number,
): number {
  const fit = Math.max(fitCameraDistance, 0.001);
  const start = fit * SHRINK_START_RATIO;
  const end = Math.max(fit * SHRINK_END_RATIO, maxCameraDistance * 0.92);
  if (cameraDistance <= start) return 1;
  if (cameraDistance >= end) return 0;
  return 1 - smoothstep((cameraDistance - start) / (end - start));
}

export function resolvePointSize(
  sizeClass: SizeClass,
  zoomScale = 1,
): number {
  const minScale = MIN_SCALE[sizeClass];
  const scale = minScale + (1 - minScale) * zoomScale;
  const phoneScale = isPhonePointViewport() ? PHONE_SIZE_SCALE : 1;
  return CLASS_PIXELS[sizeClass] * scale * SIZE_SCALE * phoneScale;
}
