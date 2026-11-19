"use client";

import { useEffect, type ReactNode } from "react";
import { scheduleLoadedFallback } from "@/lib/loaded";
import { MotionPrefsProvider } from "./MotionPrefs";
import { SmoothScroll } from "./SmoothScroll";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => scheduleLoadedFallback(), []);
  return (
    <MotionPrefsProvider>
      <SmoothScroll>{children}</SmoothScroll>
    </MotionPrefsProvider>
  );
}
