export const CARD_PREVIEW_PARAM = "card";
export const CARD_CAMERA_DISTANCE = 3.45;
export const CARD_EARTH_ROTATION_Y = -1.35;

export const CARD_CONSTELLATION_IDS = ["stations", "gps", "galileo"] as const;

export function isCardPreview(searchParams: URLSearchParams | null | undefined) {
  return searchParams?.has(CARD_PREVIEW_PARAM) ?? false;
}