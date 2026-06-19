import { NextRequest, NextResponse } from "next/server";

import { CONSTELLATION_BY_ID } from "@/lib/constellations";
import {
  isCacheFresh,
  readBundledStarlinkFallback,
  readCachedGroup,
  writeCachedGroup,
} from "@/lib/celestrak-cache";
import { OmmRecord, SerializedSatellite } from "@/lib/satellite-math";

export const dynamic = "force-dynamic";

const CELESTRAK_BASE = "https://celestrak.org/NORAD/elements/gp.php";

function serializeRecords(
  records: OmmRecord[],
  constellationId: string,
): SerializedSatellite[] {
  return records.map((record) => ({
    id: String(record.NORAD_CAT_ID),
    name: record.OBJECT_NAME,
    constellationId,
    omm: record,
  }));
}

async function downloadGroup(group: string): Promise<OmmRecord[]> {
  const url = `${CELESTRAK_BASE}?GROUP=${group}&FORMAT=json`;

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "OrbitalView/1.0",
      Accept: "application/json",
    },
  });

  if (response.status === 403) {
    return [];
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch ${group}: ${response.status}`);
  }

  return (await response.json()) as OmmRecord[];
}

async function fetchStarlinkFallback(): Promise<SerializedSatellite[]> {
  const cache = await readCachedGroup("starlink-active-fallback");
  if (cache && isCacheFresh(cache)) {
    return cache.satellites;
  }

  const activeRecords = await downloadGroup("active");
  if (activeRecords.length === 0) {
    if (cache) return cache.satellites;

    const bundled = await readBundledStarlinkFallback();
    if (bundled) {
      await writeCachedGroup("starlink-active-fallback", bundled);
      return bundled;
    }

    throw new Error(
      "Starlink is temporarily rate-limited by CelesTrak. Try again in about 2 hours.",
    );
  }

  const starlinkRecords = activeRecords.filter((record) =>
    record.OBJECT_NAME.toUpperCase().includes("STARLINK"),
  );

  const satellites = serializeRecords(starlinkRecords, "starlink");
  await writeCachedGroup("starlink-active-fallback", satellites);
  return satellites;
}

async function fetchConstellation(
  constellationId: string,
  group: string,
): Promise<{ satellites: SerializedSatellite[]; cached: boolean }> {
  const cached = await readCachedGroup(group);
  if (cached && isCacheFresh(cached)) {
    return { satellites: cached.satellites, cached: true };
  }

  const records = await downloadGroup(group);

  if (records.length === 0) {
    if (group === "starlink") {
      const satellites = await fetchStarlinkFallback();
      return { satellites, cached: false };
    }

    if (cached) {
      return { satellites: cached.satellites, cached: true };
    }

    throw new Error(
      `CelesTrak rate-limited ${group}. Data refreshes every 2 hours — try again shortly.`,
    );
  }

  const satellites = serializeRecords(records, constellationId);
  await writeCachedGroup(group, satellites);
  return { satellites, cached: false };
}

export async function GET(request: NextRequest) {
  const groupParam = request.nextUrl.searchParams.get("group");

  try {
    if (!groupParam) {
      return NextResponse.json({ error: "Missing group parameter" }, { status: 400 });
    }

    const constellation = CONSTELLATION_BY_ID[groupParam];
    if (!constellation) {
      return NextResponse.json({ error: "Unknown constellation group" }, { status: 400 });
    }

    const { satellites, cached } = await fetchConstellation(
      constellation.id,
      constellation.group,
    );

    return NextResponse.json({
      satellites,
      count: satellites.length,
      constellationId: constellation.id,
      cached,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load satellite data";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}