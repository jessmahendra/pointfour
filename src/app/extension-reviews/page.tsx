"use client";

import { Suspense } from "react";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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

interface FitSection {
  title: string;
  recommendation: string;
  confidence: "high" | "medium" | "low";
  evidence?: string[];
}

interface BrandFitSummary {
  summary: string | null;
  confidence: "high" | "medium" | "low";
  sources: string[];
  totalResults: number;
  sections?: {
    [key: string]: FitSection;
  };
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
    substack: Review[];
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

// Get favicon for a source
const getFavicon = (source: string) => {
  const sourceLower = source.toLowerCase();

  // Reddit favicon
  if (sourceLower.includes("reddit")) {
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggMEE4IDggMCAxIDAgOCAxNkE4IDggMCAwIDAgOCAwem0wIDE0QTYgNiAwIDEgMSA4IDJhNiA2IDAgMCAxIDAgMTJ6IiBmaWxsPSIjRkY0NTAwIi8+CjxwYXRoIGQ9Ik0xMiAxMGEyIDIgMCAxIDEtNCAwIDIgMiAwIDAgMSA0IDB6TTYgMTBhMiAyIDAgMSAxLTQgMCAyIDIgMCAwIDEgNCAweiIgZmlsbD0iI0ZGNDUwMCIvPgo8cGF0aCBkPSJNMTAgMTJhMSAxIDAgMSAxLTIgMCAxIDEgMCAwIDEgMiAweiIgZmlsbD0iI0ZGNDUwMCIvPgo8L3N2Zz4K";
  }

  // Substack favicon
  if (sourceLower.includes("substack")) {
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggMEE4IDggMCAxIDAgOCAxNkE4IDggMCAwIDAgOCAwem0wIDE0QTYgNiAwIDEgMSA4IDJhNiA2IDAgMCAxIDAgMTJ6IiBmaWxsPSIjRkY2NDAwIi8+CjxwYXRoIGQ9Ik0xMSA4SDV2Mmg2Vjh6TTExIDExSDV2Mmg2di0yeiIgZmlsbD0iI0ZGRiIvPgo8L3N2Zz4K";
  }

  // YouTube favicon
  if (sourceLower.includes("youtube")) {
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE1Ljg0IDQuNzJhMS45IDEuOSAwIDAgMC0xLjMyLTEuMzJDNy4xIDMgOCAzIDggM0E4IDggMCAwIDAgMCA4YTggOCAwIDAgMCA4IDggOCA4IDAgMCAwIDgtOEMxNiA4IDE2IDggMTUuODQgNC43MnpNMTAgMTJMMTAgNkw2IDlMMTAgMTJ6IiBmaWxsPSIjRkYwMDAwIi8+Cjwvc3ZnPgo=";
  }

  // Twitter/X favicon
  if (sourceLower.includes("twitter") || sourceLower.includes("x")) {
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE0LjUgNC4yN0wxMy4yIDMuNzJMMTQuNSAzLjE3VjQuMjdaTTEzLjIgMTIuMjhMMTQuNSAxMS43M1YxMi43OEwxMy4yIDEyLjI4Wk0xMS4yIDUuNzJMMTAuOSA2LjE3TDEwLjUgNS43MkwxMS4yIDUuNzJaTTUuOCAxMC4yN0w2LjEgOS44Mkw2LjUgMTAuMjdMNS44IDEwLjI3Wk0xMi4yIDYuNzJMMTEuOSA3LjE3TDExLjUgNi43MkwxMi4yIDYuNzJaTTcuOCAxMS4yN0w4LjEgMTAuODJMODUgMTEuMjdMNy44IDExLjI3Wk0xMy4yIDcuNzJMMTIuOSA4LjE3TDEyLjUgNy43MkwxMy4yIDcuNzJaTTguOCAxMi4yN0w5LjEgMTEuODJMOS41IDEyLjI3TDguOCAxMi4yN1pNMTQuMiA4LjcyTDEzLjkgOS4xN0wxMy41IDguNzJMMTQuMiA4LjcyWiIgZmlsbD0iIzAwMDAwMCIvPgo8L3N2Zz4K";
  }

  // Instagram favicon
  if (sourceLower.includes("instagram")) {
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggMEE4IDggMCAxIDAgOCAxNkE4IDggMCAwIDAgOCAwem0wIDE0QTYgNiAwIDEgMSA4IDJhNiA2IDAgMCAxIDAgMTJ6IiBmaWxsPSIjRjUwN0YzIi8+CjxjaXJjbGUgY3g9IjgiIGN5PSI4IiByPSIyIiBmaWxsPSIjRkZGIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iNCIgcj0iMC41IiBmaWxsPSIjRkZGIi8+Cjwvc3ZnPgo=";
  }

  // TikTok favicon
  if (sourceLower.includes("tiktok")) {
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJIMTF2NmMwIDIuMjEtMS43OSA0LTQgNHMtNC0xLjc5LTQtNFYySDV2NmMwIDMuMzEgMi42OSA2IDYgNnM2LTIuNjkgNi02VjJ6IiBmaWxsPSIjMDAwMDAwIi8+Cjwvc3ZnPgo=";
  }

  // Pinterest favicon
  if (sourceLower.includes("pinterest")) {
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggMEE4IDggMCAxIDAgOCAxNkE4IDggMCAwIDAgOCAwem0wIDE0QTYgNiAwIDEgMSA4IDJhNiA2IDAgMCAxIDAgMTJ6IiBmaWxsPSIjRDAwMDAwIi8+CjxwYXRoIGQ9Ik04IDRjLTEuNjYgMC0zIDEuMzQtMyAzIDAgMS4yNy0uNzUgMi4zLTEuNzUgMi43NS0uMjUuMS0uNS0uMjUtLjUtLjVWNGMwLTEuNjYgMS4zNC0zIDMtM3MzIDEuMzQgMyAzdjJjMCAuMjUtLjI1LjYtLjUuNS0xLS40NS0xLjc1LTEuNDgtMS43NS0yLjc1IDAtLjgzLjY3LTEuNSAxLjUtMS41czEuNS42NyAxLjUgMS41djRjMCAuMjUuMjUuNS41LjVzMS41LS4yNSAxLjUtLjVWNHoiIGZpbGw9IiNGRkYiLz4KPC9zdmc+Cg==";
  }

  // Facebook favicon
  if (sourceLower.includes("facebook")) {
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggMEE4IDggMCAxIDAgOCAxNkE4IDggMCAwIDAgOCAwem0wIDE0QTYgNiAwIDEgMSA4IDJhNiA2IDAgMCAxIDAgMTJ6IiBmaWxsPSIjMTg3N0YyIi8+CjxwYXRoIGQ9Ik0xMS4zIDhIMTAuM1Y2LjVjMC0uMzMuMjctLjYuNi0uNmgxLjR2LTEuNWgtMS40Yy0xLjE2IDAtMi4xLjk0LTIuMSAyLjFWN2gtMS4xYy0uMjIgMC0uNC4xOC0uNC40djEuMmMwIC4yMi4xOC40LjQuNGgxLjF2NC4zYzAgLjIyLjE4LjQuNC40aDEuMmMuMjIgMCAuNC0uMTguNC0uNFY4LjRoMS4xYy4yMiAwIC40LS4xOC40LS40VjcuNGMwLS4yMi0uMTgtLjQtLjQtLjRIMTEuM1oiIGZpbGw9IiNGRkYiLz4KPC9zdmc+Cg==";
  }

  // LinkedIn favicon
  if (sourceLower.includes("linkedin")) {
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggMEE4IDggMCAxIDAgOCAxNkE4IDggMCAwIDAgOCAwem0wIDE0QTYgNiAwIDEgMSA4IDJhNiA2IDAgMCAxIDAgMTJ6IiBmaWxsPSIjMDA3N0I1Ii8+CjxwYXRoIGQ9Ik0xMi4xIDUuN0gxMS4xVjQuN2MwLS4yMi4xOC0uNC40LS40aDEuNmMtLjIyIDAtLjQuMTgtLjQuNFY1LjdaTTExLjEgMTIuM1Y5LjNjMC0uMjIuMTgtLjQuNC0uNGgxLjJjLjIyIDAgLjQuMTguNC40djMuMWMwIC4yMi0uMTguNC0uNC40aC0xLjJjLS4yMiAwLS40LS4xOC0uNC0uNFpNMTAgMTIuM1Y5LjNjMC0uMjIuMTgtLjQuNC0uNGgxLjJjLjIyIDAgLjQuMTguNC40djMuMWMwIC4yMi0uMTguNC0uNC40aC0xLjJjLS4yMiAwLS40LS4xOC0uNC0uNFpNOSAxMi4zVjkuM2MwLS4yMi4xOC0uNC40LS40aDEuMmMuMjIgMCAuNC4xOC40LjR2My4xYzAgLjIyLS4xOC40LS40LjRIMTBDOS43OCAxMi43IDkuNiAxMi41MiA5LjYgMTIuM1Y5LjNjMC0uMjIuMTgtLjQuNC0uNGgxLjJjLjIyIDAgLjQuMTguNC40djMuMWMwIC4yMi0uMTguNC0uNC40aC0xLjJjLS4yMiAwLS40LS4xOC0uNC0uNFoiIGZpbGw9IiNGRkYiLz4KPC9zdmc+Cg==";
  }

  // Medium favicon
  if (sourceLower.includes("medium")) {
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggMEE4IDggMCAxIDAgOCAxNkE4IDggMCAwIDAgOCAwem0wIDE0QTYgNiAwIDEgMSA4IDJhNiA2IDAgMCAxIDAgMTJ6IiBmaWxsPSIjMDAwMDAwIi8+CjxwYXRoIGQ9Ik0xMS4yIDUuN0gxMS4xVjQuN2MwLS4yMi4xOC0uNC40LS40aDEuNmMtLjIyIDAtLjQuMTgtLjQuNFY1LjdaTTExLjEgMTIuM1Y5LjNjMC0uMjIuMTgtLjQuNC0uNGgxLjJjLjIyIDAgLjQuMTguNC40djMuMWMwIC4yMi0uMTguNC0uNC40aC0xLjJjLS4yMiAwLS40LS4xOC0uNC0uNFpNMTAgMTIuM1Y5LjNjMC0uMjIuMTgtLjQuNC0uNGgxLjJjLjIyIDAgLjQuMTguNC40djMuMWMwIC4yMi0uMTguNC0uNC40aC0xLjJjLS4yMiAwLS40LS4xOC0uNC0uNFpNOSAxMi4zVjkuM2MwLS4yMi4xOC0uNC40LS40aDEuMmMuMjIgMCAuNC4xOC40LjR2My4xYzAgLjIyLS4xOC40LS40LjRIMTBDOS43OCAxMi43IDkuNiAxMi41MiA5LjYgMTIuM1Y5LjNjMC0uMjIuMTgtLjQuNC0uNGgxLjJjLjIyIDAgLjQuMTguNC40djMuMWMwIC4yMi0uMTguNC0uNC40aC0xLjJjLS4yMiAwLS40LS4xOC0uNC0uNFoiIGZpbGw9IiNGRkYiLz4KPC9zdmc+Cg==";
  }

  // Blog/Forum favicon
  if (sourceLower.includes("blog") || sourceLower.includes("forum")) {
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggMEE4IDggMCAxIDAgOCAxNkE4IDggMCAwIDAgOCAwem0wIDE0QTYgNiAwIDEgMSA4IDJhNiA2IDAgMCAxIDAgMTJ6IiBmaWxsPSIjNjc3Njg0Ii8+CjxwYXRoIGQ9Ik0xMS41IDQuNUg0LjV2N2g3di03em0tNiA2VjUuNWg1djVoLTV6IiBmaWxsPSIjRkZGIi8+Cjwvc3ZnPgo=";
  }

  // Default favicon for unknown sources
  return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiByeD0iMiIgZmlsbD0iI0Y0NEE0NCIvPgo8L3N2Zz4K";
};

// Get source display name
const getSourceName = (source: string) => {
  if (source.includes("reddit")) return "Reddit";
  if (source.includes("substack")) return "Substack";
  if (source.includes("youtube")) return "YouTube";
  if (source.includes("instagram")) return "Instagram";
  if (source.includes("twitter")) return "Twitter";
  if (source.includes("tiktok")) return "TikTok";
  if (source.includes("pinterest")) return "Pinterest";
  if (source.includes("facebook")) return "Facebook";
  if (source.includes("linkedin")) return "LinkedIn";
  if (source.includes("medium")) return "Medium";
  if (source.includes("blog")) return "Fashion Blog";
  if (source.includes("forum")) return "Community Forum";
  return source;
};

// Function to prioritize fit and quality information in snippets
const prioritizeFitAndQuality = (snippet: string) => {
  if (!snippet) return snippet;

  // Split snippet into sentences or bullet points
  const parts = snippet.split(/[.!?]/).filter((part) => part.trim().length > 0);

  // Keywords that indicate fit and quality information
  const fitKeywords = [
    "fit",
    "fits",
    "sizing",
    "size",
    "large",
    "small",
    "true to size",
    "runs",
    "athletic",
    "comfortable",
  ];
  const qualityKeywords = [
    "quality",
    "materials",
    "construction",
    "durable",
    "premium",
    "excellent",
    "amazing",
    "incredible",
    "top-notch",
  ];

  // Separate fit/quality parts from other parts
  const fitQualityParts: string[] = [];
  const otherParts: string[] = [];

  parts.forEach((part) => {
    const lowerPart = part.toLowerCase();
    const hasFitKeyword = fitKeywords.some((keyword) =>
      lowerPart.includes(keyword)
    );
    const hasQualityKeyword = qualityKeywords.some((keyword) =>
      lowerPart.includes(keyword)
    );

    if (hasFitKeyword || hasQualityKeyword) {
      fitQualityParts.push(part.trim());
    } else {
      otherParts.push(part.trim());
    }
  });

  // Reconstruct snippet with fit/quality first
  const prioritizedParts = [...fitQualityParts, ...otherParts];
  return prioritizedParts.join(". ") + (snippet.endsWith(".") ? "" : ".");
};

function ExtensionReviewsContent() {
  const searchParams = useSearchParams();
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(false); // Set to false for demo
  const [error, setError] = useState<string | null>(null);
  // All sections are now always expanded - no state needed
  const [showMoreCards, setShowMoreCards] = useState<Record<string, boolean>>(
    {}
  );

  const brandName = searchParams.get("brand") || "Vollebak"; // Default to Vollebak for demo
  const itemName = searchParams.get("item") || "";
  const fromWidget = searchParams.get("fromWidget") === "true";
  const widgetDataParam = searchParams.get("widgetData");
  const storageKey = searchParams.get("storageKey");
  const useStorage = searchParams.get("useStorage") === "true";
  const tldrParam = searchParams.get("tldr") || "";

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // If coming from widget with data, use that instead of making a new API call
      if (fromWidget && (widgetDataParam || (useStorage && storageKey))) {
        try {
          let widgetData;

          if (useStorage && storageKey) {
            // Get data from sessionStorage
            const storedData = sessionStorage.getItem(storageKey);
            if (storedData) {
              widgetData = JSON.parse(storedData);
              console.log(
                "🔗 [ExtensionReviews] Retrieved data from sessionStorage:",
                storageKey
              );
              // Clean up the stored data
              sessionStorage.removeItem(storageKey);
            } else {
              throw new Error("No data found in sessionStorage");
            }
          } else if (widgetDataParam) {
            // Parse data from URL parameter
            widgetData = JSON.parse(widgetDataParam);
          } else {
            throw new Error("No widget data available");
          }
          console.log("🔗 [ExtensionReviews] Using widget data:", {
            brand: brandName,
            hasBrandFitSummary: !!widgetData.brandFitSummary,
            brandFitSummarySources: widgetData.brandFitSummary?.sources,
            reviewCount: widgetData.reviews?.length || 0,
            totalResults: widgetData.totalResults,
            hasGroupedReviews: !!widgetData.groupedReviews,
            groupedReviewCounts: widgetData.groupedReviews
              ? Object.fromEntries(
                  Object.entries(widgetData.groupedReviews).map(
                    ([key, reviews]) => [key, (reviews as Review[]).length]
                  )
                )
              : null,
          });

          // Transform widget data to match expected format
          const transformedData: ReviewData = {
            brand: brandName,
            itemName: itemName,
            brandFitSummary: widgetData.brandFitSummary || {
              summary: `Based on ${
                widgetData.totalResults || widgetData.reviews?.length || 0
              } reviews from multiple sources`,
              confidence: "medium" as const,
              sources: (() => {
                // Extract unique sources from reviews
                if (widgetData.reviews && widgetData.reviews.length > 0) {
                  const sources = [
                    ...new Set(widgetData.reviews.map((r: Review) => r.source)),
                  ];
                  return sources.slice(0, 5); // Limit to 5 sources for display
                }
                return ["Reddit", "Fashion forums", "Reviews"];
              })(),
              totalResults:
                widgetData.totalResults || widgetData.reviews?.length || 0,
            },
            reviews: widgetData.reviews || [],
            groupedReviews: widgetData.groupedReviews || {
              // Fallback to client-side grouping if server grouping not available
              primary:
                widgetData.reviews?.filter(
                  (r: Review) =>
                    r.source?.includes("reddit") ||
                    r.source?.includes("substack")
                ) || [],
              community:
                widgetData.reviews?.filter(
                  (r: Review) =>
                    r.source?.includes("community") ||
                    r.source?.includes("forum")
                ) || [],
              blogs:
                widgetData.reviews?.filter(
                  (r: Review) =>
                    r.source?.includes("blog") || r.source?.includes("medium")
                ) || [],
              videos:
                widgetData.reviews?.filter(
                  (r: Review) =>
                    r.source?.includes("youtube") || r.source?.includes("video")
                ) || [],
              social:
                widgetData.reviews?.filter(
                  (r: Review) =>
                    r.source?.includes("social") ||
                    r.source?.includes("instagram") ||
                    r.source?.includes("twitter") ||
                    r.source?.includes("tiktok")
                ) || [],
              publications:
                widgetData.reviews?.filter(
                  (r: Review) =>
                    r.source?.includes("publication") ||
                    r.source?.includes("vogue") ||
                    r.source?.includes("magazine")
                ) || [],
              other:
                widgetData.reviews?.filter(
                  (r: Review) =>
                    !r.source?.includes("reddit") &&
                    !r.source?.includes("substack") &&
                    !r.source?.includes("community") &&
                    !r.source?.includes("forum") &&
                    !r.source?.includes("blog") &&
                    !r.source?.includes("medium") &&
                    !r.source?.includes("youtube") &&
                    !r.source?.includes("video") &&
                    !r.source?.includes("social") &&
                    !r.source?.includes("instagram") &&
                    !r.source?.includes("twitter") &&
                    !r.source?.includes("tiktok") &&
                    !r.source?.includes("publication") &&
                    !r.source?.includes("vogue") &&
                    !r.source?.includes("magazine")
                ) || [],
            },
            totalResults: (() => {
              // Use groupedReviews as single source of truth for count consistency
              if (widgetData.groupedReviews) {
                const groupedCount: number = (
                  Object.values(widgetData.groupedReviews) as Review[][]
                ).reduce(
                  (total: number, group: Review[]) => total + group.length,
                  0
                );

                // Warn if counts don't match by >20%
                const originalCount =
                  Number(widgetData.totalResults) ||
                  (widgetData.reviews?.length ?? 0) ||
                  0;
                if (originalCount > 0) {
                  const ratio =
                    Math.abs(groupedCount - originalCount) / originalCount;
                  if (ratio > 0.2) {
                    console.warn(
                      `🔢 COUNT MISMATCH: Grouped=${groupedCount}, Original=${originalCount}`
                    );
                  }
                }

                return groupedCount;
              }
              return widgetData.totalResults || widgetData.reviews?.length || 0;
            })(),
            timestamp: widgetData.timestamp,
          };

          // Validate the transformed data
          console.log("🔗 [ExtensionReviews] Transformed data validation:", {
            hasBrandFitSummary: !!transformedData.brandFitSummary,
            brandFitSummarySources: transformedData.brandFitSummary?.sources,
            sourcesLength:
              transformedData.brandFitSummary?.sources?.length || 0,
            reviewCount: transformedData.reviews?.length || 0,
            totalResults: transformedData.totalResults,
            groupedReviewCounts: Object.fromEntries(
              Object.entries(transformedData.groupedReviews).map(
                ([key, reviews]) => [key, (reviews as Review[]).length]
              )
            ),
          });

          setReviewData(transformedData);
          setLoading(false);
          return;
        } catch (e) {
          console.warn(
            "🔗 [ExtensionReviews] Failed to parse widget data, falling back to API:",
            e
          );

          // If sessionStorage failed, try to clean up any remaining keys
          if (useStorage && storageKey) {
            try {
              sessionStorage.removeItem(storageKey);
              console.log(
                "🔗 [ExtensionReviews] Cleaned up sessionStorage key:",
                storageKey
              );
            } catch (cleanupError) {
              console.warn(
                "🔗 [ExtensionReviews] Failed to cleanup sessionStorage:",
                cleanupError
              );
            }
          }
        }
      }

      // Fallback to API call when no widget data or parsing failed
      console.log(
        "🔗 [ExtensionReviews] Making fallback API call to /api/extension/search-reviews"
      );

      // Build query parameters for GET request
      const params = new URLSearchParams({
        brand: brandName,
        searchType: "all",
        enableExternalSearch: "true",
      });

      if (itemName) {
        params.append("itemName", itemName);
      }

      const response = await fetch(
        `/api/extension/search-reviews?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("🔗 [ExtensionReviews] API call failed:", {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
        });
        throw new Error(
          `API call failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("🔗 [ExtensionReviews] API call successful:", {
        hasBrandFitSummary: !!data.brandFitSummary,
        hasReviews: !!data.reviews,
        reviewCount: data.reviews?.length || 0,
        hasGroupedReviews: !!data.groupedReviews,
        totalResults: data.totalResults,
      });

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
          substack: [],
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
  }, [
    brandName,
    itemName,
    fromWidget,
    widgetDataParam,
    storageKey,
    useStorage,
  ]);

