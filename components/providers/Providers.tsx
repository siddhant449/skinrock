"use client";

import { useEffect, type ReactNode } from "react";
import { scheduleLoadedFallback } from "@/lib/loaded";
import { MotionPrefsProvider } from "./MotionPrefs";
import { ScrollSetup } from "./ScrollSetup";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => scheduleLoadedFallback(), []);
  return (
    <MotionPrefsProvider>
      <ScrollSetup>{children}</ScrollSetup>
    </MotionPrefsProvider>
  );
}
