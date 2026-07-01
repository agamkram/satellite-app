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
        : property === "bottom"
          ? style.paddingBottom
          : style.paddingLeft;
  return parseFloat(value) || 0;
}

function visualViewportBottomGap(): number {
  const vv = window.visualViewport;
  if (!vv) return 0;
  return Math.max(0, window.innerHeight - (vv.offsetTop + vv.height));
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

export function measureDockInsets(): { bottom: number; padBottom: number; left: number; right: number } {
  if (typeof window === "undefined") {
    return { bottom: 0, padBottom: 0, left: 12, right: 12 };
  }

  const safeBottom = readEnvInset("bottom");
  const visualGap = visualViewportBottomGap();
  const padBottom = Math.max(safeBottom, isIosHomeScreen() ? 10 : 6);

  return {
    bottom: visualGap,
    padBottom,
    left: Math.max(12, readEnvInset("left")),
    right: Math.max(12, readEnvInset("right")),
  };
}

export function isPhonePortrait(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px) and (orientation: portrait)").matches;
}