  useEffect(() => {
    if (!brandName) {
      setError("No brand specified");
      setLoading(false);
      return;
    }

    // For demo purposes, create mock data instead of fetching
    if (brandName === "Vollebak") {
      const mockData: ReviewData = {
        brand: "Vollebak",
        itemName: undefined,
        brandFitSummary: {
          summary:
            "Vollebak is known for innovative, high-tech clothing that often runs true to size but with a technical, athletic fit. Their pieces are designed for extreme conditions and tend to be more fitted than casual wear. Quality is consistently excellent with premium materials and construction.\n\n**Fit:** True to size, athletic fit | **Quality:** Premium, excellent construction\n\n**Sizing:** Generally true to size, but designed for athletic builds. Consider sizing up if you prefer a looser fit.\n\n**Quality:** Exceptional durability and innovative materials. Worth the premium price for technical performance.",
          confidence: "high",
          sources: ["Reddit", "Substack", "Fashion forums"],
          totalResults: 30,
        },
        reviews: [],
        groupedReviews: {
          primary: [],
          community: [],
          blogs: [
            {
              title: "Merino wool t-shirt brands",
              snippet:
                "I really like this merino t-shirt from Vollebak, it's amazing! Great quality and innovative design.",
              url: "#",
              source: "blog",
              tags: ["merino", "quality", "design"],
              confidence: "high",
              brandLevel: true,
              fullContent: "",
            },
            {
              title: "Love Vollebak!",
              snippet:
                "I've bought so many things from Vollebak and yes they're a bit expensive but worth every penny for the innovation.",
              url: "#",
              source: "blog",
              tags: ["expensive", "innovation", "worth"],
              confidence: "high",
              brandLevel: true,
              fullContent: "",
            },
            {
              title: "Innovative materials",
              snippet:
                "Vollebak's use of cutting-edge materials and technology makes their clothing truly unique. The fit is perfect for active lifestyles.",
              url: "#",
              source: "blog",
              tags: ["materials", "technology", "active"],
              confidence: "high",
              brandLevel: true,
              fullContent: "",
            },
          ],
          videos: [],
          social: [],
          publications: [],
          other: [],
          substack: [
            {
              title: "Merino wool t-shirt brands",
              snippet:
                "I really like this merino t-shirt from Vollebak, it's amazing! Great quality and the fit is perfect for my athletic build.",
              url: "#",
              source: "reddit",
              tags: ["merino", "quality", "fit"],
              confidence: "high",
              brandLevel: true,
              fullContent: "",
            },
            {
              title: "Technical outdoor gear",
              snippet:
                "Vollebak's technical pieces are incredible. The materials feel premium and the construction is top-notch. Worth every penny.",
              url: "#",
              source: "substack",
              tags: ["technical", "premium", "construction"],
              confidence: "high",
              brandLevel: true,
              fullContent: "",
            },
            {
              title: "Innovative fashion brands",
              snippet:
                "Love how Vollebak pushes boundaries with materials and design. Their pieces are conversation starters and perform amazingly.",
              url: "#",
              source: "substack",
              tags: ["innovative", "design", "performance"],
              confidence: "high",
              brandLevel: true,
              fullContent: "",
            },
            {
              title: "Sustainable luxury clothing",
              snippet:
                "Vollebak's commitment to sustainability while maintaining luxury quality is impressive. The fit is athletic but comfortable.",
              url: "#",
              source: "substack",
              tags: ["sustainable", "luxury", "athletic"],
              confidence: "high",
              brandLevel: true,
              fullContent: "",
            },
            {
              title: "High-tech apparel",
              snippet:
                "The technology in Vollebak's clothing is mind-blowing. The fit is perfect for active lifestyles and the quality is unmatched.",
              url: "#",
              source: "substack",
              tags: ["technology", "active", "quality"],
              confidence: "high",
              brandLevel: true,
              fullContent: "",
            },
            {
              title: "Premium outdoor wear",
              snippet:
                "Vollebak creates the most innovative outdoor gear I've ever worn. The fit is athletic and the materials are revolutionary.",
              url: "#",
              source: "substack",
              tags: ["outdoor", "athletic", "revolutionary"],
              confidence: "high",
              brandLevel: true,
              fullContent: "",
            },
          ],
        },
        totalResults: 30,
        timestamp: Date.now(),
      };
      setReviewData(mockData);
      return;
    }

    fetchReviews();
  }, [brandName, itemName, fetchReviews]);

