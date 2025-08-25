"use client";

import { Suspense } from "react";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Review {
  title: string;
  snippet: string;
  url: string;
  source: string;
  tags: string[];
  confidence: "high" | "medium" | "low";
  brandLevel: boolean;
  fullContent: string;
}

interface BrandFitSummary {
  summary: string | null;
  confidence: "high" | "medium" | "low";
  sources: string[];
  totalResults: number;
}

interface ReviewData {
  brand: string;
  itemName?: string;
  brandFitSummary: BrandFitSummary | null;
  reviews: Review[];
  groupedReviews: {
    primary: Review[];
    community: Review[];
    blogs: Review[];
    videos: Review[];
    social: Review[];
    publications: Review[];
    other: Review[];
  };
  totalResults: number;
  timestamp?: number;
  productImage?: {
    src: string;
    alt: string;
    selector: string;
  };
  pageUrl?: string;
}

// Enhanced markdown formatting function for better text rendering
const formatMarkdownText = (text: string) => {
  if (!text || !text.trim()) {
    return <span>{text}</span>;
  }
  // Split the text into lines, preserving empty lines for spacing
  const lines = text.split("\n");
  return (
    <div>
      {lines.map((line, lineIndex) => {
        const trimmedLine = line.trim();
        // Handle empty lines as spacing
        if (!trimmedLine) {
          return <div key={lineIndex} style={{ marginBottom: "16px" }} />;
        }
        // Check if this line is a heading (starts with **)
        const isHeading = trimmedLine.match(/^\*\*.*?\*\*/);
        // Process bold text and quoted text
        const parts = trimmedLine.split(/(\*\*.*?\*\*|".*?")/g);
        const processedParts = parts.map((part, partIndex) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={partIndex}>{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('"') && part.endsWith('"')) {
            return (
              <span
                key={partIndex}
                style={{
                  fontStyle: "italic",
                  backgroundColor: "#F8F7F4",
                  padding: "2px 4px",
                  borderRadius: "3px",
                }}
              >
                {part}
              </span>
            );
          }
          return part;
        });
        return (
          <div
            key={lineIndex}
            style={{
              marginBottom: isHeading ? "8px" : "8px",
              marginTop: isHeading && lineIndex > 0 ? "8px" : "0px",
              lineHeight: "1.2",
            }}
          >
            {processedParts}
          </div>
        );
      })}
    </div>
  );
};

