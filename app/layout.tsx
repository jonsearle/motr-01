import type { Metadata, Viewport } from "next";
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
      <body>{children}</body>
    </html>
  );
}
