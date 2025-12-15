import Image from "next/image";

export default function Footer() {
  return (
    <footer
      className="w-full py-4 px-6 md:px-12"
      style={{ backgroundColor: '#2F3437' }}
    >
      <div className="flex items-center gap-2">
        <Image
          src="/images/spannr-icon-white.png"
          alt="Spannr"
          width={32}
          height={32}
          className="object-contain"
        />
        <span className="text-white text-xs">Powered by Motr</span>
      </div>
    </footer>
  );
}

