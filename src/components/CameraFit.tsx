"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

interface CameraFitProps {
  distance: number;
  position?: [number, number, number];
  viewOffsetY?: number;
}

export function CameraFit({ distance, position, viewOffsetY = 0 }: CameraFitProps) {
  const { camera, controls, size } = useThree();
  const [x, y, z] = position ?? [0, 0, distance];

  useEffect(() => {
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);

    if (camera instanceof THREE.PerspectiveCamera) {
      if (viewOffsetY > 0) {
        const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
        const scale = viewportHeight > 0 ? size.height / viewportHeight : 1;
        const offsetY = viewOffsetY * scale;
        camera.setViewOffset(size.width, size.height, 0, offsetY, size.width, size.height);
      } else {
        camera.clearViewOffset();
      }
    }

    camera.updateProjectionMatrix();

    const orbitControls = controls as {
      target?: { set: (x: number, y: number, z: number) => void };
      update?: () => void;
    } | null;
    orbitControls?.target?.set(0, 0, 0);
    orbitControls?.update?.();
  }, [camera, controls, distance, size.height, size.width, viewOffsetY, x, y, z]);

  return null;
}