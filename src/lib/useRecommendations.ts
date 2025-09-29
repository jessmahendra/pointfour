"use client";

import { useState, useCallback } from "react";
import { AnalysisResult, UserProfile } from "@/types/analysis";

interface UseRecommendationsOptions {
  onSuccess?: (result: AnalysisResult) => void;
  onError?: (error: string) => void;
}

interface UseRecommendationsReturn {
  analysisResult: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  shareUrl: string | null;
  getRecommendations: (query: string, userProfile?: UserProfile, productId?: string) => Promise<void>;
  clearResults: () => void;
  loadCachedResult: (result: AnalysisResult) => void;
}

export function useRecommendations(options: UseRecommendationsOptions = {}): UseRecommendationsReturn {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const getRecommendations = useCallback(async (query: string, userProfile?: UserProfile, productId?: string) => {
    if (!query.trim()) {
      setError("Query cannot be empty");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          userProfile: userProfile || {
            ukClothingSize: "",
            ukShoeSize: "",
            bodyShape: "",
            height: "",
            fitPreference: "",
            footType: "",
            category: "",
          },
          productId, // Include productId in the request
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAnalysisResult(data.data);
        setShareUrl(data.shareUrl || null);
        options.onSuccess?.(data.data);
      } else {
        const errorMessage = data.error || "Analysis failed. Please try again.";
        setError(errorMessage);
        options.onError?.(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error during analysis. Please try again.";
      setError(errorMessage);
      options.onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [options]);

  const clearResults = useCallback(() => {
    setAnalysisResult(null);
    setError(null);
    setShareUrl(null);
  }, []);

  const loadCachedResult = useCallback((result: AnalysisResult) => {
    setAnalysisResult(result);
    setError(null);
    setLoading(false);
  }, []);

  return {
    analysisResult,
    loading,
    error,
    shareUrl,
    getRecommendations,
    clearResults,
    loadCachedResult,
  };
}
