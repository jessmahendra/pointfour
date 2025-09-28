"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { UserProfile, AnalysisResult } from "../../types/analysis";
import { UserMeasurements } from "../../types/user";
import { UserProfileForm } from "./components/UserProfileForm";
import { AnalysisResults } from "./components/AnalysisResults";
import { ChatInterface } from "./components/ChatInterface";

function BrandAnalysisContent() {
  const [currentStep, setCurrentStep] = useState<"form" | "analysis" | "chat">(
    "form"
  );
  const [messages, setMessages] = useState<
    Array<{ type: "user" | "assistant"; content: string; timestamp: number }>
  >([]);
  const [currentInput, setCurrentInput] = useState("");
  const [userProfile, setUserProfile] = useState<UserProfile>({
    ukClothingSize: "",
    ukShoeSize: "",
    bodyShape: "",
    height: "",
    fitPreference: "",
    footType: "",
    category: "",
  });
  const [brandQuery, setBrandQuery] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [userMeasurements, setUserMeasurements] =
    useState<UserMeasurements | null>(null);
  const [measurementsLoading, setMeasurementsLoading] = useState(true);
  const [simpleQuery, setSimpleQuery] = useState("");
  const [parsedData, setParsedData] = useState<string | null>(null);
  const [parsingLoading, setParsingLoading] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle loading shared analysis from URL parameters
  useEffect(() => {
    const shareId = searchParams.get("share");
    if (shareId) {
      loadSharedAnalysis(shareId);
    }
  }, [searchParams]);

  const loadUserMeasurements = async () => {
    try {
      setMeasurementsLoading(true);
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const { profile } = await response.json();
        setUserMeasurements(profile?.measurements || null);
      } else if (response.status === 401) {
        // User not authenticated, that's fine
        setUserMeasurements(null);
      } else {
        console.error("Failed to load user measurements");
        setUserMeasurements(null);
      }
    } catch (error) {
      console.error("Error loading user measurements:", error);
      setUserMeasurements(null);
    } finally {
      setMeasurementsLoading(false);
    }
  };

  // Console logging for search type debugging
  useEffect(() => {
    if (analysisResult) {
      const searchTypeLabels = {
        hybrid: "🔍 Hybrid: Database + Web Search",
        external: "🌐 External: Web Search Only",
        database: "📊 Database: Database Only",
        fallback: "⚠️ Fallback: No Data Available",
      };

      console.log("🔍 PointFour Search Debug Info:");
      console.log(
        `Search Type: ${
          searchTypeLabels[
            analysisResult.searchType as keyof typeof searchTypeLabels
          ] || analysisResult.searchType
        }`
      );
      console.log(
        `Has Database Data: ${analysisResult.hasDatabaseData ? "Yes" : "No"}`
      );
      console.log(
        `Has External Data: ${analysisResult.hasExternalData ? "Yes" : "No"}`
      );

      if (
        analysisResult.hasExternalData &&
        analysisResult.externalSearchResults
      ) {
        console.log(
          `External Reviews Found: ${
            analysisResult.externalSearchResults.brandFitSummary
              ?.totalResults || 0
          }`
        );
        console.log(
          `Grouped Reviews: ${
            Object.keys(analysisResult.externalSearchResults.groupedReviews)
              .length
          } categories`
        );
      }
    }
  }, [analysisResult]);

  const loadSharedAnalysis = async (shareId: string) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/share?id=${shareId}`);
      const data = await response.json();

      if (data.success) {
        setAnalysisResult(data.data.analysisResult);
        setUserProfile(data.data.userProfile);
        setBrandQuery(data.data.brandQuery);
        setCurrentStep("analysis");
      } else {
        console.error("Failed to load shared analysis:", data.error);
        alert("Share link not found or expired");
      }
    } catch (error) {
      console.error("Error loading shared analysis:", error);
      alert("Error loading shared analysis");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!analysisResult) return;

    try {
      setShareLoading(true);

      const shareData = {
        analysisResult,
        userProfile,
        brandQuery,
        sharedAt: new Date().toISOString(),
      };

      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shareData),
      });

      const data = await response.json();

      if (data.success) {
        const shareUrl = `${window.location.origin}/analyze?share=${data.shareId}`;
        await navigator.clipboard.writeText(shareUrl);
        alert("Share link copied to clipboard!");
      } else {
        console.error("Failed to create share link:", data.error);
        alert("Failed to create share link");
      }
    } catch (error) {
      console.error("Error sharing analysis:", error);
      alert("Error sharing analysis");
    } finally {
      setShareLoading(false);
    }
  };

  const handleSimpleFormSubmit = async () => {
    if (!simpleQuery.trim()) return;

    try {
      setParsingLoading(true);
      setParsedData(null);

      const response = await fetch("/api/enhanced-product-parsing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Parse this product query and identify the brand name and product name. The user may have made typos, used incomplete names, or provided vague descriptions. Use web search to verify and correct any information, find the most likely brand and product they're referring to, and return accurate data. Be forgiving of typos and incomplete information - use your knowledge and web search to fill in the gaps and find the correct brand and product. Always return the official brand website and specific product URL when available. Query: "${simpleQuery}"`,
          options: {
            enableWebSearch: true,
            temperature: 0.3,
            fuzzyMatchThreshold: 0.7
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        const result = data.data;
        const enhancedResult = {
          parsedData: result.parsedData,
          brand: result.brand,
          product: result.product,
          wasBrandCreated: result.wasBrandCreated,
          wasProductCreated: result.wasProductCreated,
          databaseInfo: {
            brandSlug: result.brand.slug,
            productId: result.product.id,
            brandCreated: result.wasBrandCreated,
            productCreated: result.wasProductCreated
          }
        };
        setParsedData(JSON.stringify(enhancedResult, null, 2));
        
        // Navigate to the product page after a short delay to show the results
        if (result.product?.id) {
          setNavigating(true);
          setTimeout(() => {
            router.push(`/products/${result.product.id}`);
          }, 2000); // 2 second delay to let user see the results
        }
      } else {
        console.error("Parsing failed:", data.error);
        setParsedData(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error during parsing:", error);
      setParsedData(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setParsingLoading(false);
    }
  };

  const handleFormSubmit = async () => {
    if (!brandQuery.trim() || !userProfile.category) return;

    try {
      setLoading(true);

      // Use saved measurements if available, otherwise use form data
      const profileToSubmit = userMeasurements
        ? {
            ...userProfile,
            // Map saved measurements to the expected format
            ukClothingSize:
              userMeasurements.usualSize?.tops?.[0] ||
              userProfile.ukClothingSize,
            ukShoeSize:
              userMeasurements.usualSize?.shoes?.[0] || userProfile.ukShoeSize,
            height: userMeasurements.height
              ? `${Math.floor(userMeasurements.height / 30.48)}'${Math.round(
                  (userMeasurements.height % 30.48) / 2.54
                )}"`
              : userProfile.height,
            fitPreference:
              userMeasurements.fitPreference?.tops || userProfile.fitPreference,
          }
        : userProfile;

      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: brandQuery,
          userProfile: profileToSubmit,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAnalysisResult(data.data);
        setCurrentStep("analysis");
      } else {
        console.error("Analysis failed:", data.error);
        alert("Analysis failed. Please try again.");
      }
    } catch (error) {
      console.error("Error during analysis:", error);
      alert("Error during analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentInput.trim() || !analysisResult) return;

    const userMessage = currentInput.trim();
    setCurrentInput("");
    setMessages((prev) => [
      ...prev,
      { type: "user", content: userMessage, timestamp: Date.now() },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          analysisResult,
          userProfile,
          brandQuery,
        }),
      });

      console.log("Chat response:", response);

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { type: "assistant", content: data.response, timestamp: Date.now() },
        ]);
      } else {
        console.error("Chat failed:", data.error);
        setMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            content:
              "Sorry, I couldn't process your message. Please try again.",
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error during chat:", error);
      setMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: Date.now(),
        },
      ]);
    }
  };

  return (
    <div
      className={`min-h-screen bg-stone-50 ${
        currentStep === "form" ? "p-10 px-6" : ""
      }`}
    >
      {/* Simple Product Parser Form */}
      <div className="max-w-4xl mx-auto mb-8 p-6 bg-white rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Enhanced Product Parser
        </h2>
        <p className="text-gray-600 mb-4">
          Enter a product query like &quot;nike air max 270&quot; to parse brand and product information and automatically store it in the database. 
          Don&apos;t worry about typos or incomplete names - we&apos;ll use web search to find the correct information and fuzzy matching to handle variations.
        </p>
        <div className="flex gap-4">
          <input
            type="text"
            value={simpleQuery}
            onChange={(e) => setSimpleQuery(e.target.value)}
            placeholder="e.g., nike air max 270, adidas stan smith, nike air max (typos ok!)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleSimpleFormSubmit()}
          />
          <button
            onClick={handleSimpleFormSubmit}
            disabled={parsingLoading || navigating || !simpleQuery.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {parsingLoading ? "Parsing..." : navigating ? "Navigating..." : "Parse"}
          </button>
        </div>
        {parsedData && (
          <div className="mt-4 space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="text-sm font-medium text-green-800 mb-3">✅ Enhanced Parsing Results</h3>
              <div className="text-xs text-green-700 space-y-2">
                {(() => {
                  try {
                    const result = JSON.parse(parsedData);
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="font-semibold text-green-800 mb-1">Parsed Information:</div>
                            <div><strong>Brand:</strong> {result.parsedData?.brandName || 'N/A'}</div>
                            <div><strong>Product:</strong> {result.parsedData?.productName || 'N/A'}</div>
                            <div><strong>Brand Website:</strong> {result.parsedData?.brandWebsite || 'N/A'}</div>
                            <div><strong>Product URL:</strong> {result.parsedData?.productUrl || 'N/A'}</div>
                          </div>
                          <div>
                            <div className="font-semibold text-green-800 mb-1">Database Operations:</div>
                            <div className={`flex items-center gap-1 ${result.wasBrandCreated ? 'text-green-600' : 'text-blue-600'}`}>
                              {result.wasBrandCreated ? '🆕' : '🔍'} 
                              Brand {result.wasBrandCreated ? 'created' : 'found'} (Slug: {result.brand?.slug || 'N/A'})
                            </div>
                            <div className={`flex items-center gap-1 ${result.wasProductCreated ? 'text-green-600' : 'text-blue-600'}`}>
                              {result.wasProductCreated ? '🆕' : '🔍'} 
                              Product {result.wasProductCreated ? 'created' : 'found'} (ID: {result.product?.id || 'N/A'})
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-green-300">
                          <div className="font-semibold text-green-800 mb-1">Summary:</div>
                          <div className="text-xs mb-2">
                            {result.wasBrandCreated && result.wasProductCreated ? (
                              <span className="text-green-600">🆕 Both brand and product were created in the database</span>
                            ) : result.wasBrandCreated ? (
                              <span className="text-green-600">🆕 Brand was created, product already existed</span>
                            ) : result.wasProductCreated ? (
                              <span className="text-green-600">🆕 Product was created, brand already existed</span>
                            ) : (
                              <span className="text-blue-600">🔍 Both brand and product already existed in the database</span>
                            )}
                          </div>
                          {result.product?.id && (
                            <div className="flex items-center gap-2">
                              {navigating ? (
                                <span className="text-blue-600 text-xs">🚀 Navigating to product page...</span>
                              ) : (
                                <button
                                  onClick={() => {
                                    setNavigating(true);
                                    router.push(`/products/${result.product.id}`);
                                  }}
                                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                >
                                  View Product Page →
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    );
                  } catch {
                    return <div>Error parsing results</div>;
                  }
                })()}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Full Response:</h3>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-64">
                {parsedData}
              </pre>
            </div>
          </div>
        )}
      </div>

      {currentStep === "form" && (
        <UserProfileForm
          userProfile={userProfile}
          setUserProfile={setUserProfile}
          brandQuery={brandQuery}
          setBrandQuery={setBrandQuery}
          loading={loading}
          onSubmit={handleFormSubmit}
          userMeasurements={userMeasurements}
          measurementsLoading={measurementsLoading}
        />
      )}
      {currentStep === "analysis" && analysisResult && (
        <AnalysisResults
          analysisResult={analysisResult}
          userProfile={userProfile}
          brandQuery={brandQuery}
          onShare={handleShare}
          shareLoading={shareLoading}
        />
      )}
      {currentStep === "chat" && analysisResult && (
        <ChatInterface
          messages={messages}
          currentInput={currentInput}
          setCurrentInput={setCurrentInput}
          onSendMessage={handleSendMessage}
          userProfile={userProfile}
          brandQuery={brandQuery}
          onBackToAnalysis={() => setCurrentStep("analysis")}
        />
      )}
    </div>
  );
}

export default function BrandAnalysisPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <BrandAnalysisContent />
    </Suspense>
  );
}
