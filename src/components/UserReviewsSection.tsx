"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

interface UserReview {
  id: string;
  user_id: string;
  rating: number;
  fit_rating: string;
  review_text: string;
  size_worn: string;
  created_at: string;
  helpful_count: number;
  measurements_snapshot: Record<string, unknown>;
  review_photos: Array<{
    id: string;
    photo_url: string;
    display_order: number;
  }>;
}

interface UserReviewsSectionProps {
  productId: string;
  className?: string;
  brandId?: string;
  productName?: string;
}

export function UserReviewsSection({
  productId,
  className = "",
  brandId,
  productName,
}: UserReviewsSectionProps) {
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterBySimilar, setFilterBySimilar] = useState(true);
  const [sortBy, setSortBy] = useState("created_at");
  const [isFiltered, setIsFiltered] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        similar: filterBySimilar.toString(),
        sortBy,
        sortOrder: "desc",
      });

      const response = await fetch(
        `/api/reviews/product/${productId}?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }

      const data = await response.json();
      setReviews(data.reviews || []);
      setIsFiltered(data.filtered || false);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError(err instanceof Error ? err.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [productId, filterBySimilar, sortBy]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getFitRatingLabel = (fitRating: string) => {
    switch (fitRating) {
      case "runs-small":
        return "Runs Small";
      case "runs-large":
        return "Runs Large";
      case "true-to-size":
        return "True to Size";
      default:
        return fitRating;
    }
  };

  const getFitRatingColor = (fitRating: string) => {
    switch (fitRating) {
      case "runs-small":
        return "bg-blue-100 text-blue-800";
      case "runs-large":
        return "bg-orange-100 text-orange-800";
      case "true-to-size":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-semibold text-gray-900">
            Community Reviews
          </h2>
          {brandId && productName && (
            <Link
              href={`/review?productId=${productId}&brandId=${brandId}&productName=${encodeURIComponent(productName)}`}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#4E4B4B] rounded-lg hover:bg-[#3E3B3B] transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Review
            </Link>
          )}
        </div>
        <p className="text-sm text-gray-600">
          {reviews.length} review{reviews.length !== 1 ? "s" : ""} from our
          community
          {isFiltered && " with similar measurements to you"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 pb-6 border-b border-gray-200">
        <button
          onClick={() => setFilterBySimilar(!filterBySimilar)}
          className={`px-4 py-2 rounded-lg border-2 transition-colors ${
            filterBySimilar
              ? "border-[#4E4B4B] bg-[#4E4B4B] text-white"
              : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
          }`}
        >
          Similar to me
        </button>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4E4B4B]"
        >
          <option value="created_at">Most Recent</option>
          <option value="rating">Highest Rated</option>
          <option value="helpful_count">Most Helpful</option>
        </select>
      </div>

      {/* Reviews List */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">
            No reviews yet. Be the first to share your experience!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="border border-gray-200 rounded-lg p-5"
            >
              {/* Review Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {/* Star Rating */}
                    <div className="flex text-yellow-400">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i}>
                          {i < review.rating ? "★" : "☆"}
                        </span>
                      ))}
                    </div>
                    {/* Fit Badge */}
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${getFitRatingColor(
                        review.fit_rating
                      )}`}
                    >
                      {getFitRatingLabel(review.fit_rating)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatDate(review.created_at)}
                  </p>
                </div>

                {/* Size Worn */}
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Size Worn</p>
                  <p className="text-sm font-medium text-gray-900">
                    {review.size_worn}
                  </p>
                </div>
              </div>

              {/* Measurements Snapshot (if similar) */}
              {isFiltered && review.measurements_snapshot && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <p className="text-xs font-medium text-blue-800 mb-1">
                    Similar measurements to you
                  </p>
                  <div className="flex gap-4 text-xs text-blue-700">
                    {Boolean(review.measurements_snapshot.waist_cm) && (
                      <span>Waist: {String(review.measurements_snapshot.waist_cm)}cm</span>
                    )}
                    {Boolean(review.measurements_snapshot.hips_cm) && (
                      <span>Hips: {String(review.measurements_snapshot.hips_cm)}cm</span>
                    )}
                    {Boolean(review.measurements_snapshot.bust_cm) && (
                      <span>Bust: {String(review.measurements_snapshot.bust_cm)}cm</span>
                    )}
                  </div>
                </div>
              )}

              {/* Review Text */}
              <p className="text-gray-700 leading-relaxed mb-4">
                {review.review_text}
              </p>

              {/* Photos */}
              {review.review_photos && review.review_photos.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {review.review_photos
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((photo) => (
                      <Image
                        key={photo.id}
                        src={photo.photo_url}
                        alt="Review photo"
                        width={96}
                        height={96}
                        className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(photo.photo_url, "_blank")}
                      />
                    ))}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Helpful ({review.helpful_count || 0})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
