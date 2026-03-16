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
      <div className="text-sm font-medium text-[#5F6773]">
        <p className="text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}
