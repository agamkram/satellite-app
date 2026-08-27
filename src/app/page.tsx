import { Suspense } from "react";

import { OrbitalViewer } from "@/components/OrbitalViewer";

export default function Home() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-[#02040a]" aria-hidden />}>
      <OrbitalViewer />
    </Suspense>
  );
}