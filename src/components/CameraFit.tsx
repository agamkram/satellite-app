"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

interface CameraFitProps {
  distance: number;
  position?: [number, number, number];
  viewOffsetY?: number;
}

export function CameraFit({ distance, position, viewOffsetY = 0 }: CameraFitProps) {
  const { camera, controls, size } = useThree();
  const [x, y, z] = position ?? [0, 0, distance];
  const lastPoseRef = useRef({ x: Number.NaN, y: Number.NaN, z: Number.NaN });

  useEffect(() => {
    const poseChanged =
      lastPoseRef.current.x !== x ||
      lastPoseRef.current.y !== y ||
      lastPoseRef.current.z !== z;

    if (poseChanged) {
      camera.position.set(x, y, z);
      camera.lookAt(0, 0, 0);
      lastPoseRef.current = { x, y, z };

      const orbitControls = controls as {
        target?: { set: (x: number, y: number, z: number) => void };
        update?: () => void;
      } | null;
      orbitControls?.target?.set(0, 0, 0);
      orbitControls?.update?.();
    }

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
  }, [camera, controls, distance, size.height, size.width, viewOffsetY, x, y, z]);

  return null;
}
