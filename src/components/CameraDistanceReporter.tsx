"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";

const DISTANCE_EPSILON = 0.025;

interface CameraDistanceReporterProps {
  onDistance: (distance: number) => void;
}

/** Pushes camera distance to React UI (throttled) for teaching chips. */
export function CameraDistanceReporter({ onDistance }: CameraDistanceReporterProps) {
  const { camera } = useThree();
  const lastRef = useRef(-1);
  const onDistanceRef = useRef(onDistance);
  onDistanceRef.current = onDistance;

  useFrame(() => {
    const distance = camera.position.length();
    if (Math.abs(distance - lastRef.current) < DISTANCE_EPSILON) return;
    lastRef.current = distance;
    onDistanceRef.current(distance);
  });

  return null;
}
