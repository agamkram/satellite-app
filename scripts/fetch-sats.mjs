#!/usr/bin/env node
/**
 * Morning catalog bake — pull CelesTrak once, write public/data.
 * Visitors never hit CelesTrak. Same pattern as GovDash heat.
 *
 *   npm run fetch:sats
 */
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "data");
const CELESTRAK = "https://celestrak.org/NORAD/elements/gp.php";
const TIMEOUT_MS = 90_000;
const GAP_MS = 400;

/** Must match src/lib/constellations.ts */
const GROUPS = [
  { id: "stations", group: "stations" },
  { id: "starlink", group: "starlink" },
  { id: "gps", group: "gps-ops" },
  { id: "oneweb", group: "oneweb" },
  { id: "iridium", group: "iridium-NEXT" },
  { id: "kuiper", group: "kuiper" },
  { id: "galileo", group: "galileo" },
  { id: "glo", group: "glo-ops" },
  { id: "beidou", group: "beidou" },
];

function cacheKey(group) {
  return group.replace(/[^a-z0-9-]/gi, "_");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function serialize(records, constellationId) {
  return records.map((record) => ({
    id: String(record.NORAD_CAT_ID),
    name: record.OBJECT_NAME,
    constellationId,
    omm: record,
  }));
}

async function downloadGroup(group) {
  const url = `${CELESTRAK}?GROUP=${encodeURIComponent(group)}&FORMAT=json`;
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      "User-Agent": "OrbitalView/1.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`${group} → HTTP ${response.status}`);
  }

  const records = await response.json();
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error(`${group} → empty catalog`);
  }

  return records;
}

async function fetchStarlink() {
  try {
    return await downloadGroup("starlink");
  } catch (error) {
    console.warn(`  starlink group failed (${error.message}); trying active filter`);
    const active = await downloadGroup("active");
    const starlink = active.filter((record) =>
      String(record.OBJECT_NAME || "")
        .toUpperCase()
        .includes("STARLINK"),
    );
    if (starlink.length === 0) {
      throw new Error("active catalog had no STARLINK names");
    }
    return starlink;
  }
}

async function main() {
  const fetchedAt = new Date().toISOString();
  const summary = [];

  for (let i = 0; i < GROUPS.length; i += 1) {
    const { id, group } = GROUPS[i];
    process.stdout.write(`${id} (${group})… `);
    const records = id === "starlink" ? await fetchStarlink() : await downloadGroup(group);
    const satellites = serialize(records, id);
    const path = join(OUT_DIR, `${cacheKey(group)}-fallback.json`);
    await writeFile(
      path,
      JSON.stringify({ fetchedAt, satellites }),
    );
    console.log(`${satellites.length} sats`);
    summary.push({ id, group, count: satellites.length });
    if (i < GROUPS.length - 1) await sleep(GAP_MS);
  }

  console.log(`\nfetchedAt ${fetchedAt}`);
  for (const row of summary) {
    console.log(`  ${row.id.padEnd(12)} ${String(row.count).padStart(6)}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
