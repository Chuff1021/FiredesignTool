import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "FireDesign Showroom",
  description: "Dimensionally accurate fireplace showroom visualization.",
  applicationName: "FireDesign",
  manifest: "/manifest.webmanifest",
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#171513",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className={`${geist.variable} ${geistMono.variable}`} lang="en">
      <body>{children}</body>
    </html>
  );
}
