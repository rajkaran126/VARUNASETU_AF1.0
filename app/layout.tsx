import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VARUNASETU — AI-Powered Submarine Cable Digital Twin",
  description:
    "An AI-powered digital twin for global submarine cable infrastructure intelligence, failure simulation, and intelligent network recovery planning.",
};

const HERO_VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260813_092641_de52eb87-daf2-41db-92cb-7a56eae012a5.mp4";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=IBM+Plex+Mono:wght@300;400;500;600&family=Manrope:wght@300;400;500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,600&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased text-white selection:bg-white selection:text-black">
        {/* Persistent background video playing continuously everywhere on scroll */}
        <div className="fixed-video-bg">
          <video
            src={HERO_VIDEO_URL}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
          />
        </div>
        {/* Subtle dark ambient gradient vignette */}
        <div className="fixed-video-overlay" aria-hidden="true" />

        {/* Page content layers atop the fixed video */}
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
