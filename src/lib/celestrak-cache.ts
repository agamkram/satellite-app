import { promises as fs } from "fs";
import path from "path";

import { SerializedSatellite } from "@/lib/satellite-math";

const CACHE_TTL_MS = 2 * 60 * 60 * 1000;
const CACHE_DIR = process.env.VERCEL
  ? path.join("/tmp", "celestrak-cache")
  : path.join(process.cwd(), ".celestrak-cache");

interface CacheEntry {
  fetchedAt: string;
  satellites: SerializedSatellite[];
}

const memoryCache = new Map<string, CacheEntry>();

function cacheKey(group: string) {
  return group.replace(/[^a-z0-9-]/gi, "_");
}

async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

async function readDiskCache(group: string): Promise<CacheEntry | null> {
  try {
    const raw = await fs.readFile(path.join(CACHE_DIR, `${cacheKey(group)}.json`), "utf8");
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

async function writeDiskCache(group: string, entry: CacheEntry) {
  try {
    await ensureCacheDir();
    await fs.writeFile(
      path.join(CACHE_DIR, `${cacheKey(group)}.json`),
      JSON.stringify(entry),
      "utf8",
    );
  } catch {
    // Disk cache is best-effort (e.g. read-only environments).
  }
}

export async function readCachedGroup(group: string): Promise<CacheEntry | null> {
  const memory = memoryCache.get(group);
  if (memory) return memory;

  const disk = await readDiskCache(group);
  if (disk) {
    memoryCache.set(group, disk);
    return disk;
  }

  return null;
}

export async function writeCachedGroup(group: string, satellites: SerializedSatellite[]) {
  const entry: CacheEntry = {
    fetchedAt: new Date().toISOString(),
    satellites,
  };

  memoryCache.set(group, entry);
  await writeDiskCache(group, entry);
}

export function isCacheFresh(entry: CacheEntry) {
  const age = Date.now() - new Date(entry.fetchedAt).getTime();
  return age < CACHE_TTL_MS;
}

const BUNDLED_STARLINK_PATH = path.join(
  process.cwd(),
  "public",
  "data",
  "starlink-fallback.json",
);

export async function readBundledStarlinkFallback(): Promise<SerializedSatellite[] | null> {
  try {
    const raw = await fs.readFile(BUNDLED_STARLINK_PATH, "utf8");
    const payload = JSON.parse(raw) as CacheEntry;
    return payload.satellites;
  } catch {
    return null;
  }
}