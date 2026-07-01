"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { CONSTELLATIONS } from "@/lib/constellations";
import { HOUR_MS } from "@/lib/playback-speed";
import {
  computeFitCameraDistance,
  computeMaxOrbitalRadiusScene,
  DEFAULT_MAX_CAMERA_DISTANCE,
  parseOmmRecord,
  SatelliteRecord,
  SerializedSatellite,
} from "@/lib/satellite-math";
import { ConstellationLegend } from "./ConstellationLegend";
import { OrbitalScene } from "./OrbitalScene";
import { TimeControls } from "./TimeControls";

const INITIAL_VISIBILITY = Object.fromEntries(
  CONSTELLATIONS.map((constellation) => [constellation.id, true]),
);

export function OrbitalViewer() {
  const [satellites, setSatellites] = useState<SatelliteRecord[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);
  const [offsetHours, setOffsetHours] = useState(0);
  const [simTime, setSimTime] = useState(() => Date.now());
  const [visibleConstellations, setVisibleConstellations] = useState(INITIAL_VISIBILITY);
  const [legendOpen, setLegendOpen] = useState(false);

  const baseTimeRef = useRef(Date.now());
  const simTimeRef = useRef(Date.now());
  const offsetHoursRef = useRef(0);
  const speedRef = useRef(speed);
  const scrubbingRef = useRef(false);
  const scrubAnchorRef = useRef<number | null>(null);
  const scrubUiFrameRef = useRef<number | null>(null);

  speedRef.current = speed;

  const syncSimTime = useCallback((hours: number) => {
    offsetHoursRef.current = hours;
    simTimeRef.current = baseTimeRef.current + hours * HOUR_MS;
    setSimTime(simTimeRef.current);
  }, []);

  const handleUiUpdate = useCallback((hours: number) => {
    setOffsetHours(hours);
    setSimTime(simTimeRef.current);
  }, []);

  const [viewportAspect, setViewportAspect] = useState(() =>
    typeof window === "undefined" ? 1 : window.innerWidth / window.innerHeight,
  );
  const [uiMounted, setUiMounted] = useState(false);
  const [portraitPhone, setPortraitPhone] = useState(false);

  useEffect(() => {
    setUiMounted(true);

    const updateViewport = () => {
      setViewportAspect(window.innerWidth / window.innerHeight);
      setPortraitPhone(
        window.matchMedia("(max-width: 767px) and (orientation: portrait)").matches,
      );
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    window.addEventListener("orientationchange", updateViewport);
    window.visualViewport?.addEventListener("resize", updateViewport);

    return () => {
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener("orientationchange", updateViewport);
      window.visualViewport?.removeEventListener("resize", updateViewport);
    };
  }, []);

  const { fitCameraDistance, maxCameraDistance } = useMemo(() => {
    if (satellites.length === 0) {
      return {
        fitCameraDistance: 6,
        maxCameraDistance: DEFAULT_MAX_CAMERA_DISTANCE,
      };
    }

    const maxOrbitalRadius = computeMaxOrbitalRadiusScene(satellites);
    const isPortrait = viewportAspect < 1;
    const padding = isPortrait ? 1.22 : 1.15;
    const fit = computeFitCameraDistance(
      maxOrbitalRadius,
      undefined,
      padding,
      viewportAspect,
    );

    return {
      fitCameraDistance: fit,
      maxCameraDistance: Math.max(fit * 1.08, DEFAULT_MAX_CAMERA_DISTANCE),
    };
  }, [satellites, viewportAspect]);

  useEffect(() => {
    let cancelled = false;

    async function loadSatellites() {
      try {
        setLoading(true);
        setError(null);
        setWarning(null);

        const results = await Promise.allSettled(
          CONSTELLATIONS.map(async (constellation) => {
            const response = await fetch(`/api/satellites?group=${constellation.id}`);
            const raw = await response.text();

            let payload: {
              satellites: SerializedSatellite[];
              count: number;
              error?: string;
            };

            try {
              payload = JSON.parse(raw) as typeof payload;
            } catch {
              throw new Error(
                "Server not ready yet. Wait a few seconds, then refresh the page.",
              );
            }

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

        const responses = results.flatMap((result) =>
          result.status === "fulfilled" ? [result.value] : [],
        );
        const failures = results
          .map((result, index) =>
            result.status === "rejected"
              ? `${CONSTELLATIONS[index].name}: ${
                  result.reason instanceof Error ? result.reason.message : "failed"
                }`
              : null,
          )
          .filter((message): message is string => message !== null);

        if (responses.length === 0) {
          throw new Error(failures[0] ?? "Failed to load satellites");
        }

        const parsed = responses
          .flatMap((result) => result.satellites)
          .map((satellite) => parseOmmRecord(satellite.omm, satellite.constellationId))
          .filter((satellite): satellite is SatelliteRecord => satellite !== null);

        const nextCounts = Object.fromEntries(
          responses.map((result) => [result.constellationId, result.count]),
        );

        setSatellites(parsed);
        setCounts(nextCounts);

        if (failures.length > 0) {
          setWarning(`Some groups could not be loaded: ${failures.join("; ")}`);
        }
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

  const handleScrubStart = useCallback(() => {
    scrubbingRef.current = true;
    scrubAnchorRef.current = Date.now();
  }, []);

  const handleScrubChange = useCallback((hours: number) => {
    const anchor = scrubAnchorRef.current ?? Date.now();
    offsetHoursRef.current = hours;
    simTimeRef.current = anchor + hours * HOUR_MS;
    setOffsetHours(hours);

    if (scrubUiFrameRef.current === null) {
      scrubUiFrameRef.current = requestAnimationFrame(() => {
        setSimTime(simTimeRef.current);
        scrubUiFrameRef.current = null;
      });
    }
  }, []);

  const handleScrubEnd = useCallback(
    (hours: number) => {
      if (scrubUiFrameRef.current !== null) {
        cancelAnimationFrame(scrubUiFrameRef.current);
        scrubUiFrameRef.current = null;
      }

      scrubbingRef.current = false;
      scrubAnchorRef.current = null;
      baseTimeRef.current = Date.now();
      syncSimTime(hours);
      setOffsetHours(hours);
    },
    [syncSimTime],
  );

  const handleReset = useCallback(() => {
    baseTimeRef.current = Date.now();
    syncSimTime(0);
    setOffsetHours(0);
  }, [syncSimTime]);

  const toggleConstellation = useCallback((id: string) => {
    setVisibleConstellations((current) => ({
      ...current,
      [id]: !current[id],
    }));
  }, []);

  const timeControlsDock = (
    <div
      className={
        portraitPhone
          ? "time-controls-gradient pointer-events-none fixed inset-x-0 bottom-0 z-[10000] bg-gradient-to-t from-[#02040a]/80 via-[#02040a]/35 to-transparent"
          : "time-controls-gradient absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#02040a]/80 via-[#02040a]/35 to-transparent"
      }
    >
      <TimeControls
        simTime={simTime}
        offsetHours={offsetHours}
        speed={speed}
        onScrubStart={handleScrubStart}
        onScrubChange={handleScrubChange}
        onScrubEnd={handleScrubEnd}
        onSpeedChange={setSpeed}
        onReset={handleReset}
      />
    </div>
  );

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#02040a] text-white">
      <div className="absolute inset-0">
        {!loading && satellites.length > 0 ? (
          <OrbitalScene
            satellites={satellites}
            visibleConstellations={visibleConstellations}
            speedRef={speedRef}
            baseTimeRef={baseTimeRef}
            offsetHoursRef={offsetHoursRef}
            simTimeRef={simTimeRef}
            scrubbingRef={scrubbingRef}
            onUiUpdate={handleUiUpdate}
            fitCameraDistance={fitCameraDistance}
            maxCameraDistance={maxCameraDistance}
          />
        ) : null}
      </div>

      <ConstellationLegend
        counts={counts}
        visibleConstellations={visibleConstellations}
        open={legendOpen}
        onOpenChange={setLegendOpen}
        onToggle={toggleConstellation}
      />

      <div className="pointer-events-none absolute inset-0 z-10">
        {warning ? (
          <div className="pointer-events-auto absolute left-1/2 top-3 z-30 max-w-md -translate-x-1/2 rounded-full border border-amber-400/25 bg-amber-950/80 px-3 py-1.5 text-center text-xs text-amber-100">
            {warning}
          </div>
        ) : null}

        {!portraitPhone ? timeControlsDock : null}
      </div>

      {uiMounted && portraitPhone
        ? createPortal(timeControlsDock, document.body)
        : null}

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