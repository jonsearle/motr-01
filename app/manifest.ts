import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MOTR Smart Reply",
    short_name: "MOTR",
    description: "Smart Reply garage app",
    start_url: "/",
    display: "standalone",
    background_color: "#FBFCFE",
    theme_color: "#FF6B35",
    icons: [
      {
        src: "/icons/smart-reply-icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
