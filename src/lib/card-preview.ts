import {
  computeEarthFitCameraDistance,
  DESKTOP_EARTH_FIT_MARGIN,
} from "@/lib/satellite-math";

export const CARD_PREVIEW_PARAM = "card";
/** Hub screenshot viewport: 1280×800 */
export const CARD_PREVIEW_ASPECT = 1.6;
export const CARD_CAMERA_DISTANCE = computeEarthFitCameraDistance(
  undefined,
  DESKTOP_EARTH_FIT_MARGIN,
  CARD_PREVIEW_ASPECT,
);
export const CARD_EARTH_ROTATION_Y = -1.35;

export const CARD_CONSTELLATION_IDS = ["stations", "gps", "galileo"] as const;

export function isCardPreview(searchParams: URLSearchParams | null | undefined) {
  return searchParams?.has(CARD_PREVIEW_PARAM) ?? false;
}