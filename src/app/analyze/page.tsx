"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

  const searchParams = useSearchParams();

  // Load user measurements on component mount
  useEffect(() => {
    loadUserMeasurements();
  }, []);

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
