"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  isPhonePortrait,
  measureDockInsets,
} from "@/lib/ios-home-screen";
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

function TimeDisplay({ simTime, offsetHours }: Pick<TimeControlsProps, "simTime" | "offsetHours">) {
  return (
    <div className="time-controls-time mb-1 flex items-center justify-between gap-2 text-[10px] text-white/50 short-landscape:mb-0.5">
      <span suppressHydrationWarning className="font-mono text-white/75">
        {formatLocalTime(simTime)}
      </span>
      <span>
        {offsetHours >= 0 ? "+" : ""}
        {offsetHours.toFixed(1)}h
      </span>
    </div>
  );
}

function TimeSlider({
  offsetHours,
  onScrubStart,
  onScrubChange,
  onScrubEnd,
  className = "",
}: Pick<
  TimeControlsProps,
  "offsetHours" | "onScrubStart" | "onScrubChange" | "onScrubEnd"
> & { className?: string }) {
  return (
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
      className={`time-controls-slider time-slider w-full ${className}`.trim()}
      aria-label="Time offset in hours"
    />
  );
}

function SpeedControls({
  speed,
  onReset,
  onSpeedChange,
}: Pick<TimeControlsProps, "speed" | "onReset" | "onSpeedChange">) {
  return (
    <div className="time-controls-actions mt-1 flex items-center gap-2 short-landscape:mt-0.5 short-landscape:gap-1">
      <button
        type="button"
        onClick={onReset}
        className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs text-white/85 hover:bg-white/10 short-landscape:px-2 short-landscape:py-0 tall:px-3 tall:py-1"
      >
        Now
      </button>

      <div className="ml-auto flex items-center gap-1">
        <span className="hidden text-[10px] uppercase tracking-wide text-white/45 tall:inline">
          Speed
        </span>
        <button
          type="button"
          onClick={() => onSpeedChange(stepSpeedDown(speed))}
          disabled={speed <= SPEED_MIN}
          aria-label="Decrease speed"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-sm text-white/85 hover:bg-white/10 disabled:opacity-30 short-landscape:h-7 short-landscape:w-7 tall:h-11 tall:w-11 tall:text-base"
        >
          −
        </button>
        <span
          aria-live="polite"
          className="min-w-[2.75rem] rounded-md border border-white/15 bg-black/40 px-1.5 py-0.5 text-center font-mono text-xs text-white short-landscape:min-w-[2.25rem] short-landscape:px-1 tall:min-w-[3rem] tall:px-2 tall:py-1"
        >
          {speed}×
        </span>
        <button
          type="button"
          onClick={() => onSpeedChange(stepSpeedUp(speed))}
          disabled={speed >= SPEED_MAX}
          aria-label="Increase speed"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-sm text-white/85 hover:bg-white/10 disabled:opacity-30 short-landscape:h-7 short-landscape:w-7 tall:h-11 tall:w-11 tall:text-base"
        >
          +
        </button>
      </div>
    </div>
  );
}

function LandscapeDock(props: TimeControlsProps) {
  return (
    <div className="time-controls-dock pointer-events-auto w-full px-3 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 short-landscape:px-2 short-landscape:pb-1 short-landscape:pt-0.5 tall:px-5 tall:pt-2">
      <div className="time-controls-panel mx-auto max-w-3xl rounded-xl border border-white/10 bg-black/45 px-3 py-1.5 backdrop-blur-sm short-landscape:px-2 short-landscape:py-1 tall:py-2">
        <TimeDisplay simTime={props.simTime} offsetHours={props.offsetHours} />
        <TimeSlider
          offsetHours={props.offsetHours}
          onScrubStart={props.onScrubStart}
          onScrubChange={props.onScrubChange}
          onScrubEnd={props.onScrubEnd}
        />
        <SpeedControls
          speed={props.speed}
          onReset={props.onReset}
          onSpeedChange={props.onSpeedChange}
        />
      </div>
    </div>
  );
}

function PortraitDock(
  props: TimeControlsProps & {
    dockInsets: ReturnType<typeof measureDockInsets>;
  },
) {
  const { dockInsets } = props;

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 z-[9999] bg-gradient-to-t from-[#02040a]/92 via-[#02040a]/45 to-transparent"
        style={{
          bottom: dockInsets.bottom,
          height: "7.5rem",
        }}
        aria-hidden
      />
      <div
        id="ov-time-controls"
        className="pointer-events-none fixed z-[10000]"
        style={{
          left: dockInsets.left,
          right: dockInsets.right,
          bottom: dockInsets.bottom,
          paddingBottom: dockInsets.padBottom,
        }}
      >
        <div className="pointer-events-auto mx-auto w-full max-w-3xl">
          <div className="mb-2 rounded-xl border border-white/10 bg-black/45 px-3 py-1.5 backdrop-blur-sm">
            <TimeDisplay simTime={props.simTime} offsetHours={props.offsetHours} />
            <SpeedControls
              speed={props.speed}
              onReset={props.onReset}
              onSpeedChange={props.onSpeedChange}
            />
          </div>
          <TimeSlider
            offsetHours={props.offsetHours}
            onScrubStart={props.onScrubStart}
            onScrubChange={props.onScrubChange}
            onScrubEnd={props.onScrubEnd}
            className="min-h-11"
          />
        </div>
      </div>
    </>
  );
}

export function TimeControls(props: TimeControlsProps) {
  const [mounted, setMounted] = useState(false);
  const [portraitPhone, setPortraitPhone] = useState(false);
  const [dockInsets, setDockInsets] = useState(() => measureDockInsets());

  useEffect(() => {
    setMounted(true);

    const updateLayout = () => {
      setPortraitPhone(isPhonePortrait());
      setDockInsets(measureDockInsets());
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);
    window.addEventListener("orientationchange", updateLayout);
    window.visualViewport?.addEventListener("resize", updateLayout);
    window.visualViewport?.addEventListener("scroll", updateLayout);

    return () => {
      window.removeEventListener("resize", updateLayout);
      window.removeEventListener("orientationchange", updateLayout);
      window.visualViewport?.removeEventListener("resize", updateLayout);
      window.visualViewport?.removeEventListener("scroll", updateLayout);
    };
  }, []);

  if (!mounted) return null;

  if (portraitPhone) {
    return createPortal(
      <PortraitDock {...props} dockInsets={dockInsets} />,
      document.body,
    );
  }

  return <LandscapeDock {...props} />;
}