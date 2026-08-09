"use client";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Brain } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, user, isAuthenticated, initialize } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    initialize();
    setIsMounted(true);
  }, [initialize]);

  // Handle clinical and patient redirection rules
  useEffect(() => {
    if (!isMounted) return;

    const isPublic = pathname === "/" || pathname === "/login";

    // 1. Unauthenticated redirection
    if (!isAuthenticated) {
      if (!isPublic) {
        router.replace("/login");
      }
      return;
    }

    // 2. Authenticated redirection rules
    if (user) {
      if (user.role === "patient") {
        const allowedPath = `/patients/${user.patient_id}`;
        const isLandingPage = pathname === "/";
        // Patients are ONLY allowed to view their specific patient profile, report, or public landing page
        if (pathname !== allowedPath && !pathname.startsWith(`${allowedPath}/`) && !isLandingPage) {
          router.replace(allowedPath);
        }
      } else if ((user.role === "admin" || user.role === "doctor") && pathname === "/login") {
        // Clinical staff visiting login screen are pushed directly to dashboard
        router.replace("/dashboard");
      }
    }
  }, [isMounted, isAuthenticated, user, pathname, router]);

  // A. Initial mounting skeleton (prevents layout flash)
  if (!isMounted) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black gap-4">
        <Brain className="w-12 h-12 text-white/50 animate-pulse" />
        <span className="text-xs text-white/30 uppercase tracking-widest animate-pulse font-medium">
          Loading Portal...
        </span>
      </div>
    );
  }

  const isPublic = pathname === "/" || pathname === "/login";

  // B. Unauthenticated state checks
  if (!isAuthenticated || !token || !user) {
    if (isPublic) {
      return <>{children}</>;
    }
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black gap-4">
        <Brain className="w-12 h-12 text-white/50 animate-pulse" />
        <span className="text-xs text-white/30 uppercase tracking-widest animate-pulse font-medium">
          Redirecting to Login...
        </span>
      </div>
    );
  }

  // C. Patient role guard check: prevent rendering protected elements in transitions
  if (user.role === "patient") {
    const allowedPath = `/patients/${user.patient_id}`;
    const isLandingPage = pathname === "/";
    if (pathname !== allowedPath && !pathname.startsWith(`${allowedPath}/`) && !isLandingPage) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black gap-4">
          <Brain className="w-12 h-12 text-white/50 animate-pulse" />
          <span className="text-xs text-white/30 uppercase tracking-widest animate-pulse font-medium">
            Redirecting to Patient Portal...
          </span>
        </div>
      );
    }
  }

  // D. Clinical staff login redirection guard check
  if ((user.role === "admin" || user.role === "doctor") && pathname === "/login") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black gap-4">
        <Brain className="w-12 h-12 text-white/50 animate-pulse" />
        <span className="text-xs text-white/30 uppercase tracking-widest animate-pulse font-medium">
          Redirecting to Dashboard...
        </span>
      </div>
    );
  }

  // E. Render children with guard active
  return <>{children}</>;
}
