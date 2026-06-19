import { CAMERA_MIN_DISTANCE, SatelliteRecord } from "@/lib/satellite-math";

const ZOOM_CLOSE = CAMERA_MIN_DISTANCE;
const SIZE_ZOOMED_IN = 1.75;
const SIZE_ZOOMED_OUT = 0.8;

export type PointSizePolicy = "zoom" | "fixed-2" | "fixed-4";

// Only the primary ISS catalog object — not docked modules (NAUKA) or nearby debris.
function isIss(satellite: SatelliteRecord): boolean {
  return satellite.id === "25544";
}

export function getPointSizePolicy(
  constellationId: string,
  satellite: SatelliteRecord,
): PointSizePolicy {
  if (
    constellationId === "starlink" ||
    constellationId === "oneweb" ||
    constellationId === "iridium" ||
    constellationId === "kuiper"
  ) {
    return "zoom";
  }
  if (isIss(satellite)) {
    return "fixed-4";
  }
  return "fixed-2";
}

function computeZoomPointSize(cameraDistance: number, zoomFar: number): number {
  const t = Math.min(1, Math.max(0, (cameraDistance - ZOOM_CLOSE) / (zoomFar - ZOOM_CLOSE)));
  const smooth = t * t * (3 - 2 * t);

  return SIZE_ZOOMED_IN + (SIZE_ZOOMED_OUT - SIZE_ZOOMED_IN) * smooth;
}

export function resolvePointSize(
  policy: PointSizePolicy,
  cameraDistance: number,
  zoomFar: number,
): number {
  switch (policy) {
    case "fixed-2":
      return 2;
    case "fixed-4":
      return 4;
    case "zoom":
      return computeZoomPointSize(cameraDistance, zoomFar);
  }
}