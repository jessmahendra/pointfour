"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-4xl flex flex-col items-center">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-stone-900 mb-6">
            Know before you own
          </h1>
          <p className="text-xl text-stone-600 max-w-2xl mx-auto">
            Get personalized recommendations based on real user reviews and sizing data from our fashion directory.
          </p>
        </div>

        {/* Main Action Cards */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-12 w-full">
          {/* Review a Brand Card */}
          <Link href="/analyze" className="flex-shrink-0">
            <div
              className="p-6 cursor-pointer group transition-all duration-200 hover:shadow-sm"
              style={{
                width: "280px",
                backgroundColor: "#F8F7F4",
                border: "1px solid #E9DED5",
                borderRadius: "12px",
              }}
            >
              <div>
                {/* Icon without frame */}
                <div className="mb-4">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-stone-600"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10,9 9,9 8,9" />
                  </svg>
                </div>

                <div>
                  <h3
                    className="font-semibold mb-3 leading-tight flex items-center gap-2"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#4E4B4B",
                    }}
                  >
                    Review a brand or item
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-stone-600"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </h3>
                  <p
                    className="leading-relaxed"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "14px",
                      fontWeight: "400",
                      color: "rgba(78, 75, 75, 0.7)",
                    }}
                  >
                    Type any brand to discover their fit based on similar body
                    types
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* Get Recommendations Card - HIDDEN FOR NOW */}
          <Link
            href="/recommendations"
            className="flex-shrink-0"
            style={{ display: "none" }}
          >
            <div
              className="p-6 cursor-pointer group transition-all duration-200 hover:shadow-sm"
              style={{
                width: "280px",
                backgroundColor: "#F8F7F4",
                border: "1px solid #E9DED5",
                borderRadius: "12px",
              }}
            >
              <div>
                {/* Icon without frame */}
                <div className="mb-4">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-stone-600"
                  >
                    <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4" />
                    <polyline points="9,11 12,14 15,11" />
                    <line x1="12" y1="14" x2="12" y2="3" />
                  </svg>
                </div>

                <div>
                  <h3
                    className="font-semibold mb-3 leading-tight flex items-center gap-2"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#4E4B4B",
                    }}
                  >
                    Get recommendations
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-stone-600"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </h3>
                  <p
                    className="leading-relaxed"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "14px",
                      fontWeight: "400",
                      color: "rgba(78, 75, 75, 0.7)",
                    }}
                  >
                    Tell us what you&apos;re looking for to get brand
                    recommendations
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Browse Directory Link - HIDDEN FOR NOW */}
        <div className="text-center" style={{ display: "none" }}>
          <Link
            href="/directory"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              border: "1px solid #E9DED5",
              color: "#6C6A68",
            }}
          >
            <span className="text-xs">🌐</span>
            Browse directory
          </Link>
        </div>
      </div>
    </div>
  );
}
