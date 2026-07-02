"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

interface CameraFitProps {
  distance: number;
  position?: [number, number, number];
}

export function CameraFit({ distance, position }: CameraFitProps) {
  const { camera, controls } = useThree();
  const [x, y, z] = position ?? [0, 0, distance];

  useEffect(() => {
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    const orbitControls = controls as {
      target?: { set: (x: number, y: number, z: number) => void };
      update?: () => void;
    } | null;
    orbitControls?.target?.set(0, 0, 0);
    orbitControls?.update?.();
  }, [camera, controls, distance, x, y, z]);

  return null;
}