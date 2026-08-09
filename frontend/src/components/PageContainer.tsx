"use client";

import React from "react";
import { usePathname } from "next/navigation";

export function PageContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullWidth = pathname === "/" || pathname === "/login";

  if (isFullWidth) {
    return <>{children}</>;
  }

  return (
    <main className="pt-32 pb-12 px-6 max-w-7xl mx-auto">
      {children}
    </main>
  );

}
