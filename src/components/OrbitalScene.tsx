"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

import {
  CAMERA_FOV,
  CAMERA_MIN_DISTANCE,
  SatelliteRecord,
} from "@/lib/satellite-math";
import { Earth } from "./Earth";
import { SatelliteField } from "./SatelliteField";
import { SceneClock } from "./SceneClock";
import { Starfield } from "./Starfield";

interface OrbitalSceneProps {
  satellites: SatelliteRecord[];
  visibleConstellations: Record<string, boolean>;
  speedRef: React.RefObject<number>;
  baseTimeRef: React.RefObject<number>;
  offsetHoursRef: React.RefObject<number>;
  simTimeRef: React.RefObject<number>;
  scrubbingRef: React.RefObject<boolean>;
  onUiUpdate: (offsetHours: number) => void;
  maxCameraDistance: number;
}

export function OrbitalScene({
  satellites,
  visibleConstellations,
  speedRef,
  baseTimeRef,
  offsetHoursRef,
  simTimeRef,
  scrubbingRef,
  onUiUpdate,
  maxCameraDistance,
}: OrbitalSceneProps) {
  return (
    <Canvas
      frameloop="always"
      camera={{ position: [0, 0, 6], fov: CAMERA_FOV, near: 0.1, far: 200 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ touchAction: "none" }}
    >
      <SceneClock
        speedRef={speedRef}
        baseTimeRef={baseTimeRef}
        offsetHoursRef={offsetHoursRef}
        simTimeRef={simTimeRef}
        scrubbingRef={scrubbingRef}
        onUiUpdate={onUiUpdate}
      />
      <ambientLight intensity={0.35} />
      <directionalLight position={[8, 4, 2]} intensity={1.4} />
      <Starfield />
      <Earth />
      <SatelliteField
        satellites={satellites}
        visibleConstellations={visibleConstellations}
        simTimeRef={simTimeRef}
        scrubbingRef={scrubbingRef}
        maxCameraDistance={maxCameraDistance}
      />
      <OrbitControls
        enablePan={false}
        minDistance={CAMERA_MIN_DISTANCE}
        maxDistance={maxCameraDistance}
        rotateSpeed={0.45}
        zoomSpeed={0.7}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}