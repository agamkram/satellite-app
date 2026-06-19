"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

import { HOUR_MS } from "@/lib/playback-speed";

const UI_UPDATE_MS = 250;

interface SceneClockProps {
  speedRef: React.RefObject<number>;
  baseTimeRef: React.RefObject<number>;
  offsetHoursRef: React.RefObject<number>;
  simTimeRef: React.RefObject<number>;
  onUiUpdate: (offsetHours: number) => void;
}

export function SceneClock({
  speedRef,
  baseTimeRef,
  offsetHoursRef,
  simTimeRef,
  onUiUpdate,
}: SceneClockProps) {
  const lastUiUpdateRef = useRef(0);

  useFrame((_, delta) => {
    const deltaMs = Math.min(delta * 1000, 50);
    const nextOffset = offsetHoursRef.current + (deltaMs / HOUR_MS) * speedRef.current;

    offsetHoursRef.current = nextOffset;
    simTimeRef.current = baseTimeRef.current + nextOffset * HOUR_MS;

    const now = performance.now();
    if (now - lastUiUpdateRef.current >= UI_UPDATE_MS) {
      onUiUpdate(nextOffset);
      lastUiUpdateRef.current = now;
    }
  }, -1000);

  return null;
}