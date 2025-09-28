"use client";
import React from "react";
import { AnalysisResult, UserProfile } from "../types/analysis";
import { formatTextWithStyling } from "../utils/textFormatting";

interface ChatMessage {
  type: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  currentInput: string;
  setCurrentInput: React.Dispatch<React.SetStateAction<string>>;
  onSendMessage: () => void;
  analysisResult: AnalysisResult;
  userProfile: UserProfile;
  brandQuery: string;
  onBackToAnalysis: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  currentInput,
  setCurrentInput,
  onSendMessage,
  analysisResult,
  userProfile,
  brandQuery,
  onBackToAnalysis,
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const suggestedQuestions = [
    "What size should I order?",
    "How does the fit compare to other brands?",
    "What do customers say about quality?",
    "Are there any sizing issues I should know about?",
  ];

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          padding: "24px",
          borderRadius: "16px",
          border: "1px solid #D8D6D5",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
          marginBottom: "24px",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "700",
            color: "#333",
            margin: "0 0 12px 0",
          }}
        >
          Analysis for: {brandQuery}
        </h2>
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <span
            style={{
              fontSize: "12px",
              backgroundColor: "#F8F7F4",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            {userProfile.category}
          </span>
          <span
            style={{
              fontSize: "12px",
              backgroundColor: "#F8F7F4",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            {userProfile.category === "footwear"
              ? userProfile.footType
              : userProfile.bodyShape}
          </span>
          <span
            style={{
              fontSize: "12px",
              backgroundColor: "#F8F7F4",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            {userProfile.fitPreference}
          </span>
        </div>
        <button
          onClick={onBackToAnalysis}
          style={{
            fontSize: "12px",
            color: "#6C6A68",
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          ← View full analysis
        </button>
      </div>

      {/* Messages */}
      {messages.map((message, index) => (
        <div key={index} style={{ marginBottom: "24px" }}>
          {message.type === "user" ? (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div
                style={{
                  maxWidth: "400px",
                  backgroundColor: "#E9DED5",
                  padding: "16px 20px",
                  borderRadius: "16px",
                  fontSize: "14px",
                }}
              >
                {message.content}
              </div>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                padding: "24px",
                borderRadius: "16px",
                border: "1px solid #D8D6D5",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
                {formatTextWithStyling(message.content)}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Suggested Questions */}
      {messages.length === 0 && (
        <div
          style={{
            backgroundColor: "#F8F7F4",
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "24px",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
              margin: "0 0 12px 0",
            }}
          >
            Ask me anything about {brandQuery} sizing and fit:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setCurrentInput(question)}
                style={{
                  textAlign: "left",
                  padding: "12px 16px",
                  fontSize: "14px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #D8D6D5",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#F0F0F0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#FFFFFF";
                }}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          padding: "20px",
          borderRadius: "16px",
          border: "1px solid #D8D6D5",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ display: "flex", gap: "12px" }}>
          <textarea
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about sizing, fit, or anything else..."
            style={{
              flex: 1,
              padding: "12px 16px",
              fontSize: "14px",
              backgroundColor: "#F8F7F4",
              border: "1px solid #D8D6D5",
              borderRadius: "8px",
              outline: "none",
              resize: "vertical",
              minHeight: "44px",
              maxHeight: "120px",
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          />
          <button
            onClick={onSendMessage}
            disabled={!currentInput.trim()}
            style={{
              padding: "12px 20px",
              fontSize: "14px",
              fontWeight: "600",
              color: currentInput.trim() ? "#FFFFFF" : "#9CA3AF",
              backgroundColor: currentInput.trim() ? "#DC2626" : "#E5E7EB",
              border: "none",
              borderRadius: "8px",
              cursor: currentInput.trim() ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              alignSelf: "flex-end",
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
