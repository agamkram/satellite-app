import { Suspense } from "react";

import { OrbitalViewerClient } from "@/components/OrbitalViewerClient";

export default function Home() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-[#02040a]" aria-hidden />}>
      <OrbitalViewerClient />
    </Suspense>
  );
}