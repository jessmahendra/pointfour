"use client";

import { useState, useCallback } from "react";
import { AnalysisResult, UserProfile } from "@/types/analysis";

interface UseRecommendationsLLMOptions {
  onSuccess?: (result: AnalysisResult) => void;
  onError?: (error: string) => void;
}

interface UseRecommendationsLLMReturn {
  analysisResult: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  getRecommendations: (query: string, userProfile?: UserProfile) => Promise<void>;
  clearResults: () => void;
}

export function useRecommendationsLLM(options: UseRecommendationsLLMOptions = {}): UseRecommendationsLLMReturn {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRecommendations = useCallback(async (query: string, userProfile?: UserProfile) => {
    if (!query.trim()) {
      setError("Query cannot be empty");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🤖 LLM Recommendations: Starting request for query:', query);

      const response = await fetch("/api/recommendations-llm", {
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
        }),
      });

      const data = await response.json();

      console.log('🤖 LLM Recommendations: Response received:', {
        success: data.success,
        hasData: !!data.data,
        searchType: data.data?.searchType,
        model: data.data?.llmInteraction?.model
      });

      if (data.success) {
        setAnalysisResult(data.data);
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
      console.error('🤖 LLM Recommendations: Error occurred:', err);
    } finally {
      setLoading(false);
    }
  }, [options]);

  const clearResults = useCallback(() => {
    setAnalysisResult(null);
    setError(null);
  }, []);

  return {
    analysisResult,
    loading,
    error,
    getRecommendations,
    clearResults,
  };
}
