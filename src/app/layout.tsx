import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OrbitalView",
  description:
    "Interactive 3D map of satellites in Earth orbit with constellation colors and time scrubbing.",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL("https://orbital.markmaga.com"),
  openGraph: {
    type: "website",
    siteName: "Mark Maga",
    title: "OrbitalView",
    description:
      "Interactive 3D map of satellites in Earth orbit with constellation colors and time scrubbing.",
    url: "https://orbital.markmaga.com/",
    images: [{ url: "/icon-512.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary",
    title: "OrbitalView",
    description:
      "Interactive 3D map of satellites in Earth orbit with constellation colors and time scrubbing.",
    images: ["/icon-512.png"],
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OrbitalView",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#02040a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-dvh max-h-dvh overflow-hidden bg-[#02040a] font-sans text-white">
        {children}
        <Script id="vercel-analytics-init" strategy="afterInteractive">
          {`window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };`}
        </Script>
        <Script
          src="/_vercel/insights/script.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}