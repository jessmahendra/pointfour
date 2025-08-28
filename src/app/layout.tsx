import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import PlausibleProvider from "next-plausible";
import "./globals.css";

// GPT-5 Testing Configuration
const ENABLE_GPT5_TESTING = process.env.ENABLE_GPT5_TESTING === "true";
const GPT5_TEST_PERCENTAGE =
  parseInt(process.env.GPT5_TEST_PERCENTAGE || "10") || 10;

// Debug: Log all environment variables to see what's loaded
console.log("🔍 ENVIRONMENT DEBUG:", {
  NODE_ENV: process.env.NODE_ENV,
  ENABLE_GPT5_TESTING: process.env.ENABLE_GPT5_TESTING,
  GPT5_TEST_PERCENTAGE: process.env.GPT5_TEST_PERCENTAGE,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "SET" : "NOT SET",
});

console.log("🧪 GPT-5 TESTING CONFIG:", {
  enabled: ENABLE_GPT5_TESTING,
  testPercentage: GPT5_TEST_PERCENTAGE,
  model: "gpt-5-mini",
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
  title: "Pointfour: know before you own",
  description:
    "Get personalised recommendations based on real user reviews and sizing data from our fashion directory.",
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
        <PlausibleProvider domain="pointfour.in">{children}</PlausibleProvider>
      </body>
    </html>
  );
}
