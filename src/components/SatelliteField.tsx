"use client";

import { useFrame } from "@react-three/fiber";
import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { CONSTELLATION_BY_ID } from "@/lib/constellations";
import {
  DEFAULT_EARTH_CAMERA_DISTANCE,
  lerpPositionBuffers,
  SatelliteRecord,
  writeSatellitePosition,
} from "@/lib/satellite-math";
import { getSatellitePointTexture } from "@/lib/point-texture";
import {
  getPointSizePolicy,
  PointSizePolicy,
  resolvePointSize,
} from "@/lib/satellite-point-size";

const PROPAGATE_INTERVAL_MS = 50;
const SNAP_TIME_JUMP_MS = 5_000;
const DEFAULT_CAMERA_DISTANCE = DEFAULT_EARTH_CAMERA_DISTANCE;
const CAMERA_SIZE_EPSILON = 0.02;

interface RenderGroup {
  key: string;
  constellationId: string;
  color: string;
  sizePolicy: PointSizePolicy;
  satellites: SatelliteRecord[];
  previous: Float32Array;
  target: Float32Array;
  display: Float32Array;
}

interface SatelliteFieldProps {
  satellites: SatelliteRecord[];
  visibleConstellations: Record<string, boolean>;
  simTimeRef: React.RefObject<number>;
  scrubbingRef: React.RefObject<boolean>;
  maxCameraDistance: number;
}

function buildGroups(satelliteList: SatelliteRecord[]): RenderGroup[] {
  const grouped = new Map<string, RenderGroup>();

  for (const satellite of satelliteList) {
    const meta = CONSTELLATION_BY_ID[satellite.constellationId];
    if (!meta) continue;

    const sizePolicy = getPointSizePolicy(satellite.constellationId, satellite);
    const key = `${satellite.constellationId}:${sizePolicy}`;

    let group = grouped.get(key);
    if (!group) {
      group = {
        key,
        constellationId: satellite.constellationId,
        color: meta.color,
        sizePolicy,
        satellites: [],
        previous: new Float32Array(),
        target: new Float32Array(),
        display: new Float32Array(),
      };
      grouped.set(key, group);
    }

    group.satellites.push(satellite);
  }

  for (const group of grouped.values()) {
    const length = group.satellites.length;
    group.previous = new Float32Array(length * 3);
    group.target = new Float32Array(length * 3);
    group.display = new Float32Array(length * 3);
  }

  return Array.from(grouped.values());
}

export function SatelliteField({
  satellites,
  visibleConstellations,
  simTimeRef,
  scrubbingRef,
  maxCameraDistance,
}: SatelliteFieldProps) {
  const pointTexture = useMemo(() => getSatellitePointTexture(), []);
  const pointsRefs = useRef<Map<string, THREE.Object3D>>(new Map());
  const groups = useMemo(() => buildGroups(satellites), [satellites]);
  const groupsRef = useRef(groups);
  groupsRef.current = groups;

  const propagateDateRef = useRef(new Date(0));
  const lastPropagateRef = useRef(0);
  const blendRef = useRef(1);
  const lastSimTimeRef = useRef(simTimeRef.current);
  const lastCameraDistanceRef = useRef(-1);

  const seedPositions = useCallback(
    (groupList: RenderGroup[]) => {
      propagateDateRef.current.setTime(simTimeRef.current);
      lastSimTimeRef.current = simTimeRef.current;
      blendRef.current = 1;

      for (const group of groupList) {
        for (let i = 0; i < group.satellites.length; i += 1) {
          writeSatellitePosition(
            group.satellites[i].satrec,
            propagateDateRef.current,
            group.target,
            i,
          );
        }
        group.previous.set(group.target);
        group.display.set(group.target);
      }
    },
    [simTimeRef],
  );

  useLayoutEffect(() => {
    seedPositions(groups);

    for (const group of groups) {
      const node = pointsRefs.current.get(group.key) as THREE.Points | undefined;
      if (!node) continue;

      const geometry = node.geometry as THREE.BufferGeometry;
      geometry.setAttribute("position", new THREE.BufferAttribute(group.display, 3));
      const positionAttr = geometry.attributes.position;
      if (positionAttr) positionAttr.needsUpdate = true;
    }
  }, [groups, seedPositions]);

  useFrame(({ camera }, delta) => {
    const activeGroups = groupsRef.current;
    if (activeGroups.length === 0) return;

    const simTime = simTimeRef.current;
    const cameraDistance = camera.position.length();
    const now = performance.now();
    const simTimeChanged = simTime !== lastSimTimeRef.current;
    const timeJumpMs = Math.abs(simTime - lastSimTimeRef.current);
    const isScrubbing = scrubbingRef.current;
    const shouldSnap = isScrubbing || timeJumpMs >= SNAP_TIME_JUMP_MS;
    const shouldPropagate =
      simTimeChanged &&
      (shouldSnap || now - lastPropagateRef.current >= PROPAGATE_INTERVAL_MS);

    if (shouldPropagate) {
      lastPropagateRef.current = now;
      lastSimTimeRef.current = simTime;
      propagateDateRef.current.setTime(simTime);

      for (const group of activeGroups) {
        if (!shouldSnap) {
          group.previous.set(group.target);
        }
        for (let i = 0; i < group.satellites.length; i += 1) {
          writeSatellitePosition(
            group.satellites[i].satrec,
            propagateDateRef.current,
            group.target,
            i,
          );
        }
        if (shouldSnap) {
          group.previous.set(group.target);
          group.display.set(group.target);
        }
      }

      blendRef.current = shouldSnap ? 1 : 0;
    }

    const blend = blendRef.current;
    const isBlending = blend < 1;

    if (isBlending) {
      blendRef.current = Math.min(1, blend + delta / (PROPAGATE_INTERVAL_MS / 1000));

      for (const group of activeGroups) {
        lerpPositionBuffers(group.previous, group.target, group.display, blend);
      }
    }

    const cameraMoved =
      Math.abs(cameraDistance - lastCameraDistanceRef.current) >= CAMERA_SIZE_EPSILON;
    if (cameraMoved) {
      lastCameraDistanceRef.current = cameraDistance;
    }

    if (!isBlending && !shouldPropagate && !cameraMoved) return;

    for (const group of activeGroups) {
      const node = pointsRefs.current.get(group.key) as THREE.Points | undefined;
      if (!node) continue;

      if (isBlending || shouldPropagate) {
        const positionAttr = node.geometry.attributes.position;
        if (positionAttr) positionAttr.needsUpdate = true;
      }

      if (cameraMoved) {
        const material = node.material as THREE.PointsMaterial;
        material.size = resolvePointSize(group.sizePolicy, cameraDistance, maxCameraDistance);
      }
    }
  });

  return (
    <>
      {groups.map((group) => (
        <points
          key={group.key}
          ref={(node) => {
            if (node) pointsRefs.current.set(group.key, node as THREE.Object3D);
            else pointsRefs.current.delete(group.key);
          }}
          visible={visibleConstellations[group.constellationId] ?? true}
          frustumCulled={false}
        >
          <bufferGeometry />
          <pointsMaterial
            color={group.color}
            size={resolvePointSize(group.sizePolicy, DEFAULT_CAMERA_DISTANCE, maxCameraDistance)}
            sizeAttenuation={false}
            map={pointTexture ?? undefined}
            alphaTest={0.5}
            transparent
            toneMapped={false}
            depthWrite={false}
          />
        </points>
      ))}
    </>
  );
}