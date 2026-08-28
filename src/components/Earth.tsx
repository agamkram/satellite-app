"use client";

import { useTexture } from "@react-three/drei";
import { GLOBE_RADIUS } from "@/lib/satellite-math";

export const EARTH_TEXTURE_URL = "/earth.jpg";

interface EarthProps {
  rotationY?: number;
}

export function Earth({ rotationY = 0 }: EarthProps) {
  const earthTexture = useTexture(EARTH_TEXTURE_URL);

  return (
    <group rotation={[0, rotationY, 0]}>
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshStandardMaterial map={earthTexture} roughness={0.85} metalness={0.05} />
      </mesh>
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS * 1.015, 48, 48]} />
        <meshBasicMaterial
          color="#6eb5ff"
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}