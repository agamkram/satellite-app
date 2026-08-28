"use client";

import dynamic from "next/dynamic";

// The viewer's first render depends on viewport size and the wall clock, which
// the server cannot know. Server-rendering it fails hydration and repaints the
// whole tree, so render it on the client only.
const OrbitalViewer = dynamic(
  () => import("./OrbitalViewer").then((mod) => mod.OrbitalViewer),
  { ssr: false },
);

export function OrbitalViewerClient() {
  return <OrbitalViewer />;
}