  // All sections are now always expanded - no toggle needed

  const toggleShowMore = (section: string) => {
    setShowMoreCards((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const categoryNames: Record<string, string> = {
    primary: "Newsletters & Forums",
    community: "Community Discussions",
    blogs: "Fashion Blogs",
    videos: "Video Reviews",
    social: "Social Media",
    publications: "Fashion Publications",
    other: "Other Sources",
    substack: "Substack Newsletters",
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
        <style>{`
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
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
                d="M4.20631 6.53813L3.45431 11.0021C3.83831 11.2261 4.20631 11.2901 4.63831 11.2901C6.09431 11.2901 7.10231 9.65813 7.10231 7.57813C7.10231 6.36213 6.57431 5.69013 5.74231 5.69013C5.15031 5.69013 4.62231 6.07413 4.20631 6.53813ZM4.27031 5.89813H4.33431C4.84631 5.03413 5.48631 4.65013 6.38231 4.65013C7.71031 4.65013 8.59031 5.59413 8.59031 7.30613C8.59031 9.96213 6.97431 11.9461 4.47831 11.9461C3.88631 11.2901 3.48631 11.8021 3.32631 11.7221L2.84631 14.3781L3.96631 14.6821L3.75831 15.1461H0.654312V14.6981L1.40631 14.4261L2.95831 5.69013C2.47831 5.53013 1.99831 5.80213 1.69431 6.13813L1.47031 5.89813C1.66231 5.32213 2.19031 4.65013 3.19831 4.65013C4.07831 4.65013 4.36631 5.11413 4.27031 5.89813ZM12.6003 11.2741C13.8803 11.2741 14.5203 9.49813 14.6163 7.99413C14.6323 7.81813 14.6323 7.64213 14.6323 7.48213C14.6323 6.09013 14.2643 5.32213 13.3843 5.32213C12.1043 5.32213 11.4643 7.09813 11.3683 8.60213C11.3523 8.77813 11.3523 8.95413 11.3523 9.11413C11.3523 10.5061 11.7203 11.2741 12.6003 11.2741ZM12.5843 11.9461C10.7923 11.9461 9.86431 10.6661 9.86431 8.92213C9.86431 6.71413 11.0003 4.65013 13.4003 4.65013C15.1923 4.65013 16.1203 5.93013 16.1203 7.67413C16.1203 9.88213 14.9843 11.9461 12.5843 11.9461ZM19.8756 6.26613L19.0916 10.8741C19.5716 11.0341 20.0676 10.7621 20.3716 10.4261L20.6116 10.6661C20.4196 11.2421 19.8756 11.9461 18.8676 11.9461C18.0196 11.9461 17.7156 11.4981 17.7156 10.8901C17.7156 10.7621 17.7316 10.5701 17.7796 10.2821L18.5636 5.69013C18.0836 5.53013 17.6196 5.80213 17.3156 6.13813L17.0756 5.89813C17.2676 5.32213 17.8116 4.65013 18.8196 4.65013C19.6676 4.65013 19.9396 5.09813 19.9396 5.70613C19.9396 5.83413 19.9076 6.07413 19.8756 6.26613ZM18.5796 2.58613C18.5796 2.02613 19.0116 1.59413 19.5716 1.59413C20.1316 1.59413 20.5636 2.02613 20.5636 2.58613C20.5636 3.14613 20.1316 3.57813 19.5716 3.57813C19.0116 3.57813 18.5796 3.14613 18.5796 2.58613ZM26.1713 10.2821L26.7153 7.11413C26.8753 6.21813 26.6353 5.85013 25.9793 5.85013C25.4513 5.85013 24.8273 6.23413 24.3153 6.61813L23.4353 11.7861H22.0113L23.0673 5.69013C22.5873 5.53013 22.1073 5.80213 21.8033 6.13813L21.5793 5.89813C21.7713 5.32213 22.2993 4.65013 23.3073 4.65013C24.3313 4.65013 24.4913 5.30613 24.3473 6.10613H24.4113C25.1153 5.00213 25.9633 4.65013 26.6833 4.65013C27.4993 4.65013 28.2353 5.13013 28.2353 6.20213C28.2353 6.45813 28.2033 6.63413 28.1713 6.84213L27.4833 10.8741C27.9633 11.0341 28.4593 10.7621 28.7633 10.4261L29.0033 10.6661C28.8113 11.2421 28.2673 11.9461 27.2593 11.9461C26.4113 11.9461 26.1073 11.4981 26.1073 10.8901C26.1073 10.7621 26.1233 10.5701 26.1713 10.2821ZM30.2762 5.56213L30.3562 5.14613L32.6122 2.93813H33.0442L32.7082 4.81013H34.8042L34.5642 5.56213H32.5962L31.8922 9.51413C31.8602 9.67413 31.8122 9.94613 31.8122 10.2181C31.8122 10.7621 32.1482 10.9221 32.6922 10.9221C33.0922 10.9221 33.5082 10.7941 33.9082 10.5541L34.0522 10.8581C33.5882 11.5461 32.6922 11.9461 31.8922 11.9461C31.0602 11.9461 30.3562 11.5141 30.3562 10.5221C30.3562 10.3141 30.3882 10.0421 30.4362 9.77013L31.2842 5.56213H30.2762ZM35.0179 13.1301L36.2979 5.56213H35.1299L35.2419 5.00213L36.4739 4.74613L36.6659 3.83413C37.0979 1.77013 38.4099 0.810132 39.8339 0.810132C40.7459 0.810132 41.6259 1.14613 41.6259 2.05813C41.6259 2.60213 41.2579 2.98613 40.7619 2.98613C40.2979 2.98613 39.8979 2.66613 39.8979 2.13813C39.8979 1.85013 40.0419 1.56213 40.2339 1.41813C40.1059 1.38613 39.9779 1.37013 39.8499 1.37013C38.8739 1.37013 38.2819 2.39413 37.9779 4.09013L37.8499 4.81013H39.7699L39.5299 5.56213H37.7059L36.6179 12.0901C36.2979 13.9621 35.3859 15.3061 33.4979 15.3061C32.7779 15.3061 32.3299 14.8901 32.3299 14.3461C32.3299 13.7381 32.7139 13.4501 33.1939 13.4501C33.6739 13.4501 33.9459 13.7861 33.9459 14.2661C33.9459 14.5061 33.8659 14.7141 33.7219 14.8261C34.2979 14.8261 34.8099 14.3141 35.0179 13.1301ZM42.2878 11.2741C43.5678 11.2741 44.2078 9.49813 44.3038 7.99413C44.3198 7.81813 44.3198 7.64213 44.3198 7.48213C44.3198 6.09013 43.9518 5.32213 43.0718 5.32213C41.7918 5.32213 41.1518 7.09813 41.0558 8.60213C41.0398 8.77813 41.0398 8.95413 41.0398 9.11413C41.0398 10.5061 41.4078 11.2741 42.2878 11.2741ZM42.2718 11.9461C40.4798 11.9461 39.5518 10.6661 39.5518 8.92213C39.5518 6.71413 40.6878 4.65013 43.0878 4.65013C44.8798 11.9461 45.8078 5.93013 45.8078 7.67413C45.8078 9.88213 44.6718 11.9461 42.2718 11.9461ZM53.6751 4.81013L52.6191 10.8741C53.0991 11.0341 53.5791 10.7621 53.8831 10.4261L54.1231 10.6661C53.9311 11.2421 53.3871 11.9461 52.3791 11.9461C51.3551 11.9461 51.2111 11.2901 51.3551 10.4901H51.2911C50.5871 11.5941 49.7231 11.9461 49.0031 11.9461C48.0751 11.9461 47.2431 11.3861 47.5151 9.75413L48.1871 5.69013C47.7071 5.53013 47.2271 5.80213 46.9231 6.13813L46.6831 5.89813C46.8751 5.32213 47.4191 4.65013 48.4271 4.65013C49.4511 4.65013 49.6911 5.30613 49.5471 6.10613L48.9231 9.75413C48.7951 10.4741 48.9391 10.9061 49.5151 10.9061C50.1551 10.9061 50.8271 10.4741 51.3711 9.97813L52.2191 4.93813L53.6751 4.81013ZM57.8793 6.10613L57.7833 6.69813H57.8473C58.4393 5.14613 59.1433 4.65013 59.9913 4.65013C60.6473 4.65013 61.0793 5.01813 61.0793 5.67413C61.0793 6.33013 60.6793 6.71413 60.0553 6.71413C59.4953 6.71413 59.1753 6.36213 59.1753 5.73813C58.6953 6.02613 58.2153 6.71413 57.6233 7.78613L56.9353 11.7861H55.5113L56.5673 5.69013C56.0873 5.53013 55.6073 5.80213 55.3033 6.13813L55.0793 5.89813C55.2713 5.32213 55.7993 4.65013 56.8073 4.65013C57.8313 4.65013 57.9913 5.30613 57.8793 6.10613Z"
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
          maxWidth: "50%",
          margin: "0 auto",
          padding: "80px 80px 40px",
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
        </div>

        {/* Fit Review Section - Clean Design */}
        {(tldrParam || reviewData.brandFitSummary) && (
          <div style={{ marginBottom: "40px" }}>
            {/* Title and Source Count */}
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#333",
                margin: "0 0 8px 0",
              }}
            >
              Fit Review
            </h2>

            <p
              style={{
                fontSize: "14px",
                color: "#666",
                margin: "0 0 20px 0",
              }}
            >
              {reviewData.totalResults}+ sources including{" "}
              {(() => {
                // Try to get sources from brandFitSummary first
                if (
                  reviewData.brandFitSummary?.sources &&
                  reviewData.brandFitSummary.sources.length > 0
                ) {
                  return reviewData.brandFitSummary.sources
                    .slice(0, 3)
                    .join(", ");
                }

                // Fallback: extract sources from actual reviews
                if (reviewData.reviews && reviewData.reviews.length > 0) {
                  const sources = [
                    ...new Set(reviewData.reviews.map((r) => r.source)),
                  ];
                  if (sources.length > 0) {
                    return sources.slice(0, 3).join(", ");
                  }
                }

                // Final fallback
                return "Reddit, fashion forums, reviews";
              })()}
            </p>

            {/* TLDR Section */}
            {reviewData.brandFitSummary?.summary && (
              <div
                style={{
                  margin: "0 0 20px 0",
                  padding: "0",
                  backgroundColor: "transparent",
                  border: "none",
                  borderRadius: "0",
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
                {reviewData.brandFitSummary.summary
                  .split("\n")
                  .map((line, index) => {
                    if (line.trim() === "") {
                      return <br key={index} />;
                    }

                    // Handle warning lines with subtle styling
                    if (line.includes("⚠️")) {
                      return (
                        <p
                          key={index}
                          style={{
                            margin: "0 0 8px 0",
                            fontSize: "14px",
                            color: "#666",
                            fontStyle: "italic",
                          }}
                        >
                          {line.replace("⚠️ ", "")}
                        </p>
                      );
                    }

                    // Handle bold sections (brand reputation, sizing, quality)
                    if (line.includes("**") && line.includes("**:")) {
                      const parts = line.split(/(\*\*[^*]+\*\*)/);
                      return (
                        <p
                          key={index}
                          style={{ margin: "0 0 8px 0", fontWeight: "400" }}
                        >
                          {parts.map((part, i) => {
                            if (part.startsWith("**") && part.endsWith("**")) {
                              return (
                                <strong key={i} style={{ fontWeight: "600" }}>
                                  {part.slice(2, -2)}
                                </strong>
                              );
                            }
                            return part;
                          })}
                        </p>
                      );
                    }

                    return (
                      <p
                        key={index}
                        style={{ margin: "0 0 8px 0", fontWeight: "400" }}
                      >
                        {line}
                      </p>
                    );
                  })}
              </div>
            )}

            {/* TLDR Summary - fallback for legacy URLs */}
            {tldrParam && !reviewData.brandFitSummary?.summary && (
              <div
                style={{
                  margin: "0 0 20px 0",
                  padding: "0",
                  backgroundColor: "transparent",
                  border: "none",
                  borderRadius: "0",
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
                <p style={{ margin: "0", fontWeight: "400" }}>
                  {decodeURIComponent(tldrParam)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Reviews Sections - Perplexity Style */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {Object.entries(reviewData.groupedReviews).map(
            ([category, reviews]) => {
              if (!reviews || reviews.length === 0) return null;

              const visibleReviews = showMoreCards[category]
                ? reviews
                : reviews.slice(0, 3);
              const hasMoreReviews = reviews.length > 3;

              return (
                <div
                  key={category}
                  style={{
                    backgroundColor: "transparent",
                    borderRadius: "0",
                    border: "none",
                    overflow: "visible",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 0",
                      marginBottom: "8px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        color: "#333",
                        margin: "0 0 4px 0",
                      }}
                    >
                      {categoryNames[category]}
                    </h3>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#666",
                        margin: 0,
                      }}
                    >
                      {reviews.length} reviews
                    </p>
                  </div>

                  <div style={{ padding: "0", marginTop: "0" }}>
                    {/* Cards Grid - 3 columns */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "16px",
                        marginBottom: "0",
                      }}
                    >
                      {visibleReviews.map((review, index) => (
                        <div
                          key={index}
                          style={{
                            padding: "16px",
                            backgroundColor: "#FFFFFF",
                            borderRadius: "8px",
                            border: "1px solid #E7DED6",
                            display: "flex",
                            flexDirection: "column",
                            height: "100%",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          onClick={() => {
                            if (review.url && review.url !== "#") {
                              window.open(review.url, "_blank");
                            }
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform =
                              "translateY(-2px)";
                            e.currentTarget.style.boxShadow =
                              "0 4px 12px rgba(0,0,0,0.1)";
                            e.currentTarget.style.borderColor = "#D4C5B8";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                            e.currentTarget.style.borderColor = "#E7DED6";
                          }}
                        >
                          {/* Review Title - Limited to 2 lines */}
                          <h4
                            style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#333",
                              margin: "0 0 4px 0",
                              lineHeight: "1.4",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              wordBreak: "break-word",
                              maxHeight: "calc(1.4em * 2)",
                            }}
                          >
                            {review.title}
                          </h4>

                          {/* Review Content - Prioritize fit review summaries */}
                          <p
                            style={{
                              fontSize: "13px",
                              color: "#333",
                              margin: "0 0 12px 0",
                              lineHeight: "1.4",
                              display: "-webkit-box",
                              WebkitLineClamp: 5,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              wordBreak: "break-word",
                              maxHeight: "calc(1.4em * 5)",
                            }}
                          >
                            {prioritizeFitAndQuality(review.snippet)}
                          </p>

                          {/* Source with Favicon - Perplexity Style */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              marginTop: "auto",
                            }}
                          >
                            <Image
                              src={getFavicon(review.source)}
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
                              {getSourceName(review.source)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* View More Button */}
                    {hasMoreReviews && (
                      <div style={{ textAlign: "left", marginTop: "20px" }}>
                        <button
                          onClick={() => toggleShowMore(category)}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "transparent",
                            border: "none",
                            borderRadius: "0",
                            color: "#666",
                            fontSize: "13px",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            textDecoration: "underline",
                          }}
                          onMouseOver={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.backgroundColor = "transparent";
                          }}
                          onMouseOut={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.backgroundColor = "transparent";
                          }}
                        >
                          {showMoreCards[category] ? "Show less" : "View more"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>

        {/* Action Buttons Section */}
        <div
          style={{
            marginTop: "40px",
            padding: "24px",
            backgroundColor: "transparent",
            borderRadius: "0",
            border: "none",
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
      <style>{`
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
