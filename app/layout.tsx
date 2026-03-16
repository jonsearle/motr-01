import type { Metadata, Viewport } from "next";
import { BootLoader } from "@/components/boot-loader";
import "./globals.css";

export const metadata: Metadata = {
  title: "MOTR Smart Reply",
  description: "Smart Reply garage app",
  icons: {
    icon: [
      { url: "/icons/smart-reply-icon.svg", type: "image/svg+xml" },
      { url: "/images/favicon.jpg" },
    ],
    apple: [{ url: "/icons/smart-reply-icon.svg" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MOTR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FF6B35",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: "#EEF1F5", color: "#1C2330" }}>
        <div
          id="instant-loading"
          aria-hidden
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#EEF1F5",
            color: "#6B727D",
            fontSize: "16px",
            fontWeight: 500,
            letterSpacing: "0.01em",
            zIndex: 0,
            pointerEvents: "none",
          }}
        >
          Loading...
        </div>
        <BootLoader />
        {children}
      </body>
    </html>
  );
}