function ExtensionReviewsContent() {
  const searchParams = useSearchParams();
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["primary"]) // Primary section expanded by default
  );

  const brandName = searchParams.get("brand") || "";
  const itemName = searchParams.get("item") || "";

  // Get enhanced data from extension
  const tldrParam = searchParams.get("tldr") || "";

  // Parse review insights JSON (but prioritize fresh API data)
  // Note: Currently not used - keeping for future implementation
  // let reviewInsights: Array<{
  //   id: number;
  //   title: string;
  //   source: string;
  //   insight: string;
  //   confidence: 'high' | 'medium' | 'low';
  // }> = [];

  // try {
  //   const reviewInsightsParam = searchParams.get("reviewInsights") || "";
  //   if (reviewInsightsParam) {
  //     reviewInsights = JSON.parse(decodeURIComponent(reviewInsightsParam));
  //   }
  // } catch (e) {
  //   console.warn('Failed to parse review insights:', e);
  // }

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/extension/search-reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brand: brandName,
          itemName: itemName || "",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }

      const data = await response.json();

      setReviewData({
        brand: brandName,
        itemName: itemName || undefined,
        brandFitSummary: data.brandFitSummary,
        reviews: data.reviews || [],
        groupedReviews: data.groupedReviews || {
          primary: [],
          community: [],
          blogs: [],
          videos: [],
          social: [],
          publications: [],
          other: [],
        },
        totalResults: data.totalResults || 0,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError("Failed to load reviews. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [brandName, itemName]);

  useEffect(() => {
    if (!brandName) {
      setError("No brand specified");
      setLoading(false);
      return;
    }

    fetchReviews();
  }, [brandName, itemName, fetchReviews]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const categoryNames: Record<string, string> = {
    primary: "Primary sources (Reddit & Substack)",
    community: "Community Forums",
    blogs: "Fashion blogs",
    videos: "Video reviews",
    social: "Social Media",
    publications: "Fashion Publications",
    other: "Other Sources",
  };

  const categoryDescriptions: Record<string, string> = {
    primary:
      "Detailed reviews and discussions from Reddit and Substack communities",
    community: "Insights from fashion forums and community discussions",
    blogs: "In-depth reviews from fashion bloggers and style experts",
    videos: "Video reviews and try-ons from YouTube and other platforms",
    social: "Quick takes and outfit posts from social media",
    publications:
      "Professional reviews from fashion magazines and publications",
    other: "Additional reviews from various sources",
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#F8F7F4",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid #E9DED5",
              borderTop: "3px solid #8B7355",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "#666", fontSize: "14px" }}>
            Loading reviews for {brandName}...
          </p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  if (error || !reviewData) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#F8F7F4",
          padding: "40px 24px",
        }}
      >
        <div
          style={{
            maxWidth: "640px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "24px",
              color: "#333",
              marginBottom: "16px",
            }}
          >
            Unable to Load Reviews
          </h1>
          <p style={{ color: "#666", marginBottom: "24px" }}>
            {error || "Something went wrong"}
          </p>
          <Link
            href="/analyze"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              backgroundColor: "#6C6A68",
              color: "#FFFFFF",
              textDecoration: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Try Manual Search
          </Link>
        </div>
      </div>
    );
  }

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
          <Link href="/">
            <svg
              width="93"
              height="24"
              viewBox="0 0 62 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ cursor: "pointer" }}
            >
              <path
                d="M4.20631 6.53813L3.45431 11.0021C3.83831 11.2261 4.20631 11.2901 4.63831 11.2901C6.09431 11.2901 7.10231 9.65813 7.10231 7.57813C7.10231 6.36213 6.57431 5.69013 5.74231 5.69013C5.15031 5.69013 4.62231 6.07413 4.20631 6.53813ZM4.27031 5.89813H4.33431C4.84631 5.03413 5.48631 4.65013 6.38231 4.65013C7.71031 4.65013 8.59031 5.59413 8.59031 7.30613C8.59031 9.96213 6.97431 11.9461 4.47831 11.9461C3.88631 11.9461 3.48631 11.8021 3.32631 11.7221L2.84631 14.3781L3.96631 14.6821L3.75831 15.1461H0.654312V14.6981L1.40631 14.4261L2.95831 5.69013C2.47831 5.53013 1.99831 5.80213 1.69431 6.13813L1.47031 5.89813C1.66231 5.32213 2.19031 4.65013 3.19831 4.65013C4.07831 4.65013 4.36631 5.11413 4.27031 5.89813ZM12.6003 11.2741C13.8803 11.2741 14.5203 9.49813 14.6163 7.99413C14.6323 7.81813 14.6323 7.64213 14.6323 7.48213C14.6323 6.09013 14.2643 5.32213 13.3843 5.32213C12.1043 5.32213 11.4643 7.09813 11.3683 8.60213C11.3523 8.77813 11.3523 8.95413 11.3523 9.11413C11.3523 10.5061 11.7203 11.2741 12.6003 11.2741ZM12.5843 11.9461C10.7923 11.9461 9.86431 10.6661 9.86431 8.92213C9.86431 6.71413 11.0003 4.65013 13.4003 4.65013C15.1923 4.65013 16.1203 5.93013 16.1203 7.67413C16.1203 9.88213 14.9843 11.9461 12.5843 11.9461ZM19.8756 6.26613L19.0916 10.8741C19.5716 11.0341 20.0676 10.7621 20.3716 10.4261L20.6116 10.6661C20.4196 11.2421 19.8756 11.9461 18.8676 11.9461C18.0196 11.9461 17.7156 11.4981 17.7156 10.8901C17.7156 10.7621 17.7316 10.5701 17.7796 10.2821L18.5636 5.69013C18.0836 5.53013 17.6196 5.80213 17.3156 6.13813L17.0756 5.89813C17.2676 5.32213 17.8116 4.65013 18.8196 4.65013C19.6676 4.65013 19.9396 5.09813 19.9396 5.70613C19.9396 5.83413 19.9076 6.07413 19.8756 6.26613ZM18.5796 2.58613C18.5796 2.02613 19.0116 1.59413 19.5716 1.59413C20.1316 1.59413 20.5636 2.02613 20.5636 2.58613C20.5636 3.14613 20.1316 3.57813 19.5716 3.57813C19.0116 3.57813 18.5796 3.14613 18.5796 2.58613ZM26.1713 10.2821L26.7153 7.11413C26.8753 6.21813 26.6353 5.85013 25.9793 5.85013C25.4513 5.85013 24.8273 6.23413 24.3153 6.61813L23.4353 11.7861H22.0113L23.0673 5.69013C22.5873 5.53013 22.1073 5.80213 21.8033 6.13813L21.5793 5.89813C21.7713 5.32213 22.2993 4.65013 23.3073 4.65013C24.3313 4.65013 24.4913 5.30613 24.3473 6.10613H24.4113C25.1153 5.00213 25.9633 4.65013 26.6833 4.65013C27.4993 4.65013 28.2353 5.13013 28.2353 6.20213C28.2353 6.45813 28.2033 6.63413 28.1713 6.84213L27.4833 10.8741C27.9633 11.0341 28.4593 10.7621 28.7633 10.4261L29.0033 10.6661C28.8113 11.2421 28.2673 11.9461 27.2593 11.9461C26.4113 11.9461 26.1073 11.4981 26.1073 10.8901C26.1073 10.7621 26.1233 10.5701 26.1713 10.2821ZM30.2762 5.56213L30.3562 5.14613L32.6122 2.93813H33.0442L32.7082 4.81013H34.8042L34.5642 5.56213H32.5962L31.8922 9.51413C31.8602 9.67413 31.8122 9.94613 31.8122 10.2181C31.8122 10.7621 32.1482 10.9221 32.6922 10.9221C33.0922 10.9221 33.5082 10.7941 33.9082 10.5541L34.0522 10.8581C33.5882 11.5461 32.6922 11.9461 31.8922 11.9461C31.0602 11.9461 30.3562 11.5141 30.3562 10.5221C30.3562 10.3141 30.3882 10.0421 30.4362 9.77013L31.2842 5.56213H30.2762ZM35.0179 13.1301L36.2979 5.56213H35.1299L35.2419 5.00213L36.4739 4.74613L36.6659 3.83413C37.0979 1.77013 38.4099 0.810132 39.8339 0.810132C40.7459 0.810132 41.6259 1.14613 41.6259 2.05813C41.6259 2.60213 41.2579 2.98613 40.7619 2.98613C40.2979 2.98613 39.8979 2.66613 39.8979 2.13813C39.8979 1.85013 40.0419 1.56213 40.2339 1.41813C40.1059 1.38613 39.9779 1.37013 39.8499 1.37013C38.8739 1.37013 38.2819 2.39413 37.9779 4.09013L37.8499 4.81013H39.7699L39.5299 5.56213H37.7059L36.6179 12.0901C36.2979 13.9621 35.3859 15.3061 33.4979 15.3061C32.7779 15.3061 32.3299 14.8901 32.3299 14.3461C32.3299 13.7381 32.7139 13.4501 33.1939 13.4501C33.6739 13.4501 33.9459 13.7861 33.9459 14.2661C33.9459 14.5061 33.8659 14.7141 33.7219 14.8261C34.2979 14.8261 34.8099 14.3141 35.0179 13.1301ZM42.2878 11.2741C43.5678 11.2741 44.2078 9.49813 44.3038 7.99413C44.3198 7.81813 44.3198 7.64213 44.3198 7.48213C44.3198 6.09013 43.9518 5.32213 43.0718 5.32213C41.7918 5.32213 41.1518 7.09813 41.0558 8.60213C41.0398 8.77813 41.0398 8.95413 41.0398 9.11413C41.0398 10.5061 41.4078 11.2741 42.2878 11.2741ZM42.2718 11.9461C40.4798 11.9461 39.5518 10.6661 39.5518 8.92213C39.5518 6.71413 40.6878 4.65013 43.0878 4.65013C44.8798 4.65013 45.8078 5.93013 45.8078 7.67413C45.8078 9.88213 44.6718 11.9461 42.2718 11.9461ZM53.6751 4.81013L52.6191 10.8741C53.0991 11.0341 53.5791 10.7621 53.8831 10.4261L54.1231 10.6661C53.9311 11.2421 53.3871 11.9461 52.3791 11.9461C51.3551 11.9461 51.2111 11.2901 51.3551 10.4901H51.2911C50.5871 11.5941 49.7231 11.9461 49.0031 11.9461C48.0751 11.9461 47.2431 11.3861 47.5151 9.75413L48.1871 5.69013C47.7071 5.53013 47.2271 5.80213 46.9231 6.13813L46.6831 5.89813C46.8751 5.32213 47.4191 4.65013 48.4271 4.65013C49.4511 4.65013 49.6911 5.30613 49.5471 6.10613L48.9231 9.75413C48.7951 10.4741 48.9391 10.9061 49.5151 10.9061C50.1551 10.9061 50.8271 10.4741 51.3711 9.97813L52.2191 4.93813L53.6751 4.81013ZM57.8793 6.10613L57.7833 6.69813H57.8473C58.4393 5.14613 59.1433 4.65013 59.9913 4.65013C60.6473 4.65013 61.0793 5.01813 61.0793 5.67413C61.0793 6.33013 60.6793 6.71413 60.0553 6.71413C59.4953 6.71413 59.1753 6.36213 59.1753 5.73813C58.6953 6.02613 58.2153 6.71413 57.6233 7.78613L56.9353 11.7861H55.5113L56.5673 5.69013C56.0873 5.53013 55.6073 5.80213 55.3033 6.13813L55.0793 5.89813C55.2713 5.32213 55.7993 4.65013 56.8073 4.65013C57.8313 4.65013 57.9913 5.30613 57.8793 6.10613Z"
                fill="black"
                fillOpacity="0.5"
              />
            </svg>
          </Link>

          <Link
            href={`/analyze?brand=${encodeURIComponent(brandName)}`}
            style={{
              padding: "8px 16px",
              backgroundColor: "#6C6A68",
              color: "#FFFFFF",
              textDecoration: "none",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "500",
            }}
          >
            Full Analysis →
          </Link>
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
            {brandName}
            {itemName && (
              <span style={{ color: "#666", fontSize: "24px" }}>
                {" "}
                - {itemName}
              </span>
            )}
          </h1>

          <p style={{ color: "#666", fontSize: "14px" }}>
            Found {reviewData.totalResults} reviews from web sources
          </p>
        </div>

        {/* Fit Review */}
        {(tldrParam || reviewData.brandFitSummary) && (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              padding: "32px",
              borderRadius: "12px",
              border: "2px solid #D4B894",
              marginBottom: "32px",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                marginBottom: "16px",
                color: "#333",
                fontFamily: "system-ui, -apple-system, sans-serif",
              }}
            >
              Fit review
            </h3>

            <p
              style={{
                fontSize: "16px",
                color: "#666",
                marginBottom: "24px",
                fontWeight: "400",
              }}
            >
              {reviewData.totalResults}+ sources including{" "}
              {reviewData.brandFitSummary?.sources?.slice(0, 3).join(", ") ||
                "Reddit, fashion forums, reviews"}
            </p>

            <div
              style={{
                fontSize: "14px",
                color: "#333",
                lineHeight: "1.5",
                fontWeight: "400",
              }}
            >
              {tldrParam && (
                <div style={{ margin: "0 0 16px 0" }}>
                  {formatMarkdownText(decodeURIComponent(tldrParam))}
                </div>
              )}

              {reviewData.brandFitSummary?.summary && (
                <div style={{ margin: "0" }}>
                  {formatMarkdownText(reviewData.brandFitSummary.summary)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CHANGED: Added Grouped Reviews Section (Lines 365-635) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {Object.entries(reviewData.groupedReviews).map(
            ([category, reviews]) => {
              if (!reviews || reviews.length === 0) return null;

              const isExpanded = expandedSections.has(category);

              return (
                <div
                  key={category}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "12px",
                    border: "1px solid #E9DED5",
                    overflow: "hidden",
                  }}
                >
                  <button
                    onClick={() => toggleSection(category)}
                    style={{
                      width: "100%",
                      padding: "20px 24px",
                      backgroundColor: "#FFFFFF",
                      border: "none",
                      borderBottom: isExpanded ? "1px solid #E9DED5" : "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "background-color 0.2s",
                    }}
                    onMouseOver={(e) => {
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = "#F8F7F4";
                    }}
                    onMouseOut={(e) => {
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = "#FFFFFF";
                    }}
                  >
                    <div style={{ textAlign: "left" }}>
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#333",
                          margin: "0 0 4px 0",
                        }}
                      >
                        {categoryNames[category]} ({reviews.length})
                      </h3>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#666",
                          margin: 0,
                        }}
                      >
                        {categoryDescriptions[category]}
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
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
                        transition: "transform 0.2s",
                        color: "#666",
                        flexShrink: 0,
                      }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>

                  {isExpanded && (
                    <div style={{ padding: "24px" }}>
                      <div
                        style={{
                          display: "grid",
                          gap: "16px",
                        }}
                      >
                        {reviews.map((review, index) => {
                          // Skip URL parameter insights - use fresh API data only

                          return (
                            <div
                              key={index}
                              style={{
                                padding: "16px",
                                backgroundColor: "#F8F7F4",
                                borderRadius: "8px",
                                border: "1px solid #E9DED5",
                              }}
                            >
                              {/* Review Header with Source */}
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                  marginBottom: "12px",
                                  gap: "12px",
                                }}
                              >
                                <h4
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#333",
                                    margin: 0,
                                    flex: 1,
                                    lineHeight: "1.4",
                                  }}
                                >
                                  {review.title}
                                </h4>
                                <span
                                  style={{
                                    fontSize: "11px",
                                    color: "#666",
                                    backgroundColor: "#FFFFFF",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    flexShrink: 0,
                                    fontWeight: "500",
                                  }}
                                >
                                  {review.source}
                                </span>
                              </div>

                              {/* Review Content */}
                              <div
                                style={{
                                  fontSize: "14px",
                                  color: "#333",
                                  margin: "0 0 12px 0",
                                  lineHeight: "1.5",
                                }}
                              >
                                {(() => {
                                  const content = review.snippet;

                                  // Check if content contains bullet points
                                  if (
                                    content.includes("•") ||
                                    content.includes("- ")
                                  ) {
                                    // Split by bullet points and render as list
                                    const points = content
                                      .split(/[•\-]\s/)
                                      .filter((point) => point.trim());

                                    if (points.length > 1) {
                                      return (
                                        <ul
                                          style={{
                                            margin: 0,
                                            paddingLeft: "16px",
                                          }}
                                        >
                                          {points.map((point, idx) => (
                                            <li
                                              key={idx}
                                              style={{ marginBottom: "4px" }}
                                            >
                                              {point.trim()}
                                            </li>
                                          ))}
                                        </ul>
                                      );
                                    }
                                  }

                                  // Fallback to regular paragraph
                                  return <div>{content}</div>;
                                })()}
                              </div>

                              {/* Tags */}
                              <div
                                style={{
                                  display: "flex",
                                  gap: "8px",
                                  flexWrap: "wrap",
                                  marginBottom: "12px",
                                }}
                              >
                                {review.tags
                                  .slice(0, 3)
                                  .map((tag, tagIndex) => (
                                    <span
                                      key={tagIndex}
                                      style={{
                                        fontSize: "12px",
                                        color: "#666",
                                        backgroundColor: "#F5F5F5",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                      }}
                                    >
                                      {tag}
                                    </span>
                                  ))}
                              </div>

                              {/* Read More Link */}
                              <a
                                href={review.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  color: "#333",
                                  textDecoration: "none",
                                  fontSize: "14px",
                                  fontWeight: "400",
                                }}
                              >
                                Read more
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M7 17L17 7"></path>
                                  <path d="M7 7h10v10"></path>
                                </svg>
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            }
          )}
        </div>

        {/* CHANGED: Added Action Buttons Section (Lines 637-661) */}
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
          <Link
            href={`/analyze?brand=${encodeURIComponent(brandName)}`}
            style={{
              display: "inline-block",
              padding: "12px 24px",
              backgroundColor: "#6C6A68",
              color: "#FFFFFF",
              textDecoration: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Get Full Analysis
          </Link>
        </div>
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function LoadingFallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F8F7F4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid #E9DED5",
            borderTop: "3px solid #8B7355",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <p style={{ color: "#666", fontSize: "14px" }}>Loading reviews...</p>
      </div>
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

// Main component with Suspense wrapper
export default function ExtensionReviewsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ExtensionReviewsContent />
    </Suspense>
  );
}
