"use client";

import { Constellation } from "@/lib/constellations";

interface ConstellationLegendProps {
  constellations: Constellation[];
  counts: Record<string, number>;
  visibleConstellations: Record<string, boolean>;
  onToggle: (id: string) => void;
}

export function ConstellationLegend({
  constellations,
  counts,
  visibleConstellations,
  onToggle,
}: ConstellationLegendProps) {
  return (
    <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/70 p-3 shadow-2xl backdrop-blur-md sm:p-4">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-sky-300/90">
        Constellations
      </p>

      <ul className="max-h-[40dvh] space-y-2 overflow-y-auto pr-1 sm:max-h-none">
        {constellations.map((constellation) => {
          const visible = visibleConstellations[constellation.id] ?? true;
          const count = counts[constellation.id] ?? 0;

          return (
            <li key={constellation.id}>
              <button
                type="button"
                onClick={() => onToggle(constellation.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition ${
                  visible ? "bg-white/5 hover:bg-white/10" : "opacity-45 hover:opacity-70"
                }`}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: constellation.color }}
                />
                <span className="min-w-0 flex-1 text-sm text-white/90">
                  {constellation.name}
                </span>
                <span className="font-mono text-xs text-white/45">
                  {count.toLocaleString()}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}