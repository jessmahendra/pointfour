"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { UserProfile, AnalysisResult } from "../../types/analysis";
import { UserMeasurements } from "../../types/user";
import { UserProfileForm } from "./components/UserProfileForm";
import { AnalysisResults } from "./components/AnalysisResults";
import { ChatInterface } from "./components/ChatInterface";
import MeasurementsForm from "../../components/MeasurementsForm";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

function BrandAnalysisContent() {
  const [currentStep, setCurrentStep] = useState<
    "form" | "measurements" | "analysis" | "chat"
  >("form");
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
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Handle authentication state
  useEffect(() => {
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setAuthLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Load user measurements if authenticated
  useEffect(() => {
    if (user && !measurementsLoading) {
      loadUserMeasurements();
    } else if (!user) {
      setUserMeasurements(null);
      setMeasurementsLoading(false);
    }
  }, [user]);

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

      // Start running parser
      const response = await fetch("/api/enhanced-product-parsing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Parse this product query and identify the brand name and product name. The user may have made typos, used incomplete names, or provided vague descriptions. Use web search to verify and correct any information, find the most likely brand and product they're referring to, and return accurate data. Be forgiving of typos and incomplete information - use your knowledge and web search to fill in the gaps and find the correct brand and product. Always return the official brand website and specific product URL when available. Query: "${simpleQuery}"`,
          options: {
            enableWebSearch: true,
            temperature: 0.3,
            fuzzyMatchThreshold: 0.7,
          },
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
            productCreated: result.wasProductCreated,
          },
        };
        setParsedData(JSON.stringify(enhancedResult, null, 2));

        // Check if user is logged in
        if (user) {
          // User is logged in, navigate directly to product page
          if (result.product?.id) {
            setNavigating(true);
            setTimeout(() => {
              router.push(`/products/${result.product.id}`);
            }, 2000); // 2 second delay to let user see the results
          }
        } else {
          // User is not logged in, store product ID and show measurements form
          if (result.product?.id) {
            setPendingProductId(result.product.id);
            setCurrentStep("measurements");
          }
        }
      } else {
        console.error("Parsing failed:", data.error);
        setParsedData(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error during parsing:", error);
      setParsedData(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
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

  const handleMeasurementsComplete = (measurements: UserMeasurements) => {
    // Store measurements temporarily for this session
    setUserMeasurements(measurements);

    // Store measurements in session storage for the product page
    sessionStorage.setItem("tempMeasurements", JSON.stringify(measurements));

    // Navigate to product page with measurements
    if (pendingProductId) {
      setNavigating(true);
      setTimeout(() => {
        router.push(`/products/${pendingProductId}`);
      }, 1000);
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

  const handleBackToForm = () => {
    setCurrentStep("form");
    setPendingProductId(null);
    setParsedData(null);
  };

  return (
    <div
      className={`min-h-screen bg-stone-50 ${
        currentStep === "form" ? "p-10 px-6" : ""
      }`}
    >
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
          simpleQuery={simpleQuery}
          setSimpleQuery={setSimpleQuery}
          parsedData={parsedData}
          parsingLoading={parsingLoading}
          navigating={navigating}
          handleSimpleFormSubmit={handleSimpleFormSubmit}
          router={router}
          setNavigating={setNavigating}
        />
      )}
      {currentStep === "measurements" && (
        <div className="max-w-md mx-auto p-8">
          <div className="mb-6">
            <button
              onClick={handleBackToForm}
              className="text-stone-600 hover:text-stone-800 text-sm font-medium mb-4"
            >
              ← Back to form
            </button>
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: "#4E4B4B" }}
            >
              Complete Your Details
            </h2>
            <p className="text-sm" style={{ color: "#6C6A68" }}>
              Help us provide personalized sizing recommendations by sharing
              your measurements.
            </p>
          </div>
          <MeasurementsForm
            onSave={handleMeasurementsComplete}
            skipLoading={true}
            skipSaving={true}
          />
        </div>
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
