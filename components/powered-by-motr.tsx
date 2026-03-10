import Image from "next/image";
import type { CSSProperties } from "react";

export function PoweredByMotr({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <a
      href="https://motex-home.netlify.app/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Powered by MOTR"
      className={`inline-flex items-center gap-1 rounded-full bg-black/35 px-2 py-1 text-[10px] font-medium text-white/90 backdrop-blur-sm transition-opacity hover:opacity-100 opacity-80 ${className}`}
      style={style}
    >
      <span>Powered by</span>
      <Image src="/images/motr-grey.png" alt="MOTR" width={48} height={18} className="h-[12px] w-auto" />
    </a>
  );
}
