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

function getInsetProbe(): HTMLDivElement {
  if (!insetProbe) {
    insetProbe = document.createElement("div");
    insetProbe.style.cssText =
      "position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;";
    document.body.appendChild(insetProbe);
  }
  return insetProbe;
}

function readEnvInset(property: "top" | "right" | "bottom"): number {
  const probe = getInsetProbe();
  probe.style.paddingTop = property === "top" ? "env(safe-area-inset-top)" : "0px";
  probe.style.paddingRight = property === "right" ? "env(safe-area-inset-right)" : "0px";
  probe.style.paddingBottom = property === "bottom" ? "env(safe-area-inset-bottom)" : "0px";

  const style = getComputedStyle(probe);
  const value =
    property === "top"
      ? style.paddingTop
      : property === "right"
        ? style.paddingRight
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

export function measureHomeScreenInsets(): { top: number; right: number } {
  if (!isIosHomeScreen()) {
    return { top: 0, right: 0 };
  }

  return {
    top: readEnvInset("top") || window.visualViewport?.offsetTop || fallbackSafeAreaTop(),
    right: readEnvInset("right"),
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