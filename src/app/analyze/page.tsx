"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { UserProfile, AnalysisResult } from "../../types/analysis";
import { UserProfileForm } from "../../components/UserProfileForm";
import { AnalysisResults } from "../../components/AnalysisResults";
import { ChatInterface } from "../../components/ChatInterface";

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
  const [isSharedView, setIsSharedView] = useState(false);

  const searchParams = useSearchParams();

  // Handle loading shared analysis from URL parameters
  useEffect(() => {
    const shareId = searchParams.get("share");
    if (shareId) {
      loadSharedAnalysis(shareId);
    }
  }, [searchParams]);

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
      setIsSharedView(true);

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

      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: brandQuery,
          userProfile,
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
            content: "Sorry, I couldn't process your message. Please try again.",
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
      style={{
        minHeight: "100vh",
        backgroundColor: "#F8F7F4",
        padding: currentStep === "form" ? "40px 24px" : "0",
      }}
    >
      {currentStep === "form" && (
        <UserProfileForm
          userProfile={userProfile}
          setUserProfile={setUserProfile}
          brandQuery={brandQuery}
          setBrandQuery={setBrandQuery}
          loading={loading}
          onSubmit={handleFormSubmit}
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
          analysisResult={analysisResult}
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
    <Suspense fallback={<div>Loading...</div>}>
      <BrandAnalysisContent />
    </Suspense>
  );
}