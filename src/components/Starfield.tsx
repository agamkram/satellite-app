"use client";

import { useMemo } from "react";

import { buildStarfieldBuffers, STAR_COUNT, STAR_RADIUS } from "@/lib/starfield";
import { getStarPointTexture } from "@/lib/point-texture";

export function Starfield() {
  const starTexture = useMemo(() => getStarPointTexture(), []);
  const { positions, colors } = useMemo(
    () => buildStarfieldBuffers(STAR_COUNT, STAR_RADIUS),
    [],
  );

  return (
    <points frustumCulled={false} renderOrder={-10}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={1.5}
        sizeAttenuation={false}
        vertexColors
        map={starTexture ?? undefined}
        transparent
        alphaTest={0.01}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}