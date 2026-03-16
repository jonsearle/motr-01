"use client";

import { useEffect, useState } from "react";

export function BootLoader() {
  const [visible, setVisible] = useState(true);
  const [rendered, setRendered] = useState(true);

  useEffect(() => {
    const instantLoading = document.getElementById("instant-loading");
    if (instantLoading) {
      instantLoading.style.display = "none";
    }

    const hideTimer = window.setTimeout(() => setVisible(false), 180);
    const removeTimer = window.setTimeout(() => setRendered(false), 500);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!rendered) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#EEF1F5] transition-opacity duration-300 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="flex flex-col items-center gap-4 text-[#5F6773]">
        <div className="relative h-11 w-11">
          <div className="absolute inset-0 rounded-full border-[3px] border-[#CBD2DB]" />
          <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-[#6B727D] border-r-[#6B727D]" />
        </div>
        <p className="text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}
