"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { getSatellitePosition, SatelliteRecord } from "@/lib/satellite-math";

interface ConstellationInstancesProps {
  satellites: SatelliteRecord[];
  color: string;
  visible: boolean;
  simTimeRef: React.RefObject<number>;
}

const SATELLITE_SCALE = 0.012;

export function ConstellationInstances({
  satellites,
  color,
  visible,
  simTimeRef,
}: ConstellationInstancesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    meshRef.current.count = satellites.length;
    meshRef.current.frustumCulled = false;
  }, [satellites.length]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh || !visible || satellites.length === 0) return;

    const time = new Date(simTimeRef.current);

    for (let i = 0; i < satellites.length; i += 1) {
      const position = getSatellitePosition(satellites[i].satrec, time);

      if (!position) {
        dummy.position.set(0, 0, 0);
        dummy.scale.setScalar(0);
      } else {
        dummy.position.set(position.x, position.y, position.z);
        dummy.scale.setScalar(SATELLITE_SCALE);
      }

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  if (satellites.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, satellites.length]}
      visible={visible}
    >
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </instancedMesh>
  );
}