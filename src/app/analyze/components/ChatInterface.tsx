"use client";
import React from "react";
import { UserProfile } from "../../../types/analysis";
import { MarkdownText } from "../../../components/MarkdownText";

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
  userProfile: UserProfile;
  brandQuery: string;
  onBackToAnalysis: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  currentInput,
  setCurrentInput,
  onSendMessage,
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
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-300 shadow-lg mb-6">
        <h2 className="text-xl font-bold text-gray-800 m-0 mb-3">
          Analysis for: {brandQuery}
        </h2>
        <div className="flex gap-2 mb-3">
          <span className="text-xs bg-stone-50 px-2 py-1 rounded">
            {userProfile.category}
          </span>
          <span className="text-xs bg-stone-50 px-2 py-1 rounded">
            {userProfile.category === "footwear"
              ? userProfile.footType
              : userProfile.bodyShape}
          </span>
          <span className="text-xs bg-stone-50 px-2 py-1 rounded">
            {userProfile.fitPreference}
          </span>
        </div>
        <button
          onClick={onBackToAnalysis}
          className="text-xs text-stone-600 bg-transparent border-none cursor-pointer underline hover:text-stone-800"
        >
          ← View full analysis
        </button>
      </div>

      {/* Messages */}
      {messages.map((message, index) => (
        <div key={index} className="mb-6">
          {message.type === "user" ? (
            <div className="flex justify-end">
              <div className="max-w-sm bg-stone-200 px-5 py-4 rounded-2xl text-sm">
                {message.content}
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-stone-300 shadow-lg">
              <MarkdownText text={message.content} />
            </div>
          )}
        </div>
      ))}

      {/* Suggested Questions */}
      {messages.length === 0 && (
        <div className="bg-stone-50 p-5 rounded-xl mb-6">
          <p className="text-sm font-medium text-gray-800 m-0 mb-3">
            Ask me anything about {brandQuery} sizing and fit:
          </p>
          <div className="flex flex-col gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setCurrentInput(question)}
                className="text-left p-3 px-4 text-sm bg-white border border-stone-300 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white p-5 rounded-2xl border border-stone-300 shadow-lg">
        <div className="flex gap-3">
          <textarea
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about sizing, fit, or anything else..."
            className="flex-1 p-3 px-4 text-sm bg-stone-50 border border-stone-300 rounded-lg outline-none resize-y min-h-11 max-h-30 font-inter focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
          <button
            onClick={onSendMessage}
            disabled={!currentInput.trim()}
            className={`px-5 py-3 text-sm font-semibold border-none rounded-lg transition-all duration-200 self-end ${
              currentInput.trim()
                ? "text-white bg-red-600 hover:bg-red-700 cursor-pointer"
                : "text-gray-400 bg-gray-200 cursor-not-allowed"
            }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
