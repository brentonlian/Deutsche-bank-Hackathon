"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useApp } from "./AppState";

/** Pages that only make sense after onboarding send first-time visitors to the start. */
export function RequireProfile({ children }: { children: ReactNode }) {
  const { ready, profile } = useApp();
  const router = useRouter();
  useEffect(() => {
    if (ready && !profile) router.replace("/");
  }, [ready, profile, router]);
  if (!ready || !profile) return null;
  return <>{children}</>;
}
