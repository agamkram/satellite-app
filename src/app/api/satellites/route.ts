import { NextRequest, NextResponse } from "next/server";

import { CONSTELLATION_BY_ID } from "@/lib/constellations";
import { readBundledGroupFallback } from "@/lib/celestrak-cache";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const groupParam = request.nextUrl.searchParams.get("group");

  if (!groupParam) {
    return NextResponse.json({ error: "Missing group parameter" }, { status: 400 });
  }

  const constellation = CONSTELLATION_BY_ID[groupParam];
  if (!constellation) {
    return NextResponse.json({ error: "Unknown constellation group" }, { status: 400 });
  }

  const catalog = await readBundledGroupFallback(constellation.group);
  if (!catalog) {
    return NextResponse.json(
      { error: `No baked catalog for ${constellation.name}. Run npm run fetch:sats.` },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      satellites: catalog.satellites,
      count: catalog.satellites.length,
      constellationId: constellation.id,
      fetchedAt: catalog.fetchedAt,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
      },
    },
  );
}
