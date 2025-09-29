"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRecommendations } from "@/lib/useRecommendations";
import { RecommendationDisplay } from "@/components/RecommendationDisplay";
import { ReviewSection } from "../../analyze/components/ReviewSection";
import { createClient } from "@/utils/supabase/client";
import { UserMeasurements } from "@/types/user";
import { UserProfile } from "@/types/analysis";

interface ProductRecommendationsProps {
  productName: string;
  brandName: string;
  brandUrl?: string;
  productId?: string; // Add productId prop
  onShareUrlGenerated?: (shareUrl: string | null) => void; // Callback for share URL
  onShareClick?: (shareFn: () => Promise<void>) => void; // Callback for share button click
  onShareStateChange?: (
    isMakingShareable: boolean,
    copiedToClipboard: boolean
  ) => void; // Callback for UI state
}

export function ProductRecommendations({
  productName,
  brandName,
  brandUrl,
  productId,
  onShareUrlGenerated,
  onShareClick,
  onShareStateChange,
}: ProductRecommendationsProps) {
  // Use the legacy API (now the best one)
  const {
    analysisResult,
    loading,
    error,
    shareUrl,
    getRecommendations,
    loadCachedResult,
  } = useRecommendations();
  const [hasRun, setHasRun] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [tempMeasurements, setTempMeasurements] =
    useState<UserMeasurements | null>(null);
  const [savedMeasurements, setSavedMeasurements] =
    useState<UserMeasurements | null>(null);
  const [measurementsLoading, setMeasurementsLoading] = useState(true);
  const [generatedShareUrl, setGeneratedShareUrl] = useState<string | null>(
    null
  );

  // Debug logging for share URL state
  useEffect(() => {
    console.log(
      "🔍 DEBUG: generatedShareUrl state changed:",
      generatedShareUrl
    );
  }, [generatedShareUrl]);
  const supabase = createClient();
  const initializationRef = useRef(false);

  // Load user measurements from profiles table
  const loadUserMeasurements = async () => {
    try {
      setMeasurementsLoading(true);
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const { profile } = await response.json();
        console.log("🔍 DEBUG: Loaded user profile:", profile);
        console.log("🔍 DEBUG: User measurements:", profile?.measurements);
        setSavedMeasurements(profile?.measurements || null);
      } else if (response.status === 401) {
        // User not authenticated, that's fine
        console.log("🔍 DEBUG: User not authenticated");
        setSavedMeasurements(null);
      } else {
        console.error("Failed to load user measurements");
        setSavedMeasurements(null);
      }
    } catch (error) {
      console.error("Error loading user measurements:", error);
      setSavedMeasurements(null);
    } finally {
      setMeasurementsLoading(false);
    }
  };

  // Convert UserMeasurements to UserProfile format with comprehensive data
  const convertMeasurementsToProfile = (
    measurements: UserMeasurements
  ): UserProfile => {
    console.log("🔍 DEBUG: Converting measurements to profile:", measurements);

    // Determine category based on product type (this will be enhanced later)
    const category = "clothing"; // Default to clothing, can be enhanced based on product analysis

    // Extract comprehensive size information
    const clothingSizes = [
      ...(measurements.usualSize?.tops || []),
      ...(measurements.usualSize?.bottoms || []),
    ];
    const shoeSizes = measurements.usualSize?.shoes || [];

    // Create comprehensive fit preference string
    const fitPreferences = [];
    if (measurements.fitPreference?.tops) {
      fitPreferences.push(`Tops: ${measurements.fitPreference.tops}`);
    }
    if (measurements.fitPreference?.bottoms) {
      fitPreferences.push(`Bottoms: ${measurements.fitPreference.bottoms}`);
    }

    // Create body shape description from measurements
    let bodyShapeDescription = "";
    if (measurements.bodyMeasurements) {
      const { bust, waist, hips } = measurements.bodyMeasurements;
      if (bust && waist && hips) {
        // Basic body shape determination
        const bustWaistDiff = bust - waist;
        const waistHipDiff = hips - waist;

        if (bustWaistDiff > 5 && waistHipDiff > 5) {
          bodyShapeDescription = "Hourglass";
        } else if (bustWaistDiff < 2 && waistHipDiff < 2) {
          bodyShapeDescription = "Rectangle";
        } else if (waistHipDiff > bustWaistDiff) {
          bodyShapeDescription = "Pear";
        } else if (bustWaistDiff > waistHipDiff) {
          bodyShapeDescription = "Apple";
        } else {
          bodyShapeDescription = "Balanced";
        }

        // Add measurements to description
        bodyShapeDescription += ` (Bust: ${bust}cm, Waist: ${waist}cm, Hips: ${hips}cm)`;
      }
    }

    const convertedProfile = {
      ukClothingSize: clothingSizes.join(", ") || "",
      ukShoeSize: shoeSizes.join(", ") || "",
      bodyShape: bodyShapeDescription,
      height: measurements.height
        ? `${Math.floor(measurements.height / 30.48)}'${Math.round(
            (measurements.height % 30.48) / 2.54
          )}" (${measurements.height}cm)`
        : "",
      fitPreference: fitPreferences.join(", ") || "",
      footType: "", // Not available in new measurement system
      category: category,
    };

    console.log("🔍 DEBUG: Converted profile:", convertedProfile);
    return convertedProfile;
  };

  // Check for temporary measurements from session storage
  useEffect(() => {
    const tempMeasurementsStr = sessionStorage.getItem("tempMeasurements");
    if (tempMeasurementsStr) {
      try {
        const measurements = JSON.parse(tempMeasurementsStr);
        setTempMeasurements(measurements);
        // Clear the temporary measurements after using them
        sessionStorage.removeItem("tempMeasurements");
      } catch (error) {
        console.error("Failed to parse temporary measurements:", error);
      }
    }
  }, []);

  // Generate the LLM query using the same format as the analyze page
  const llmQuery = `${productName} from ${brandName}${
    brandUrl ? ` (${brandUrl})` : ""
  }`;

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    const cacheKey = `recommendations_${
      userEmail || "anonymous"
    }_${productName}_${brandName}`;
    localStorage.removeItem(cacheKey); // Clear cache
    setHasRun(false);
    setIsInitialized(false); // Reset initialization to trigger auto-run
    initializationRef.current = false; // Reset the ref to allow auto-run again

    // Use saved measurements for logged-in users, or temporary measurements for non-logged-in users
    const measurements = savedMeasurements || tempMeasurements;
    console.log("🔍 DEBUG: Refresh - Using measurements:", measurements);

    const userProfile = measurements
      ? convertMeasurementsToProfile(measurements)
      : undefined;

    console.log("🔍 DEBUG: Refresh - Final user profile for LLM:", userProfile);

    await getRecommendations(llmQuery, userProfile, productId);
    setHasRun(true); // Mark as run after successful generation
    setIsInitialized(true); // Mark as initialized
    setIsRefreshing(false);
  }, [
    userEmail,
    productName,
    brandName,
    productId,
    getRecommendations,
    llmQuery,
    savedMeasurements,
    tempMeasurements,
  ]);

  // Get user email and load measurements on component mount
  useEffect(() => {
    const getUserEmail = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);

      // Load measurements if user is authenticated
      if (user) {
        await loadUserMeasurements();
      } else {
        setMeasurementsLoading(false);
      }
    };
    getUserEmail();
  }, [supabase.auth]);

  // Auto-run recommendations on mount - only run once
  useEffect(() => {
    console.log("🤖 ProductRecommendations: Auto-run check", {
      userEmail: userEmail !== null,
      savedMeasurements: savedMeasurements !== null,
      tempMeasurements: tempMeasurements !== null,
      measurementsLoading,
      initializationRef: initializationRef.current,
    });

    // Wait for measurements to load before auto-running
    if (measurementsLoading) return;

    const hasMeasurements =
      savedMeasurements !== null || tempMeasurements !== null;

    if ((userEmail !== null || hasMeasurements) && !initializationRef.current) {
      console.log(
        "🤖 ProductRecommendations: Starting auto-run initialization"
      );
      initializationRef.current = true;

      const runInitialization = async () => {
        const cacheKey = `recommendations_${
          userEmail || "anonymous"
        }_${productName}_${brandName}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
          try {
            const cachedData = JSON.parse(cached);
            // Check if cache is less than 24 hours old
            const cacheAge = Date.now() - cachedData.timestamp;
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours

            if (cacheAge < maxAge) {
              console.log("🤖 ProductRecommendations: Using cached data");
              // Load cached data into the analysis result
              if (cachedData.result) {
                loadCachedResult(cachedData.result);
                setHasRun(true);
                setIsInitialized(true);
                return;
              }
            }
          } catch (error) {
            console.warn("Failed to parse cached data:", error);
            localStorage.removeItem(cacheKey);
          }
        }

        // No valid cache, run recommendations
        setHasRun(true);
        console.log("🤖 ProductRecommendations: Using legacy API");

        // Use saved measurements for logged-in users, or temporary measurements for non-logged-in users
        const measurements = savedMeasurements || tempMeasurements;
        const userProfile = measurements
          ? convertMeasurementsToProfile(measurements)
          : undefined;

        await getRecommendations(llmQuery, userProfile, productId);
        setIsInitialized(true);
      };

      runInitialization();
    }
  }, [
    userEmail,
    productName,
    brandName,
    brandUrl,
    productId,
    loadCachedResult,
    getRecommendations,
    llmQuery,
    savedMeasurements,
    tempMeasurements,
    measurementsLoading,
  ]);

  // Save to cache when analysis result changes
  useEffect(() => {
    if (analysisResult && userEmail !== null && isInitialized) {
      const cacheKey = `recommendations_${
        userEmail || "anonymous"
      }_${productName}_${brandName}`;
      const cacheData = {
        result: analysisResult,
        timestamp: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    }
  }, [analysisResult, userEmail, productName, brandName, isInitialized]);

  // Call the callback when shareUrl changes
  useEffect(() => {
    if (onShareUrlGenerated) {
      onShareUrlGenerated(shareUrl);
    }
  }, [shareUrl, onShareUrlGenerated]);

  // Function to make recommendation shareable
  // Simple clipboard copy function with better debugging
  const copyToClipboard = async (text: string): Promise<boolean> => {
    console.log("📋 Attempting to copy to clipboard:", text);

    try {
      // Method 1: Modern clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        console.log("✅ Clipboard API success");
        return true;
      }

      // Method 2: Fallback method
      console.log("⚠️ Using fallback clipboard method");
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      textArea.style.opacity = "0";
      textArea.style.pointerEvents = "none";
      textArea.style.zIndex = "-1";

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);

      console.log(
        successful
          ? "✅ Fallback clipboard success"
          : "❌ Fallback clipboard failed"
      );
      return successful;
    } catch (error) {
      console.error("❌ Clipboard copy failed:", error);
      return false;
    }
  };

  const makeRecommendationShareable = useCallback(async () => {
    if (!analysisResult || !productId) return;

    console.log("🚀 Starting shareable generation...");

    // Notify parent about state change
    if (onShareStateChange) {
      onShareStateChange(true, false);
    }

    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: llmQuery,
          userProfile: savedMeasurements
            ? convertMeasurementsToProfile(savedMeasurements)
            : null,
          productId: productId,
          makeShareable: true,
        }),
      });

      console.log("📡 API Response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("📦 API Response data:", {
          shareUrl: result.shareUrl,
          success: result.success,
        });

        if (result.shareUrl) {
          console.log("✅ Setting share URL:", result.shareUrl);
          setGeneratedShareUrl(result.shareUrl);
          if (onShareUrlGenerated) {
            onShareUrlGenerated(result.shareUrl);
          }

          // Copy to clipboard
          console.log("📋 Attempting clipboard copy...");
          const copySuccess = await copyToClipboard(result.shareUrl);
          console.log("📋 Clipboard result:", copySuccess);

          // Notify parent about state change
          if (onShareStateChange) {
            onShareStateChange(false, copySuccess);
          }

          setTimeout(() => {
            if (onShareStateChange) {
              onShareStateChange(false, false);
            }
          }, 3000);
        } else {
          console.log("❌ No shareUrl in response");
          if (onShareStateChange) {
            onShareStateChange(false, false);
          }
        }
      } else {
        console.error("❌ API request failed:", response.status);
        if (onShareStateChange) {
          onShareStateChange(false, false);
        }
      }
    } catch (error) {
      console.error("❌ Error making recommendation shareable:", error);
      if (onShareStateChange) {
        onShareStateChange(false, false);
      }
    }
  }, [
    analysisResult,
    productId,
    llmQuery,
    savedMeasurements,
    onShareStateChange,
    onShareUrlGenerated,
  ]);

  // Expose the share function to parent
  useEffect(() => {
    if (onShareClick) {
      onShareClick(makeRecommendationShareable);
    }
  }, [onShareClick, makeRecommendationShareable]);

  return (
    <div className="mb-8">
      {!hasRun ? (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-stone-200">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-stone-900 mb-4">
              Your Recommendations
            </h2>
            <p className="text-gray-600 mb-6">
              {loading
                ? "Getting personalized fit recommendations and reviews..."
                : "Get personalized fit recommendations and reviews for this product"}
            </p>
            {loading && (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-blue-600 font-medium">
                  Getting Recommendations...
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header with refresh and share buttons */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Recommendations
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || loading}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRefreshing ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Refreshing...
                  </>
                ) : (
                  <>
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
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Refresh
                  </>
                )}
              </button>
            </div>
          </div>

          <RecommendationDisplay
            analysisResult={analysisResult}
            loading={loading}
            error={error}
          />

          {/* Reviews Section */}
          {analysisResult?.externalSearchResults?.groupedReviews && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-stone-200">
              <ReviewSection
                groupedReviews={
                  analysisResult.externalSearchResults.groupedReviews
                }
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
