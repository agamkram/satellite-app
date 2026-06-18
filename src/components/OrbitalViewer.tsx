"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CONSTELLATIONS } from "@/lib/constellations";
import {
  deserializeSatellite,
  SatelliteRecord,
  SerializedSatellite,
} from "@/lib/satellite-math";
import { ConstellationLegend } from "./ConstellationLegend";
import { OrbitalScene } from "./OrbitalScene";
import { TimeControls } from "./TimeControls";

const HOUR_MS = 60 * 60 * 1000;

function getInitialVisibility() {
  return Object.fromEntries(
    CONSTELLATIONS.map((constellation) => [
      constellation.id,
      constellation.defaultVisible,
    ]),
  );
}

export function OrbitalViewer() {
  const [satellites, setSatellites] = useState<SatelliteRecord[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(300);
  const [offsetHours, setOffsetHours] = useState(0);
  const [displayTime, setDisplayTime] = useState(() => Date.now());
  const [visibleConstellations, setVisibleConstellations] = useState(getInitialVisibility);

  const baseTimeRef = useRef(Date.now());
  const simTimeRef = useRef(Date.now());

  const syncSimTime = useCallback((hours: number) => {
    simTimeRef.current = baseTimeRef.current + hours * HOUR_MS;
    return simTimeRef.current;
  }, []);

  const simTime = useMemo(
    () => baseTimeRef.current + offsetHours * HOUR_MS,
    // displayTime drives recomputation while playing without thrashing React each frame
    [offsetHours, displayTime, syncSimTime],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSatellites() {
      try {
        setLoading(true);
        setError(null);

        const responses = await Promise.all(
          CONSTELLATIONS.map(async (constellation) => {
            const response = await fetch(`/api/satellites?group=${constellation.id}`);
            const payload = (await response.json()) as {
              satellites: SerializedSatellite[];
              count: number;
              error?: string;
            };

            if (!response.ok) {
              throw new Error(payload.error ?? `Failed to load ${constellation.name}`);
            }

            return {
              constellationId: constellation.id,
              satellites: payload.satellites,
              count: payload.count,
            };
          }),
        );

        if (cancelled) return;

        const parsed = responses
          .flatMap((result) => result.satellites)
          .map(deserializeSatellite)
          .filter((satellite): satellite is SatelliteRecord => satellite !== null);

        const nextCounts = Object.fromEntries(
          responses.map((result) => [result.constellationId, result.count]),
        );

        setSatellites(parsed);
        setCounts(nextCounts);
      } catch (fetchError) {
        if (cancelled) return;
        const message =
          fetchError instanceof Error ? fetchError.message : "Failed to load satellites";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSatellites();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!playing) return;

    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const deltaMs = now - last;
      last = now;

      setOffsetHours((current) => {
        const next = current + (deltaMs / HOUR_MS) * speed;
        simTimeRef.current = baseTimeRef.current + next * HOUR_MS;
        return next;
      });
      setDisplayTime(Date.now());

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frame);
  }, [playing, speed]);

  const handleOffsetChange = useCallback(
    (hours: number) => {
      setPlaying(false);
      syncSimTime(hours);
      setOffsetHours(hours);
      setDisplayTime(Date.now());
    },
    [syncSimTime],
  );

  const handleReset = useCallback(() => {
    setPlaying(false);
    baseTimeRef.current = Date.now();
    syncSimTime(0);
    setOffsetHours(0);
    setDisplayTime(Date.now());
  }, [syncSimTime]);

  const toggleConstellation = useCallback((id: string) => {
    setVisibleConstellations((current) => ({
      ...current,
      [id]: !current[id],
    }));
  }, []);

  const totalVisible = useMemo(() => {
    return satellites.filter(
      (satellite) => visibleConstellations[satellite.constellationId],
    ).length;
  }, [satellites, visibleConstellations]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#02040a] text-white">
      <div className="absolute inset-0">
        {!loading && !error ? (
          <OrbitalScene
            satellites={satellites}
            visibleConstellations={visibleConstellations}
            simTimeRef={simTimeRef}
          />
        ) : null}
      </div>

      <div className="pointer-events-none relative z-10 flex h-full flex-col">
        <header className="pointer-events-none flex items-start justify-between gap-3 p-3 sm:p-5">
          <div className="pointer-events-auto max-w-xl rounded-2xl border border-white/10 bg-black/55 px-4 py-3 backdrop-blur-md">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-sky-300/90">
              Orbital View
            </p>
            <h1 className="mt-1 text-lg font-semibold sm:text-xl">
              Live satellites around Earth
            </h1>
            <p className="mt-1 text-xs text-white/55 sm:text-sm">
              NORAD TLE data via CelesTrak. Drag to orbit, pinch to zoom, scrub time
              ±24 hours.
            </p>
          </div>

          <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/55 px-3 py-2 text-right backdrop-blur-md">
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Visible</p>
            <p className="font-mono text-sm text-white/90">
              {loading ? "…" : totalVisible.toLocaleString()}
            </p>
          </div>
        </header>

        <div className="flex-1" />

        <div className="pointer-events-none grid gap-3 p-3 sm:grid-cols-[minmax(0,280px)_minmax(0,1fr)] sm:p-5">
          <ConstellationLegend
            constellations={CONSTELLATIONS}
            counts={counts}
            visibleConstellations={visibleConstellations}
            onToggle={toggleConstellation}
          />

          <TimeControls
            simTime={simTime}
            offsetHours={offsetHours}
            playing={playing}
            speed={speed}
            onOffsetChange={handleOffsetChange}
            onPlayingChange={setPlaying}
            onSpeedChange={setSpeed}
            onReset={handleReset}
          />
        </div>
      </div>

      {loading ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#02040a]/80 backdrop-blur-sm">
          <div className="rounded-2xl border border-white/10 bg-black/70 px-6 py-4 text-center">
            <p className="text-sm text-white/80">Loading satellite catalog…</p>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#02040a]/85 backdrop-blur-sm">
          <div className="max-w-md rounded-2xl border border-red-400/20 bg-black/75 px-6 py-4 text-center">
            <p className="text-sm text-red-200">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}