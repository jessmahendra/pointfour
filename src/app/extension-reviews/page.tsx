"use client";

import { Suspense } from "react";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

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


function ExtensionReviewsContent() {
  const searchParams = useSearchParams();
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brandName = searchParams.get("brand") || "";
  const itemName = searchParams.get("item") || "";

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Always make fresh API calls
      const response = await fetch("/api/extension/search-reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brand: brandName,
          itemName: itemName || "",
          enableExternalSearch: true,
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
  }, [brandName, itemName]);

  useEffect(() => {
    if (!brandName) {
      setError("No brand specified");
      setLoading(false);
      return;
    }

    fetchReviews();
  }, [brandName, itemName, fetchReviews]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#F8F7F4" }}>
        <p>Loading reviews for {brandName}...</p>
      </div>
    );
  }

  if (error || !reviewData) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#F8F7F4" }}>
        <h1>Unable to Load Reviews</h1>
        <p>{error || "Something went wrong"}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F8F7F4" }}>
      <h1>
        {brandName}
        {itemName && ` - ${itemName}`}
      </h1>

      {/* Fit Review Section */}
      {reviewData.brandFitSummary && (
        <div>
          <h2>Fit Review</h2>
          <p>
            <strong>Fit/Sizing:</strong>{" "}
            {reviewData.brandFitSummary?.sections?.fit?.recommendation ||
              reviewData.brandFitSummary?.summary ||
              "Information based on customer reviews"}
          </p>
          <p>
            <strong>Quality:</strong>{" "}
            {reviewData.brandFitSummary?.sections?.quality?.recommendation ||
              "Quality information based on customer feedback"}
          </p>
        </div>
      )}

      {/* Reviews */}
      <div>
        {Object.entries(reviewData.groupedReviews).map(
          ([category, reviews]) => {
            if (!reviews || reviews.length === 0) return null;

            return (
              <div key={category}>
                <h3>{category}</h3>
                {reviews.slice(0, 3).map((review, index) => (
                  <div key={index}>
                    <h4>{review.title}</h4>
                    <p>{review.snippet}</p>
                  </div>
                ))}
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}

export default function ExtensionReviewsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExtensionReviewsContent />
    </Suspense>
  );
}
