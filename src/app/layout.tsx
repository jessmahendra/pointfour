import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import PlausibleProvider from "next-plausible";
import GlobalNavigation from "@/components/GlobalNavigation";
import "./globals.css";
import { AiInspector } from "@/components/AiInspector";

// Debug: Log all environment variables to see what's loaded
console.log("🔍 ENVIRONMENT DEBUG:", {
  NODE_ENV: process.env.NODE_ENV,
  OPENAI_API_KEY2: process.env.OPENAI_API_KEY2 ? "SET" : "NOT SET",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Woven: know it fits before you buy",
  description:
    "Your new fitting room is a community. Get personalised size recommendations based on real reviews from women like you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PlausibleProvider domain="pointfour.in">
          <GlobalNavigation />
          {children}
          <AiInspector />
        </PlausibleProvider>
      </body>
    </html>
  );
}
