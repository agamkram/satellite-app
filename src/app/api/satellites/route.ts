import { NextRequest, NextResponse } from "next/server";

import { CONSTELLATIONS, CONSTELLATION_BY_ID } from "@/lib/constellations";
import { OmmRecord, SerializedSatellite } from "@/lib/satellite-math";

export const revalidate = 3600;

const CELESTRAK_BASE = "https://celestrak.org/NORAD/elements/gp.php";

async function fetchConstellation(
  constellationId: string,
  group: string,
): Promise<SerializedSatellite[]> {
  const url = `${CELESTRAK_BASE}?GROUP=${group}&FORMAT=json`;

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${group}: ${response.status}`);
  }

  const records = (await response.json()) as OmmRecord[];

  return records.map((record) => ({
    id: String(record.NORAD_CAT_ID),
    name: record.OBJECT_NAME,
    constellationId,
    omm: record,
  }));
}

export async function GET(request: NextRequest) {
  const groupParam = request.nextUrl.searchParams.get("group");

  try {
    if (groupParam) {
      const constellation = CONSTELLATION_BY_ID[groupParam];
      if (!constellation) {
        return NextResponse.json({ error: "Unknown constellation group" }, { status: 400 });
      }

      const satellites = await fetchConstellation(constellation.id, constellation.group);

      return NextResponse.json({
        satellites,
        count: satellites.length,
        constellationId: constellation.id,
        fetchedAt: new Date().toISOString(),
      });
    }

    const results = await Promise.all(
      CONSTELLATIONS.map(({ id, group }) => fetchConstellation(id, group)),
    );

    const satellites = results.flat();
    const counts = Object.fromEntries(
      CONSTELLATIONS.map(({ id }, index) => [id, results[index].length]),
    );

    return NextResponse.json({
      satellites,
      counts,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load satellite data";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}