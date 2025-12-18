import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spannr Drop-Off Prototype 02",
  description: "Admin Portal and Booking Site MVP",
  icons: {
    icon: "/images/motr-grey.png",
  },
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




