import * as satellite from "satellite.js";
import type { OMMJsonObject, SatRec } from "satellite.js";

export const EARTH_RADIUS_KM = 6371.0;
export const GLOBE_RADIUS = 2;
export const SCENE_SCALE = GLOBE_RADIUS / EARTH_RADIUS_KM;
export const HIDDEN_POSITION = 9999;
export const CAMERA_MIN_DISTANCE = 2.6;
export const CAMERA_FOV = 45;
export const DEFAULT_MAX_CAMERA_DISTANCE = 18;

export interface SatelliteRecord {
  id: string;
  name: string;
  constellationId: string;
  satrec: SatRec;
}

export interface SerializedSatellite {
  id: string;
  name: string;
  constellationId: string;
  omm: OmmRecord;
}

export type OmmRecord = OMMJsonObject;

export function parseOmmRecord(
  record: OMMJsonObject,
  constellationId: string,
): SatelliteRecord | null {
  try {
    const satrec = satellite.json2satrec(record);
    if (satrec.error) return null;

    return {
      id: String(record.NORAD_CAT_ID),
      name: record.OBJECT_NAME,
      constellationId,
      satrec,
    };
  } catch {
    return null;
  }
}

export function writeSatellitePosition(
  satrec: SatRec,
  date: Date,
  positions: Float32Array,
  index: number,
): void {
  const offset = index * 3;
  const result = satellite.propagate(satrec, date);

  if (!result?.position || typeof result.position === "boolean") {
    positions[offset] = HIDDEN_POSITION;
    positions[offset + 1] = HIDDEN_POSITION;
    positions[offset + 2] = HIDDEN_POSITION;
    return;
  }

  const { x, y, z } = result.position;
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
    positions[offset] = HIDDEN_POSITION;
    positions[offset + 1] = HIDDEN_POSITION;
    positions[offset + 2] = HIDDEN_POSITION;
    return;
  }

  positions[offset] = x * SCENE_SCALE;
  positions[offset + 1] = z * SCENE_SCALE;
  positions[offset + 2] = -y * SCENE_SCALE;
}

export function computeOrbitalRadiusScene(satrec: SatRec, date: Date): number | null {
  const result = satellite.propagate(satrec, date);

  if (!result?.position || typeof result.position === "boolean") {
    return null;
  }

  const { x, y, z } = result.position;
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
    return null;
  }

  const radiusKm = Math.hypot(x, y, z);
  return radiusKm * SCENE_SCALE;
}

export function computeMaxOrbitalRadiusScene(
  satellites: SatelliteRecord[],
  date: Date = new Date(),
): number {
  let max = GLOBE_RADIUS;

  for (const satellite of satellites) {
    const radius = computeOrbitalRadiusScene(satellite.satrec, date);
    if (radius !== null) {
      max = Math.max(max, radius);
    }
  }

  return max;
}

export function computeFitCameraDistance(
  maxOrbitalRadius: number,
  fovDeg = CAMERA_FOV,
  padding = 1.15,
): number {
  const halfFovRad = (fovDeg / 2) * (Math.PI / 180);
  const fitDistance = (maxOrbitalRadius / Math.tan(halfFovRad)) * padding;

  return Math.max(CAMERA_MIN_DISTANCE + 1, fitDistance);
}

export function lerpPositionBuffers(
  from: Float32Array,
  to: Float32Array,
  out: Float32Array,
  alpha: number,
): void {
  const t = alpha <= 0 ? 0 : alpha >= 1 ? 1 : alpha;
  for (let i = 0; i < out.length; i += 1) {
    out[i] = from[i] + (to[i] - from[i]) * t;
  }
}