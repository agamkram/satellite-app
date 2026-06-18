"use client";

import { OrbitControls, Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";

import { CONSTELLATION_BY_ID } from "@/lib/constellations";
import { SatelliteRecord } from "@/lib/satellite-math";
import { ConstellationInstances } from "./ConstellationInstances";
import { Earth } from "./Earth";

interface OrbitalSceneProps {
  satellites: SatelliteRecord[];
  visibleConstellations: Record<string, boolean>;
  simTimeRef: React.RefObject<number>;
}

function SceneContent({
  satellites,
  visibleConstellations,
  simTimeRef,
}: OrbitalSceneProps) {
  const groupedSatellites = useMemo(() => {
    const groups: Record<string, SatelliteRecord[]> = {};

    for (const satellite of satellites) {
      if (!groups[satellite.constellationId]) {
        groups[satellite.constellationId] = [];
      }
      groups[satellite.constellationId].push(satellite);
    }

    return groups;
  }, [satellites]);

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[8, 4, 2]} intensity={1.4} />
      <Stars radius={120} depth={60} count={5000} factor={3} fade speed={0.2} />
      <Earth />
      {Object.entries(groupedSatellites).map(([constellationId, constellationSats]) => {
        const constellation = CONSTELLATION_BY_ID[constellationId];
        if (!constellation) return null;

        return (
          <ConstellationInstances
            key={constellationId}
            satellites={constellationSats}
            color={constellation.color}
            visible={visibleConstellations[constellationId] ?? true}
            simTimeRef={simTimeRef}
          />
        );
      })}
      <OrbitControls
        enablePan={false}
        minDistance={2.6}
        maxDistance={18}
        rotateSpeed={0.45}
        zoomSpeed={0.7}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  );
}

export function OrbitalScene(props: OrbitalSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45, near: 0.1, far: 200 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ touchAction: "none" }}
    >
      <SceneContent {...props} />
    </Canvas>
  );
}