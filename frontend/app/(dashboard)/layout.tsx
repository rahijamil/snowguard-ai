"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { useAccessibility } from "@/lib/hooks/use-accessibility";
import Navbar from "@/components/shared/navbar";
import Sidebar from "@/components/shared/sidebar";
import AccessibilityControls from "@/components/shared/accessibility-controls";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  useAccessibility(); // Apply accessibility settings

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 ml-64">{children}</main>
      </div>
      <AccessibilityControls />
      <Toaster />
    </div>
  );
}
