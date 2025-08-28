"use client";

import { useState } from "react";
import Image from "next/image";

export default function TestVollebakPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["substack"]) // Substack section expanded by default
  );

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedSections(newExpanded);
  };

  const toggleViewMore = (categoryId: string) => {
    // This would typically load more cards
    console.log(`Toggle view more for ${categoryId}`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F8F7F4",
        position: "relative",
      }}
    >
      {/* Fixed Header */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: "#F8F7F4",
          zIndex: 1000,
          borderBottom: "1px solid rgba(216, 214, 213, 0.3)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "#333",
            }}
          >
            Pointfour
          </div>

          <div
            style={{
              padding: "8px 16px",
              backgroundColor: "#6C6A68",
              color: "#FFFFFF",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "500",
            }}
          >
            Full Analysis →
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "80px 24px 40px",
        }}
      >
        {/* Brand Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "600",
              color: "#9F513A",
              margin: "0 0 8px 0",
            }}
          >
            Vollebak
          </h1>
        </div>

        {/* Fit Review Section */}
        <div style={{ marginBottom: "40px" }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "#333",
              margin: "0 0 8px 0",
            }}
          >
            Fit review
          </h2>

          <p
            style={{
              fontSize: "14px",
              color: "#666",
              margin: "0 0 20px 0",
            }}
          >
            30+ sources including Reddit, fashion forums, reviews
          </p>

          {/* TLDR Section */}
          <div
            style={{
              margin: "0 0 20px 0",
              padding: "20px",
              backgroundColor: "#f9f8f6",
              border: "1px solid #e9ded5",
              borderRadius: "8px",
              fontSize: "15px",
              lineHeight: "1.6",
              color: "#333",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                margin: "0 0 12px 0",
                color: "#333",
              }}
            >
              TL;DR
            </h3>
            <p style={{ margin: "0 0 8px 0", fontWeight: "400" }}>
              Vollebak is known for innovative, high-tech clothing that often
              runs true to size but with a technical, athletic fit. Their pieces
              are designed for extreme conditions and tend to be more fitted
              than casual wear. Quality is consistently excellent with premium
              materials and construction.
            </p>
            <br />
            <p style={{ margin: "0 0 8px 0", fontWeight: "400" }}>
              <strong>Fit:</strong> True to size, athletic fit |{" "}
              <strong>Quality:</strong> Premium, excellent construction
            </p>
            <br />
            <p style={{ margin: "0 0 8px 0", fontWeight: "400" }}>
              <strong>Sizing:</strong> Generally true to size, but designed for
              athletic builds. Consider sizing up if you prefer a looser fit.
            </p>
            <br />
            <p style={{ margin: "0 0 8px 0", fontWeight: "400" }}>
              <strong>Quality:</strong> Exceptional durability and innovative
              materials. Worth the premium price for technical performance.
            </p>
          </div>
        </div>

        {/* Reviews Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Substack Section */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              border: "1px solid #E9DED5",
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => toggleCategory("substack")}
              style={{
                width: "100%",
                padding: "20px 24px",
                backgroundColor: "#FFFFFF",
                border: "none",
                borderBottom: expandedSections.has("substack")
                  ? "1px solid #E9DED5"
                  : "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "#F8F7F4";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "#FFFFFF";
              }}
            >
              <div style={{ textAlign: "left" }}>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#333",
                    margin: "0 0 4px 0",
                  }}
                >
                  Substack
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#666",
                    margin: 0,
                  }}
                >
                  6 reviews
                </p>
              </div>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: expandedSections.has("substack")
                    ? "rotate(180deg)"
                    : "rotate(0)",
                  transition: "transform 0.2s",
                  color: "#666",
                  flexShrink: 0,
                }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {expandedSections.has("substack") && (
              <div style={{ padding: "24px" }}>
                {/* Cards Grid - 3 columns */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "16px",
                    marginBottom: "24px",
                  }}
                >
                  {[
                    {
                      title: "Merino wool t-shirt brands",
                      content:
                        "I really like this merino t-shirt from Vollebak, it's amazing! Great quality and the fit is perfect for my athletic build.",
                      source: "Allison Bornstein newsletter",
                      favicon: "https://substack.com/favicon.ico",
                    },
                    {
                      title: "Technical outdoor gear",
                      content:
                        "Vollebak's technical pieces are incredible. The materials feel premium and the construction is top-notch. Worth every penny.",
                      source: "Outdoor Tech Review",
                      favicon: "https://substack.com/favicon.ico",
                    },
                    {
                      title: "Innovative fashion brands",
                      content:
                        "Love how Vollebak pushes boundaries with materials and design. Their pieces are conversation starters and perform amazingly.",
                      source: "Future Fashion Weekly",
                      favicon: "https://substack.com/favicon.ico",
                    },
                    {
                      title: "Sustainable luxury clothing",
                      content:
                        "Vollebak's commitment to sustainability while maintaining luxury quality is impressive. The fit is athletic but comfortable.",
                      source: "Eco Luxury Digest",
                      favicon: "https://substack.com/favicon.ico",
                    },
                    {
                      title: "High-tech apparel",
                      content:
                        "The technology in Vollebak's clothing is mind-blowing. The fit is perfect for active lifestyles and the quality is unmatched.",
                      source: "Tech Fashion Insider",
                      favicon: "https://substack.com/favicon.ico",
                    },
                    {
                      title: "Premium outdoor wear",
                      content:
                        "Vollebak creates the most innovative outdoor gear I've ever worn. The fit is athletic and the materials are revolutionary.",
                      source: "Adventure Gear Review",
                      favicon: "https://substack.com/favicon.ico",
                    },
                  ].map((review, index) => (
                    <div
                      key={index}
                      style={{
                        padding: "16px",
                        backgroundColor: "#F8F7F4",
                        borderRadius: "8px",
                        border: "1px solid #E9DED5",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                      }}
                    >
                      {/* Review Title */}
                      <h4
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#333",
                          margin: "0 0 8px 0",
                          lineHeight: "1.4",
                          flex: 1,
                        }}
                      >
                        {review.title}
                      </h4>

                      {/* Review Content */}
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#333",
                          margin: "0 0 12px 0",
                          lineHeight: "1.4",
                          flex: 1,
                        }}
                      >
                        {review.content}
                      </p>

                      {/* Source with Favicon */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginTop: "auto",
                        }}
                      >
                        <Image
                          src={review.favicon}
                          alt=""
                          width={16}
                          height={16}
                          style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "2px",
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#666",
                            fontWeight: "400",
                          }}
                        >
                          {review.source}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* View More Button */}
                <div style={{ textAlign: "left" }}>
                  <button
                    onClick={() => toggleViewMore("substack")}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "transparent",
                      border: "1px solid #E9DED5",
                      borderRadius: "6px",
                      color: "#666",
                      fontSize: "13px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = "#F8F7F4";
                    }}
                    onMouseOut={(e) => {
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = "transparent";
                    }}
                  >
                    View more
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Fashion Blogs Section */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              border: "1px solid #E9DED5",
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => toggleCategory("blogs")}
              style={{
                width: "100%",
                padding: "20px 24px",
                backgroundColor: "#FFFFFF",
                border: "none",
                borderBottom: expandedSections.has("blogs")
                  ? "1px solid #E9DED5"
                  : "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "#F8F7F4";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "#FFFFFF";
              }}
            >
              <div style={{ textAlign: "left" }}>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#333",
                    margin: "0 0 4px 0",
                  }}
                >
                  Fashion blogs
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#666",
                    margin: 0,
                  }}
                >
                  3 reviews
                </p>
              </div>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: expandedSections.has("blogs")
                    ? "rotate(180deg)"
                    : "rotate(0)",
                  transition: "transform 0.2s",
                  color: "#666",
                  flexShrink: 0,
                }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {expandedSections.has("blogs") && (
              <div style={{ padding: "24px" }}>
                {/* Cards Grid - 3 columns */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "16px",
                  }}
                >
                  {[
                    {
                      title: "Merino wool t-shirt brands",
                      content:
                        "I really like this merino t-shirt from Vollebak, it's amazing! Great quality and innovative design.",
                      source: "Style & Substance Blog",
                      favicon: "https://www.google.com/favicon.ico",
                    },
                    {
                      title: "Love Vollebak!",
                      content:
                        "I've bought so many things from Vollebak and yes they're a bit expensive but worth every penny for the innovation.",
                      source: "Luxury Fashion Daily",
                      favicon: "https://www.google.com/favicon.ico",
                    },
                    {
                      title: "Innovative materials",
                      content:
                        "Vollebak's use of cutting-edge materials and technology makes their clothing truly unique. The fit is perfect for active lifestyles.",
                      source: "Tech Fashion Forward",
                      favicon: "https://www.google.com/favicon.ico",
                    },
                  ].map((review, index) => (
                    <div
                      key={index}
                      style={{
                        padding: "16px",
                        backgroundColor: "#F8F7F4",
                        borderRadius: "8px",
                        border: "1px solid #E9DED5",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                      }}
                    >
                      {/* Review Title */}
                      <h4
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#333",
                          margin: "0 0 8px 0",
                          lineHeight: "1.4",
                          flex: 1,
                        }}
                      >
                        {review.title}
                      </h4>

                      {/* Review Content */}
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#333",
                          margin: "0 0 12px 0",
                          lineHeight: "1.4",
                          flex: 1,
                        }}
                      >
                        {review.content}
                      </p>

                      {/* Source with Favicon */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginTop: "auto",
                        }}
                      >
                        <Image
                          src={review.favicon}
                          alt=""
                          width={16}
                          height={16}
                          style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "2px",
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#666",
                            fontWeight: "400",
                          }}
                        >
                          {review.source}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Section */}
        <div
          style={{
            marginTop: "40px",
            padding: "24px",
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E9DED5",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              color: "#666",
              margin: "0 0 16px 0",
            }}
          >
            Want personalized fit recommendations based on your body type?
          </p>
          <div
            style={{
              display: "inline-block",
              padding: "12px 24px",
              backgroundColor: "#6C6A68",
              color: "#FFFFFF",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Get Full Analysis
          </div>
        </div>
      </div>
    </div>
  );
}
