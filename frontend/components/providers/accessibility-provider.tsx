// ===== components/providers/accessibility-provider.tsx =====
"use client";

import { useAccessibility } from "@/lib/hooks/use-accessibility";

export default function AccessibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useAccessibility(); // This applies all accessibility settings

  return <>{children}</>;
}
