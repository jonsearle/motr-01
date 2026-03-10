"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PoweredByMotr } from "@/components/powered-by-motr";

export default function BookLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDateTimePage = pathname === "/book/date-time";

  return (
    <>
      {children}
      {!isDateTimePage && (
        <PoweredByMotr
          className="fixed bottom-3 right-3 z-10"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 10px)" }}
        />
      )}
    </>
  );
}
