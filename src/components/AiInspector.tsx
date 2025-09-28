"use client";

import { useState, useEffect } from "react";
import { LLMInteraction, useLLMStore } from "@/lib/llm-store";
import { useApiWithLogging } from "@/lib/useApiWithLogging";


// LLMInteraction and LLMStats interfaces are now imported from llm-store

export function AiInspector() {
  const [isOpen, setIsOpen] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testQuery, setTestQuery] = useState("");
  const [testType, setTestType] = useState<"text" | "object">("text");
  const [selectedInteraction, setSelectedInteraction] =
    useState<LLMInteraction | null>(null);

  // Use Zustand store for interactions
  const interactions = useLLMStore((state) => state.interactions);
  const clearInteractions = useLLMStore((state) => state.clearInteractions);
  const { callApiWithLogging } = useApiWithLogging();

  // Poll for server updates every 5 seconds as fallback
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch("/api/llm-interactions?limit=100");
        const data = await response.json();

        if (data.success && data.interactions.length !== interactions.length) {
          // If server has different count, we might need to sync
          // For now, the store should be the source of truth
          console.log(
            "🤖 AI Inspector: Server has",
            data.interactions.length,
            "interactions, store has",
            interactions.length
          );
        }
      } catch (error) {
        console.error("❌ AI Inspector: Polling failed:", error);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [interactions.length]);

  const runTest = async () => {
    if (!testQuery.trim()) return;

    try {
      setTestLoading(true);
      

      console.log("🤖 AI Inspector: Running test via API");

      await callApiWithLogging(
        "/api/ai-inspector",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: testQuery,
            type: testType,
          }),
        },
        {
          source: 'ai-inspector-test',
          logInProgress: true,
          prompt: testQuery,
          type: testType
        }
      );

     

      console.log("✅ AI Inspector: Test completed successfully");
    } catch (error) {
      console.error("❌ AI Inspector: Test failed:", error);

     
    } finally {
      setTestLoading(false);
    }
  };

  const refreshInteractions = async () => {
    try {
      const response = await fetch("/api/llm-interactions?limit=100");
      const data = await response.json();
      
      if (data.success) {
        // Clear current interactions and add server interactions
        clearInteractions();
        data.interactions.forEach((interaction: LLMInteraction) => {
          useLLMStore.getState().addInteraction(interaction);
        });
        console.log("🔄 AI Inspector: Refreshed interactions from server");
      }
    } catch (error) {
      console.error("❌ AI Inspector: Failed to refresh interactions:", error);
    }
  };

  const clearLogs = async () => {
    try {
      // Clear from server
      const response = await fetch("/api/llm-interactions", {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        // Clear from store
        clearInteractions();
        console.log("🧹 AI Inspector: Cleared all interactions");
      }
    } catch (error) {
      console.error("❌ AI Inspector: Failed to clear interactions:", error);
    }
  };

  // No useEffect needed - Zustand store updates automatically

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors z-50"
      >
        AI Inspector
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-full max-w-2xl h-[80vh] shadow-lg border border-gray-200 rounded-lg bg-white z-50 flex flex-col text-sm">
      {/* Header */}
      <div className="py-2 px-4 border-b border-gray-200 flex justify-end items-center">
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Test Section */}
        <div className="space-y-4">
          {/* Test Controls */}
          <div className="space-y-2 pt-2 bg-stone-100">
            <input
              type="text"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter test query..."
            />

            <div className="flex gap-2 border-t border-stone-200 py-1 pr-2">
              <select
                value={testType}
                onChange={(e) =>
                  setTestType(e.target.value as "text" | "object")
                }
                className="px-3 py-2 rounded-md hover:text-stone-800 text-stone-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="text">Text Generation</option>
                <option value="object">Structured Object</option>
              </select>
              <div className="flex-1" />
              <button
                onClick={runTest}
                disabled={testLoading || !testQuery.trim()}
                className="h-8 px-3 rounded-full bg-stone-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {testLoading ? "Testing..." : "Run Test"}
              </button>
            </div>
          </div>

        
        </div>

        {/* Interactions Section */}
        <div className="space-y-4 px-4">
          <div className="flex justify-between items-center border-b border-stone-200 pb-2">
            <h4 className="font-medium">
              Recent Interactions ({interactions.length})
            </h4>
            <div className="flex gap-2">
              <button
                onClick={refreshInteractions}
                className="px-3 py-1 text-blue-600 rounded text-sm hover:bg-blue-50"
              >
                Refresh
              </button>
              <button
                onClick={clearLogs}
                className="px-3 py-1 text-red-600 rounded text-sm hover:bg-red-50"
              >
                Clear All
              </button>
            </div>
          </div>

          {interactions.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No interactions yet. Try running a test or using the
              ProductRecommendations component.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {interactions.map((interaction) => (
                <div
                  key={interaction.id}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedInteraction(interaction)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            interaction.type === "text"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {interaction.type}
                        </span>
                        <span className="text-sm font-medium">
                          {interaction.model}
                        </span>
                        {interaction.source && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {interaction.source}
                          </span>
                        )}
                        {interaction.status === 'in-progress' && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded animate-pulse">
                            In Progress
                          </span>
                        )}
                        {interaction.error && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                            Error
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        {interaction.prompt.substring(0, 80)}
                        {interaction.prompt.length > 80 && "..."}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(interaction.timestamp).toLocaleString()} •
                        {interaction.status === 'in-progress' ? 'In progress...' : `${interaction.duration}ms`} •
                        {interaction.tokens?.total || 0} tokens
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interaction Detail Modal */}
      {selectedInteraction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Interaction Details</h3>
              <button
                onClick={() => setSelectedInteraction(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Prompt</h4>
                  <pre className="bg-gray-100 p-3 rounded text-sm whitespace-pre-wrap">
                    {selectedInteraction.prompt}
                  </pre>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Response</h4>
                  <pre className="bg-gray-100 p-3 rounded text-sm whitespace-pre-wrap">
                    {selectedInteraction.response ||
                      (selectedInteraction.error
                        ? `Error: ${selectedInteraction.error}`
                        : "No response")}
                  </pre>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Model:</span>{" "}
                  {selectedInteraction.model}
                </div>
                <div>
                  <span className="font-medium">Type:</span>{" "}
                  {selectedInteraction.type}
                </div>
                <div>
                  <span className="font-medium">Duration:</span>{" "}
                  {selectedInteraction.duration}ms
                </div>
                <div>
                  <span className="font-medium">Tokens:</span>{" "}
                  {selectedInteraction.tokens?.total || 0}
                </div>
              </div>
              {selectedInteraction.metadata &&
                Object.keys(selectedInteraction.metadata).length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Metadata</h4>
                    <pre className="bg-gray-100 p-3 rounded text-sm">
                      {JSON.stringify(selectedInteraction.metadata, null, 2)}
                    </pre>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
