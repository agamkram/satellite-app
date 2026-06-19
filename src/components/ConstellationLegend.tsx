"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { Constellation } from "@/lib/constellations";

interface ConstellationLegendProps {
  constellations: Constellation[];
  counts: Record<string, number>;
  visibleConstellations: Record<string, boolean>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggle: (id: string) => void;
}

export function ConstellationLegend({
  constellations,
  counts,
  visibleConstellations,
  open,
  onOpenChange,
  onToggle,
}: ConstellationLegendProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sortedConstellations = useMemo(
    () =>
      [...constellations].sort(
        (a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0),
      ),
    [constellations, counts],
  );

  if (!mounted) return null;

  return createPortal(
    <>
      <button
        id="ov-constellation-btn"
        type="button"
        onClick={() => onOpenChange(!open)}
        className="pointer-events-auto rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-xs text-white/85 backdrop-blur-sm hover:bg-black/60"
        aria-expanded={open}
        aria-label={open ? "Hide constellations" : "Show constellations"}
      >
        {open ? "Hide" : "Constellations"}
      </button>

      {open ? (
        <div
          id="ov-constellation-panel"
          className="pointer-events-auto max-h-[min(50dvh,320px)] w-[min(240px,calc(100vw-1.5rem))] overflow-y-auto rounded-xl border border-white/10 bg-black/55 p-2 backdrop-blur-md"
        >
          <ul className="space-y-1">
            {sortedConstellations.map((constellation) => {
              const visible = visibleConstellations[constellation.id] ?? true;
              const count = counts[constellation.id] ?? 0;

              return (
                <li key={constellation.id}>
                  <button
                    type="button"
                    onClick={() => onToggle(constellation.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition ${
                      visible ? "hover:bg-white/10" : "opacity-40 hover:opacity-65"
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: constellation.color }}
                    />
                    <span className="min-w-0 flex-1 truncate text-white/90">
                      {constellation.name}
                    </span>
                    <span className="font-mono text-[10px] text-white/45">
                      {count.toLocaleString()}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </>,
    document.body,
  );
}