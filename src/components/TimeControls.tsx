"use client";

interface TimeControlsProps {
  simTime: number;
  offsetHours: number;
  playing: boolean;
  speed: number;
  onOffsetChange: (hours: number) => void;
  onPlayingChange: (playing: boolean) => void;
  onSpeedChange: (speed: number) => void;
  onReset: () => void;
}

function formatUtc(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function TimeControls({
  simTime,
  offsetHours,
  playing,
  speed,
  onOffsetChange,
  onPlayingChange,
  onSpeedChange,
  onReset,
}: TimeControlsProps) {
  return (
    <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/70 p-3 shadow-2xl backdrop-blur-md sm:p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-sky-300/90">
          Simulation Time
        </p>
        <p className="font-mono text-xs text-white/90 sm:text-sm">{formatUtc(simTime)} UTC</p>
      </div>

      <input
        type="range"
        min={-24}
        max={24}
        step={0.25}
        value={offsetHours}
        onChange={(event) => onOffsetChange(Number(event.target.value))}
        className="time-slider mb-3 w-full"
        aria-label="Time offset in hours"
      />

      <div className="mb-3 flex items-center justify-between text-[11px] text-white/50">
        <span>-24h</span>
        <span>
          {offsetHours >= 0 ? "+" : ""}
          {offsetHours.toFixed(1)}h from now
        </span>
        <span>+24h</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPlayingChange(!playing)}
          className="rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-400"
        >
          {playing ? "Pause" : "Play"}
        </button>

        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/85 transition hover:bg-white/10"
        >
          Now
        </button>

        <label className="ml-auto flex items-center gap-2 text-xs text-white/70">
          Speed
          <select
            value={speed}
            onChange={(event) => onSpeedChange(Number(event.target.value))}
            className="rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-sm text-white"
          >
            <option value={60}>60×</option>
            <option value={300}>300×</option>
            <option value={1800}>1800×</option>
            <option value={3600}>3600×</option>
          </select>
        </label>
      </div>
    </div>
  );
}