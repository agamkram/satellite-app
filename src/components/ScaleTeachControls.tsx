"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { measureHomeScreenInsets } from "@/lib/ios-home-screen";
import {
  formatMagnification,
  isPhonePointViewport,
  resolveMegaMagnification,
} from "@/lib/satellite-point-size";

interface ScaleTeachControlsProps {
  trueScale: boolean;
  onTrueScaleChange: (trueScale: boolean) => void;
  cameraDistance: number;
  fitCameraDistance: number;
  maxCameraDistance: number;
}

/** Match Constellations / title clearance. */
const TITLE_CLEARANCE = 36;
const DESKTOP_TOP = 10;

function isDesktopPointer() {
  return (
    navigator.maxTouchPoints === 0 &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );
}

function getCornerInset(wide: boolean) {
  const { top, left } = measureHomeScreenInsets();
  const baseSide = wide ? 20 : 12;
  const baseTop = isDesktopPointer() ? DESKTOP_TOP : 0;
  return {
    top: Math.max(baseTop, top) + TITLE_CLEARANCE,
    left: Math.max(baseSide, left),
  };
}

export function ScaleTeachControls({
  trueScale,
  onTrueScaleChange,
  cameraDistance,
  fitCameraDistance,
  maxCameraDistance,
}: ScaleTeachControlsProps) {
  const [mounted, setMounted] = useState(false);
  const [inset, setInset] = useState({ top: TITLE_CLEARANCE, left: 12 });
  const [viewportHeight, setViewportHeight] = useState(900);
  const [magInfoOpen, setMagInfoOpen] = useState(false);
  const [phoneLayout, setPhoneLayout] = useState(false);

  useEffect(() => {
    setMounted(true);

    const update = () => {
      const wide = window.matchMedia("(min-width: 640px)").matches;
      setInset(getCornerInset(wide));
      setViewportHeight(window.visualViewport?.height ?? window.innerHeight);
      setPhoneLayout(isPhonePointViewport());
    };

    update();
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);

    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, []);

  useEffect(() => {
    if (!magInfoOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const root = document.getElementById("ov-mag-teach");
      if (root && !root.contains(event.target as Node)) {
        setMagInfoOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [magInfoOpen]);

  if (!mounted) return null;

  const magnification = resolveMegaMagnification({
    cameraDistance,
    fitCameraDistance,
    maxCameraDistance,
    viewportHeightPx: viewportHeight,
    trueScale,
  });
  const magLabel = trueScale
    ? "Mag 1×"
    : `Mag ${formatMagnification(magnification)}`;

  const pillClass = (active: boolean) =>
    `pointer-events-auto rounded-full border px-3 py-1.5 text-xs backdrop-blur-sm ${
      active
        ? "border-white/20 bg-white/10 text-white/90 hover:bg-white/15"
        : "border-white/10 bg-black/[0.02] text-white/85 hover:bg-black/10"
    }`;

  const magButton = (
    <button
      type="button"
      onClick={() => setMagInfoOpen((open) => !open)}
      className={pillClass(magInfoOpen)}
      aria-expanded={magInfoOpen}
      aria-label="Satellite magnification — tap for explanation"
    >
      {magLabel}
    </button>
  );

  const magInfo = magInfoOpen ? (
    <div
      className={`pointer-events-auto w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-white/10 bg-black/[0.02] px-3 py-1.5 text-xs leading-snug text-white/85 backdrop-blur-sm ${
        phoneLayout ? "text-center" : "text-left"
      }`}
    >
      <p className="font-medium text-white/85">Magnification</p>
      <p className="mt-0.5 line-clamp-3 text-white/85">
        How many times larger the satellite dots are than a real ~3&nbsp;m
        craft at this zoom. Pinch to update. True scale sets Mag to 1× — they
        vanish.
      </p>
    </div>
  ) : null;

  return createPortal(
    <>
      {/* Pad / Mac: True scale + Mag, same left edge as each other */}
      {!phoneLayout ? (
        <div
          id="ov-scale-teach"
          style={{ top: inset.top, left: inset.left }}
          className="pointer-events-none"
        >
          <button
            type="button"
            onClick={() => onTrueScaleChange(!trueScale)}
            className={pillClass(trueScale)}
            aria-pressed={trueScale}
            aria-label={
              trueScale
                ? "Switch to exaggerated satellite size"
                : "Show satellites at true scale"
            }
          >
            True scale
          </button>

          <div
            id="ov-mag-teach"
            style={{
              position: "relative",
              left: 0,
              transform: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "0.5rem",
            }}
          >
            {magButton}
            {magInfo}
          </div>
        </div>
      ) : (
        <>
          <div
            id="ov-scale-teach"
            style={{ top: inset.top, left: inset.left }}
            className="pointer-events-none"
          >
            <button
              type="button"
              onClick={() => onTrueScaleChange(!trueScale)}
              className={pillClass(trueScale)}
              aria-pressed={trueScale}
              aria-label={
                trueScale
                  ? "Switch to exaggerated satellite size"
                  : "Show satellites at true scale"
              }
            >
              True scale
            </button>
          </div>

          <div
            id="ov-mag-teach"
            style={{
              position: "fixed",
              top: "calc(0.375in + env(safe-area-inset-top, 0px) + 0.35rem)",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 100001,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem",
              pointerEvents: "none",
            }}
          >
            {magButton}
            {magInfo}
          </div>
        </>
      )}
    </>,
    document.body,
  );
}
