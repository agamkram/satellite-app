"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

interface CameraFitProps {
  distance: number;
}

export function CameraFit({ distance }: CameraFitProps) {
  const { camera, controls } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, distance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    const orbitControls = controls as {
      target?: { set: (x: number, y: number, z: number) => void };
      update?: () => void;
    } | null;
    orbitControls?.target?.set(0, 0, 0);
    orbitControls?.update?.();
  }, [camera, controls, distance]);

  return null;
}