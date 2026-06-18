import * as satellite from "satellite.js";
import type { OMMJsonObject, SatRec } from "satellite.js";

export const EARTH_RADIUS_KM = 6371.0;
export const GLOBE_RADIUS = 2;

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

export function deserializeSatellite(data: SerializedSatellite): SatelliteRecord | null {
  return parseOmmRecord(data.omm, data.constellationId);
}

export interface ScenePosition {
  x: number;
  y: number;
  z: number;
}

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

export function eciToScene(eci: { x: number; y: number; z: number }): ScenePosition {
  const scale = GLOBE_RADIUS / EARTH_RADIUS_KM;
  return {
    x: eci.x * scale,
    y: eci.z * scale,
    z: -eci.y * scale,
  };
}

export function getSatellitePosition(
  satrec: SatRec,
  date: Date,
): ScenePosition | null {
  const result = satellite.propagate(satrec, date);
  if (!result || !result.position || typeof result.position === "boolean") return null;

  const { x, y, z } = result.position;
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
    return null;
  }

  return eciToScene({ x, y, z });
}