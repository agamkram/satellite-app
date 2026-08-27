let insetProbe: HTMLDivElement | null = null;

export function isIosHomeScreen(): boolean {
  if (typeof window === "undefined") return false;

  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches
  );
}

/**
 * Bug B (Bottom:full bleed): Home-screen PWA layout viewport can stay shorter
 * than screen.height → ~5/16" black strip until orientation refresh.
 * Lock the paint stack to screen height (phone) + tablet safe-area extra.
 */
export function pwaFillHeightPx(): number {
  if (typeof window === "undefined") return 0;
  const iw = window.innerWidth || 0;
  const ih = window.innerHeight || 0;
  const sw = window.screen.width || 0;
  const sh = window.screen.height || 0;
  // iOS keeps screen.* in portrait metrics; pick the axis for current height.
  if (ih >= iw) return Math.max(ih, Math.max(sw, sh));
  return Math.max(ih, Math.min(sw, sh));
}

/** iPad PWA: screen.* undershoots CSS inner — phone uses screen height instead. */
export function pwaExtraBottomPx(): number {
  if (typeof window === "undefined") return 0;
  const iw = window.innerWidth || 0;
  const ih = window.innerHeight || 0;
  const sw = window.screen.width || 0;
  const sh = window.screen.height || 0;
  const screenMax = Math.max(sw, sh);
  if (Math.min(iw, ih) < 600) return 0;
  if (screenMax >= ih - 10) return 0;
  return Math.max(readEnvInset("bottom"), 20);
}

/** Apply --pwa-fill-h / --pwa-extra-b when standalone; clear when not. */
export function syncPwaFillHeight(): number {
  if (typeof window === "undefined") return 0;

  const root = document.documentElement;
  if (!isIosHomeScreen()) {
    root.classList.remove("pwa-standalone");
    root.style.removeProperty("--pwa-fill-h");
    root.style.removeProperty("--pwa-extra-b");
    return 0;
  }

  root.classList.add("pwa-standalone");
  const fillH = pwaFillHeightPx();
  const extra = pwaExtraBottomPx();
  root.style.setProperty("--pwa-fill-h", `${fillH}px`);
  root.style.setProperty("--pwa-extra-b", `${extra}px`);
  return fillH + extra;
}

function getInsetProbe(): HTMLDivElement {
  if (!insetProbe) {
    insetProbe = document.createElement("div");
    insetProbe.style.cssText =
      "position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;";
    document.body.appendChild(insetProbe);
  }
  return insetProbe;
}

function readEnvInset(property: "top" | "right" | "bottom" | "left"): number {
  const probe = getInsetProbe();
  probe.style.paddingTop = property === "top" ? "env(safe-area-inset-top)" : "0px";
  probe.style.paddingRight = property === "right" ? "env(safe-area-inset-right)" : "0px";
  probe.style.paddingBottom = property === "bottom" ? "env(safe-area-inset-bottom)" : "0px";
  probe.style.paddingLeft = property === "left" ? "env(safe-area-inset-left)" : "0px";

  const style = getComputedStyle(probe);
  const value =
    property === "top"
      ? style.paddingTop
      : property === "right"
        ? style.paddingRight
        : property === "left"
          ? style.paddingLeft
          : style.paddingBottom;
  return parseFloat(value) || 0;
}

function fallbackSafeAreaTop(): number {
  const shortSide = Math.min(window.screen.width, window.screen.height);
  const longSide = Math.max(window.screen.width, window.screen.height);

  if (shortSide >= 390 && longSide >= 852) return 59;
  if (shortSide >= 375 && longSide >= 812) return 47;
  return 20;
}

export function measureHomeScreenInsets(): {
  top: number;
  right: number;
  left: number;
} {
  if (!isIosHomeScreen()) {
    return { top: 0, right: 0, left: 0 };
  }

  return {
    top: readEnvInset("top") || window.visualViewport?.offsetTop || fallbackSafeAreaTop(),
    right: readEnvInset("right"),
    left: readEnvInset("left"),
  };
}

export function isPortraitPhone(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768 && window.innerHeight > window.innerWidth;
}

export type PortraitDockLayout =
  | { mode: "bottom" }
  | { mode: "top"; top: number };

export function waitForStableViewport(
  readSize: () => { width: number; height: number },
  options: { maxMs?: number; stableFrames?: number } = {}
): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  const maxMs = options.maxMs ?? 600;
  const stableFrames = options.stableFrames ?? 4;
  const start = performance.now();
  let stable = 0;
  let lastW = -1;
  let lastH = -1;

  return new Promise((resolve) => {
    function tick() {
      const { width, height } = readSize();

      if (width > 0 && height > 0 && width === lastW && height === lastH) {
        stable += 1;
        if (stable >= stableFrames) {
          resolve();
          return;
        }
      } else {
        stable = 0;
        lastW = width;
        lastH = height;
      }

      if (performance.now() - start >= maxMs) {
        resolve();
        return;
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });
}

export function readVisualViewportSize(): { width: number; height: number } {
  const vv = window.visualViewport;
  return {
    width: vv?.width ?? window.innerWidth,
    height: vv?.height ?? window.innerHeight,
  };
}

export function measurePortraitDockLayout(dockHeight: number): PortraitDockLayout {
  if (typeof window === "undefined") return { mode: "bottom" };

  // Home-screen apps paint the full display; visualViewport.height is often
  // shorter than innerHeight and leaves the dock floating too high.
  if (isIosHomeScreen()) {
    return { mode: "bottom" };
  }

  const vv = window.visualViewport;
  const visibleTop = vv?.offsetTop ?? 0;
  const visibleHeight = vv?.height ?? window.innerHeight;

  return {
    mode: "top",
    top: Math.max(0, visibleTop + visibleHeight - dockHeight),
  };
}