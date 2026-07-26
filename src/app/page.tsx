import { Suspense } from "react";

import { OrbitalViewer } from "@/components/OrbitalViewer";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <OrbitalViewer />
    </Suspense>
  );
}