"use client";

import { useTexture } from "@react-three/drei";
import { GLOBE_RADIUS } from "@/lib/satellite-math";

export function Earth() {
  const earthTexture = useTexture("/earth.jpg");

  return (
    <group>
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