"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Recommendation {
  id: string;
  product_id: number;
  query: string;
  created_at: string;
  product: {
    id: number;
    name: string;
    image_url?: string;
    brand: {
      name: string;
      slug: string;
    };
  };
}

interface RecommendationHistoryProps {
  isAuthenticated: boolean;
}

export function RecommendationHistory({ isAuthenticated }: RecommendationHistoryProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const router = useRouter();

  const LIMIT = 10;

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    
    fetchRecommendations(0);
  }, [isAuthenticated]);

  const fetchRecommendations = async (currentOffset: number) => {
    try {
      if (currentOffset === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await fetch(
        `/api/user-recommendations?limit=${LIMIT}&offset=${currentOffset}`
      );

      if (response.ok) {
        const data = await response.json();
        
        if (currentOffset === 0) {
          setRecommendations(data.recommendations || []);
        } else {
          setRecommendations(prev => [...prev, ...(data.recommendations || [])]);
        }
        
        setHasMore(data.hasMore || false);
        setOffset(currentOffset);
      } else if (response.status === 401) {
        // User not authenticated
        setRecommendations([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    fetchRecommendations(offset + LIMIT);
  };

  const handleRecommendationClick = (recommendation: Recommendation) => {
    router.push(`/products/${recommendation.product.id}?recommendationId=${recommendation.id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? "month" : "months"} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="mt-8">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-600 mx-auto mb-4"></div>
            <p className="text-stone-600 text-sm">Loading your history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="mt-8">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Your Search History
        </h3>
        <div className="bg-white border border-stone-200 rounded-lg p-6 text-center">
          <p className="text-stone-500 text-sm">
            No previous searches yet. Start by searching for a product above!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Your Search History
      </h3>
      <div className="space-y-2">
        {recommendations.map((recommendation) => (
          <button
            key={recommendation.id}
            onClick={() => handleRecommendationClick(recommendation)}
            className="w-full bg-white border border-stone-200 rounded-lg p-4 hover:border-stone-300 hover:shadow-sm transition-all duration-200 text-left group"
          >
            <div className="flex items-center gap-4">
              {/* Product Image */}
              <div className="flex-shrink-0 w-16 h-16 bg-stone-100 rounded-md overflow-hidden">
                {recommendation.product.image_url ? (
                  <Image
                    src={recommendation.product.image_url}
                    alt={recommendation.product.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-400">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-grow min-w-0">
                <p className="text-sm font-medium text-stone-900 group-hover:text-[#928704] transition-colors truncate">
                  {recommendation.product.name}
                </p>
                <p className="text-xs text-stone-500 mt-0.5">
                  {recommendation.product.brand.name}
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  {formatDate(recommendation.created_at)}
                </p>
              </div>

              {/* Arrow Icon */}
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-stone-400 group-hover:text-[#928704] transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-4">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="w-full py-3 px-4 bg-white border border-stone-300 rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-stone-600"></div>
                Loading...
              </span>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

