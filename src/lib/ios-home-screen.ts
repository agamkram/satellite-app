export function isIosHomeScreen(): boolean {
  if (typeof window === "undefined") return false;

  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches
  );
}

function readEnvInset(property: "top" | "right"): number {
  const probe = document.createElement("div");
  probe.style.cssText =
    property === "top"
      ? "position:fixed;top:0;left:0;padding-top:env(safe-area-inset-top);visibility:hidden;pointer-events:none;"
      : "position:fixed;top:0;left:0;padding-right:env(safe-area-inset-right);visibility:hidden;pointer-events:none;";
  document.body.appendChild(probe);
  const style = getComputedStyle(probe);
  const value =
    parseFloat(property === "top" ? style.paddingTop : style.paddingRight) || 0;
  document.body.removeChild(probe);

  return value;
}

function fallbackSafeAreaTop(): number {
  const shortSide = Math.min(window.screen.width, window.screen.height);
  const longSide = Math.max(window.screen.width, window.screen.height);

  if (shortSide >= 390 && longSide >= 852) return 59; // Dynamic Island
  if (shortSide >= 375 && longSide >= 812) return 47; // notch
  if (shortSide >= 375) return 20;
  return 20;
}

export function measureHomeScreenInsets(): { top: number; right: number } {
  if (!isIosHomeScreen()) {
    return { top: 0, right: 0 };
  }

  const top = readEnvInset("top") || window.visualViewport?.offsetTop || fallbackSafeAreaTop();
  const right = readEnvInset("right");

  return { top, right };
}