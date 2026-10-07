import type { Metadata } from "next";
import { Suspense } from "react";
import { Barlow_Condensed, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const barlowCondensed = Barlow_Condensed({
  weight: ["700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RPL - Raptee Premier League Season 2",
  description:
    "Official tournament management, live ball-by-ball cricket scoring, player auction, and team rosters for Raptee Premier League.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark h-full antialiased ${barlowCondensed.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-full flex flex-col bg-[var(--color-bg-base)] text-[var(--color-text-primary)] font-sans">
        <Suspense
          fallback={
            <div className="h-16 w-full border-b border-[var(--color-border)] bg-[var(--color-bg-base)]" />
          }
        >
          <Navbar />
        </Suspense>
        {children}
        <Footer />
      </body>
    </html>
  );
}
