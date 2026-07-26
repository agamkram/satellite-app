import * as THREE from "three";

const cache = new Map<string, THREE.CanvasTexture>();

function createCanvasTexture(
  key: string,
  size: number,
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
): THREE.CanvasTexture | null {
  const cached = cache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  draw(ctx, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.needsUpdate = true;

  cache.set(key, texture);
  return texture;
}

export function getStarPointTexture() {
  return createCanvasTexture("star", 8, (ctx, size) => {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(3, 3, 2, 2);
  });
}

export function getSatellitePointTexture() {
  return createCanvasTexture("satellite", 32, (ctx, size) => {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.4375, 0, Math.PI * 2);
    ctx.fill();
  });
}