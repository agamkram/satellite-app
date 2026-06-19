"use client";

import {
  SPEED_MAX,
  SPEED_MIN,
  stepSpeedDown,
  stepSpeedUp,
} from "@/lib/playback-speed";

interface TimeControlsProps {
  simTime: number;
  offsetHours: number;
  speed: number;
  onScrubStart: () => void;
  onScrubChange: (hours: number) => void;
  onScrubEnd: (hours: number) => void;
  onSpeedChange: (speed: number) => void;
  onReset: () => void;
}

function formatLocalTime(timestamp: number) {
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "short",
  });
}

export function TimeControls({
  simTime,
  offsetHours,
  speed,
  onScrubStart,
  onScrubChange,
  onScrubEnd,
  onSpeedChange,
  onReset,
}: TimeControlsProps) {
  return (
    <div className="pointer-events-auto w-full px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-5">
      <div className="mx-auto max-w-3xl rounded-xl border border-white/10 bg-black/45 px-3 py-2 backdrop-blur-sm">
        <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] text-white/50">
          <span suppressHydrationWarning className="font-mono text-white/75">
            {formatLocalTime(simTime)}
          </span>
          <span>
            {offsetHours >= 0 ? "+" : ""}
            {offsetHours.toFixed(1)}h
          </span>
        </div>

        <input
          type="range"
          min={-12}
          max={12}
          step="any"
          value={offsetHours}
          onPointerDown={onScrubStart}
          onPointerUp={(event) => onScrubEnd(Number(event.currentTarget.value))}
          onPointerCancel={(event) => onScrubEnd(Number(event.currentTarget.value))}
          onInput={(event) => onScrubChange(Number(event.currentTarget.value))}
          className="time-slider w-full"
          aria-label="Time offset in hours"
        />

        <div className="mt-1.5 flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/85 hover:bg-white/10"
          >
            Now
          </button>

          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wide text-white/45">Speed</span>
            <button
              type="button"
              onClick={() => onSpeedChange(stepSpeedDown(speed))}
              disabled={speed <= SPEED_MIN}
              aria-label="Decrease speed"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-base text-white/85 hover:bg-white/10 disabled:opacity-30 sm:h-11 sm:w-11"
            >
              −
            </button>
            <span
              aria-live="polite"
              className="min-w-[3rem] rounded-md border border-white/15 bg-black/40 px-2 py-1 text-center font-mono text-xs text-white"
            >
              {speed}×
            </span>
            <button
              type="button"
              onClick={() => onSpeedChange(stepSpeedUp(speed))}
              disabled={speed >= SPEED_MAX}
              aria-label="Increase speed"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-base text-white/85 hover:bg-white/10 disabled:opacity-30 sm:h-11 sm:w-11"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}