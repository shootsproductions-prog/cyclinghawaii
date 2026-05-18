import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Nav from "@/components/Nav";
import NavAuth from "@/components/NavAuth";
import Footer from "@/components/Footer";
import EasterEgg from "@/components/EasterEgg";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cyclinghawaii.com"),
  title: "Cycling Hawaii — Ride the Islands",
  description:
    "Exploring Hawaii on two wheels. Live ride tracking, routes, and stories from Maui, Big Island, Oahu, and Kauai.",
  keywords: [
    "cycling",
    "hawaii",
    "maui",
    "cycling routes",
    "bike hawaii",
    "haleakala",
    "strava",
  ],
  icons: {
    icon: "/favicon-32.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Cycling Hawaii — Ride the Islands",
    description:
      "Exploring Hawaii on two wheels. Live ride tracking, routes, and stories from the islands.",
    url: "https://cyclinghawaii.com",
    siteName: "Cycling Hawaii",
    locale: "en_US",
    type: "website",
    images: [{ url: "/logo-orange-full.png", width: 1600, height: 1600 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cycling Hawaii — Ride the Islands",
    description:
      "Exploring Hawaii on two wheels. Live ride tracking, routes, and stories from the islands.",
    images: ["/logo-orange-full.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`} style={{ backgroundColor: "#ffffff" }}>
      <body>
        <Nav slot={<NavAuth />} />
        {children}
        <Footer />
        <EasterEgg />
        {/*
          Vercel Web Analytics — anonymous, cookieless page-view tracking
          (referrers, devices, geography). Speed Insights — Core Web
          Vitals per route (LCP, CLS, INP). Both auto-emit; we view the
          data in the Vercel dashboard under the project's Analytics tab.
        */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
